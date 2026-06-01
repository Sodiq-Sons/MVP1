// app/trending/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

// ── Category meta ─────────────────────────────────────────────────────────────
const CATEGORY_META = {
    infrastructure: {
        emoji: "🏗️",
        color: "text-cp",
        bg: "bg-cp-tint",
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
    // "polls" kept for legacy docs; "poll" covers new posts from create-issue
    polls: {
        emoji: "🗳️",
        color: "text-violet-700",
        bg: "bg-violet-50",
        label: "Poll",
    },
    poll: {
        emoji: "🗳️",
        color: "text-violet-700",
        bg: "bg-violet-50",
        label: "Poll",
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
        bg: "bg-muted",
        label: "Other",
    },
};

// ── Filter map ───────────────────────────────────────────────────────────────
const FILTER_MAP = {
    gist: { field: "category", values: ["gist", "gossip", "discussion"] },
    polls: { field: "category", values: ["poll", "polls"] },
    food: { field: "category", values: ["food"] },
    issues: {
        field: "category",
        values: [
            "healthcare",
            "electricity",
            "issue",
            "infrastructure",
            "other",
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
    if (!createdAt?.seconds) return true;
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
    "bg-amber-400",
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
const PlatoonIcon = ({ className = "w-3 h-3" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={className}
    >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
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
const DownvoteIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#DC2626" : "none"}
        stroke="#DC2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    if (!status) return null;
    const map = {
        viral: { label: "🔥 Viral", bg: "bg-red-50", text: "text-red-600" },
        trending: {
            label: "📈 Trending",
            bg: "bg-cp-tint",
            text: "text-cp",
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
            <div className="relative bg-card rounded-2xl p-6 mx-4 max-w-sm w-full z-10 shadow-2xl">
                <div className="text-center">
                    <div className="w-16 h-16 bg-cp-tint rounded-full flex items-center justify-center mx-auto mb-4">
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
                        Please sign in to like posts and join the
                        conversation.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm border border-theme text-gray-600 hover:bg-subtle transition-colors cursor-pointer"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onLogin}
                            className="flex-1 py-3 rounded-xl font-bold text-sm btn-primary transition-colors cursor-pointer"
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
        <div className="bg-card rounded-2xl p-4 border border-cp-border animate-pulse">
            <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-24 bg-muted rounded-full" />
                <div className="h-4 w-12 bg-muted rounded" />
            </div>
            <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <div className="w-14 h-16 bg-muted rounded-xl shrink-0" />
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
    const [downvoted, setDownvoted] = useState(false);
    const [downvoteCount, setDownvoteCount] = useState(issue.downvotes || 0);
    const [downvoteLoading, setDownvoteLoading] = useState(false);
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

    // Restore upvote state from localStorage
    useEffect(() => {
        if (!currentUser || !issue.id || isAnonymous) return;
        if (
            localStorage.getItem(`upvote_${issue.id}_${currentUser.uid}`) ===
            "1"
        )
            setUpvoted(true);
    }, [currentUser, issue.id, isAnonymous]);

    // Restore downvote state from localStorage
    useEffect(() => {
        if (!currentUser || !issue.id || isAnonymous) return;
        if (
            localStorage.getItem(`downvote_${issue.id}_${currentUser.uid}`) ===
            "1"
        )
            setDownvoted(true);
    }, [currentUser, issue.id, isAnonymous]);

    useEffect(() => {
        setCount(issue.upvotes || 0);
    }, [issue.upvotes]);

    useEffect(() => {
        setDownvoteCount(issue.downvotes || 0);
    }, [issue.downvotes]);

    const handleUpvote = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnonymous || !currentUser || currentUser.isAnonymous) {
            setShowLoginPrompt(true);
            return;
        }
        if (!authReady || loading || downvoteLoading) return;

        const wasUpvoted = upvoted;
        const wasDownvoted = downvoted;
        const newCount = wasUpvoted ? Math.max(0, count - 1) : count + 1;

        setUpvoted(!wasUpvoted);
        setCount(newCount);
        if (wasDownvoted) {
            setDownvoted(false);
            setDownvoteCount((c) => Math.max(0, c - 1));
        }
        setLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ issueId: issue.id, type: "up" }),
            });
            if (!res.ok) throw new Error("Vote failed");

            if (wasUpvoted) localStorage.removeItem(`upvote_${issue.id}_${currentUser.uid}`);
            else localStorage.setItem(`upvote_${issue.id}_${currentUser.uid}`, "1");
            if (wasDownvoted) localStorage.removeItem(`downvote_${issue.id}_${currentUser.uid}`);

            if (!wasUpvoted) {
                if (issue?.author?.uid && issue.author.uid !== currentUser.uid) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.UPVOTE,
                        recipientId: issue.author.uid,
                        actorId: currentUser.uid,
                        actorName: currentUser.displayName || "Someone",
                        actorPhotoURL: currentUser.photoURL,
                        issueId: issue.id,
                        issueTitle: issue.title,
                        meta: `${newCount} total likes`,
                    });
                }
                const milestones = [10, 25, 50, 100, 250, 500];
                if (milestones.includes(newCount) && issue?.author?.uid) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.MILESTONE,
                        recipientId: issue.author.uid,
                        actorId: "system",
                        actorName: "Camp Voice",
                        issueId: issue.id,
                        issueTitle: issue.title,
                        meta: `🎉 ${newCount} likes reached!`,
                    });
                }
            }
        } catch (err) {
            console.error("Upvote failed:", err);
            setUpvoted(wasUpvoted);
            setDownvoted(wasDownvoted);
            setCount(issue.upvotes || 0);
            setDownvoteCount(issue.downvotes || 0);
        } finally {
            setLoading(false);
        }
    };

    const handleDownvote = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnonymous || !currentUser || currentUser.isAnonymous) {
            setShowLoginPrompt(true);
            return;
        }
        if (!authReady || downvoteLoading || loading) return;

        const wasDownvoted = downvoted;
        const wasUpvoted = upvoted;
        const newCount = wasDownvoted ? Math.max(0, downvoteCount - 1) : downvoteCount + 1;

        setDownvoted(!wasDownvoted);
        setDownvoteCount(newCount);
        if (wasUpvoted) {
            setUpvoted(false);
            setCount((c) => Math.max(0, c - 1));
        }
        setDownvoteLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ issueId: issue.id, type: "down" }),
            });
            if (!res.ok) throw new Error("Vote failed");

            if (wasDownvoted) localStorage.removeItem(`downvote_${issue.id}_${currentUser.uid}`);
            else localStorage.setItem(`downvote_${issue.id}_${currentUser.uid}`, "1");
            if (wasUpvoted) localStorage.removeItem(`upvote_${issue.id}_${currentUser.uid}`);
        } catch (err) {
            console.error("Oppose failed:", err);
            setDownvoted(wasDownvoted);
            setUpvoted(wasUpvoted);
            setDownvoteCount(issue.downvotes || 0);
            setCount(issue.upvotes || 0);
        } finally {
            setDownvoteLoading(false);
        }
    };

    function normalisePlatoon(raw) {
        if (!raw) return null;
        const s = raw.toString().trim();
        if (!s) return null;
        if (s.toLowerCase().startsWith("platoon")) return s;
        return `Platoon ${s}`;
    }

    // Resolve author display name
    const authorName = issue.author?.isAnonymous
        ? "👤 Anonymous"
        : issue.author?.name || issue.author?.displayName || null;

    const avatarCount = getAvatarCount(count);

    return (
        <>
            <Link href={`/issue/${issue.id}`} className="block group">
                <article className="relative bg-[color:var(--card-bg)] rounded-2xl cursor-pointer">
                    {/* Rank badge */}
                    <div
                        className={`absolute -top-3 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-md border-2 border-[color:var(--bg)] z-10 ${
                            rank === 1 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                            : rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                            : rank === 3 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white"
                            : "bg-[color:var(--muted-bg)] text-gray-600"
                        }`}
                    >
                        {rank}
                    </div>

                    <div className="pt-5 px-4 pb-4 flex flex-col">
                        {/* Author + category row */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                                {issue.author?.photoURL && !issue.author?.isAnonymous ? (
                                    <img src={issue.author.photoURL} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-black/5 shrink-0" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
                                        <span className="text-gray-500 text-[10px] font-bold">
                                            {issue.author?.isAnonymous ? "?" : (authorName || "?").charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="min-w-0">
                                    {authorName && (
                                        <span className="text-[11px] font-semibold text-gray-700 block leading-none truncate">{authorName}</span>
                                    )}
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {normalisePlatoon(issue.author?.platoon) && (
                                            <span className="text-[10px] text-gray-400">{normalisePlatoon(issue.author.platoon)}</span>
                                        )}
                                        {normalisePlatoon(issue.author?.platoon) && <span className="text-[10px] text-gray-300">·</span>}
                                        <span className="text-[10px] text-gray-400">{issue.timeAgo}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${issue.categoryBg} ${issue.categoryColor}`}>
                                {issue.categoryEmoji} {issue.categoryLabel}
                            </span>
                        </div>

                        {/* Title */}
                        <h3
                            className="font-extrabold text-gray-900 text-[15px] leading-snug mb-2 line-clamp-2"
                            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        >
                            {issue.title}
                        </h3>

                        {/* Description */}
                        <p
                            className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 flex-1"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {issue.description}
                        </p>

                        {/* Status */}
                        {issue.status && (
                            <div className="mt-1.5">
                                <StatusBadge status={issue.status} />
                            </div>
                        )}

                        {/* Engagement footer */}
                        <div
                            className="flex items-center gap-0.5 mt-3 pt-2"
                            onClick={(e) => e.preventDefault()}
                        >
                            <button
                                onClick={handleUpvote}
                                disabled={loading || downvoted}
                                title={downvoted ? "Remove your dislike first" : "Like this post"}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 text-[12px] font-semibold ${upvoted ? "bg-green-50 text-green-600" : "text-gray-400 hover:bg-green-50 hover:text-green-600"}`}
                            >
                                <UpvoteIcon active={upvoted} />
                                {formatNum(count)}
                            </button>
                            <button
                                onClick={handleDownvote}
                                disabled={downvoteLoading || upvoted}
                                title={upvoted ? "Remove your like first" : "Dislike this post"}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 text-[12px] font-semibold ${downvoted ? "bg-red-50 text-red-500" : "text-gray-400 hover:bg-red-50 hover:text-red-500"}`}
                            >
                                <DownvoteIcon active={downvoted} />
                                {formatNum(downvoteCount)}
                            </button>
                            <div className="flex-1" />
                            <div className="flex items-center gap-1.5 px-2 text-gray-400">
                                <CommentIcon />
                                <span className="text-[12px] font-semibold">{realtimeCommentCount}</span>
                            </div>
                        </div>
                    </div>
                </article>
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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchWrapperRef = useRef(null);
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
                        downvotes: d.downvotes ?? 0,
                        commentCount: d.commentCount ?? 0,
                        createdAt: d.createdAt ?? null,
                        status: d.status ?? null,
                        demographics: d.demographics ?? [],
                        author: d.author ?? null,
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

    useEffect(() => {
        const handler = (e) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const suggestions = search.trim().length >= 2
        ? issues
            .filter((issue) => {
                const q = search.toLowerCase();
                return (
                    issue.title.toLowerCase().includes(q) ||
                    issue.description.toLowerCase().includes(q)
                );
            })
            .slice(0, 6)
        : [];

    const filters = [
        { key: "all", label: "All" },
        { key: "gist", label: "💬 Gist" },
        { key: "polls", label: "🗳️ Polls" },
        { key: "food", label: "🍛 Food" },
        { key: "issues", label: "🚨 Issues" },
        { key: "opposed", label: "👎 Dislike" },
    ];

    const filtered = issues
        .filter((issue) => {
            if (!isWithinRange(issue.createdAt, timeRange)) return false;
            if (search) {
                const q = search.toLowerCase();
                if (
                    !issue.title.toLowerCase().includes(q) &&
                    !issue.description.toLowerCase().includes(q)
                )
                    return false;
            }
            if (activeFilter === "opposed") return (issue.downvotes || 0) > 0;
            if (activeFilter === "all") return true;
            const rule = FILTER_MAP[activeFilter];
            if (!rule) return true;
            const issueVal = (issue[rule.field] ?? "").toLowerCase();
            return rule.values.includes(issueVal);
        })
        .sort((a, b) => {
            if (activeFilter === "opposed")
                return (b.downvotes || 0) - (a.downvotes || 0);
            return (b.upvotes || 0) - (a.upvotes || 0);
        });

    const mostActivePlatoon = (() => {
        if (!filtered.length) return "—";
        const platoonCounts = filtered.reduce((acc, issue) => {
            let platoonNum = null;
            if (issue.demographics?.includes("platoon")) {
                if (issue.author?.platoon) {
                    platoonNum = issue.author.platoon;
                } else if (issue.author?.stateCode) {
                    const lastDigit = issue.author.stateCode
                        .toString()
                        .slice(-1);
                    platoonNum = parseInt(lastDigit) || 1;
                } else if (issue.author?.uid) {
                    // Use the uid's last char code as a stable, render-safe
                    // fallback (avoids calling impure Date.now() during render).
                    const seed = issue.author.uid.charCodeAt(issue.author.uid.length - 1);
                    platoonNum = (seed % 10) + 1;
                }
            }
            if (platoonNum) {
                const key = `Platoon ${platoonNum}`;
                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {});
        const sorted = Object.entries(platoonCounts).sort(
            (a, b) => b[1] - a[1],
        );
        return sorted[0]?.[0] ?? "No platoon data";
    })();

    const timeRangeLabel = {
        "24h": "Last 24 hours",
        "7d": "Last 7 days",
        "30d": "Last 30 days",
    }[timeRange];

    return (
        <div className="min-h-screen pb-24 md:pb-8" style={{ background: "var(--bg)" }}>

            {/* ── Mobile Header ── */}
            <header
                className="md:hidden sticky top-0 z-40 overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, var(--cp-deeper) 0%, var(--cp) 100%)",
                    boxShadow: "0 4px 24px var(--cp-glow)",
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                    }}
                />
                <div className="relative flex items-center justify-between px-4 py-3.5">
                    <div>
                        <h1 className="text-white font-extrabold text-[15px]" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            🔥 Explore
                        </h1>
                        <p className="text-white/60 text-[10px] font-medium mt-0.5">Trending posts across camp</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/15 border border-white/20 rounded-full p-0.5">
                            {["24h", "7d", "30d"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeRange(t)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${timeRange === t ? "bg-white text-gray-800" : "text-white/70 hover:text-white"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Desktop Header ── */}
            <div className="hidden md:block px-6 pt-8 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1
                            className="text-[28px] font-extrabold text-gray-900 leading-none"
                            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        >
                            🔥 Explore
                        </h1>
                        <p className="text-gray-400 text-sm mt-1.5 font-medium">Trending posts sorted by most likes</p>
                    </div>
                    <div className="flex items-center gap-2 bg-[color:var(--card-bg)] rounded-xl p-1 border border-[color:var(--border-subtle)] shadow-sm">
                        {["24h", "7d", "30d"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === t ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                style={timeRange === t ? { background: "linear-gradient(135deg, var(--cp-deeper), var(--cp))" } : {}}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Stats Banner ── */}
            <div className="px-4 md:px-6 mb-4">
                <div
                    className="rounded-2xl p-4 relative overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, var(--cp-deeper) 0%, var(--cp) 100%)",
                        boxShadow: "0 4px 20px var(--cp-glow)",
                    }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
                            backgroundSize: "18px 18px",
                        }}
                    />
                    <div className="relative grid grid-cols-3 divide-x divide-white/20">
                        {[
                            { label: "In Range", value: loading ? "…" : filtered.length, icon: "📋" },
                            { label: "Most Active", value: loading ? "…" : mostActivePlatoon.replace(/^platoon\s*/i, "P"), icon: "🔥" },
                            { label: timeRange === "24h" ? "24h" : timeRange === "7d" ? "7 days" : "30 days", value: loading ? "…" : issues.reduce((s, i) => s + (i.upvotes || 0), 0).toLocaleString(), icon: "👍" },
                        ].map((s) => (
                            <div key={s.label} className="text-center px-2">
                                <div className="text-lg mb-0.5">{s.icon}</div>
                                <div className="text-white font-black text-lg leading-none" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    {s.value}
                                </div>
                                <div className="text-white/60 text-[10px] font-medium mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="px-4 md:px-6 mb-3">
                <div className="relative" ref={searchWrapperRef}>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <SearchIcon />
                    </div>
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => e.key === "Escape" && setShowSuggestions(false)}
                        placeholder="Search trending posts..."
                        className="w-full bg-[color:var(--card-bg)] rounded-xl pl-9 pr-4 py-3 text-sm text-gray-700 placeholder-gray-400 border border-[color:var(--border-subtle)] shadow-sm focus:outline-none focus:border-[color:var(--cp)] focus:shadow-md transition-all"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[color:var(--card-bg)] rounded-xl border border-[color:var(--border-subtle)] shadow-lg z-50 overflow-hidden">
                            {suggestions.map((issue) => {
                                const meta = CATEGORY_META[issue.category] ?? CATEGORY_META.other;
                                return (
                                    <button
                                        key={issue.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setSearch(issue.title);
                                            setShowSuggestions(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[color:var(--muted-bg)] transition-colors text-left cursor-pointer border-b border-[color:var(--border-subtle)] last:border-b-0"
                                    >
                                        <span className="text-base shrink-0">{meta.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                                {issue.title}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                                {meta.label}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Filter Pills ── */}
            <div className="px-4 md:px-6 mb-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`shrink-0 snap-start px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                activeFilter === f.key
                                    ? "text-white shadow-md"
                                    : "bg-[color:var(--card-bg)] text-gray-600 border border-[color:var(--border-subtle)] hover:border-[color:var(--border)] hover:shadow-sm"
                            }`}
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                ...(activeFilter === f.key ? { background: "linear-gradient(135deg, var(--cp-deeper), var(--cp))" } : {}),
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Section Header ── */}
            <div className="px-4 md:px-6 mb-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5" style={{ color: "var(--cp)" }}>
                    <FireIcon className="w-4 h-4" />
                    <span className="text-sm font-extrabold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        {activeFilter === "opposed" ? "Most Disliked" : "Trending by Likes"}
                    </span>
                </div>
                <span className="text-xs text-gray-400 font-medium">· {timeRangeLabel}</span>
                <div className="flex-1 h-px bg-[color:var(--border-subtle)]" />
                <span className="text-[11px] text-gray-400 font-medium">{filtered.length} posts</span>
            </div>

            {error && (
                <div className="mx-4 md:mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    {error}
                </div>
            )}

            {/* ── Issues List ── */}
            <div className="px-4 md:px-6 pt-4 pb-6 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
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
                    <div className="col-span-2 text-center py-16 bg-[color:var(--card-bg)] rounded-2xl border border-[color:var(--border-subtle)]">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="font-semibold text-gray-700" style={{ fontFamily: "DM Sans, sans-serif" }}>
                            {issues.length === 0 ? "No posts yet" : "No posts found"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            {issues.length === 0 ? "Be the first to post!" : "Try a different filter or time range"}
                        </p>
                    </div>
                )}
            </div>

            <div className="h-6" />
        </div>
    );
}
