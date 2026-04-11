// app/trending/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    doc,
    runTransaction,
    getDoc,
} from "firebase/firestore";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

// ── Category meta ─────────────────────────────────────────────────────────────
const CATEGORY_META = {
    infrastructure: {
        emoji: "🏗️",
        color: "text-orange-700",
        bg: "bg-orange-50",
        label: "Infrastructure",
    },
    education: {
        emoji: "📚",
        color: "text-blue-700",
        bg: "bg-blue-50",
        label: "Education",
    },
    healthcare: {
        emoji: "❤️",
        color: "text-rose-700",
        bg: "bg-rose-50",
        label: "Healthcare",
    },
    water: {
        emoji: "💧",
        color: "text-cyan-700",
        bg: "bg-cyan-50",
        label: "Water",
    },
    security: {
        emoji: "🔒",
        color: "text-purple-700",
        bg: "bg-purple-50",
        label: "Security",
    },
    electricity: {
        emoji: "⚡",
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        label: "Electricity",
    },
    environment: {
        emoji: "🌿",
        color: "text-green-700",
        bg: "bg-green-50",
        label: "Environment",
    },
    gist: {
        emoji: "💬",
        color: "text-pink-700",
        bg: "bg-pink-50",
        label: "Gist",
    },
    food: {
        emoji: "🍛",
        color: "text-amber-700",
        bg: "bg-amber-50",
        label: "Food",
    },
    other: {
        emoji: "📌",
        color: "text-gray-700",
        bg: "bg-gray-100",
        label: "Other",
    },
};

// ── Filter map — same as home page ───────────────────────────────────────────
const FILTER_MAP = {
    gist: { field: "category", values: ["gist", "gossip", "discussion"] },
    polls: { field: "responseType", values: ["multiple_choice", "yes_no"] },
    food: { field: "category", values: ["food"] },
    issues: {
        field: "category",
        values: [
            "infrastructure",
            "education",
            "healthcare",
            "water",
            "security",
            "electricity",
            "environment",
        ],
    },
};

// ── Time range helpers ────────────────────────────────────────────────────────
const TIME_RANGE_SECONDS = {
    "24h": 60 * 60 * 24,
    "7d": 60 * 60 * 24 * 7,
    "30d": 60 * 60 * 24 * 30,
};

function isWithinRange(createdAt, timeRange) {
    if (!createdAt?.seconds) return true; // if no date, always show
    const nowSeconds = Math.floor(Date.now() / 1000);
    const cutoff = nowSeconds - TIME_RANGE_SECONDS[timeRange];
    return createdAt.seconds >= cutoff;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(seconds) {
    const diff = Math.floor(Date.now() / 1000) - seconds;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return "Yesterday";
    return `${Math.floor(diff / 86400)} days ago`;
}

function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
}

function getAvatarCount(upvotes) {
    if (upvotes <= 0) return 0;
    return Math.min(upvotes, 4);
}

const AVATAR_LETTERS = ["A", "B", "C", "D"];
const avatarColors = [
    "bg-orange-400",
    "bg-blue-400",
    "bg-green-500",
    "bg-purple-400",
    "bg-rose-400",
    "bg-cyan-500",
    "bg-amber-400",
    "bg-indigo-400",
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const FireIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2c0 0-5.5 5.5-5.5 11a5.5 5.5 0 0011 0C17.5 7.5 12 2 12 2zm0 15a3.5 3.5 0 01-3.5-3.5c0-3 2-5.5 3.5-8 1.5 2.5 3.5 5 3.5 8A3.5 3.5 0 0112 17z" />
    </svg>
);
const CommentIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);
const LocationIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3 h-3"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
const SearchIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4 text-gray-400"
    >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const TrophyIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2L9.5 8.5H3l5.5 4L6 19l6-4 6 4-2.5-6.5L21 8.5h-6.5L12 2z" />
    </svg>
);
const UpvoteIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#16A34A" : "none"}
        stroke="#16A34A"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="18 15 12 9 6 15" />
    </svg>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    if (!status) return null;
    const map = {
        viral: { label: "🔥 Viral", bg: "bg-red-50", text: "text-red-600" },
        trending: {
            label: "📈 Trending",
            bg: "bg-orange-50",
            text: "text-orange-600",
        },
        rising: {
            label: "⚡ Rising",
            bg: "bg-amber-50",
            text: "text-amber-600",
        },
        "under-review": {
            label: "✅ Under Review",
            bg: "bg-green-50",
            text: "text-green-600",
        },
        "needs-attention": {
            label: "⚠ Needs Attention",
            bg: "bg-yellow-50",
            text: "text-yellow-600",
        },
    };
    const s = map[status];
    if (!s) return null;
    return (
        <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}
        >
            {s.label}
        </span>
    );
}

// ── Login Prompt Modal ────────────────────────────────────────────────────────
function LoginPromptModal({ isOpen, onClose, onLogin }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm w-full z-10 shadow-2xl">
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#FFF7F2] rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔒</span>
                    </div>
                    <h3
                        className="text-lg font-bold text-gray-900 mb-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Login Required
                    </h3>
                    <p
                        className="text-sm text-gray-500 mb-6"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Please sign in to upvote issues and join the
                        conversation.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onLogin}
                            className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#F97316] text-white hover:bg-[#C2410C] transition-colors cursor-pointer"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-[#FED7AA] animate-pulse">
            <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-24 bg-gray-100 rounded-full" />
                <div className="h-4 w-12 bg-gray-100 rounded" />
            </div>
            <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="w-14 h-16 bg-gray-100 rounded-xl shrink-0" />
            </div>
        </div>
    );
}

// ── Trending Card ─────────────────────────────────────────────────────────────
function TrendingCard({
    issue,
    currentUser,
    authReady,
    rank,
    isAnonymous,
    onLoginClick,
}) {
    const [upvoted, setUpvoted] = useState(false);
    const [count, setCount] = useState(issue.upvotes || 0);
    const [loading, setLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [realtimeCommentCount, setRealtimeCommentCount] = useState(0);

    useEffect(() => {
        if (!issue.id) return;
        const unsubscribe = onSnapshot(
            query(collection(db, "issues", issue.id, "comments")),
            (snap) => {
                setRealtimeCommentCount(snap.docs.length);
            },
        );
        return () => unsubscribe();
    }, [issue.id]);

    useEffect(() => {
        if (!currentUser || !issue.id || isAnonymous) return;
        const saved = localStorage.getItem(
            `upvote_${issue.id}_${currentUser.uid}`,
        );
        if (saved === "1") setUpvoted(true);
    }, [currentUser, issue.id, isAnonymous]);

    useEffect(() => {
        setCount(issue.upvotes || 0);
    }, [issue.upvotes]);

    const handleUpvote = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnonymous || !currentUser || currentUser.isAnonymous) {
            setShowLoginPrompt(true);
            return;
        }
        if (!authReady || loading) return;
        const wasUpvoted = upvoted;
        const newCount = wasUpvoted ? Math.max(0, count - 1) : count + 1;
        setUpvoted(!wasUpvoted);
        setCount(newCount);
        setLoading(true);
        try {
            const docRef = doc(db, "issues", issue.id);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(docRef);
                if (!snap.exists()) throw new Error("not found");
                const current = snap.data().upvotes || 0;
                tx.update(docRef, {
                    upvotes: wasUpvoted
                        ? Math.max(0, current - 1)
                        : current + 1,
                });
            });
            if (!wasUpvoted) {
                const issueSnap = await getDoc(docRef);
                const issueData = issueSnap.data();
                if (
                    issueData?.author?.uid &&
                    issueData.author.uid !== currentUser.uid
                ) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.UPVOTE,
                        recipientId: issueData.author.uid,
                        actorId: currentUser.uid,
                        actorName: currentUser.displayName || "Someone",
                        actorPhotoURL: currentUser.photoURL,
                        issueId: issue.id,
                        issueTitle: issue.title,
                        meta: `${newCount} total upvotes`,
                    });
                }
                const milestones = [10, 25, 50, 100, 250, 500];
                if (milestones.includes(newCount) && issueData?.author?.uid) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.MILESTONE,
                        recipientId: issueData.author.uid,
                        actorId: "system",
                        actorName: "Camp Voice",
                        issueId: issue.id,
                        issueTitle: issue.title,
                        meta: `🎉 ${newCount} upvotes reached!`,
                    });
                }
            }
            if (wasUpvoted) {
                localStorage.removeItem(
                    `upvote_${issue.id}_${currentUser.uid}`,
                );
            } else {
                localStorage.setItem(
                    `upvote_${issue.id}_${currentUser.uid}`,
                    "1",
                );
            }
        } catch (err) {
            console.error("Upvote failed:", err);
            setUpvoted(wasUpvoted);
            setCount(issue.upvotes || 0);
        } finally {
            setLoading(false);
        }
    };

    const avatarCount = getAvatarCount(count);

    return (
        <>
            <Link href={`/issue/${issue.id}`} className="block">
                <div className="issue-card bg-white rounded-2xl p-4 shadow-card border border-[#FED7AA] hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer relative">
                    <div
                        className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 border-white ${rank === 1 ? "bg-linear-to-br from-yellow-400 to-yellow-600 text-white" : rank === 2 ? "bg-linear-to-br from-gray-300 to-gray-500 text-white" : rank === 3 ? "bg-linear-to-br from-orange-400 to-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                        {rank}
                    </div>
                    <div className="flex items-center justify-between mb-2.5">
                        <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${issue.categoryBg} ${issue.categoryColor} flex items-center gap-1.5`}
                        >
                            <span>{issue.categoryEmoji}</span>
                            {issue.categoryLabel}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="font-bold text-[#F97316]">
                                #{rank}
                            </span>
                            <span>· {issue.timeAgo}</span>
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                            <h3
                                className="font-bold text-gray-900 text-sm leading-snug mb-1.5"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {issue.title}
                            </h3>
                            <p
                                className="text-xs text-gray-500 leading-relaxed line-clamp-2"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {issue.description}
                            </p>
                        </div>
                        <div
                            className="shrink-0"
                            onClick={(e) => e.preventDefault()}
                        >
                            <button
                                onClick={handleUpvote}
                                disabled={loading}
                                className={`flex flex-col items-center gap-0.5 w-14 h-16 rounded-xl border-2 transition-all cursor-pointer disabled:opacity-60 ${upvoted ? "border-green-500 bg-green-50" : isAnonymous ? "border-gray-200 bg-gray-50 hover:border-gray-300" : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"}`}
                            >
                                <span className="mt-2">
                                    <UpvoteIcon active={upvoted} />
                                </span>
                                <span
                                    className={`text-sm font-bold ${upvoted ? "text-green-600" : isAnonymous ? "text-gray-400" : "text-green-600"}`}
                                >
                                    {formatNum(count)}
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <LocationIcon />
                                {issue.location}
                            </span>
                            <StatusBadge status={issue.status} />
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <CommentIcon />
                            <span className="text-xs font-semibold">
                                {realtimeCommentCount}
                            </span>
                        </div>
                    </div>
                    {avatarCount > 0 && (
                        <div className="flex items-center gap-2 mt-2.5">
                            <div className="flex items-center">
                                {AVATAR_LETTERS.slice(0, avatarCount).map(
                                    (a, i) => (
                                        <div
                                            key={i}
                                            className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}
                                            style={{
                                                marginLeft: i === 0 ? 0 : -6,
                                            }}
                                        >
                                            {a}
                                        </div>
                                    ),
                                )}
                            </div>
                            <span
                                className="text-xs text-gray-400"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {count} {count === 1 ? "upvote" : "upvotes"}
                            </span>
                        </div>
                    )}
                </div>
            </Link>
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                onLogin={onLoginClick}
            />
        </>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TrendingPage() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [timeRange, setTimeRange] = useState("24h");
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
                setAuthReady(true);
            } else {
                signInAnonymously(auth).catch(console.error);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetched = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    const seconds = d.createdAt?.seconds ?? null;
                    const meta =
                        CATEGORY_META[d.category] ?? CATEGORY_META.other;
                    return {
                        id: docSnap.id,
                        title: d.title ?? "Untitled Issue",
                        description: d.description ?? "",
                        location: d.location ?? "Nigeria",
                        category: d.category ?? "other",
                        responseType: d.responseType ?? "yes_no",
                        totalVotes: d.totalVotes ?? 0,
                        upvotes: d.upvotes ?? 0,
                        commentCount: d.commentCount ?? 0,
                        createdAt: d.createdAt ?? null,
                        status: d.status ?? null,
                        timeAgo: seconds ? timeAgo(seconds) : "Just now",
                        categoryEmoji: meta.emoji,
                        categoryColor: meta.color,
                        categoryBg: meta.bg,
                        categoryLabel: meta.label,
                    };
                });
                setIssues(fetched);
                setLoading(false);
            },
            (err) => {
                console.error("Firestore error:", err);
                setError("Could not load issues. Please refresh.");
                setLoading(false);
            },
        );
        return () => unsubscribe();
    }, []);

    const handleLoginClick = () => {
        window.location.href = "/login";
    };

    // ── Same filter pills as home page ────────────────────────────────────────
    const filters = [
        { key: "all", label: "All" },
        { key: "gist", label: "💬 Gist" },
        { key: "polls", label: "🗳️ Polls" },
        { key: "food", label: "🍛 Food" },
        { key: "issues", label: "🚨 Issues" },
    ];

    // ── Filter + time range + sort ────────────────────────────────────────────
    const filtered = issues
        .filter((issue) => {
            // 1. Time range
            if (!isWithinRange(issue.createdAt, timeRange)) return false;
            // 2. Search
            if (search) {
                const q = search.toLowerCase();
                if (
                    !issue.title.toLowerCase().includes(q) &&
                    !issue.description.toLowerCase().includes(q)
                )
                    return false;
            }
            // 3. Category filter
            if (activeFilter === "all" || activeFilter === "trending")
                return true;
            const rule = FILTER_MAP[activeFilter];
            if (!rule) return true;
            const issueVal = (issue[rule.field] ?? "").toLowerCase();
            return rule.values.includes(issueVal);
        })
        .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)); // always sort by upvotes on this page

    // ── Stats ─────────────────────────────────────────────────────────────────
    const resolvedCount = filtered.filter(
        (i) => i.status === "resolved",
    ).length;
    const mostActiveState = filtered.length
        ? (Object.entries(
              filtered.reduce((acc, i) => {
                  const state = i.location.split(",")[0].trim();
                  acc[state] = (acc[state] ?? 0) + 1;
                  return acc;
              }, {}),
          ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—")
        : "—";

    const timeRangeLabel = {
        "24h": "Last 24 hours",
        "7d": "Last 7 days",
        "30d": "Last 30 days",
    }[timeRange];

    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* ── Mobile Header ── */}
            <header className="md:hidden sticky top-0 z-40 bg-[#F97316] px-4 pt-4 pb-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1
                            className="text-white font-bold text-lg"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Explore
                        </h1>
                        <p className="text-white/70 text-xs mt-0.5">
                            Trending issues across Nigeria
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
                        <TrophyIcon />
                        <span className="text-white text-xs font-semibold">
                            {issues.length} issues
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Desktop Header ── */}
            <div className="hidden md:block px-6 pt-8 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1
                            className="text-2xl font-bold text-gray-900"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Explore Issues
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Browse and discover trending issues across Nigeria
                        </p>
                    </div>
                    {/* Time range — desktop */}
                    <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
                        {["24h", "7d", "30d"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${timeRange === t ? "bg-[#F97316] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Stats Banner ── */}
            <div className="px-4 md:px-6 mb-4">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                            label: "In Range",
                            value: loading
                                ? "…"
                                : filtered.length.toLocaleString(),
                            icon: "📋",
                            color: "text-gray-800",
                        },
                        {
                            label: "Resolved",
                            value: loading ? "…" : resolvedCount.toString(),
                            icon: "✅",
                            color: "text-green-600",
                        },
                        {
                            label: "Most Active",
                            value: loading ? "…" : mostActiveState,
                            icon: "🔥",
                            color: "text-[#F97316]",
                        },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="bg-white rounded-xl p-3 border border-gray-50 shadow-card text-center"
                        >
                            <div className="text-lg mb-0.5">{s.icon}</div>
                            <div
                                className={`text-base font-black ${s.color}`}
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {s.value}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Search ── */}
            <div className="px-4 md:px-6 mb-3">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <SearchIcon />
                    </div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search trending issues..."
                        className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm text-gray-700 placeholder-gray-400 border border-gray-100 shadow-card focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]/40 transition-all"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    />
                </div>
            </div>

            {/* ── Filter Pills — same as home ── */}
            <div className="px-4 md:px-6 mb-3">
                <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: "none" }}
                >
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeFilter === f.key ? "bg-[#F97316] text-white shadow-sm" : "bg-white text-black border border-gray-200 hover:border-[#F97316]/40 hover:text-[#F97316]"}`}
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Time Range — mobile ── */}
            <div className="md:hidden px-4 mb-4">
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
                    {["24h", "7d", "30d"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${timeRange === t ? "bg-[#F97316] text-white" : "text-gray-500"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Section Header ── */}
            <div className="px-4 md:px-6 mb-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[#F97316]">
                    <FireIcon className="w-4 h-4" />
                    <span
                        className="text-sm font-bold"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Trending by Upvotes · {timeRangeLabel}
                    </span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">
                    {filtered.length} issues
                </span>
            </div>

            {error && (
                <div
                    className="mx-4 md:mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    {error}
                </div>
            )}

            {/* ── Issues List ── */}
            <div className="px-4 md:px-6 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((issue, index) => (
                        <TrendingCard
                            key={issue.id}
                            issue={issue}
                            currentUser={currentUser}
                            authReady={authReady}
                            rank={index + 1}
                            isAnonymous={isAnonymous}
                            onLoginClick={handleLoginClick}
                        />
                    ))
                ) : (
                    <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-50">
                        <div className="text-4xl mb-3">🔍</div>
                        <p
                            className="font-semibold text-gray-700"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {issues.length === 0
                                ? "No issues posted yet"
                                : "No issues found"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            {issues.length === 0
                                ? "Be the first to report one!"
                                : `Try a different filter or expand the time range`}
                        </p>
                    </div>
                )}
            </div>

            <div className="h-6" />
        </div>
    );
}
