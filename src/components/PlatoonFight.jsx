"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

function buildPlatoonMap(users) {
    const map = {};
    for (const u of users) {
        const platoon = u.platoon?.trim();
        if (!platoon) continue;
        if (!map[platoon]) {
            map[platoon] = { platoon, score: 0, members: 0, posts: 0, upvotes: 0, comments: 0 };
        }
        map[platoon].members++;
        map[platoon].posts += u.postsCount || 0;
        map[platoon].upvotes += u.upvotesReceived || 0;
        map[platoon].comments += u.commentsCount || 0;
        map[platoon].score += u.impactScore || 0;
    }
    return map;
}

function StatRow({ label, a, b, higher = "more" }) {
    const aWins = higher === "more" ? a > b : a < b;
    const bWins = higher === "more" ? b > a : b < a;
    const tied = a === b;

    return (
        <div className="flex items-center gap-3">
            <div className={`flex-1 text-right text-sm font-bold rounded-xl px-3 py-2 transition-colors ${aWins ? "bg-cp text-white" : tied ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-400"}`}>
                {a.toLocaleString()}
            </div>
            <div className="shrink-0 w-28 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                {label}
            </div>
            <div className={`flex-1 text-left text-sm font-bold rounded-xl px-3 py-2 transition-colors ${bWins ? "bg-cp text-white" : tied ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-400"}`}>
                {b.toLocaleString()}
            </div>
        </div>
    );
}

export default function PlatoonFight() {
    const [platoonMap, setPlatoonMap] = useState({});
    const [platoonNames, setPlatoonNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [platoonA, setPlatoonA] = useState("");
    const [platoonB, setPlatoonB] = useState("");
    const [fightStarted, setFightStarted] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const snap = await getDocs(collection(db, "users"));
                const users = snap.docs.map((d) => d.data());
                const map = buildPlatoonMap(users);
                const names = Object.keys(map).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                setPlatoonMap(map);
                setPlatoonNames(names);
            } catch (err) {
                console.error(err);
                setError("Failed to load platoon data");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const dataA = platoonMap[platoonA];
    const dataB = platoonMap[platoonB];

    const canFight = platoonA && platoonB && platoonA !== platoonB && dataA && dataB;

    let winner = null;
    if (canFight) {
        if (dataA.score > dataB.score) winner = "A";
        else if (dataB.score > dataA.score) winner = "B";
        else winner = "tie";
    }

    return (
        <div className="min-h-screen bg-page pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-subtle shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link href="/platoons" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Platoon Battle ⚔️
                        </h1>
                        <p className="text-xs text-gray-400">Head-to-head platoon showdown</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-16 text-red-400 text-sm">{error}</div>
                )}

                {!loading && !error && platoonNames.length < 2 && (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        Not enough platoon data yet. Ask corpers to add their platoon to their profile!
                    </div>
                )}

                {!loading && !error && platoonNames.length >= 2 && (
                    <>
                        {/* Picker */}
                        <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Select Two Platoons</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        Platoon A
                                    </label>
                                    <select
                                        value={platoonA}
                                        onChange={(e) => { setPlatoonA(e.target.value); setFightStarted(false); }}
                                        className="w-full bg-subtle border border-theme rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 cursor-pointer"
                                        style={{ "--tw-ring-color": "var(--cp-border)" }}
                                    >
                                        <option value="">Choose...</option>
                                        {platoonNames.filter((n) => n !== platoonB).map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white shadow-sm"
                                    style={{ background: "var(--cp)" }}>
                                    ⚔️
                                </div>

                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        Platoon B
                                    </label>
                                    <select
                                        value={platoonB}
                                        onChange={(e) => { setPlatoonB(e.target.value); setFightStarted(false); }}
                                        className="w-full bg-subtle border border-theme rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 cursor-pointer"
                                        style={{ "--tw-ring-color": "var(--cp-border)" }}
                                    >
                                        <option value="">Choose...</option>
                                        {platoonNames.filter((n) => n !== platoonA).map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                disabled={!canFight}
                                onClick={() => setFightStarted(true)}
                                className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                style={{ background: "var(--cp)" }}
                            >
                                {!platoonA || !platoonB ? "Select both platoons" : platoonA === platoonB ? "Pick different platoons" : "⚔️ Start Battle!"}
                            </button>
                        </div>

                        {/* Battle results */}
                        {fightStarted && canFight && (
                            <>
                                {/* Winner banner */}
                                <div className={`rounded-2xl p-5 text-center text-white shadow-lg ${winner === "tie" ? "bg-gray-500" : "bg-cp"}`}
                                    style={winner !== "tie" ? { background: "var(--cp)" } : {}}>
                                    {winner === "tie" ? (
                                        <>
                                            <div className="text-4xl mb-2">🤝</div>
                                            <p className="text-lg font-black" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                                It&apos;s a Draw!
                                            </p>
                                            <p className="text-white/70 text-sm mt-1">Both platoons are perfectly matched</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl mb-2">🏆</div>
                                            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Winner</p>
                                            <p className="text-2xl font-black" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                                {winner === "A" ? platoonA : platoonB}
                                            </p>
                                            <p className="text-white/70 text-sm mt-1">
                                                Leads by {Math.abs(dataA.score - dataB.score).toLocaleString()} points
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Stat-by-stat breakdown */}
                                <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm space-y-1">
                                    {/* Platoon name headers */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`flex-1 text-center text-sm font-black truncate px-2 ${winner === "A" ? "text-cp" : "text-gray-500"}`}
                                            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                            {platoonA}
                                            {winner === "A" && <span className="ml-1">🏆</span>}
                                        </div>
                                        <div className="shrink-0 w-28" />
                                        <div className={`flex-1 text-center text-sm font-black truncate px-2 ${winner === "B" ? "text-cp" : "text-gray-500"}`}
                                            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                            {platoonB}
                                            {winner === "B" && <span className="ml-1">🏆</span>}
                                        </div>
                                    </div>

                                    <StatRow label="Impact Score" a={dataA.score} b={dataB.score} />
                                    <StatRow label="Members" a={dataA.members} b={dataB.members} />
                                    <StatRow label="Posts" a={dataA.posts} b={dataB.posts} />
                                    <StatRow label="Likes Received" a={dataA.upvotes} b={dataB.upvotes} />
                                    {(dataA.comments > 0 || dataB.comments > 0) && (
                                        <StatRow label="Comments" a={dataA.comments} b={dataB.comments} />
                                    )}
                                </div>

                                <p className="text-center text-xs text-gray-400">
                                    Score = combined impact points of all platoon members
                                </p>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
