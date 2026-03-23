"use client";

import { useState } from "react";
import Link from "next/link";

// ── Icons ──────────────────────────────────────────────────────────────────
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

const activityData = [
    {
        id: "1",
        type: "upvote",
        actor: "Chukwu Emeka",
        actorInitial: "C",
        actorColor: "bg-blue-400",
        message: "upvoted your issue",
        issue: "Fix Bad Road at Allen Junction",
        issueId: "1",
        timeAgo: "2m ago",
        timestamp: "Today",
        read: false,
    },
    {
        id: "2",
        type: "comment",
        actor: "Amina Bello",
        actorInitial: "A",
        actorColor: "bg-purple-400",
        message: "commented on your issue",
        issue: "No Clinic in My Community – Help!",
        issueId: "3",
        timeAgo: "15m ago",
        timestamp: "Today",
        read: false,
    },
    {
        id: "3",
        type: "resolved",
        actor: "Lagos Govt",
        actorInitial: "L",
        actorColor: "bg-green-500",
        message: "marked your issue as resolved",
        issue: "Fix Bad Road at Allen Junction",
        issueId: "1",
        timeAgo: "1h ago",
        timestamp: "Today",
        read: false,
    },
    {
        id: "4",
        type: "upvote",
        actor: "Fatima Yusuf",
        actorInitial: "F",
        actorColor: "bg-rose-400",
        message: "and 47 others upvoted your issue",
        issue: "Our School Needs More Classrooms!",
        issueId: "2",
        timeAgo: "2h ago",
        timestamp: "Today",
        read: false,
    },
    {
        id: "5",
        type: "milestone",
        actor: "System",
        actorInitial: "✨",
        actorColor: "bg-amber-400",
        message: "Your issue hit 1,000 upvotes!",
        issue: "Fix Bad Road at Allen Junction",
        issueId: "1",
        timeAgo: "3h ago",
        timestamp: "Today",
        read: true,
    },
    {
        id: "6",
        type: "mention",
        actor: "Tunde Adeola",
        actorInitial: "T",
        actorColor: "bg-teal-500",
        message: "mentioned you in a comment on",
        issue: "No Power Supply in Ikeja",
        issueId: "4",
        timeAgo: "5h ago",
        timestamp: "Today",
        read: true,
    },
    {
        id: "7",
        type: "upvote",
        actor: "Ngozi Okafor",
        actorInitial: "N",
        actorColor: "bg-orange-400",
        message: "upvoted your issue",
        issue: "No Clinic in My Community – Help!",
        issueId: "3",
        timeAgo: "8h ago",
        timestamp: "Today",
        read: true,
    },
    {
        id: "8",
        type: "update",
        actor: "Oyo State Govt",
        actorInitial: "O",
        actorColor: "bg-indigo-400",
        message: "posted an update on",
        issue: "Our School Needs More Classrooms!",
        issueId: "2",
        timeAgo: "1d ago",
        timestamp: "Yesterday",
        read: true,
    },
    {
        id: "9",
        type: "comment",
        actor: "Blessing Nweke",
        actorInitial: "B",
        actorColor: "bg-pink-400",
        message: "replied to your comment on",
        issue: "Fix Bad Road at Allen Junction",
        issueId: "1",
        timeAgo: "1d ago",
        timestamp: "Yesterday",
        read: true,
    },
    {
        id: "10",
        type: "upvote",
        actor: "Musa Ibrahim",
        actorInitial: "M",
        actorColor: "bg-cyan-500",
        message: "and 23 others upvoted your issue",
        issue: "No Pipe-borne Water for 6 Months",
        issueId: "5",
        timeAgo: "2d ago",
        timestamp: "2 days ago",
        read: true,
    },
    {
        id: "11",
        type: "resolved",
        actor: "PHCN Authority",
        actorInitial: "P",
        actorColor: "bg-green-500",
        message: "updated status to Under Review on",
        issue: "No Power Supply in Ikeja",
        issueId: "4",
        timeAgo: "2d ago",
        timestamp: "2 days ago",
        read: true,
    },
    {
        id: "12",
        type: "milestone",
        actor: "System",
        actorInitial: "🎉",
        actorColor: "bg-amber-400",
        message: "Congratulations! 500 upvotes on",
        issue: "Our School Needs More Classrooms!",
        issueId: "2",
        timeAgo: "3d ago",
        timestamp: "3 days ago",
        read: true,
    },
];

const typeConfig = {
    upvote: {
        icon: <UpvoteIcon />,
        bg: "bg-green-50",
        color: "text-green-600",
        label: "Upvotes",
    },
    comment: {
        icon: <CommentIcon />,
        bg: "bg-blue-50",
        color: "text-blue-600",
        label: "Comments",
    },
    resolved: {
        icon: <CheckIcon />,
        bg: "bg-emerald-50",
        color: "text-emerald-600",
        label: "Resolved",
    },
    mention: {
        icon: <MegaphoneIcon />,
        bg: "bg-purple-50",
        color: "text-purple-600",
        label: "Mentions",
    },
    milestone: {
        icon: <StarIcon />,
        bg: "bg-amber-50",
        color: "text-amber-500",
        label: "Milestones",
    },
    update: {
        icon: <AlertIcon />,
        bg: "bg-orange-50",
        color: "text-[#F97316]",
        label: "Updates",
    },
};

// ── Stats Data ────────────────────────────────────────────────────────────
const stats = [
    { label: "Issues Posted", value: "12", icon: "📋", trend: "+2 this month" },
    {
        label: "Total Upvotes",
        value: "3.4K",
        icon: "⬆️",
        trend: "+847 this week",
    },
    { label: "Issues Resolved", value: "4", icon: "✅", trend: "33% rate" },
    { label: "Comments", value: "89", icon: "💬", trend: "+12 this week" },
];

// ── Sub-components ────────────────────────────────────────────────────────
function ActivityItem({ item, isLast }) {
    const cfg = typeConfig[item.type];

    return (
        <div className="relative flex gap-3 pb-4">
            {/* Timeline line */}
            {!isLast && (
                <div className="absolute left-4 top-9 bottom-0 w-px bg-gray-100" />
            )}

            {/* Actor avatar */}
            <div
                className={`w-8 h-8 rounded-full ${item.actorColor} flex items-center justify-center text-white text-[11px] font-bold shrink-0 relative z-10`}
            >
                {item.actorInitial}
            </div>

            {/* Content */}
            <div
                className={`flex-1 min-w-0 bg-white rounded-xl p-3 border transition-all ${!item.read ? "border-[#F97316]/20 shadow-sm" : "border-gray-50"}`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {/* Type badge */}
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}
                            >
                                {cfg.icon}
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
                            <span className="font-semibold text-[#F97316] hover:underline cursor-pointer">
                                &quot;{item.issue}&quot;
                            </span>
                        </p>

                        {item.meta && (
                            <p className="text-[11px] text-gray-400 mt-1 bg-gray-50 px-2 py-1 rounded-md">
                                {item.meta}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {item.timeAgo}
                        </span>
                        <ChevronRightIcon />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function ActivityPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const unreadCount = activityData.filter((a) => !a.read).length;

    const filtered = activityData.filter((a) => {
        const matchTab = activeTab === "all" || a.type === activeTab;
        const matchRead = !showUnreadOnly || !a.read;
        return matchTab && matchRead;
    });

    // Group by timestamp
    const groups = filtered.reduce((acc, item) => {
        if (!acc[item.timestamp]) acc[item.timestamp] = [];
        acc[item.timestamp].push(item);
        return acc;
    }, {});

    const tabs = [
        { key: "all", label: "All", emoji: "📬" },
        { key: "upvote", label: "Upvotes", emoji: "⬆️" },
        { key: "comment", label: "Comments", emoji: "💬" },
        { key: "resolved", label: "Resolved", emoji: "✅" },
        { key: "milestone", label: "Milestones", emoji: "🏆" },
    ];

    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* ── Mobile Header ── */}
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
                        <div className="flex items-center gap-1.5 bg-white text-[#F97316] rounded-xl px-3 py-1.5">
                            <BellIcon />
                            <span className="text-xs font-bold">
                                {unreadCount} new
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* ── Desktop Header ── */}
            <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-6">
                <div>
                    <h1
                        className="text-2xl font-bold text-gray-900"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Activity
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Track updates on your issues and community activity
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button className="flex items-center gap-2 text-xs font-semibold text-[#F97316] bg-orange-50 border border-orange-100 px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors">
                            <BellIcon />
                            {unreadCount} unread
                        </button>
                    )}
                    <button
                        onClick={() => setShowUnreadOnly((u) => !u)}
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${showUnreadOnly ? "bg-[#F97316] text-white border-[#F97316]" : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"}`}
                    >
                        <FilterIcon />
                        {showUnreadOnly ? "All" : "Unread only"}
                    </button>
                </div>
            </div>

            {/* ── Stats Grid ── */}
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

            {/* ── Tabs ── */}
            <div className="px-4 md:px-6 mb-4">
                <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: "none" }}
                >
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === t.key ? "bg-[#F97316] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-100 hover:border-[#FED7AA] shadow-card"}`}
                        >
                            <span>{t.emoji}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Mobile Unread Toggle ── */}
            <div className="md:hidden px-4 mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                    {filtered.length} notifications
                </span>
                <button
                    onClick={() => setShowUnreadOnly((u) => !u)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showUnreadOnly ? "bg-[#F97316] text-white border-[#F97316]" : "bg-white text-gray-600 border-gray-100"}`}
                >
                    <FilterIcon />
                    {showUnreadOnly ? "Showing unread" : "Unread only"}
                </button>
            </div>

            {/* ── Activity Feed ── */}
            <div className="px-4 md:px-6 md:max-w-2xl md:mx-auto">
                {filtered.length === 0 ? (
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
                    Object.entries(groups).map(([timestamp, items]) => (
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
                            {items.map((item, i) => (
                                <ActivityItem
                                    key={item.id}
                                    item={item}
                                    isLast={i === items.length - 1}
                                />
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
