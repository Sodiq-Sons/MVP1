// app/page.tsx
"use client";

import Link from "next/link";
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
import { db, auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

// ── Category display map ──────────────────────────────────────────────────────
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
    polls: {
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
        bg: "bg-gray-100",
        label: "Other",
    },
};

// ── Filter map
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

// ── Helpers
function timeAgo(seconds) {
    const diff = Math.floor(Date.now() / 1000) - seconds;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return "Yesterday";
    return `${Math.floor(diff / 86400)} days ago`;
}

function formatUpvotes(n) {
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
    "bg-green-400",
    "bg-purple-400",
    "bg-rose-400",
    "bg-cyan-400",
    "bg-amber-400",
    "bg-indigo-400",
];

// ── Icons ─────
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
const FilterIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
);
const LocationIcon = ({ className = "w-3 h-3" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={className}
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
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
const CommentIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4 text-gray-400"
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);
const UserIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    if (!status) return null;
    const map = {
        trending: {
            label: "🔥 Trending",
            className: "bg-red-50 text-red-600 border border-red-100",
        },
        "under-review": {
            label: "✅ Under Review",
            className: "bg-blue-50 text-blue-600 border border-blue-100",
        },
        resolved: {
            label: "✔ Resolved",
            className: "bg-green-50 text-green-600 border border-green-100",
        },
        "needs-attention": {
            label: "⚠ Needs Attention",
            className: "bg-yellow-50 text-yellow-600 border border-yellow-100",
        },
    };
    const s = map[status];
    if (!s) return null;
    return (
        <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.className}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
        >
            {s.label}
        </span>
    );
}

// ── Skeleton ──
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

// ── Issue Card
function IssueCard({
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
    const meta = CATEGORY_META[issue.category] ?? CATEGORY_META.other;
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
                const issueSnap = await getDoc(doc(db, "issues", issue.id));
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
                    {rank && (
                        <div
                            className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 border-white ${rank === 1 ? "bg-linear-to-br from-yellow-400 to-yellow-600 text-white" : rank === 2 ? "bg-linear-to-br from-gray-300 to-gray-500 text-white" : rank === 3 ? "bg-linear-to-br from-orange-400 to-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}
                        >
                            {rank}
                        </div>
                    )}
                    <div className="flex items-center justify-between mb-2.5">
                        <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color} flex items-center gap-1.5`}
                        >
                            <span>{meta.emoji}</span>
                            {meta.label}
                        </span>
                        <span
                            className="text-xs text-gray-400"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {rank ? `Trending #${rank} · ` : ""}
                            {issue.timeAgo}
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
                                className={`upvote-btn flex flex-col items-center gap-0.5 w-14 h-16 rounded-xl border-2 transition-all cursor-pointer disabled:opacity-60 ${upvoted ? "border-green-500 bg-green-50" : isAnonymous ? "border-gray-200 bg-gray-50 hover:border-gray-300" : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"}`}
                            >
                                <span className="mt-2">
                                    <UpvoteIcon active={upvoted} />
                                </span>
                                <span
                                    className={`text-sm font-bold ${upvoted ? "text-green-600" : isAnonymous ? "text-gray-400" : "text-green-600"}`}
                                >
                                    {formatUpvotes(count)}
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
                        <button
                            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            onClick={(e) => e.preventDefault()}
                        >
                            <CommentIcon />
                            <span
                                className="text-xs font-semibold"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {realtimeCommentCount}
                            </span>
                        </button>
                    </div>
                    {avatarCount > 0 && (
                        <div className="flex items-center gap-2 mt-2.5">
                            <div className="flex items-center">
                                {AVATAR_LETTERS.slice(0, avatarCount).map(
                                    (a, i) => (
                                        <div
                                            key={i}
                                            className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold -ml-1.5 first:ml-0`}
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
export default function HomePage() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
                setAuthReady(true);
                if (!user.isAnonymous) {
                    setUserProfile({
                        name: user.displayName || "User",
                        email: user.email,
                        photoURL: user.photoURL,
                    });
                }
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (err) {
                    console.error("Anonymous sign-in failed:", err);
                    setAuthReady(true);
                }
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
                    return {
                        id: docSnap.id,
                        title: d.title ?? "Untitled Issue",
                        description: d.description ?? "",
                        location: d.location ?? "Nigeria",
                        category: d.category ?? "other",
                        responseType: d.responseType ?? "yes_no",
                        voteOptions: d.voteOptions ?? [],
                        votes: d.votes ?? {},
                        totalVotes: d.totalVotes ?? 0,
                        upvotes: d.upvotes ?? 0,
                        commentCount: d.commentCount ?? 0,
                        createdAt: d.createdAt ?? null,
                        timeAgo: seconds ? timeAgo(seconds) : "Just now",
                        status: d.status ?? null,
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

    const filters = [
        { key: "all", label: "All" },
        { key: "trending", label: "🔥 Trending" },
        { key: "gist", label: "💬 Gist" },
        { key: "polls", label: "🗳️ Polls" },
        { key: "food", label: "🍛 Food" },
        { key: "issues", label: "🚨 Issues" },
    ];

    const filteredIssues = issues
        .filter((issue) => {
            if (search) {
                const q = search.toLowerCase();
                if (
                    !issue.title.toLowerCase().includes(q) &&
                    !issue.description.toLowerCase().includes(q)
                )
                    return false;
            }
            if (activeFilter === "all" || activeFilter === "trending")
                return true;
            const rule = FILTER_MAP[activeFilter];
            if (!rule) return true;
            const issueVal = (issue[rule.field] ?? "").toLowerCase();
            return rule.values.includes(issueVal);
        })
        .sort((a, b) => {
            if (activeFilter === "trending")
                return (b.upvotes || 0) - (a.upvotes || 0);
            return 0;
        });

    const displayName = isAnonymous ? "Guest" : userProfile?.name || "User";
    const displayLocation = isAnonymous ? "" : userProfile?.state || "Nigeria";

    return (
        <div
            className="min-h-screen pb-24 md:pb-0"
            style={{ background: "#FDF6EF" }}
        >
            {/* ── Mobile Header ── */}
            <header className="md:hidden sticky top-0 z-40 bg-[#F97316] px-4 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-base">✊</span>
                        </div>
                        <span
                            className="text-white font-bold text-base"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            We The People NG
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAnonymous ? (
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-white text-[#F97316] rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Login
                            </Link>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-200 to-orange-400 border-2 border-white flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Desktop Header ── */}
            <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-0">
                <div>
                    <h1
                        className="text-2xl font-bold text-gray-900"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Community Feed
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Issues from across Nigeria
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAnonymous ? (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#F97316] text-white rounded-xl font-bold text-sm hover:bg-[#C2410C] transition-colors shadow-sm"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            <UserIcon />
                            Login
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div
                                    className="text-sm font-semibold text-gray-800 leading-none"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {displayName}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    {displayLocation || "Nigeria"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Mobile Greeting ── */}
            <div className="md:hidden px-4 pt-5 pb-2">
                <h1
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Hello, {displayName} 👋
                </h1>
                <p
                    className="text-gray-500 text-sm mt-0.5"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Be the voice. Drive the change.
                </p>
            </div>

            {/* ── Desktop Greeting ── */}
            <div className="hidden md:block px-6 mt-4">
                <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2
                            className="text-lg font-bold text-gray-900"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Hello, {displayName} 👋
                        </h2>
                        <p
                            className="text-gray-500 text-sm"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Be the voice. Drive the change.
                        </p>
                    </div>
                    <div className="ml-auto flex gap-6 text-center">
                        <div>
                            <div
                                className="text-lg font-bold text-[#F97316]"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {issues.length}
                            </div>
                            <div className="text-xs text-gray-400">Issues</div>
                        </div>
                        <div>
                            <div
                                className="text-lg font-bold text-[#16A34A]"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {issues.reduce(
                                    (sum, i) => sum + (i.totalVotes || 0),
                                    0,
                                )}
                            </div>
                            <div className="text-xs text-gray-400">
                                Total Votes
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Search + Filter ── */}
            <div className="px-4 md:px-6 mt-4 flex gap-2">
                <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search issues, communities..."
                        className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm text-black placeholder-gray-400 border border-gray-100 shadow-card focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]/40 transition-all"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    />
                </div>
                <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-card border border-gray-100 hover:bg-gray-50 transition-colors text-black shrink-0 self-center cursor-pointer">
                    <FilterIcon />
                </button>
            </div>

            {/* ── Filter Pills ── */}
            <div className="px-4 md:px-6 mt-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

            {activeFilter === "trending" && (
                <p
                    className="px-4 md:px-6 mt-2 text-xs text-gray-400"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Sorted by most upvotes
                </p>
            )}

            {error && (
                <div
                    className="mx-4 md:mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    {error}
                </div>
            )}

            {/* ── Issues List ── */}
            <div className="px-4 md:px-6 my-4 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))
                ) : filteredIssues.length > 0 ? (
                    filteredIssues.map((issue, index) => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            currentUser={currentUser}
                            authReady={authReady}
                            rank={
                                activeFilter === "trending" ? index + 1 : null
                            }
                            isAnonymous={isAnonymous}
                            onLoginClick={handleLoginClick}
                        />
                    ))
                ) : (
                    <div className="col-span-2 text-center py-16">
                        <div className="text-4xl mb-3">🔍</div>
                        <p
                            className="text-gray-500 font-medium"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {issues.length === 0
                                ? "No issues posted yet"
                                : "No issues found"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            {issues.length === 0
                                ? "Be the first to report one!"
                                : "Try a different filter or search"}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Floating Post Button (mobile) ── */}
            <Link
                href="/create-issue"
                className="md:hidden fixed bottom-20 right-4 flex items-center gap-2 bg-[#EA580C] text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:bg-[#C2410C] transition-colors"
                style={{
                    fontFamily: "DM Sans, sans-serif",
                    boxShadow: "0 4px 20px rgba(232,97,26,0.45)",
                }}
            >
                <span className="text-lg font-light">+</span>
                Post to Camp
            </Link>
        </div>
    );
}
