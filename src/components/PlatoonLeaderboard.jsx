"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

const MEDALS = ["🥇", "🥈", "🥉"];

function buildLeaderboard(users) {
    const map = {};
    for (const u of users) {
        const platoon = u.platoon?.trim();
        if (!platoon) continue;
        if (!map[platoon]) map[platoon] = { platoon, score: 0, members: 0, posts: 0, upvotes: 0 };
        map[platoon].members++;
        map[platoon].posts += u.postsCount || 0;
        map[platoon].upvotes += u.upvotesReceived || 0;
        map[platoon].score += (u.impactScore || 0);
    }
    return Object.values(map).sort((a, b) => b.score - a.score);
}

export default function PlatoonLeaderboard() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [highlight, setHighlight] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const snap = await getDocs(collection(db, "users"));
                const users = snap.docs.map((d) => d.data());
                setRows(buildLeaderboard(users));
            } catch (err) {
                console.error(err);
                setError("Failed to load leaderboard");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen bg-page">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-subtle">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Platoon Leaderboard
                        </h1>
                        <p className="text-xs text-gray-400">Total engagement across all platoons</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-16 text-red-400 text-sm">{error}</div>
                )}

                {!loading && !error && rows.length === 0 && (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        No platoon data yet. Update your profile with your platoon!
                    </div>
                )}

                {/* Top 3 podium */}
                {rows.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 py-4">
                        {[rows[1], rows[0], rows[2]].map((row, podiumIdx) => {
                            const rank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                            const heights = ["h-24", "h-32", "h-20"];
                            return (
                                <div key={row.platoon} className="flex flex-col items-center gap-2">
                                    <span className="text-2xl">{MEDALS[rank]}</span>
                                    <div
                                        className={`${heights[podiumIdx]} w-20 rounded-t-2xl flex items-end justify-center pb-2`}
                                        style={{ background: podiumIdx === 1 ? "var(--cp)" : "var(--cp-tint)" }}
                                    >
                                        <span className={`text-xs font-bold ${podiumIdx === 1 ? "text-white" : "text-cp"}`}>
                                            {row.score.toLocaleString()} pts
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 text-center max-w-[80px] truncate">
                                        {row.platoon}
                                    </p>
                                    <p className="text-xs text-gray-400">{row.members} members</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Full list */}
                <div className="space-y-2">
                    {rows.map((row, i) => (
                        <div
                            key={row.platoon}
                            className={`bg-card rounded-2xl border shadow-sm px-4 py-4 flex items-center gap-4 transition-all ${i === 0 ? "border-amber-300 bg-amber-50" : "border-subtle"}`}
                        >
                            <span className="text-xl w-7 text-center shrink-0">{MEDALS[i] || `${i + 1}`}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{row.platoon}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {row.members} members · {row.posts} posts · {row.upvotes} upvotes
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-base font-bold text-cp">{row.score.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">points</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-cp-tint border border-cp/20 rounded-2xl p-4 text-sm text-gray-600 text-center">
                    🏆 Top platoon members earn the <strong>Platoon Champion</strong> badge on their profile.
                    <br />
                    <Link href="/profile" className="text-cp font-semibold hover:underline mt-1 inline-block">
                        Update your platoon →
                    </Link>
                </div>

                <Link
                    href="/platoons/fight"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-sm transition-all active:scale-95"
                    style={{ background: "var(--cp)" }}
                >
                    ⚔️ Platoon vs Platoon Battle
                </Link>
            </div>
        </div>
    );
}
