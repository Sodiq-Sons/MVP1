"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    getDocs,
    limit,
    writeBatch,
    doc,
    arrayUnion,
    updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import Link from "next/link";

const MIN_MEMBERS = 3;
const CUTOFF_MS = 3 * 60 * 1000; // 3 min → "online"

function timeAgo(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function CamperAvatar({ name, photoURL, size = 10, online = false }) {
    const dim = `w-${size} h-${size}`;
    return (
        <div className={`relative ${dim} shrink-0`}>
            <div className={`${dim} rounded-full overflow-hidden flex items-center justify-center`} style={{ background: photoURL ? undefined : "var(--cp-tint)" }}>
                {photoURL
                    ? <img src={photoURL} alt={name || "Camper"} className="w-full h-full object-cover" />
                    : <span className="font-bold" style={{ color: "var(--cp)", fontSize: size < 8 ? 10 : 14 }}>{name?.charAt(0)?.toUpperCase() || "?"}</span>}
            </div>
            {online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
        </div>
    );
}

// ── Step 1: Select campers ───────────────────────────────────────────────────
function CamperPicker({ uid, onNext, onClose }) {
    const [allCampers, setAllCampers] = useState([]);
    const [onlineSet, setOnlineSet] = useState(new Set());
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const searchRef = useRef(null);

    // Load all registered campers once
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDocs(query(collection(db, "users"), limit(200)));
                if (cancelled) return;
                setAllCampers(snap.docs
                    .map((d) => ({ uid: d.id, name: d.data().displayName || d.data().name || "", photoURL: d.data().photoURL || null, platoon: d.data().platoon || null }))
                    .filter((u) => u.name && u.uid !== uid)
                    .sort((a, b) => a.name.localeCompare(b.name)));
            } catch { /* ignore */ }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [uid]);

    // Listen to presence for online dots
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "presence"), (snap) => {
            const now = Date.now();
            const online = new Set(
                snap.docs
                    .filter((d) => { const ts = d.data().lastSeen?.toMillis?.(); return ts && now - ts < CUTOFF_MS; })
                    .map((d) => d.id)
            );
            setOnlineSet(online);
        }, () => {});
        return () => unsub();
    }, []);

    useEffect(() => { setTimeout(() => searchRef.current?.focus(), 150); }, []);

    const toggle = (camper) => {
        setSelected((prev) =>
            prev.find((m) => m.uid === camper.uid)
                ? prev.filter((m) => m.uid !== camper.uid)
                : [...prev, camper]
        );
    };

    const lq = search.toLowerCase();
    const filtered = search
        ? allCampers.filter((c) => c.name.toLowerCase().includes(lq))
        : allCampers;

    // Sort: online first, then alphabetical
    const sorted = [...filtered].sort((a, b) => {
        const aOnline = onlineSet.has(a.uid);
        const bOnline = onlineSet.has(b.uid);
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-subtle">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Add Members</h2>
                    <p className="text-xs text-gray-400">{selected.length} selected · need at least {MIN_MEMBERS - 1}</p>
                </div>
                {selected.length >= MIN_MEMBERS - 1 && (
                    <button
                        onClick={() => onNext(selected)}
                        className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all active:scale-95 shrink-0"
                        style={{ background: "var(--cp)" }}
                    >
                        Next →
                    </button>
                )}
            </div>

            {/* Selected chips row */}
            {selected.length > 0 && (
                <div className="px-4 py-3 border-b border-subtle">
                    <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                        {selected.map((m) => (
                            <button
                                key={m.uid}
                                type="button"
                                onClick={() => toggle(m)}
                                className="flex flex-col items-center gap-1 shrink-0 group"
                            >
                                <div className="relative">
                                    <CamperAvatar name={m.name} photoURL={m.photoURL} size={10} online={onlineSet.has(m.uid)} />
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-white">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-600 max-w-[56px] truncate">{m.name.split(" ")[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search bar */}
            <div className="px-4 py-3 border-b border-subtle">
                <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search campers…"
                        className="w-full pl-9 pr-9 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2"
                        style={{ "--tw-ring-color": "var(--cp)" }}
                        autoComplete="off"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Camper list */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-400">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-cp animate-spin" />
                        Loading campers…
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-16 text-sm text-gray-400">
                        {search ? `No camper found for "${search}"` : "No campers found"}
                    </div>
                ) : (
                    sorted.map((camper) => {
                        const isSelected = !!selected.find((m) => m.uid === camper.uid);
                        const isOnline = onlineSet.has(camper.uid);
                        return (
                            <button
                                key={camper.uid}
                                type="button"
                                onClick={() => toggle(camper)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-50 last:border-0"
                            >
                                <CamperAvatar name={camper.name} photoURL={camper.photoURL} size={11} online={isOnline} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{camper.name}</p>
                                    <p className="text-xs truncate" style={{ color: isOnline ? "#22c55e" : "#9ca3af" }}>
                                        {isOnline ? "Online now" : camper.platoon ? `Platoon ${camper.platoon}` : "Camper"}
                                    </p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? "border-transparent" : "border-gray-300"}`}
                                    style={{ background: isSelected ? "var(--cp)" : "transparent" }}>
                                    {isSelected && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-3.5 h-3.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ── Step 2: Name the group ───────────────────────────────────────────────────
function GroupNamer({ selected, uid, user, onBack, onClose }) {
    const router = useRouter();
    const [chatName, setChatName] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

    const createChat = async () => {
        if (!chatName.trim()) { setError("Give your group a name."); return; }
        setCreating(true);
        setError(null);
        try {
            const chatRef = await addDoc(collection(db, "groupChats"), {
                name: chatName.trim(),
                members: [{ uid, name: user.name, photoURL: user.photoURL }],
                memberIds: [uid],
                createdBy: uid,
                createdByName: user.name,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: null,
                lastMessageAt: null,
            });
            const batch = writeBatch(db);
            for (const member of selected) {
                // Fixed ID format so rules can verify invite existence without a query
                const inviteRef = doc(db, "groupChatInvites", `${chatRef.id}_${member.uid}`);
                batch.set(inviteRef, {
                    chatId: chatRef.id,
                    chatName: chatName.trim(),
                    invitedUid: member.uid,
                    invitedByUid: uid,
                    invitedByName: user.name,
                    status: "pending",
                    createdAt: serverTimestamp(),
                });
            }
            await batch.commit();
            router.push(`/chat/${chatRef.id}`);
        } catch (err) {
            console.error(err);
            setError("Failed to create group. Try again.");
            setCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-subtle">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div className="flex-1">
                    <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>New Group</h2>
                    <p className="text-xs text-gray-400">You + {selected.length} camper{selected.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            </div>

            <div className="px-4 py-5 space-y-5">
                {/* Group name input */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Group name</label>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="e.g. Platoon 5 Squad, NYSC Fam…"
                        value={chatName}
                        onChange={(e) => setChatName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createChat()}
                        maxLength={60}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                        style={{ borderColor: chatName ? "var(--cp)" : "#e5e7eb" }}
                    />
                    <p className="text-xs text-gray-400 mt-1.5 text-right">{chatName.length}/60</p>
                </div>

                {/* Member preview */}
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Members ({selected.length + 1})</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-700">You</span>
                        {selected.map((m) => (
                            <span key={m.uid} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: "var(--cp-tint)", color: "var(--cp)" }}>
                                {m.name.split(" ")[0]}
                            </span>
                        ))}
                    </div>
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">{error}</p>}

                <button
                    onClick={createChat}
                    disabled={creating || !chatName.trim()}
                    className="w-full py-4 rounded-2xl text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98] cursor-pointer"
                    style={{ background: "var(--cp)" }}
                >
                    {creating ? "Creating group…" : `Create & Invite ${selected.length} Camper${selected.length !== 1 ? "s" : ""}`}
                </button>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function GroupChatList() {
    const router = useRouter();
    const [uid, setUid] = useState(null);
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [onlineSet, setOnlineSet] = useState(new Set());
    const [loading, setLoading] = useState(true);

    // Create flow: null | "pick" | "name"
    const [createStep, setCreateStep] = useState(null);
    const [pickedMembers, setPickedMembers] = useState([]);

    const [acceptingId, setAcceptingId] = useState(null);
    const [decliningId, setDecliningId] = useState(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u || u.isAnonymous) { router.replace("/login"); return; }
            setUid(u.uid);
            setUser({ uid: u.uid, name: u.displayName || "You", photoURL: u.photoURL || null });
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        if (!uid) return;
        // No orderBy — array-contains + orderBy requires a composite index.
        // Sort client-side instead so no index deployment is needed.
        const q = query(
            collection(db, "groupChats"),
            where("memberIds", "array-contains", uid)
        );
        const unsub = onSnapshot(q, (snap) => {
            const sorted = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0));
            setChats(sorted);
            setLoading(false);
        }, (err) => {
            console.error("groupChats listen error:", err);
            setLoading(false);
        });
        return () => unsub();
    }, [uid]);

    useEffect(() => {
        if (!uid) return;
        const q = query(
            collection(db, "groupChatInvites"),
            where("invitedUid", "==", uid),
            where("status", "==", "pending")
        );
        const unsub = onSnapshot(q, (snap) => {
            setPendingInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, () => {});
        return () => unsub();
    }, [uid]);

    // Global online presence
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "presence"), (snap) => {
            const now = Date.now();
            setOnlineSet(new Set(
                snap.docs
                    .filter((d) => { const ts = d.data().lastSeen?.toMillis?.(); return ts && now - ts < CUTOFF_MS; })
                    .map((d) => d.id)
            ));
        }, () => {});
        return () => unsub();
    }, []);

    const acceptInvite = async (invite) => {
        if (!user) return;
        setAcceptingId(invite.id);
        try {
            // Step 1 — join the group (critical)
            await updateDoc(doc(db, "groupChats", invite.chatId), {
                memberIds: arrayUnion(uid),
                members: arrayUnion({ uid, name: user.name, photoURL: user.photoURL }),
                updatedAt: serverTimestamp(),
            });
            // Step 2 — mark invite accepted (non-critical, don't block navigation)
            updateDoc(doc(db, "groupChatInvites", invite.id), { status: "accepted" }).catch(() => {});
            router.push(`/chat/${invite.chatId}`);
        } catch (err) {
            console.error("Join failed:", err);
            toast.error("Could not join the group. Please try again.");
        } finally {
            setAcceptingId(null);
        }
    };

    const declineInvite = async (invite) => {
        setDecliningId(invite.id);
        try {
            await updateDoc(doc(db, "groupChatInvites", invite.id), { status: "declined" });
        } catch (err) { console.error(err); }
        finally { setDecliningId(null); }
    };

    const closeCreate = () => { setCreateStep(null); setPickedMembers([]); };

    if (!uid && !loading) return null;

    return (
        <div className="min-h-screen bg-page">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-subtle">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Back">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
                        </Link>
                        <div>
                            <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Group Chats</h1>
                            <p className="text-xs text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                                    {onlineSet.size} camper{onlineSet.size !== 1 ? "s" : ""} online
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setCreateStep("pick")}
                        className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl cursor-pointer transition-all active:scale-95"
                        style={{ background: "var(--cp)" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        New Group
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                {/* Pending invites */}
                {pendingInvites.length > 0 && (
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pending Invites ({pendingInvites.length})</p>
                        <div className="space-y-2">
                            {pendingInvites.map((inv) => (
                                <div key={inv.id} className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0 text-white font-bold text-base">
                                        {inv.chatName?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{inv.chatName}</p>
                                        <p className="text-xs text-gray-500">{inv.invitedByName} invited you</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => declineInvite(inv)} disabled={decliningId === inv.id}
                                            className="text-xs font-semibold text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg cursor-pointer hover:border-gray-400 transition-colors disabled:opacity-50">
                                            Decline
                                        </button>
                                        <button onClick={() => acceptInvite(inv)} disabled={acceptingId === inv.id}
                                            className="text-xs font-bold text-white px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-60 transition-all active:scale-95"
                                            style={{ background: "var(--cp)" }}>
                                            {acceptingId === inv.id ? "Joining…" : "Join"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-7 h-7 rounded-full border-2 border-muted border-t-cp animate-spin" />
                    </div>
                )}

                {!loading && chats.length === 0 && pendingInvites.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">💬</div>
                        <p className="text-gray-700 font-bold">No group chats yet</p>
                        <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto">Start a group with at least {MIN_MEMBERS} campers.</p>
                        <button onClick={() => setCreateStep("pick")}
                            className="mt-5 text-white text-sm font-bold px-6 py-3 rounded-2xl cursor-pointer transition-all active:scale-95"
                            style={{ background: "var(--cp)" }}>
                            Create First Group
                        </button>
                    </div>
                )}

                {chats.length > 0 && (
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">My Groups</p>
                        <div className="rounded-2xl border border-subtle overflow-hidden bg-white">
                            {chats.map((chat, i) => {
                                const onlineCount = (chat.memberIds || []).filter((id) => onlineSet.has(id)).length;
                                return (
                                    <Link key={chat.id} href={`/chat/${chat.id}`}
                                        className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${i < chats.length - 1 ? "border-b border-gray-50" : ""}`}>
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-lg" style={{ background: "var(--cp)" }}>
                                            {chat.name?.charAt(0)?.toUpperCase() || "G"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-gray-900 truncate">{chat.name}</p>
                                                {onlineCount > 0 && (
                                                    <span className="shrink-0 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                                        {onlineCount} online
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                                {chat.lastMessage || `${chat.memberIds?.length || 0} members`}
                                            </p>
                                        </div>
                                        <div className="text-xs text-gray-300 shrink-0">{timeAgo(chat.updatedAt)}</div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Create group overlay — full-screen sheet */}
            {createStep && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col" style={{ maxWidth: 600, margin: "0 auto" }}>
                    {createStep === "pick" && (
                        <CamperPicker
                            uid={uid}
                            onNext={(members) => { setPickedMembers(members); setCreateStep("name"); }}
                            onClose={closeCreate}
                        />
                    )}
                    {createStep === "name" && (
                        <GroupNamer
                            selected={pickedMembers}
                            uid={uid}
                            user={user}
                            onBack={() => setCreateStep("pick")}
                            onClose={closeCreate}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
