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
    serverTimestamp,
    getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useSidebar } from "@/components/SidebarContext";

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
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

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

    // Messages
    useEffect(() => {
        if (!uid) return;
        const q = query(collection(db, "groupChats", chatId, "messages"), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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

    const sendMessage = async (e) => {
        e?.preventDefault();
        const msg = text.trim();
        if (!msg || sending || !uid) return;
        setSending(true);
        setText("");
        try {
            await addDoc(collection(db, "groupChats", chatId, "messages"), {
                text: msg,
                senderId: uid,
                senderName: userName,
                senderPhoto: photoURL || null,
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, "groupChats", chatId), {
                lastMessage: msg.length > 60 ? msg.slice(0, 60) + "…" : msg,
                lastMessageAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } catch {
            setText(msg); // Restore on failure
        } finally {
            setSending(false);
            inputRef.current?.focus();
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

                    {/* Group avatar */}
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

                    {/* Member stacked avatars */}
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

                                {/* Message row */}
                                <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${msg.isFirst ? "mt-3" : "mt-0.5"}`}>
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
                                        {/* Sender name (others, first in run) */}
                                        {!isMe && msg.isFirst && (
                                            <p className="text-[10px] font-bold px-1" style={{ color: "var(--cp)" }}>{msg.senderName}</p>
                                        )}

                                        {/* Bubble */}
                                        <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                                            isMe
                                                ? "text-white rounded-2xl rounded-br-md"
                                                : "text-gray-800 bg-white border border-gray-100 rounded-2xl rounded-bl-md shadow-sm"
                                        }`} style={isMe ? { background: "var(--cp)" } : {}}>
                                            {msg.text}
                                        </div>

                                        {/* Timestamp */}
                                        <p className={`text-[10px] text-gray-300 px-1 ${isMe ? "text-right" : "text-left"}`}>
                                            {fmtTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} className="h-1" />
                </div>
            </div>

            {/* ── Input bar ── */}
            <div className="shrink-0 bg-white border-t border-subtle">
                <form onSubmit={sendMessage} className="max-w-2xl mx-auto px-3 py-3 flex items-end gap-2">
                    <div className="flex-1 bg-gray-100 rounded-2xl flex items-center overflow-hidden focus-within:ring-2 transition-all" style={{ "--tw-ring-color": "var(--cp)" }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Message…"
                            maxLength={1000}
                            className="flex-1 px-4 py-3 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!text.trim() || sending}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                        style={{ background: "var(--cp)" }}
                        aria-label="Send"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ transform: "rotate(45deg) translate(-1px, 1px)" }}>
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
