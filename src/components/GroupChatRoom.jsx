"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    doc,
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    arrayRemove,
    arrayUnion,
    getDocs,
    limit,
    serverTimestamp,
    getDoc,
} from "firebase/firestore";

const SEEN_KEY = (uid, chatId) => `chat_seen_${uid}_${chatId}`;
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useSidebar } from "@/components/SidebarContext";
import { toast } from "sonner";

const CUTOFF_MS = 3 * 60 * 1000;

function fmtTime(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateLabel(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isSameDay(a, b) {
    if (!a || !b) return false;
    const da = a.toDate ? a.toDate() : new Date(a);
    const db2 = b.toDate ? b.toDate() : new Date(b);
    return da.toDateString() === db2.toDateString();
}

// ── Long-press hook ──────────────────────────────────────────────────────────
function useLongPress(onLongPress, delay = 480) {
    const timerRef = useRef(null);
    const fired = useRef(false);

    const start = (payload) => {
        fired.current = false;
        timerRef.current = setTimeout(() => {
            fired.current = true;
            onLongPress(payload);
        }, delay);
    };
    const cancel = () => clearTimeout(timerRef.current);
    // Return true if long-press fired so click handler can ignore the event
    const didFire = () => fired.current;

    return { start, cancel, didFire };
}

export default function GroupChatRoom({ chatId }) {
    const router = useRouter();
    const { collapsed } = useSidebar();
    const [uid, setUid] = useState(null);
    const [userName, setUserName] = useState("You");
    const [photoURL, setPhotoURL] = useState(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingChat, setLoadingChat] = useState(true);
    const [notMember, setNotMember] = useState(false);
    const [onlineSet, setOnlineSet] = useState(new Set());
    const [replyingTo, setReplyingTo] = useState(null); // { id, text, senderName }
    const [contextMsg, setContextMsg] = useState(null);  // message shown in bottom sheet
    const [pendingImage, setPendingImage] = useState(null); // { localUrl, cloudinaryUrl }
    const [uploading, setUploading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [memberAction, setMemberAction] = useState(null);
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [allCampers, setAllCampers] = useState([]);
    const [loadingCampers, setLoadingCampers] = useState(false);
    const [addSearch, setAddSearch] = useState("");
    const [selectedToAdd, setSelectedToAdd] = useState([]);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const longPress = useLongPress((msg) => setContextMsg(msg));

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u || u.isAnonymous) { router.replace("/login"); return; }
            setUid(u.uid);
            setUserName(u.displayName || "You");
            setPhotoURL(u.photoURL);
        });
        return () => unsub();
    }, [router]);

    // Chat metadata
    useEffect(() => {
        if (!uid) return;
        const unsub = onSnapshot(doc(db, "groupChats", chatId), (snap) => {
            if (!snap.exists()) { router.replace("/chat"); return; }
            const data = snap.data();
            if (!data.memberIds?.includes(uid)) { setNotMember(true); setLoadingChat(false); return; }
            setChat({ id: snap.id, ...data });
            setLoadingChat(false);
        });
        return () => unsub();
    }, [chatId, uid, router]);

    // Messages — update lastSeen timestamp whenever new messages arrive
    useEffect(() => {
        if (!uid) return;
        const q = query(collection(db, "groupChats", chatId, "messages"), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            // Mark chat as seen while the user is actively viewing it
            try { localStorage.setItem(SEEN_KEY(uid, chatId), Date.now().toString()); } catch {}
        });
        return () => unsub();
    }, [chatId, uid]);

    // Online presence
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

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input after setting reply
    useEffect(() => {
        if (replyingTo) inputRef.current?.focus();
    }, [replyingTo]);

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
        const localUrl = URL.createObjectURL(file);
        setPendingImage({ localUrl, cloudinaryUrl: null });
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!data.url) throw new Error(data.error || "Upload failed");
            setPendingImage({ localUrl, cloudinaryUrl: data.url });
        } catch (err) {
            toast.error(err.message || "Image upload failed");
            setPendingImage(null);
        } finally {
            setUploading(false);
        }
    };

    const sendMessage = async (e) => {
        e?.preventDefault();
        const msg = text.trim();
        if ((!msg && !pendingImage?.cloudinaryUrl) || sending || !uid) return;
        if (pendingImage && !pendingImage.cloudinaryUrl) {
            toast.error("Image is still uploading, please wait.");
            return;
        }
        setSending(true);
        setText("");
        const replySnapshot = replyingTo;
        const imageSnapshot = pendingImage;
        setReplyingTo(null);
        setPendingImage(null);
        try {
            const payload = {
                text: msg,
                senderId: uid,
                senderName: userName,
                senderPhoto: photoURL || null,
                createdAt: serverTimestamp(),
            };
            if (imageSnapshot?.cloudinaryUrl) payload.imageUrl = imageSnapshot.cloudinaryUrl;
            if (replySnapshot) {
                payload.replyTo = {
                    messageId: replySnapshot.id,
                    text: replySnapshot.text,
                    senderName: replySnapshot.senderName,
                };
            }
            await addDoc(collection(db, "groupChats", chatId, "messages"), payload);
            await updateDoc(doc(db, "groupChats", chatId), {
                lastMessage: msg.length > 60 ? msg.slice(0, 60) + "…" : msg,
                lastMessageAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Notify other group members — throttled to first message in a new burst
            // (skip if someone already sent a message in the last 90 seconds)
            const lastAt = chat?.lastMessageAt?.toMillis?.() ?? 0;
            const isNewBurst = Date.now() - lastAt > 90_000;
            if (isNewBurst && chat?.members) {
                const others = chat.members.filter((m) => m.uid !== uid);
                others.forEach((m) => {
                    addDoc(collection(db, "notifications"), {
                        userId: m.uid,
                        type: "group_message",
                        actor: userName,
                        actorInitial: userName.charAt(0).toUpperCase(),
                        actorPhotoURL: photoURL || null,
                        message: "sent a message in",
                        issue: chat.name,
                        commentPreview: msg.length > 80 ? msg.slice(0, 80) + "…" : msg,
                        chatId,
                        createdAt: serverTimestamp(),
                        read: false,
                    }).catch(() => {});
                });
            }
        } catch {
            setText(msg);
            if (replySnapshot) setReplyingTo(replySnapshot);
            if (imageSnapshot) setPendingImage(imageSnapshot);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleReply = (msg) => {
        setContextMsg(null);
        setReplyingTo({ id: msg.id, text: msg.text, senderName: msg.senderName });
    };

    // ── Admin helpers ────────────────────────────────────────────────────────
    const isAdmin = chat?.adminIds?.includes(uid) ?? chat?.createdBy === uid;
    const onlyAdmins = chat?.onlyAdminsCanMessage ?? false;
    const canSend = !onlyAdmins || isAdmin;

    const removeMember = async (targetUid) => {
        if (!isAdmin || targetUid === uid) return;
        const member = (chat.members || []).find((m) => m.uid === targetUid);
        if (!member) return;
        try {
            await updateDoc(doc(db, "groupChats", chatId), {
                memberIds: arrayRemove(targetUid),
                members:   arrayRemove(member),
                adminIds:  arrayRemove(targetUid),
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            toast.error("Couldn't remove member");
        }
    };

    const toggleAdminStatus = async (targetUid) => {
        if (!isAdmin) return;
        const targetIsAdmin = (chat.adminIds || []).includes(targetUid);
        try {
            await updateDoc(doc(db, "groupChats", chatId), {
                adminIds:  targetIsAdmin ? arrayRemove(targetUid) : arrayUnion(targetUid),
                updatedAt: serverTimestamp(),
            });
        } catch {
            toast.error("Couldn't update admin status");
        }
    };

    const toggleOnlyAdminsCanMessage = async () => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, "groupChats", chatId), {
                onlyAdminsCanMessage: !onlyAdmins,
                updatedAt: serverTimestamp(),
            });
        } catch {
            toast.error("Couldn't update setting");
        }
    };

    const loadCampers = async () => {
        if (allCampers.length > 0) return;
        setLoadingCampers(true);
        try {
            const snap = await getDocs(query(collection(db, "users"), limit(300)));
            const existing = new Set(chat?.memberIds || []);
            setAllCampers(
                snap.docs
                    .map((d) => ({ uid: d.id, name: d.data().displayName || d.data().name || "", photoURL: d.data().photoURL || null }))
                    .filter((u) => u.name && !existing.has(u.uid))
                    .sort((a, b) => a.name.localeCompare(b.name))
            );
        } catch { /* ignore */ }
        finally { setLoadingCampers(false); }
    };

    const addMembers = async () => {
        if (!isAdmin || selectedToAdd.length === 0) return;
        try {
            await updateDoc(doc(db, "groupChats", chatId), {
                memberIds: arrayUnion(...selectedToAdd.map((m) => m.uid)),
                members:   arrayUnion(...selectedToAdd.map((m) => ({ uid: m.uid, name: m.name, photoURL: m.photoURL || null }))),
                updatedAt: serverTimestamp(),
            });
            setSelectedToAdd([]);
            setShowAddMembers(false);
            setAllCampers([]);
            toast.success(`${selectedToAdd.length} member${selectedToAdd.length > 1 ? "s" : ""} added`);
        } catch {
            toast.error("Couldn't add members");
        }
    };

    if (loadingChat) {
        return (
            <div className="h-screen flex items-center justify-center bg-page">
                <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
            </div>
        );
    }

    if (notMember) {
        return (
            <div className="h-screen flex items-center justify-center px-6 bg-page">
                <div className="text-center">
                    <div className="text-4xl mb-3">🔒</div>
                    <p className="text-gray-700 font-semibold">You&apos;re not in this group</p>
                    <Link href="/chat" className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: "var(--cp)" }}>← Back to chats</Link>
                </div>
            </div>
        );
    }

    const members = chat?.members || [];
    const onlineMemberCount = members.filter((m) => onlineSet.has(m.uid)).length;

    // Build grouped messages with date separators
    const enriched = messages.reduce((acc, msg, i) => {
        const prev = messages[i - 1];
        const showDate = !prev || !isSameDay(prev.createdAt, msg.createdAt);
        const isFirst = !prev || prev.senderId !== msg.senderId ||
            (msg.createdAt && prev.createdAt &&
                (msg.createdAt.toMillis?.() || 0) - (prev.createdAt.toMillis?.() || 0) > 5 * 60 * 1000);
        acc.push({ ...msg, showDate, isFirst });
        return acc;
    }, []);

    return (
        <div className={`fixed inset-0 flex flex-col bg-gray-50 ${collapsed ? "md:left-[72px]" : "md:left-60"}`}>
            {/* ── Header ── */}
            <div className="shrink-0 bg-white border-b border-subtle z-30 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/chat" className="text-gray-400 hover:text-gray-700 shrink-0 transition-colors" aria-label="Back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
                    </Link>

                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-base" style={{ background: "var(--cp)" }}>
                        {chat?.name?.charAt(0)?.toUpperCase() || "G"}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{chat?.name}</p>
                        <p className="text-xs text-gray-400">
                            {members.length} members
                            {onlineMemberCount > 0 && (
                                <span className="text-green-500 font-semibold"> · {onlineMemberCount} online</span>
                            )}
                        </p>
                    </div>

                    {/* Info / settings button — admins only */}
                    {isAdmin && <button
                        onClick={() => setShowInfo(true)}
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Group settings"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="8" />
                            <line x1="12" y1="12" x2="12" y2="16" />
                        </svg>
                    </button>}

                    <div className="flex -space-x-2 shrink-0">
                        {members.slice(0, 4).map((m) => (
                            <div key={m.uid} className="relative w-7 h-7 rounded-full border-2 border-white bg-gray-200 overflow-hidden flex items-center justify-center">
                                {m.photoURL
                                    ? <img src={m.photoURL} alt={m.name || "Member"} className="w-full h-full object-cover" />
                                    : <span className="text-[9px] font-bold text-gray-600">{m.name?.charAt(0)}</span>}
                                {onlineSet.has(m.uid) && (
                                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                                )}
                            </div>
                        ))}
                        {members.length > 4 && (
                            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-gray-600">+{members.length - 4}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto" aria-label="Chat messages" aria-live="polite" aria-relevant="additions">
                <div className="max-w-2xl mx-auto px-4 py-4 space-y-0.5">
                    {messages.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-3">👋</div>
                            <p className="text-gray-500 font-semibold text-sm">No messages yet</p>
                            <p className="text-gray-400 text-xs mt-1">Be the first to say something!</p>
                        </div>
                    )}

                    {enriched.map((msg) => {
                        const isMe = msg.senderId === uid;

                        return (
                            <div key={msg.id}>
                                {/* Date separator */}
                                {msg.showDate && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-gray-200" />
                                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">
                                            {fmtDateLabel(msg.createdAt)}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-200" />
                                    </div>
                                )}

                                {/* Message row — long-press opens action sheet */}
                                <div
                                    className={`group flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${msg.isFirst ? "mt-3" : "mt-0.5"}`}
                                    onPointerDown={() => longPress.start(msg)}
                                    onPointerUp={longPress.cancel}
                                    onPointerLeave={longPress.cancel}
                                    onContextMenu={(e) => { e.preventDefault(); setContextMsg(msg); }}
                                >
                                    {/* Sender avatar (others only, first in run) */}
                                    <div className="w-8 h-8 shrink-0">
                                        {!isMe && msg.isFirst && (
                                            <div className="relative w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                {msg.senderPhoto
                                                    ? <img src={msg.senderPhoto} alt={msg.senderName || "Sender"} className="w-full h-full object-cover" />
                                                    : <span className="text-[11px] font-bold text-gray-600">{msg.senderName?.charAt(0)}</span>}
                                                {onlineSet.has(msg.senderId) && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                                        {/* Sender name */}
                                        {!isMe && msg.isFirst && (
                                            <p className="text-[10px] font-bold px-1" style={{ color: "var(--cp)" }}>{msg.senderName}</p>
                                        )}

                                        {/* Bubble */}
                                        <div className={`text-sm leading-relaxed break-words overflow-hidden ${
                                            isMe
                                                ? "text-white rounded-2xl rounded-br-md"
                                                : "text-gray-800 bg-white border border-gray-100 rounded-2xl rounded-bl-md shadow-sm"
                                        }`} style={isMe ? { background: "var(--cp)" } : {}}>
                                            {/* Image */}
                                            {msg.imageUrl && (
                                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Shared image"
                                                        className="w-full rounded-t-2xl object-cover"
                                                        style={{ maxHeight: 280 }}
                                                        loading="lazy"
                                                    />
                                                </a>
                                            )}
                                            {/* Text / reply quote */}
                                            {(msg.text || msg.replyTo) && (
                                                <div className="px-4 py-2.5">
                                                    {/* Reply-to quote */}
                                                    {msg.replyTo && (
                                                        <div className={`mb-2 px-3 py-1.5 rounded-xl text-xs ${
                                                            isMe
                                                                ? "bg-white/20 border-l-2 border-white/60"
                                                                : "bg-gray-100 border-l-2 border-gray-400"
                                                        }`}>
                                                            <p className={`font-bold truncate mb-0.5 ${isMe ? "text-white/90" : "text-gray-700"}`} style={!isMe ? { color: "var(--cp)" } : {}}>
                                                                {msg.replyTo.senderName}
                                                            </p>
                                                            <p className={`truncate ${isMe ? "text-white/75" : "text-gray-500"}`}>
                                                                {msg.replyTo.text}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {msg.text}
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp + quick reply button */}
                                        <div className={`flex items-center gap-1.5 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                            <p className="text-[10px] text-gray-300">{fmtTime(msg.createdAt)}</p>
                                            {/* Reply shortcut — hidden until group-hover on desktop, always present on touch */}
                                            <button
                                                onClick={() => { if (!longPress.didFire()) handleReply(msg); }}
                                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                                                aria-label="Reply"
                                                title="Reply"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                    <polyline points="9 17 4 12 9 7" />
                                                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} className="h-1" />
                </div>
            </div>

            {/* ── Image preview bar ── */}
            {pendingImage && (
                <div className="shrink-0 border-t border-subtle bg-gray-50 px-4 py-2 flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                        <img src={pendingImage.localUrl} alt="preview" className="w-full h-full object-cover" />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">{uploading ? "Uploading…" : "Image ready"}</p>
                        <p className="text-[11px] text-gray-400">You can add a caption below</p>
                    </div>
                    <button onClick={() => setPendingImage(null)} className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer" aria-label="Remove image">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Reply preview bar ── */}
            {replyingTo && (
                <div className="shrink-0 border-t border-subtle bg-gray-50 px-4 py-2 flex items-center gap-3">
                    <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: "var(--cp)" }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold truncate" style={{ color: "var(--cp)" }}>
                            Replying to {replyingTo.senderName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{replyingTo.text}</p>
                    </div>
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                        aria-label="Cancel reply"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Input bar ── */}
            <div className="shrink-0 bg-white border-t border-subtle">
                {!canSend ? (
                    <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Only admins can send messages in this group</span>
                    </div>
                ) : (
                    <>
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                        <form onSubmit={sendMessage} className="max-w-2xl mx-auto px-3 py-3 flex items-end gap-2">
                            {/* Image attach button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                                aria-label="Attach image"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                            </button>
                            <div className="flex-1 bg-gray-100 rounded-2xl flex items-center overflow-hidden focus-within:ring-2 transition-all" style={{ "--tw-ring-color": "var(--cp)" }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    placeholder={replyingTo ? `Reply to ${replyingTo.senderName}…` : pendingImage ? "Add a caption…" : "Message…"}
                                    maxLength={1000}
                                    className="flex-1 px-4 py-3 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={(!text.trim() && !pendingImage?.cloudinaryUrl) || sending || uploading}
                                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                                style={{ background: "var(--cp)" }}
                                aria-label="Send"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ transform: "rotate(45deg) translate(-1px, 1px)" }}>
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* ── Group Info / Settings panel (admin only) ── */}
            {showInfo && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => { setShowInfo(false); setMemberAction(null); setShowAddMembers(false); setSelectedToAdd([]); }}>
                    <div className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col" style={{ maxWidth: 600, margin: "0 auto" }} onClick={(e) => e.stopPropagation()}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 rounded-full bg-gray-200" />
                        </div>

                        {!showAddMembers ? (
                            <>
                                {/* Header */}
                                <div className="px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-base">{chat?.name}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">{members.length} members</p>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">⭐ Admin</span>
                                    </div>

                                    {/* Add members button */}
                                    <button
                                        onClick={() => { setShowAddMembers(true); loadCampers(); }}
                                        className="mt-3 w-full flex items-center gap-2.5 bg-cp-tint rounded-xl px-4 py-3 border cursor-pointer hover:opacity-90 transition-opacity"
                                        style={{ borderColor: "var(--cp)" }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0" style={{ color: "var(--cp)" }}>
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                                        </svg>
                                        <span className="text-sm font-semibold" style={{ color: "var(--cp)" }}>Add Members</span>
                                    </button>

                                    {/* Only-admins-can-send toggle */}
                                    <button
                                        onClick={toggleOnlyAdminsCanMessage}
                                        className="mt-2 w-full flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0 text-gray-500">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                            <span className="text-sm font-semibold text-gray-700">Only admins can send</span>
                                        </div>
                                        <div className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${onlyAdmins ? "" : "bg-gray-300"}`} style={onlyAdmins ? { background: "var(--cp)" } : {}}>
                                            <span className="block w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-200" style={{ transform: onlyAdmins ? "translateX(20px)" : "translateX(4px)" }} />
                                        </div>
                                    </button>
                                </div>

                                {/* Member list */}
                                <div className="overflow-y-auto flex-1 py-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 pt-2 pb-1">Members ({members.length})</p>
                                    {members.map((m) => {
                                        const mIsAdmin = (chat?.adminIds || []).includes(m.uid) || chat?.createdBy === m.uid;
                                        return (
                                            <button
                                                key={m.uid}
                                                onClick={() => m.uid !== uid ? setMemberAction(m) : undefined}
                                                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${m.uid !== uid ? "hover:bg-gray-50 active:bg-gray-100 cursor-pointer" : "cursor-default"}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {m.photoURL
                                                        ? <img src={m.photoURL} alt={m.name} className="w-full h-full object-cover" />
                                                        : <span className="text-sm font-bold text-gray-600">{m.name?.charAt(0)}</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{m.name}{m.uid === uid ? " (You)" : ""}</p>
                                                    {mIsAdmin && <p className="text-xs text-amber-600 font-medium">Admin</p>}
                                                </div>
                                                {m.uid !== uid && (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 text-gray-300 shrink-0">
                                                        <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button onClick={() => { setShowInfo(false); setMemberAction(null); }} className="shrink-0 py-4 text-sm font-bold text-gray-400 border-t border-gray-100 cursor-pointer">Close</button>
                            </>
                        ) : (
                            <>
                                {/* Add members sub-panel */}
                                <div className="px-5 pt-3 pb-3 border-b border-gray-100 shrink-0 flex items-center gap-3">
                                    <button onClick={() => { setShowAddMembers(false); setSelectedToAdd([]); setAddSearch(""); }} className="text-gray-400 hover:text-gray-700 cursor-pointer shrink-0">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-sm">Add Members</h3>
                                        <p className="text-xs text-gray-400">{selectedToAdd.length} selected</p>
                                    </div>
                                    {selectedToAdd.length > 0 && (
                                        <button
                                            onClick={addMembers}
                                            className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all active:scale-95 shrink-0 cursor-pointer"
                                            style={{ background: "var(--cp)" }}
                                        >
                                            Add {selectedToAdd.length}
                                        </button>
                                    )}
                                </div>

                                {/* Search */}
                                <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                                    <input
                                        type="text"
                                        value={addSearch}
                                        onChange={(e) => setAddSearch(e.target.value)}
                                        placeholder="Search campers…"
                                        className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                                        autoFocus
                                    />
                                </div>

                                {/* Camper list */}
                                <div className="overflow-y-auto flex-1">
                                    {loadingCampers ? (
                                        <div className="flex items-center justify-center py-12 gap-2 text-sm text-gray-400">
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-cp animate-spin" />
                                            Loading campers…
                                        </div>
                                    ) : (() => {
                                        const lq = addSearch.toLowerCase();
                                        const filtered = lq ? allCampers.filter((c) => c.name.toLowerCase().includes(lq)) : allCampers;
                                        return filtered.length === 0 ? (
                                            <p className="text-center py-12 text-sm text-gray-400">{addSearch ? "No campers found" : "Everyone's already in this group!"}</p>
                                        ) : filtered.map((camper) => {
                                            const isSel = !!selectedToAdd.find((s) => s.uid === camper.uid);
                                            return (
                                                <button
                                                    key={camper.uid}
                                                    onClick={() => setSelectedToAdd((prev) => isSel ? prev.filter((s) => s.uid !== camper.uid) : [...prev, camper])}
                                                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-50 last:border-0 cursor-pointer"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                                        {camper.photoURL
                                                            ? <img src={camper.photoURL} alt={camper.name} className="w-full h-full object-cover" />
                                                            : <span className="text-sm font-bold text-gray-600">{camper.name?.charAt(0)}</span>}
                                                    </div>
                                                    <p className="flex-1 text-sm font-semibold text-gray-900 truncate">{camper.name}</p>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSel ? "border-transparent" : "border-gray-300"}`} style={{ background: isSel ? "var(--cp)" : "transparent" }}>
                                                        {isSel && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                                    </div>
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Member action sheet ── */}
            {memberAction && (
                <div className="fixed inset-0 z-[60] bg-black/40 flex items-end" onClick={() => setMemberAction(null)}>
                    <div className="w-full bg-white rounded-t-3xl shadow-2xl pb-safe" style={{ maxWidth: 600, margin: "0 auto" }} onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{memberAction.name}</p>
                        </div>
                        <div className="py-2">
                            <button
                                onClick={() => { toggleAdminStatus(memberAction.uid); setMemberAction(null); }}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left cursor-pointer"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 text-amber-500">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-800">
                                    {(chat?.adminIds || []).includes(memberAction.uid) ? "Remove admin" : "Make admin"}
                                </span>
                            </button>
                            <button
                                onClick={() => { removeMember(memberAction.uid); setMemberAction(null); setShowInfo(false); }}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 active:bg-red-100 transition-colors text-left cursor-pointer"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 text-red-500">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                <span className="text-sm font-semibold text-red-600">Remove from group</span>
                            </button>
                        </div>
                        <button onClick={() => setMemberAction(null)} className="w-full py-4 text-sm font-bold text-gray-400 border-t border-gray-100 cursor-pointer">Cancel</button>
                    </div>
                </div>
            )}

            {/* ── Long-press action sheet ── */}
            {contextMsg && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-end"
                    onClick={() => setContextMsg(null)}
                >
                    <div
                        className="w-full bg-white rounded-t-3xl shadow-2xl pb-safe"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: 600, margin: "0 auto" }}
                    >
                        {/* Quoted preview */}
                        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{contextMsg.senderName}</p>
                            <p className="text-sm text-gray-700 line-clamp-3">{contextMsg.text}</p>
                        </div>

                        <div className="py-2">
                            <button
                                onClick={() => handleReply(contextMsg)}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left cursor-pointer"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
                                    <polyline points="9 17 4 12 9 7" />
                                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-800">Reply</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigator.clipboard?.writeText(contextMsg.text).catch(() => {});
                                    setContextMsg(null);
                                }}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left cursor-pointer"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-800">Copy text</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setContextMsg(null)}
                            className="w-full py-4 text-sm font-bold text-gray-400 border-t border-gray-100 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
