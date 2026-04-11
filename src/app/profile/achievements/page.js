"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    doc,
    getDoc,
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const TrophyIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 006 6 6 6 0 006-6V2z" />
    </svg>
);

const LockIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

// ─── Badges Configuration ─────────────────────────────────────────────────────
const BADGES_CONFIG = {
    first_issue: {
        emoji: "📝",
        label: "First Steps",
        description: "Posted your first issue",
        rarity: "common",
        requirement: "Post 1 issue",
    },
    pro_reporter: {
        emoji: "📋",
        label: "Pro Reporter",
        description: "Posted 5 issues",
        rarity: "common",
        requirement: "Post 5 issues",
    },
    community_watch: {
        emoji: "👁️",
        label: "Community Watch",
        description: "Posted 10 issues",
        rarity: "uncommon",
        requirement: "Post 10 issues",
    },
    local_hero: {
        emoji: "🏆",
        label: "Local Hero",
        description: "Posted 25 issues",
        rarity: "uncommon",
        requirement: "Post 25 issues",
    },
    voice_heard: {
        emoji: "📢",
        label: "Voice Heard",
        description: "Received 10 upvotes total",
        rarity: "common",
        requirement: "Get 10 upvotes",
    },
    crowd_favorite: {
        emoji: "⭐",
        label: "Crowd Favorite",
        description: "Received 50 upvotes total",
        rarity: "uncommon",
        requirement: "Get 50 upvotes",
    },
    viral_sensation: {
        emoji: "🔥",
        label: "Viral Sensation",
        description: "Received 100 upvotes total",
        rarity: "rare",
        requirement: "Get 100 upvotes",
    },
    conversation_starter: {
        emoji: "💬",
        label: "Conversation Starter",
        description: "Received 5 comments on your issues",
        rarity: "common",
        requirement: "Get 5 comments",
    },
    discussion_leader: {
        emoji: "🗣️",
        label: "Discussion Leader",
        description: "Received 20 comments on your issues",
        rarity: "uncommon",
        requirement: "Get 20 comments",
    },
    poll_master: {
        emoji: "📊",
        label: "Poll Master",
        description: "Created an issue with 10+ votes",
        rarity: "uncommon",
        requirement: "Get 10 votes on 1 issue",
    },
    popular_vote: {
        emoji: "🗳️",
        label: "Popular Vote",
        description: "Created an issue with 50+ votes",
        rarity: "rare",
        requirement: "Get 50 votes on 1 issue",
    },
    engaged_citizen: {
        emoji: "🤝",
        label: "Engaged Citizen",
        description: "Upvoted 10 issues",
        rarity: "common",
        requirement: "Upvote 10 issues",
    },
    active_voter: {
        emoji: "✅",
        label: "Active Voter",
        description: "Voted on 10 polls",
        rarity: "common",
        requirement: "Vote on 10 polls",
    },
    helpful_commenter: {
        emoji: "💡",
        label: "Helpful Commenter",
        description: "Posted 10 comments",
        rarity: "common",
        requirement: "Post 10 comments",
    },
    resolution_champion: {
        emoji: "✨",
        label: "Resolution Champion",
        description: "Had an issue marked as resolved",
        rarity: "uncommon",
        requirement: "Get 1 issue resolved",
    },
    trending_creator: {
        emoji: "📈",
        label: "Trending Creator",
        description: "Had an issue reach trending status",
        rarity: "rare",
        requirement: "Get 1 issue trending",
    },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
function formatTimeAgo(date) {
    if (!date) return "Just now";
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
}

const getRarityColor = (rarity) => {
    const colors = {
        common: "bg-gray-50 border-gray-200 text-gray-600",
        uncommon: "bg-blue-50 border-blue-200 text-blue-600",
        rare: "bg-purple-50 border-purple-200 text-purple-600",
        epic: "bg-orange-50 border-orange-200 text-orange-600",
        legendary: "bg-yellow-50 border-yellow-200 text-yellow-600",
    };
    return colors[rarity] || colors.common;
};

const getRarityLabel = (rarity) => {
    const labels = {
        common: "Common",
        uncommon: "Uncommon",
        rare: "Rare",
        epic: "Epic",
        legendary: "Legendary",
    };
    return labels[rarity] || "Common";
};

// ─── Login Prompt ─────────────────────────────────────────────────────────────
function LoginPrompt() {
    return (
        <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockIcon />
                </div>
                <h2
                    className="text-2xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Sign In Required
                </h2>
                <p
                    className="text-gray-500 text-sm mb-6"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Please log in to view your achievements and badges.
                </p>
                <Link
                    href="/login"
                    className="w-full py-3.5 rounded-2xl font-bold text-base bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer inline-block"
                    style={{
                        fontFamily: "DM Sans, sans-serif",
                        boxShadow: "0 4px 20px rgba(232,97,26,0.35)",
                    }}
                >
                    Log In to Continue
                </Link>
            </div>
        </div>
    );
}

// ─── Main Achievements Page ───────────────────────────────────────────────────
export default function AchievementsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setAuthReady(true);
            if (user && !user.isAnonymous) {
                setCurrentUser(user);

                try {
                    // Get earned badges
                    const badgesSub = onSnapshot(
                        collection(db, "users", user.uid, "badges"),
                        (snap) => {
                            const badges = snap.docs.map((d) => ({
                                id: d.id,
                                badgeId: d.data().badgeId,
                                emoji: d.data().emoji,
                                label: d.data().label,
                                desc: d.data().description,
                                earnedAt: d.data().earnedAt?.toDate(),
                            }));
                            setEarnedBadges(badges);
                        },
                    );

                    // Get stats
                    const statsSub = onSnapshot(
                        doc(db, "users", user.uid, "stats", "overview"),
                        (snap) => {
                            if (snap.exists()) {
                                setStats(snap.data());
                            }
                            setLoading(false);
                        },
                    );

                    return () => {
                        badgesSub();
                        statsSub();
                    };
                } catch (err) {
                    console.error("Error loading achievements:", err);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    if (!authReady || loading) {
        return (
            <div
                className="min-h-screen pb-24 md:pb-8 flex items-center justify-center"
                style={{ background: "#FDF6EF" }}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin" />
                    <p
                        className="text-sm text-gray-500"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPrompt />;
    }

    // Organize badges
    const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));
    const allBadges = Object.entries(BADGES_CONFIG).map(([id, config]) => ({
        id,
        ...config,
        earned: earnedIds.has(id),
        earnedData: earnedBadges.find((b) => b.badgeId === id),
    }));

    const filteredBadges =
        filter === "earned"
            ? allBadges.filter((b) => b.earned)
            : filter === "locked"
              ? allBadges.filter((b) => !b.earned)
              : allBadges;

    const earnedCount = allBadges.filter((b) => b.earned).length;
    const totalCount = allBadges.length;

    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 md:px-6 py-4">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <BackIcon />
                    </button>
                    <div>
                        <h1
                            className="text-lg md:text-xl font-bold text-gray-900"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Achievements & Badges
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500">
                            {earnedCount} of {totalCount} badges earned
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="bg-[#F97316] h-2 rounded-full transition-all duration-500"
                        style={{
                            width: `${(earnedCount / totalCount) * 100}%`,
                        }}
                    />
                </div>
            </div>

            <div className="px-4 md:px-6 py-4 space-y-4">
                {/* Filter Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("all")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                            filter === "all"
                                ? "bg-[#F97316] text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("earned")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                            filter === "earned"
                                ? "bg-green-500 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Earned ({earnedCount})
                    </button>
                    <button
                        onClick={() => setFilter("locked")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                            filter === "locked"
                                ? "bg-gray-400 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Locked ({totalCount - earnedCount})
                    </button>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredBadges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`p-4 rounded-xl border-2 transition-all ${
                                badge.earned
                                    ? `${getRarityColor(badge.rarity)} cursor-pointer hover:shadow-md`
                                    : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                            }`}
                        >
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl mb-2">
                                    {badge.emoji}
                                </div>
                                <h3
                                    className="text-xs md:text-sm font-bold mb-1 line-clamp-2"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    {badge.label}
                                </h3>
                                <p className="text-[10px] md:text-xs leading-snug mb-2 line-clamp-2">
                                    {badge.description}
                                </p>

                                {!badge.earned && (
                                    <>
                                        <div className="text-[9px] md:text-[10px] font-semibold opacity-70 mb-2">
                                            {badge.requirement}
                                        </div>
                                        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                                            <LockIcon /> Locked
                                        </div>
                                    </>
                                )}

                                {badge.earned && badge.earnedData?.earnedAt && (
                                    <div className="text-[9px] md:text-[10px] font-semibold text-current opacity-75">
                                        ✓{" "}
                                        {formatTimeAgo(
                                            badge.earnedData.earnedAt,
                                        )}
                                    </div>
                                )}

                                <div
                                    className={`mt-2 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full inline-block ${
                                        badge.earned
                                            ? "bg-current/10"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    {getRarityLabel(badge.rarity)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredBadges.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🎯</div>
                        <p className="font-semibold text-gray-700 text-sm">
                            No badges{" "}
                            {filter === "earned" ? "earned" : "locked"} yet
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            {filter === "earned"
                                ? "Keep engaging to earn more badges!"
                                : "Complete challenges to unlock badges!"}
                        </p>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="bg-white rounded-2xl border border-gray-50 p-4 md:p-6 mt-8">
                    <h2
                        className="text-lg font-bold text-gray-900 mb-4"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Your Stats
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-black text-[#F97316]">
                                {stats?.issuesCount || 0}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                Issues Posted
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-black text-green-600">
                                {stats?.upvotesReceived || 0}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                Upvotes Received
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-black text-blue-600">
                                {stats?.commentsReceived || 0}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                Comments Received
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-black text-purple-600">
                                {earnedCount}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                Badges Earned
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
