"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function ChatFAB() {
    const pathname = usePathname();
    const [unread, setUnread] = useState(0);
    const [uid, setUid] = useState(null);

    useEffect(() => {
        let inviteUnsub = null;

        const authUnsub = onAuthStateChanged(auth, (u) => {
            const nextUid = u && !u.isAnonymous ? u.uid : null;
            setUid(nextUid);

            // Tear down previous invite listener on every auth change
            inviteUnsub?.();
            inviteUnsub = null;

            if (!nextUid) {
                setUnread(0);
                return;
            }

            const q = query(
                collection(db, "groupChatInvites"),
                where("invitedUid", "==", nextUid),
                where("status", "==", "pending"),
            );
            inviteUnsub = onSnapshot(q, (snap) => setUnread(snap.size), () => setUnread(0));
        });

        return () => {
            authUnsub();
            inviteUnsub?.();
        };
    }, []);

    // Hide on chat pages and when not signed in
    if (!uid || pathname.startsWith("/chat")) return null;

    const label = unread > 0
        ? `Group chats — ${unread} pending invite${unread > 1 ? "s" : ""}`
        : "Open group chats";

    return (
        <Link
            href="/chat"
            aria-label={label}
            title={label}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            style={{
                background: "var(--cp)",
                boxShadow: "0 4px 20px var(--cp-glow)",
            }}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
                aria-hidden="true"
            >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>

            {unread > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                >
                    {unread > 9 ? "9+" : unread}
                </span>
            )}
        </Link>
    );
}
