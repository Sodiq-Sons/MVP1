"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";

const LS_KEY = "remember_this_last";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function RememberThis() {
    const [memory, setMemory] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user || user.isAnonymous) return;
            const last = Number(localStorage.getItem(LS_KEY) || 0);
            if (Date.now() - last < ONE_DAY_MS) return; // only once per day

            try {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

                const q = query(
                    collection(db, "issues"),
                    where("author.uid", "==", user.uid),
                    where("createdAt", ">=", Timestamp.fromDate(eightDaysAgo)),
                    where("createdAt", "<=", Timestamp.fromDate(sevenDaysAgo)),
                    orderBy("createdAt", "desc"),
                    limit(1)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const d = snap.docs[0];
                    setMemory({ id: d.id, ...d.data() });
                    localStorage.setItem(LS_KEY, String(Date.now()));
                }
            } catch (err) {
                console.error("RememberThis:", err);
            }
        });
        return () => unsub();
    }, []);

    if (!memory || dismissed) return null;

    return (
        <div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[190] w-[min(340px,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-subtle overflow-hidden animate-fade-in"
            role="status"
            aria-live="polite"
        >
            <div className="px-4 py-3 flex items-center gap-2 border-b border-subtle bg-cp-tint">
                <span className="text-lg">🕰️</span>
                <span className="text-xs font-bold text-gray-700">Remember this? · 7 days ago</span>
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>
            <div className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{memory.title}</p>
                {memory.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{memory.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                    <Link
                        href={`/issue/${memory.id}`}
                        className="flex-1 text-center text-xs font-bold bg-cp text-white py-2 rounded-xl  transition-colors"
                        onClick={() => setDismissed(true)}
                    >
                        See post
                    </Link>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-xs text-gray-400 px-3 cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
