"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNotifications } from "@/hooks/useNotifications";
import Image from "next/image";
import { formatMetaDisplay } from "@/hooks/useNotifications";

// ── Icons
const UpvoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="#16A34A" className="w-3.5 h-3.5">
        <polyline
            points="18 15 12 9 6 15"
            stroke="#16A34A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
        />
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

const ReplyIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
);

const LikeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const VoteIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const AlertIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const StarIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const MegaphoneIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);

const BellIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
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

const ChevronRightIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// ── Type Configuration - Store only non-JSX values ────────────────────────
const typeConfigData = {
    upvote: {
        bg: "bg-green-50",
        color: "text-green-600",
        label: "Upvotes",
    },
    comment: {
        bg: "bg-blue-50",
        color: "text-blue-600",
        label: "Comments",
    },
    reply: {
        bg: "bg-indigo-50",
        color: "text-indigo-600",
        label: "Replies",
    },
    like_comment: {
        bg: "bg-pink-50",
        color: "text-pink-600",
        label: "Likes",
    },
    vote: {
        bg: "bg-purple-50",
        color: "text-purple-600",
        label: "Votes",
    },
    resolved: {
        bg: "bg-emerald-50",
        color: "text-emerald-600",
        label: "Resolved",
    },
    mention: {
        bg: "bg-purple-50",
        color: "text-purple-600",
        label: "Mentions",
    },
    milestone: {
        bg: "bg-amber-50",
        color: "text-amber-500",
        label: "Milestones",
    },
    update: {
        bg: "bg-orange-50",
        color: "text-[#F97316]",
        label: "Updates",
    },
};

// ── Helper function to get icon component ────────────────────────────────
const getTypeIcon = (type) => {
    const iconMap = {
        upvote: <UpvoteIcon />,
        comment: <CommentIcon />,
        reply: <ReplyIcon />,
        like_comment: <LikeIcon />,
        vote: <VoteIcon />,
        resolved: <CheckIcon />,
        mention: <MegaphoneIcon />,
        milestone: <StarIcon />,
        update: <AlertIcon />,
    };
    return iconMap[type] || iconMap.update;
};

// ── Helper Functions ─────────────────────────────────────────────────────
const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";

    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return "Yesterday";
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getTimestampGroup = (timestamp) => {
    if (!timestamp) return "Today";

    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 86400),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};

// ── Activity Item Component ──────────────────────────────────────────────
function ActivityItem({ item, isLast, onMarkAsRead }) {
    const cfg = typeConfigData[item.type] || typeConfigData.update;
    const icon = getTypeIcon(item.type);

    const handleClick = () => {
        if (!item.read) {
            onMarkAsRead(item.id);
        }
    };

    return (
        <div className="relative flex gap-3 pb-4" onClick={handleClick}>
            {/* Timeline line */}
            {!isLast && (
                <div className="absolute left-4 top-9 bottom-0 w-px bg-gray-100" />
            )}

            {/* Actor avatar */}
            <div
                className={`w-8 h-8 rounded-full ${
                    item.actorColor || "bg-gray-400"
                } flex items-center justify-center text-white text-[11px] font-bold shrink-0 relative z-10 overflow-hidden`}
            >
                {item.actorPhotoURL ? (
                    <Image
                        src={item.actorPhotoURL}
                        alt={item.actor}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    item.actorInitial || "?"
                )}
            </div>

            {/* Content */}
            <div
                className={`flex-1 min-w-0 bg-white rounded-xl p-3 border transition-all cursor-pointer ${
                    !item.read
                        ? "border-[#F97316]/20 shadow-sm"
                        : "border-gray-50"
                }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {/* Type badge */}
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}
                            >
                                {icon}
                                {cfg.label}
                            </span>
                            {!item.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] shrink-0" />
                            )}
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed">
                            <span className="font-semibold text-gray-900">
                                {item.actor}
                            </span>{" "}
                            {item.message}{" "}
                            <span className="font-semibold text-[#F97316] hover:underline">
                                &quot;{item.issue}&quot;
                            </span>
                        </p>

                        {item.commentPreview && (
                            <p className="text-[11px] text-gray-500 mt-1 italic truncate">
                                &ldquo;{item.commentPreview}&rdquo;
                            </p>
                        )}
                        {item.meta &&
                            (() => {
                                const display = formatMetaDisplay(item.meta);
                                return display ? (
                                    <p className="text-[11px] text-gray-400 mt-1 bg-gray-50 px-2 py-1 rounded-md">
                                        {display}
                                    </p>
                                ) : null;
                            })()}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(item.createdAt)}
                        </span>
                        <ChevronRightIcon />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── User Profile Card Component ──────────────────────────────────────────
function UserProfileCard({ user, userStats }) {
    const getInitials = (name) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-card mb-4">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#F97316] flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                    {user.photoURL ? (
                        <Image
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        getInitials(user.displayName || user.email)
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2
                        className="font-bold text-gray-900 truncate"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        {user.displayName || "Anonymous User"}
                    </h2>
                    <p className="text-xs text-gray-500 truncate">
                        {user.email}
                    </p>
                    {userStats && (
                        <p className="text-[11px] text-[#F97316] font-semibold mt-0.5">
                            {userStats.issuesPosted} posts dropped •{" "}
                            {userStats.totalUpvotes} upvotes
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Login Prompt Component ───────────────────────────────────────────────
function LoginPrompt({ onLogin }) {
    return (
        <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🔒</span>
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
                    Please log in to view your activity feed and see updates on
                    your posts.
                </p>
                <button
                    onClick={onLogin}
                    className="w-full py-3.5 rounded-2xl font-bold text-base bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer"
                    style={{
                        fontFamily: "DM Sans, sans-serif",
                        boxShadow: "0 4px 20px rgba(232,97,26,0.35)",
                    }}
                >
                    Log In to Continue
                </button>
                <p
                    className="text-xs text-gray-400 mt-4"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="text-[#F97316] font-semibold hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

// ── Main Activity Page Component ─────────────────────────────────────────
export default function ActivityPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);

    const {
        notifications,
        unreadCount,
        loading: notificationsLoading,
        markAsRead,
        markAllAsRead,
    } = useNotifications(currentUser?.uid);

    const [activeTab, setActiveTab] = useState("all");
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    // Auth state check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
            }
            setAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    const handleLoginClick = () => {
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    };

    // Loading state
    if (!authReady) {
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

    // Authentication required
    if (!currentUser || isAnonymous) {
        return <LoginPrompt onLogin={handleLoginClick} />;
    }

    // Filter notifications
    const filtered = notifications.filter((a) => {
        const matchTab = activeTab === "all" || a.type === activeTab;
        const matchRead = !showUnreadOnly || !a.read;
        return matchTab && matchRead;
    });

    // Group notifications by timestamp
    const groups = filtered.reduce((acc, item) => {
        const group = getTimestampGroup(item.createdAt);
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    // Tab configuration
    const tabs = [
        { key: "all", label: "All", emoji: "📬" },
        { key: "upvote", label: "Upvotes", emoji: "⬆️" },
        { key: "comment", label: "Comments", emoji: "💬" },
        { key: "reply", label: "Replies", emoji: "↩️" },
        { key: "vote", label: "Votes", emoji: "🗳️" },
        { key: "milestone", label: "Milestones", emoji: "🏆" },
    ];

    // Statistics
    const stats = [
        {
            label: "Total Interactions",
            value: notifications.length.toString(),
            icon: "📊",
            trend: `${unreadCount} unread`,
        },
        {
            label: "Upvotes",
            value: notifications
                .filter((n) => n.type === "upvote")
                .length.toString(),
            icon: "⬆️",
            trend: "On your posts",
        },
        {
            label: "Comments",
            value: notifications
                .filter((n) => n.type === "comment" || n.type === "reply")
                .length.toString(),
            icon: "💬",
            trend: "Replies to you",
        },
        {
            label: "Likes",
            value: notifications
                .filter((n) => n.type === "like_comment")
                .length.toString(),
            icon: "❤️",
            trend: "On your comments",
        },
    ];

    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-[#F97316] px-4 pt-4 pb-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1
                            className="text-white font-bold text-lg"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Activity
                        </h1>
                        <p className="text-white/70 text-xs mt-0.5">
                            Your notifications & updates
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1.5 bg-white text-[#F97316] rounded-xl px-3 py-1.5 active:scale-95 transition-transform"
                        >
                            <BellIcon />
                            <span className="text-xs font-bold">
                                {unreadCount} new
                            </span>
                        </button>
                    )}
                </div>
            </header>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-6">
                <div>
                    <h1
                        className="text-2xl font-bold text-gray-900"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Activity
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Track updates on your posts and community activity
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 text-xs font-semibold text-[#F97316] bg-orange-50 border border-orange-100 px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                            <CheckIcon />
                            Mark all read
                        </button>
                    )}
                    <button
                        onClick={() => setShowUnreadOnly((u) => !u)}
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                            showUnreadOnly
                                ? "bg-[#F97316] text-white border-[#F97316]"
                                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                        }`}
                    >
                        <FilterIcon />
                        {showUnreadOnly ? "All" : "Unread only"}
                    </button>
                </div>
            </div>

            {/* User Profile Card */}
            <div className="px-4 md:px-6 mb-4">
                <UserProfileCard user={currentUser} userStats={null} />
            </div>

            {/* Stats Grid */}
            <div className="px-4 md:px-6 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="bg-white rounded-2xl p-3.5 border border-gray-50 shadow-card"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xl">{s.icon}</span>
                            </div>
                            <div
                                className="text-xl font-black text-gray-900"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {s.value}
                            </div>
                            <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                                {s.label}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                                {s.trend}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 md:px-6 mb-4">
                <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: "none" }}
                >
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === t.key
                                    ? "bg-[#F97316] text-white shadow-sm"
                                    : "bg-white text-gray-600 border border-gray-100 hover:border-[#FED7AA] shadow-card"
                            }`}
                        >
                            <span>{t.emoji}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Unread Toggle */}
            <div className="md:hidden px-4 mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                    {filtered.length} notifications
                </span>
                <button
                    onClick={() => setShowUnreadOnly((u) => !u)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        showUnreadOnly
                            ? "bg-[#F97316] text-white border-[#F97316]"
                            : "bg-white text-gray-600 border-gray-100"
                    }`}
                >
                    <FilterIcon />
                    {showUnreadOnly ? "Showing unread" : "Unread only"}
                </button>
            </div>

            {/* Activity Feed */}
            <div className="px-4 md:px-6 md:max-w-2xl md:mx-auto">
                {notificationsLoading ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-50">
                        <div className="w-8 h-8 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                            Loading activity...
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-50">
                        <div className="text-4xl mb-3">🎉</div>
                        <p className="font-semibold text-gray-700">
                            All caught up!
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            No notifications matching your filter
                        </p>
                    </div>
                ) : (
                    <>
                        {Object.entries(groups).map(([timestamp, items]) => (
                            <div key={timestamp} className="mb-4">
                                {/* Group header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        {timestamp}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-[10px] text-gray-400">
                                        {items.length}
                                    </span>
                                </div>
                                {/* Activity items */}
                                {items.map((item, i) => (
                                    <ActivityItem
                                        key={item.id}
                                        item={item}
                                        isLast={i === items.length - 1}
                                        onMarkAsRead={markAsRead}
                                    />
                                ))}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
