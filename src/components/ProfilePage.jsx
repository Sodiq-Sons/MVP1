"use client";

import { useState } from "react";
import Link from "next/link";

// ── Icons ──────────────────────────────────────────────────────────────────
const LocationIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
const CalendarIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const EditIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const ShareIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);
const SettingsIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);
const ChevronRightIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4 text-gray-300"
    >
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const LogoutIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
const UpvoteIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#16A34A"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-3 h-3"
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
        className="w-3 h-3"
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);
const ShieldIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
const HelpIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────
const userIssues = [
    {
        id: "1",
        category: "Infrastructure",
        categoryEmoji: "🏗️",
        categoryBg: "bg-orange-50",
        categoryColor: "text-orange-700",
        title: "Fix Bad Road at Allen Junction, Lagos",
        location: "Lagos, Nigeria",
        upvotes: 1200,
        comments: 48,
        status: "trending",
        timeAgo: "2h ago",
    },
    {
        id: "2",
        category: "Healthcare",
        categoryEmoji: "❤️",
        categoryBg: "bg-rose-50",
        categoryColor: "text-rose-700",
        title: "No Clinic in My Community – Help!",
        location: "Kano State",
        upvotes: 532,
        comments: 21,
        status: "needs-attention",
        timeAgo: "Yesterday",
    },
    {
        id: "3",
        category: "Education",
        categoryEmoji: "📚",
        categoryBg: "bg-blue-50",
        categoryColor: "text-blue-700",
        title: "Our School Needs More Classrooms!",
        location: "Ibadan, Oyo State",
        upvotes: 876,
        comments: 32,
        status: "under-review",
        timeAgo: "5h ago",
    },
];

const badges = [
    {
        emoji: "🔥",
        label: "First Issue",
        desc: "Posted your first issue",
        earned: true,
    },
    {
        emoji: "⬆️",
        label: "100 Upvotes",
        desc: "Received 100 upvotes on an issue",
        earned: true,
    },
    {
        emoji: "🏆",
        label: "1K Club",
        desc: "Received 1,000 upvotes",
        earned: true,
    },
    {
        emoji: "🌍",
        label: "Voice of Lagos",
        desc: "5 issues from Lagos",
        earned: true,
    },
    {
        emoji: "🌟",
        label: "Super Reporter",
        desc: "10 issues posted",
        earned: false,
    },
    {
        emoji: "✅",
        label: "Change Maker",
        desc: "2 issues resolved",
        earned: false,
    },
];

const statusMap = {
    trending: {
        label: "🔥 Trending",
        bg: "bg-orange-50",
        text: "text-orange-600",
    },
    "under-review": {
        label: "🔍 Under Review",
        bg: "bg-blue-50",
        text: "text-blue-600",
    },
    resolved: {
        label: "✅ Resolved",
        bg: "bg-green-50",
        text: "text-green-600",
    },
    "needs-attention": {
        label: "⚠️ Needs Attention",
        bg: "bg-amber-50",
        text: "text-amber-600",
    },
};

function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
}

// ── Main Component ────────────────────────────────────────────────────────
export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("issues");

    const tabs = [
        { key: "issues", label: "My Issues", count: 12 },
        { key: "badges", label: "Badges", count: 4 },
        { key: "saved", label: "Saved", count: 8 },
    ];

    const settingsGroups = [
        {
            title: "Account",
            items: [
                {
                    icon: <EditIcon />,
                    label: "Edit Profile",
                    desc: "Update your name & bio",
                },
                {
                    icon: <ShieldIcon />,
                    label: "Privacy & Security",
                    desc: "Manage account security",
                },
                {
                    icon: <BellIcon />,
                    label: "Notifications",
                    desc: "Choose what alerts you get",
                },
            ],
        },
        {
            title: "Support",
            items: [
                {
                    icon: <HelpIcon />,
                    label: "Help & FAQ",
                    desc: "Get answers to common questions",
                },
                {
                    icon: <ShareIcon />,
                    label: "Invite Friends",
                    desc: "Grow the community",
                },
            ],
        },
    ];

    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* ── Mobile Header ── */}
            <header className="md:hidden sticky top-0 z-40 bg-[#F97316] px-4 pt-4 pb-4 mb-6">
                <div className="flex items-center justify-between">
                    <h1
                        className="text-white font-bold text-lg"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        My Profile
                    </h1>
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <ShareIcon />
                        </button>
                        <button className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <SettingsIcon />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Desktop Header ── */}
            <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-4">
                <div>
                    <h1
                        className="text-2xl font-bold text-gray-900"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        My Profile
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Manage your account and track your impact
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-100 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-card cursor-pointer">
                        <ShareIcon />
                        Share Profile
                    </button>
                    <button className="flex items-center gap-2 text-xs font-semibold text-white bg-[#F97316] px-3 py-2 rounded-xl hover:bg-[#C2410C] transition-colors shadow-sm cursor-pointer">
                        <EditIcon />
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-6 space-y-4">
                {/* ── Profile Card ── */}
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-50 shadow-card">
                    {/* Cover */}
                    <div
                        className="h-24 md:h-32 relative"
                        style={{
                            background: "#EA580C",
                        }}
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                background: "#EA580C",
                            }}
                        />
                        {/* Pattern dots */}
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: "#EA580C",
                                backgroundSize: "20px 20px",
                            }}
                        />
                    </div>

                    <div className="px-4 md:px-5 pb-4 md:pb-5">
                        <div className="flex items-end justify-between -mt-10 mb-3">
                            {/* Avatar */}
                            <div className="relative">
                                <div
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-black"
                                    style={{
                                        background: "#EA580C",
                                    }}
                                >
                                    A
                                </div>
                                <div
                                    className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"
                                    title="Online"
                                />
                            </div>

                            {/* Edit button (desktop hidden — shown in header) */}
                            <button className="md:hidden flex items-center gap-1.5 text-xs font-semibold text-[#F97316] bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl">
                                <EditIcon />
                                Edit
                            </button>
                        </div>

                        {/* Name & bio */}
                        <div className="mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2
                                    className="text-lg font-black text-gray-900"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    Ada Okonkwo
                                </h2>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">
                                    🔥 Top Reporter
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                Passionate about community development.
                                Reporting issues so Nigeria can be better for
                                all of us 🇳🇬
                            </p>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                                <LocationIcon />
                                Lagos, Nigeria
                            </span>
                            <span className="flex items-center gap-1">
                                <CalendarIcon />
                                Joined Jan 2024
                            </span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                Online
                            </span>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { label: "Issues", value: "12", icon: "📋" },
                                { label: "Upvotes", value: "3.4K", icon: "⬆️" },
                                { label: "Resolved", value: "4", icon: "✅" },
                                { label: "Badges", value: "4", icon: "🏅" },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="text-center bg-gray-50 rounded-xl py-2.5 px-1"
                                >
                                    <div className="text-base mb-0.5">
                                        {s.icon}
                                    </div>
                                    <div
                                        className="text-sm font-black text-gray-900"
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        {s.value}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium">
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Impact Banner ── */}
                <div className="bg-[#EA580C] rounded-2xl p-4 text-white relative overflow-hidden">
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "#EA580C",
                        }}
                    />
                    <div className="relative z-10">
                        <div className="text-xs font-semibold text-white/70 mb-1">
                            Your Impact Score
                        </div>
                        <div
                            className="text-3xl font-black mb-2"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            847 pts
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                            <div
                                className="bg-white rounded-full h-2 transition-all"
                                style={{ width: "68%" }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/60">
                            <span>Level 4 — Community Voice</span>
                            <span>153 pts to Level 5</span>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-card overflow-hidden">
                    {/* Tab header */}
                    <div className="flex border-b border-gray-100">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === t.key ? "border-[#F97316] text-[#F97316]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                            >
                                {t.label}
                                <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-[#F97316]/10 text-[#F97316]" : "bg-gray-100 text-gray-400"}`}
                                >
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="p-4">
                        {activeTab === "issues" && (
                            <div className="space-y-3">
                                {userIssues.map((issue) => {
                                    const s = statusMap[issue.status];
                                    return (
                                        <div
                                            key={issue.id}
                                            className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#F97316]/20 hover:bg-orange-50/30 transition-all cursor-pointer"
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-xl ${issue.categoryBg} flex items-center justify-center text-lg shrink-0`}
                                            >
                                                {issue.categoryEmoji}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4
                                                    className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-1"
                                                    style={{
                                                        fontFamily:
                                                            "Plus Jakarta Sans, sans-serif",
                                                    }}
                                                >
                                                    {issue.title}
                                                </h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}
                                                    >
                                                        {s.label}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                        <UpvoteIcon />
                                                        {formatNum(
                                                            issue.upvotes,
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                        <CommentIcon />
                                                        {issue.comments}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 ml-auto">
                                                        {issue.timeAgo}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <Link
                                    href="/create-issue"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-[#F97316]/30 text-[#F97316] text-sm font-semibold hover:bg-orange-50 transition-colors"
                                >
                                    <span className="text-lg">+</span> Post a
                                    new issue
                                </Link>
                            </div>
                        )}

                        {activeTab === "badges" && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {badges.map((b, i) => (
                                    <div
                                        key={i}
                                        className={`p-3.5 rounded-xl text-center transition-all ${b.earned ? "bg-gray-50 border border-gray-100" : "bg-gray-50/50 border border-dashed border-gray-200 opacity-50"}`}
                                    >
                                        <div
                                            className={`text-3xl mb-2 ${!b.earned ? "grayscale" : ""}`}
                                        >
                                            {b.emoji}
                                        </div>
                                        <div
                                            className="text-xs font-bold text-gray-900 mb-0.5"
                                            style={{
                                                fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                            }}
                                        >
                                            {b.label}
                                        </div>
                                        <div className="text-[10px] text-gray-400 leading-snug">
                                            {b.desc}
                                        </div>
                                        {b.earned && (
                                            <div className="mt-2 text-[10px] font-bold text-[#F97316]">
                                                ✓ Earned
                                            </div>
                                        )}
                                        {!b.earned && (
                                            <div className="mt-2 text-[10px] font-semibold text-gray-400">
                                                Locked
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "saved" && (
                            <div className="text-center py-10">
                                <div className="text-4xl mb-3">🔖</div>
                                <p className="font-semibold text-gray-700 text-sm">
                                    No saved issues yet
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Bookmark issues to follow their progress
                                </p>
                                <Link
                                    href="/trending"
                                    className="inline-block mt-4 text-xs font-semibold text-[#F97316] bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors"
                                >
                                    Browse Issues
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Settings ── */}
                <div className="space-y-3">
                    {settingsGroups.map((group) => (
                        <div
                            key={group.title}
                            className="bg-white rounded-2xl border border-gray-50 shadow-card overflow-hidden"
                        >
                            <div className="px-4 pt-3 pb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {group.title}
                                </span>
                            </div>
                            {group.items.map((item, i) => (
                                <button
                                    key={i}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-50 first:border-t-0"
                                >
                                    <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-black shrink-0">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div
                                            className="text-sm font-semibold text-gray-800"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                        <div className="text-[11px] text-gray-400 truncate">
                                            {item.desc}
                                        </div>
                                    </div>
                                    <ChevronRightIcon />
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* ── Sign Out ── */}
                <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#F97316] transition-colors cursor-pointer">
                    <LogoutIcon />
                    Sign Out
                </button>

                {/* Version */}
                <p
                    className="text-center text-[10px] text-gray-300 pb-2"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    We The People NG · v1.0.0 · Made with ❤️ for Nigeria
                </p>
            </div>
        </div>
    );
}
