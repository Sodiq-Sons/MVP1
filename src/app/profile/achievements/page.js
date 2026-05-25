"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// ─── Badges Configuration (mirrors gamification.ts) ───────────────────────────
const BADGES_CONFIG = {
    verified_corper: {
        emoji: "✅",
        label: "Verified Corper",
        description: "Completed your full profile",
        rarity: "uncommon",
        requirement: "Complete all profile fields",
        special: true,
    },
    first_issue: {
        emoji: "📝",
        label: "First Steps",
        description: "Dropped your first post",
        rarity: "common",
        requirement: "Drop 1 post",
    },
    pro_reporter: {
        emoji: "📋",
        label: "Pro Reporter",
        description: "Dropped 5 posts",
        rarity: "common",
        requirement: "Drop 5 posts",
    },
    community_watch: {
        emoji: "👁️",
        label: "Community Watch",
        description: "Dropped 10 posts",
        rarity: "uncommon",
        requirement: "Drop 10 posts",
    },
    local_hero: {
        emoji: "🏆",
        label: "Local Hero",
        description: "Dropped 25 posts",
        rarity: "uncommon",
        requirement: "Drop 25 posts",
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
        description: "Received 5 comments on your post",
        rarity: "common",
        requirement: "Get 5 comments",
    },
    discussion_leader: {
        emoji: "🗣️",
        label: "Discussion Leader",
        description: "Received 20 comments on your post",
        rarity: "uncommon",
        requirement: "Get 20 comments",
    },
    poll_master: {
        emoji: "📊",
        label: "Poll Master",
        description: "Created a post with 10+ votes",
        rarity: "uncommon",
        requirement: "Get 10 votes on 1 post",
    },
    popular_vote: {
        emoji: "🗳️",
        label: "Popular Vote",
        description: "Created a post with 50+ votes",
        rarity: "rare",
        requirement: "Get 50 votes on 1 post",
    },
    engaged_citizen: {
        emoji: "🤝",
        label: "Engaged Citizen",
        description: "Upvoted 10 posts",
        rarity: "common",
        requirement: "Upvote 10 posts",
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
    community_builder: {
        emoji: "🌱",
        label: "Community Builder",
        description: "Invited 1 friend who completed signup",
        rarity: "uncommon",
        requirement: "Refer 1 friend",
    },
    growth_hacker: {
        emoji: "📈",
        label: "Growth Hacker",
        description: "Invited 5 friends who completed signup",
        rarity: "rare",
        requirement: "Refer 5 friends",
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
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

const RARITY_STYLES = {
    common: {
        card: "bg-subtle border-theme",
        badge: "bg-muted text-gray-500",
        label: "Common",
        glow: "",
    },
    uncommon: {
        card: "bg-blue-50 border-blue-200",
        badge: "bg-blue-100 text-blue-600",
        label: "Uncommon",
        glow: "shadow-blue-100",
    },
    rare: {
        card: "bg-purple-50 border-purple-200",
        badge: "bg-purple-100 text-purple-600",
        label: "Rare",
        glow: "shadow-purple-100",
    },
    epic: {
        card: "bg-cp-tint border-theme",
        badge: "bg-cp-tint text-cp",
        label: "Epic",
        glow: "shadow-cp-border",
    },
    legendary: {
        card: "bg-yellow-50 border-yellow-200",
        badge: "bg-yellow-100 text-yellow-600",
        label: "Legendary",
        glow: "shadow-yellow-100",
    },
};

// ─── Login Prompt ──────────────────────────────────────────────────────────────
function LoginPrompt() {
    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4">
            <div className="bg-card rounded-3xl shadow-lg border border-subtle p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-cp-tint rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--cp)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="w-8 h-8"
                    >
                        <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
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
                    className="w-full py-3.5 rounded-2xl font-bold text-base btn-primary transition-all inline-block text-center"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Log In to Continue
                </Link>
            </div>
        </div>
    );
}

// ─── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned, earnedData }) {
    const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
    const isSpecial = badge.special;

    if (earned) {
        return (
            <div
                className={`p-4 rounded-2xl border-2 transition-all cursor-default ${rarity.card} ${rarity.glow ? `shadow-md ${rarity.glow}` : ""} ${isSpecial ? "ring-2 ring-cp border-theme bg-cp-tint" : ""}`}
            >
                <div className="text-center">
                    <div className="text-4xl md:text-5xl mb-2 relative inline-block">
                        {badge.emoji}
                        {isSpecial && (
                            <span className="absolute -top-1 -right-1 text-xs bg-cp-deeper text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                ✓
                            </span>
                        )}
                    </div>
                    <h3
                        className="text-xs md:text-sm font-bold mb-1 line-clamp-2 text-gray-900"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        {badge.label}
                    </h3>
                    <p
                        className={`text-[10px] md:text-xs leading-snug mb-2 line-clamp-2 ${isSpecial ? "text-cp" : "text-gray-500"}`}
                    >
                        {badge.description}
                    </p>
                    {earnedData?.earnedAt && (
                        <div className="text-[9px] md:text-[10px] font-semibold text-gray-400 mb-2">
                            ✓ {formatTimeAgo(earnedData.earnedAt)}
                        </div>
                    )}
                    <div
                        className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full inline-block ${rarity.badge}`}
                    >
                        {rarity.label}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-2xl border-2 bg-subtle border-theme opacity-60">
            <div className="text-center">
                <div className="text-4xl md:text-5xl mb-2 grayscale">
                    {badge.emoji}
                </div>
                <h3
                    className="text-xs md:text-sm font-bold mb-1 line-clamp-2 text-gray-500"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    {badge.label}
                </h3>
                <p className="text-[10px] md:text-xs leading-snug mb-2 line-clamp-2 text-gray-400">
                    {badge.description}
                </p>
                <div className="text-[9px] md:text-[10px] font-semibold text-gray-400 mb-2">
                    {badge.requirement}
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="w-3 h-3"
                    >
                        <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Locked
                </div>
                <div
                    className={`mt-2 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full inline-block ${RARITY_STYLES[badge.rarity]?.badge || "bg-gray-200 text-gray-500"}`}
                >
                    {RARITY_STYLES[badge.rarity]?.label || "Common"}
                </div>
            </div>
        </div>
    );
}

// ─── Main Achievements Page ────────────────────────────────────────────────────
export default function AchievementsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [stats, setStats] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setAuthReady(true);
            if (user && !user.isAnonymous) {
                setCurrentUser(user);

                // Listen to badges
                const badgesUnsub = onSnapshot(
                    collection(db, "users", user.uid, "badges"),
                    (snap) => {
                        setEarnedBadges(
                            snap.docs.map((d) => ({
                                id: d.id,
                                badgeId: d.data().badgeId,
                                earnedAt: d.data().earnedAt?.toDate(),
                            })),
                        );
                    },
                );

                // Listen to stats
                const statsUnsub = onSnapshot(
                    doc(db, "users", user.uid, "stats", "overview"),
                    (snap) => {
                        if (snap.exists()) setStats(snap.data());
                        setLoading(false);
                    },
                );

                // Listen to user doc for verified status
                const userUnsub = onSnapshot(
                    doc(db, "users", user.uid),
                    (snap) => {
                        if (snap.exists())
                            setIsVerified(!!snap.data().isVerified);
                    },
                );

                return () => {
                    badgesUnsub();
                    statsUnsub();
                    userUnsub();
                };
            } else {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    if (!authReady || loading) {
        return (
            <div
                className="min-h-screen pb-24 flex items-center justify-center"
                style={{ background: "#FDF6EF" }}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-theme spinner-cp rounded-full animate-spin" />
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

    if (!currentUser) return <LoginPrompt />;

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
    const verifiedBadgeEarned = earnedIds.has("verified_corper");

    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-subtle px-4 md:px-6 py-4">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
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
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1
                                className="text-lg md:text-xl font-bold text-gray-900 truncate"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Achievements & Badges
                            </h1>
                            {isVerified && (
                                <span className="flex items-center gap-1 text-xs font-bold text-cp bg-cp-tint border border-theme px-2 py-0.5 rounded-full shrink-0">
                                    ✅ Verified
                                </span>
                            )}
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">
                            {earnedCount} of {totalCount} badges earned
                        </p>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className="bg-cp h-2 rounded-full transition-all duration-500"
                        style={{
                            width: `${(earnedCount / totalCount) * 100}%`,
                        }}
                    />
                </div>
            </div>

            <div className="px-4 md:px-6 py-4 space-y-4">
                {/* Verified Corper spotlight */}
                {!verifiedBadgeEarned && (
                    <div className="bg-cp rounded-2xl p-4 text-white">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">🔒</div>
                            <div className="flex-1 min-w-0">
                                <h3
                                    className="font-bold text-base mb-1"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    Unlock: Verified Corper ✅
                                </h3>
                                <p className="text-white/80 text-xs leading-relaxed">
                                    Complete your profile to earn this badge,
                                    get verified, unlock voting & posting, and
                                    earn 20 bonus points!
                                </p>
                            </div>
                            <Link
                                href="/profile/edit"
                                className="shrink-0 bg-white text-cp font-bold text-xs px-3 py-2 rounded-xl hover:bg-cp-tint transition-colors"
                            >
                                Complete →
                            </Link>
                        </div>
                    </div>
                )}

                {verifiedBadgeEarned && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">✅</div>
                            <div>
                                <h3
                                    className="font-bold text-base"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    Verified Corper!
                                </h3>
                                <p className="text-green-100 text-xs">
                                    Your profile is complete. You&apos;re verified
                                    and unlocked!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {[
                        {
                            id: "all",
                            label: "All",
                            active: "bg-cp text-white",
                            inactive:
                                "bg-white border border-theme text-gray-600",
                        },
                        {
                            id: "earned",
                            label: `Earned (${earnedCount})`,
                            active: "bg-green-500 text-white",
                            inactive:
                                "bg-white border border-theme text-gray-600",
                        },
                        {
                            id: "locked",
                            label: `Locked (${totalCount - earnedCount})`,
                            active: "bg-gray-500 text-white",
                            inactive:
                                "bg-white border border-theme text-gray-600",
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${filter === tab.id ? tab.active : tab.inactive}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredBadges.map((badge) => (
                        <BadgeCard
                            key={badge.id}
                            badge={badge}
                            earned={badge.earned}
                            earnedData={badge.earnedData}
                        />
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
                                ? "Keep engaging to earn badges!"
                                : "Complete challenges to unlock badges!"}
                        </p>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="bg-card rounded-2xl border border-subtle p-4 md:p-6">
                    <h2
                        className="text-lg font-bold text-gray-900 mb-4"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Your Stats
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-black text-cp">
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
