"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

function buildLeaderboard(users) {
    const map = {};
    for (const u of users) {
        const platoon = u.platoon?.trim();
        if (!platoon) continue;
        if (!map[platoon]) map[platoon] = { platoon, score: 0, members: 0, posts: 0, upvotes: 0 };
        map[platoon].members++;
        map[platoon].posts += u.postsCount || 0;
        map[platoon].upvotes += u.upvotesReceived || 0;
        map[platoon].score += u.impactScore || 0;
    }
    return Object.values(map).sort((a, b) => b.score - a.score);
}

const RANK_STYLES = [
    {
        gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 40%, #F97316 100%)",
        glow: "0 0 40px rgba(251,191,36,0.5), 0 8px 32px rgba(249,115,22,0.3)",
        ring: "#FBBF24",
        label: "#78350F",
        height: "h-44",
        crown: true,
        badge: "🥇",
        textColor: "#1C1403",
        shimmer: "rgba(255,255,255,0.25)",
    },
    {
        gradient: "linear-gradient(135deg, #94A3B8 0%, #CBD5E1 40%, #94A3B8 100%)",
        glow: "0 0 24px rgba(148,163,184,0.4), 0 4px 20px rgba(100,116,139,0.2)",
        ring: "#CBD5E1",
        label: "#1E293B",
        height: "h-36",
        crown: false,
        badge: "🥈",
        textColor: "#0F172A",
        shimmer: "rgba(255,255,255,0.2)",
    },
    {
        gradient: "linear-gradient(135deg, #C2633E 0%, #D97B55 40%, #B45309 100%)",
        glow: "0 0 24px rgba(180,83,9,0.4), 0 4px 20px rgba(194,99,62,0.2)",
        ring: "#D97B55",
        label: "#431407",
        height: "h-32",
        crown: false,
        badge: "🥉",
        textColor: "#1C0A03",
        shimmer: "rgba(255,255,255,0.15)",
    },
];

function PodiumCard({ row, rankStyle, rank }) {
    const initial = row.platoon.replace(/^platoon\s*/i, "").trim().charAt(0).toUpperCase() || "?";
    return (
        <div className="flex flex-col items-center gap-2 flex-1">
            {/* Crown for 1st */}
            {rankStyle.crown && (
                <div className="text-3xl animate-bounce" style={{ animationDuration: "2s" }}>👑</div>
            )}
            {!rankStyle.crown && <div className="h-10" />}

            {/* Avatar ring */}
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 shadow-lg z-10"
                style={{
                    background: rankStyle.gradient,
                    borderColor: rankStyle.ring,
                    boxShadow: rankStyle.glow,
                    color: rankStyle.textColor,
                }}
            >
                {initial}
            </div>

            {/* Podium block */}
            <div
                className={`w-full ${rankStyle.height} rounded-t-2xl relative overflow-hidden flex flex-col items-center justify-end pb-3 px-2`}
                style={{
                    background: rankStyle.gradient,
                    boxShadow: rankStyle.glow,
                }}
            >
                {/* Shimmer overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, ${rankStyle.shimmer} 0%, transparent 50%, ${rankStyle.shimmer} 100%)`,
                    }}
                />
                {/* Rank badge */}
                <div
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl"
                >
                    {rankStyle.badge}
                </div>
                <div className="relative z-10 text-center">
                    <div
                        className="text-[15px] font-black leading-tight"
                        style={{ color: rankStyle.textColor }}
                    >
                        {row.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-semibold opacity-60" style={{ color: rankStyle.textColor }}>pts</div>
                </div>
            </div>

            {/* Platoon label */}
            <div className="text-center px-1">
                <p className="text-[12px] font-black text-white leading-tight truncate max-w-[90px]">{row.platoon}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{row.members} members</p>
            </div>
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--card-bg)] animate-pulse">
            <div className="w-8 h-8 bg-[color:var(--muted-bg)] rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[color:var(--muted-bg)] rounded-full w-32" />
                <div className="h-2.5 bg-[color:var(--muted-bg)] rounded-full w-48" />
            </div>
            <div className="h-6 w-16 bg-[color:var(--muted-bg)] rounded-full shrink-0" />
        </div>
    );
}

export default function PlatoonLeaderboard() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const maxScore = rows[0]?.score || 1;

    return (
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
            {/* ── Sticky header ── */}
            <div
                className="sticky top-0 z-30 border-b border-[color:var(--border-subtle)]"
                style={{ background: "var(--nav-bg)" }}
            >
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link
                        href="/"
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-[color:var(--muted-bg)] transition-all"
                        aria-label="Back"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-[15px] font-extrabold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Platoon Leaderboard
                        </h1>
                        <p className="text-[11px] text-gray-400 font-medium">Live rankings across all platoons</p>
                    </div>
                    <Link
                        href="/platoons/fight"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm"
                        style={{ background: "linear-gradient(135deg, var(--cp-deeper), var(--cp))" }}
                    >
                        ⚔️ Battle
                    </Link>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

                {/* ── HERO PODIUM SECTION ── */}
                {(loading || rows.length >= 2) && (
                    <div
                        className="rounded-3xl overflow-hidden relative"
                        style={{
                            background: "linear-gradient(160deg, #0F0C29 0%, #1a1040 40%, #24243e 100%)",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                        }}
                    >
                        {/* Grid pattern */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{
                                backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                                backgroundSize: "40px 40px",
                            }}
                        />
                        {/* Glow blobs */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(251,191,36,0.15) 0%, transparent 70%)" }} />
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(249,115,22,0.1) 0%, transparent 70%)" }} />

                        {/* Header */}
                        <div className="relative pt-6 pb-2 px-6 text-center">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-3">
                                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                                <span className="text-white/80 text-[11px] font-semibold tracking-wide uppercase">Season Rankings</span>
                            </div>
                            <h2
                                className="text-2xl font-black text-white leading-none"
                                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                            >
                                Hall of Champions
                            </h2>
                            <p className="text-white/40 text-xs font-medium mt-1">Ranked by total impact score</p>
                        </div>

                        {/* Podium */}
                        {loading ? (
                            <div className="flex items-end justify-center gap-3 px-6 pb-0 pt-8 h-64">
                                {[1, 0, 2].map((i) => (
                                    <div key={i} className={`flex-1 rounded-t-2xl animate-pulse ${i === 0 ? "h-44" : i === 1 ? "h-36" : "h-32"}`}
                                        style={{ background: "rgba(255,255,255,0.08)" }} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-end justify-center gap-2 px-4 pb-0 pt-6">
                                {/* 2nd place (left) */}
                                {rows[1] && <PodiumCard row={rows[1]} rankStyle={RANK_STYLES[1]} rank={2} />}
                                {/* 1st place (center) */}
                                {rows[0] && <PodiumCard row={rows[0]} rankStyle={RANK_STYLES[0]} rank={1} />}
                                {/* 3rd place (right) */}
                                {rows[2] && <PodiumCard row={rows[2]} rankStyle={RANK_STYLES[2]} rank={3} />}
                            </div>
                        )}

                        {/* Bottom stats strip */}
                        <div className="relative mt-4 border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
                            {[
                                { label: "Platoons", value: loading ? "—" : rows.length },
                                { label: "Top Score", value: loading ? "—" : rows[0]?.score.toLocaleString() || "—" },
                                { label: "Members", value: loading ? "—" : rows.reduce((s, r) => s + r.members, 0) },
                            ].map((s) => (
                                <div key={s.label} className="text-center py-3">
                                    <div className="text-white font-black text-base" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{s.value}</div>
                                    <div className="text-white/40 text-[10px] font-medium mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Error state ── */}
                {error && (
                    <div className="text-center py-12 text-red-400 text-sm bg-red-50 rounded-2xl border border-red-100">
                        {error}
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && rows.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">🏆</div>
                        <p className="font-bold text-gray-700 text-base" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>No platoon data yet</p>
                        <p className="text-gray-400 text-sm mt-1 mb-4">Update your profile with your platoon to appear here.</p>
                        <Link href="/profile/edit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "var(--cp)" }}>
                            Set my platoon →
                        </Link>
                    </div>
                )}

                {/* ── Full Ranked List ── */}
                {rows.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-extrabold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Full Rankings</h3>
                            <div className="flex-1 h-px bg-[color:var(--border-subtle)]" />
                            <span className="text-[11px] text-gray-400 font-medium">{rows.length} platoons</span>
                        </div>
                        <div className="space-y-2">
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                : rows.map((row, i) => {
                                    const pct = Math.round((row.score / maxScore) * 100);
                                    const isTop3 = i < 3;
                                    const rankColors = [
                                        { bg: "bg-gradient-to-br from-yellow-400 to-orange-500", text: "text-white" },
                                        { bg: "bg-gradient-to-br from-gray-300 to-gray-500", text: "text-white" },
                                        { bg: "bg-gradient-to-br from-orange-400 to-red-500", text: "text-white" },
                                    ];
                                    const rc = rankColors[i] ?? { bg: "bg-[color:var(--muted-bg)]", text: "text-gray-500" };

                                    return (
                                        <div
                                            key={row.platoon}
                                            className="group relative bg-[color:var(--card-bg)] rounded-2xl border border-[color:var(--border-subtle)] hover:border-[color:var(--border)] hover:shadow-md transition-all duration-200 overflow-hidden"
                                        >
                                            {/* Score bar background */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: isTop3
                                                        ? "linear-gradient(90deg, var(--cp-deeper), var(--cp))"
                                                        : "var(--cp)",
                                                }}
                                            />
                                            <div className="relative flex items-center gap-3 px-4 py-3.5">
                                                {/* Rank badge */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 ${rc.bg} ${rc.text}`}>
                                                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-900 truncate" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                                        {row.platoon}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        <span className="text-[10px] text-gray-400">{row.members} members</span>
                                                        <span className="text-[10px] text-gray-300">·</span>
                                                        <span className="text-[10px] text-gray-400">{row.posts} posts</span>
                                                        <span className="text-[10px] text-gray-300">·</span>
                                                        <span className="text-[10px] text-gray-400">{row.upvotes} likes</span>
                                                    </div>
                                                </div>

                                                {/* Score */}
                                                <div className="text-right shrink-0">
                                                    <p
                                                        className="text-[15px] font-black"
                                                        style={{
                                                            color: isTop3 ? "var(--cp)" : "var(--text)",
                                                            fontFamily: "Plus Jakarta Sans, sans-serif",
                                                        }}
                                                    >
                                                        {row.score.toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">points</p>
                                                </div>
                                            </div>

                                            {/* Progress bar at bottom */}
                                            <div className="h-0.5 bg-[color:var(--muted-bg)]">
                                                <div
                                                    className="h-full transition-all duration-700"
                                                    style={{
                                                        width: `${pct}%`,
                                                        background: isTop3
                                                            ? "linear-gradient(90deg, var(--cp-deeper), var(--cp))"
                                                            : "var(--border)",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* ── Champion info banner ── */}
                {!loading && rows.length > 0 && (
                    <div
                        className="rounded-2xl p-4 flex items-center gap-3"
                        style={{
                            background: "linear-gradient(135deg, var(--cp-tint), var(--muted-bg))",
                            border: "1px solid var(--cp-border)",
                        }}
                    >
                        <span className="text-2xl shrink-0">🏆</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-800" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                Top platoon earns the <span style={{ color: "var(--cp)" }}>Platoon Champion</span> badge
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Visible on every member's profile card</p>
                        </div>
                        <Link
                            href="/profile"
                            className="shrink-0 px-3 py-1.5 rounded-xl text-white text-[11px] font-bold"
                            style={{ background: "var(--cp)" }}
                        >
                            My Profile
                        </Link>
                    </div>
                )}

                {/* ── Battle CTA ── */}
                <Link
                    href="/platoons/fight"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg transition-all active:scale-95 relative overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                        }}
                    />
                    <span className="relative text-2xl">⚔️</span>
                    <div className="relative">
                        <div className="text-base font-black">Platoon vs Platoon Battle</div>
                        <div className="text-white/50 text-[11px] font-medium">Challenge another platoon now</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5 relative text-white/60">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </Link>

                <div className="h-4" />
            </div>
        </div>
    );
}
