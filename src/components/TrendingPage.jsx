"use client";

import { useState } from "react";
import Link from "next/link";

// ── Icons ──────────────────────────────────────────────────────────────────
const FireIcon = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2c0 0-5.5 5.5-5.5 11a5.5 5.5 0 0011 0C17.5 7.5 12 2 12 2zm0 15a3.5 3.5 0 01-3.5-3.5c0-3 2-5.5 3.5-8 1.5 2.5 3.5 5 3.5 8A3.5 3.5 0 0112 17z" />
    </svg>
);

const UpArrowIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#16A34A" : "none"}
        stroke={active ? "#16A34A" : "#16A34A"}
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
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

const ZapIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const EyeIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const UpvoteIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#16A34A" : "none"}
        stroke={active ? "#16A34A" : "#16A34A"}
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="18 15 12 9 6 15" />
    </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────
const categories = [
    { key: "all", label: "All Issues", emoji: "📋", count: 1240 },
    { key: "infrastructure", label: "Infrastructure", emoji: "🏗️", count: 312 },
    { key: "education", label: "Education", emoji: "📚", count: 198 },
    { key: "healthcare", label: "Healthcare", emoji: "❤️", count: 267 },
    { key: "water", label: "Water", emoji: "💧", count: 143 },
    { key: "security", label: "Security", emoji: "🔒", count: 89 },
    { key: "electricity", label: "Electricity", emoji: "⚡", count: 231 },
];

const trendingIssues = [
    {
        id: "1",
        rank: 1,
        category: "Infrastructure",
        categoryEmoji: "🏗️",
        categoryBg: "bg-orange-50",
        categoryColor: "text-orange-700",
        title: "Fix Bad Road at Allen Junction, Lagos",
        description:
            "This road has been abandoned for months. It's affecting commuters, businesses & school children daily.",
        location: "Lagos, Nigeria",
        upvotes: 4800,
        comments: 148,
        views: 23400,
        timeAgo: "2h ago",
        status: "viral",
        avatars: ["A", "B", "C", "D", "E"],
        upvotedBy: 1234,
        change: 312,
    },
    {
        id: "2",
        rank: 2,
        category: "Healthcare",
        categoryEmoji: "❤️",
        categoryBg: "bg-rose-50",
        categoryColor: "text-rose-700",
        title: "General Hospital Enugu Lacks Basic Equipment",
        description:
            "Patients are being turned away daily. No functioning MRI machine, broken X-ray unit, and shortage of gloves.",
        location: "Enugu State",
        upvotes: 3200,
        comments: 94,
        views: 18700,
        timeAgo: "5h ago",
        status: "trending",
        avatars: ["C", "D", "E", "F"],
        upvotedBy: 876,
        change: 189,
    },
    {
        id: "3",
        rank: 3,
        category: "Education",
        categoryEmoji: "📚",
        categoryBg: "bg-blue-50",
        categoryColor: "text-blue-700",
        title: "Our School Needs More Classrooms!",
        description:
            "Government Secondary School, Ibadan needs urgent attention. Students are learning under trees.",
        location: "Ibadan, Oyo State",
        upvotes: 2876,
        comments: 72,
        views: 14200,
        timeAgo: "1d ago",
        status: "trending",
        avatars: ["G", "H", "I", "J"],
        upvotedBy: 654,
        change: 94,
    },
    {
        id: "4",
        rank: 4,
        category: "Electricity",
        categoryEmoji: "⚡",
        categoryBg: "bg-yellow-50",
        categoryColor: "text-yellow-700",
        title: "No Power Supply for 3 Weeks in Ikeja",
        description:
            "EKEDC has abandoned our transformer. Businesses are shutting down and food is spoiling.",
        location: "Ikeja, Lagos",
        upvotes: 2341,
        comments: 61,
        views: 11900,
        timeAgo: "3h ago",
        status: "rising",
        avatars: ["K", "L", "M"],
        upvotedBy: 512,
        change: 67,
    },
    {
        id: "5",
        rank: 5,
        category: "Water",
        categoryEmoji: "💧",
        categoryBg: "bg-cyan-50",
        categoryColor: "text-cyan-700",
        title: "No Pipe-borne Water for 6 Months",
        description:
            "Our entire street has been without running water. We rely on hawkers and it is too expensive.",
        location: "Port Harcourt",
        upvotes: 1980,
        comments: 47,
        views: 9800,
        timeAgo: "2d ago",
        status: "trending",
        avatars: ["N", "O", "P"],
        upvotedBy: 398,
        change: 45,
    },
    {
        id: "6",
        rank: 6,
        category: "Security",
        categoryEmoji: "🔒",
        categoryBg: "bg-purple-50",
        categoryColor: "text-purple-700",
        title: "Street Lights Out for 3 Months – Crime Rising",
        description:
            "Entire road from junction to market has no street lights. Armed robbery has increased significantly.",
        location: "Enugu State",
        upvotes: 1654,
        comments: 39,
        views: 8200,
        timeAgo: "4d ago",
        status: "rising",
        avatars: ["Q", "R"],
        upvotedBy: 287,
        change: 28,
    },
    {
        id: "7",
        rank: 7,
        category: "Infrastructure",
        categoryEmoji: "🏗️",
        categoryBg: "bg-orange-50",
        categoryColor: "text-orange-700",
        title: "Bridge on Owerri-Onitsha Road is Collapsing",
        description:
            "Heavy trucks are using this bridge daily despite visible cracks. A disaster waiting to happen.",
        location: "Imo State",
        upvotes: 1421,
        comments: 33,
        views: 7100,
        timeAgo: "1d ago",
        status: "rising",
        avatars: ["S", "T", "U"],
        upvotedBy: 234,
        change: 19,
    },
];

const avatarColors = [
    "bg-orange-400",
    "bg-blue-400",
    "bg-green-500",
    "bg-purple-400",
    "bg-rose-400",
    "bg-cyan-500",
    "bg-amber-400",
    "bg-indigo-400",
    "bg-teal-500",
    "bg-pink-400",
    "bg-lime-500",
    "bg-sky-400",
];

function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
}

function StatusBadge({ status }) {
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
    };
    const s = map[status];
    return (
        <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}
        >
            {s.label}
        </span>
    );
}

function RankBadge({ rank }) {
    const colors = [
        "bg-amber-400 text-white", // 1st - gold
        "bg-gray-400 text-white", // 2nd - silver
        "bg-orange-600 text-white", // 3rd - bronze
    ];
    return (
        <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${colors[rank - 1] || "bg-gray-100 text-gray-500"}`}
        >
            {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
        </div>
    );
}

function TrendingCard({ issue }) {
    const [upvoted, setUpvoted] = useState(false);
    const [count, setCount] = useState(issue.upvotes);

    const handleUpvote = () => {
        setUpvoted((u) => !u);
        setCount((c) => (upvoted ? c - 1 : c + 1));
    };

    return (
        <div className="issue-card bg-white rounded-2xl p-4 shadow-card border border-[#FED7AA]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5">
                <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${issue.categoryBg} ${issue.categoryColor} flex items-center gap-1.5`}
                >
                    <span>{issue.categoryEmoji}</span>
                    {issue.category}
                </span>

                <span className="text-xs text-gray-400">• {issue.timeAgo}</span>
            </div>

            {/* Content + Upvote */}
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5">
                        {issue.title}
                    </h3>

                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {issue.description}
                    </p>
                </div>

                {/* Upvote Box */}
                <div className="shrink-0">
                    <button
                        onClick={handleUpvote}
                        className={`flex flex-col items-center gap-0.5 w-14 h-16 rounded-xl border-2 transition-all ${
                            upvoted
                                ? "border-green-500 bg-green-50"
                                : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
                        }`}
                    >
                        <span className="mt-2">
                            <UpvoteIcon active={upvoted} />
                        </span>

                        <span className="text-sm font-bold text-green-600">
                            {formatNum(count)}
                        </span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Location */}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <LocationIcon />
                        {issue.location}
                    </span>

                    {/* Status */}
                    <StatusBadge status={issue.status} />
                </div>

                {/* Comments */}
                <div className="flex items-center gap-1.5 text-gray-400">
                    <CommentIcon />
                    <span className="text-xs">{issue.comments}</span>
                </div>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-2 mt-2.5">
                <div className="flex items-center">
                    {issue.avatars.slice(0, 4).map((a, i) => (
                        <div
                            key={i}
                            className={`w-6 h-6 rounded-full ${
                                avatarColors[i % avatarColors.length]
                            } border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}
                            style={{ marginLeft: i === 0 ? 0 : -6 }}
                        >
                            {a}
                        </div>
                    ))}
                </div>

                <span className="text-xs text-gray-400">
                    {issue.upvotedBy.toLocaleString()} people upvoted
                </span>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TrendingPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [timeRange, setTimeRange] = useState("24h");

    const filtered = trendingIssues.filter((i) => {
        const matchCat =
            activeCategory === "all" ||
            i.category.toLowerCase() === activeCategory;
        const matchSearch =
            !search || i.title.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

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
                            Explore
                        </h1>
                        <p className="text-white/70 text-xs mt-0.5">
                            Trending issues across Nigeria
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
                        <TrophyIcon />
                        <span className="text-white text-xs font-semibold">
                            1,240 issues
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Desktop Header ── */}
            <div className="hidden md:block px-6 pt-8 pb-6">
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
                            label: "Total Issues",
                            value: "1,240",
                            icon: "📋",
                            color: "text-gray-800",
                        },
                        {
                            label: "Resolved Today",
                            value: "23",
                            icon: "✅",
                            color: "text-green-600",
                        },
                        {
                            label: "Most Active",
                            value: "Lagos",
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
                    />
                </div>
            </div>

            {/* ── Category Pills ── */}
            <div className="px-4 md:px-6 mb-4">
                <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: "none" }}
                >
                    {categories.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => setActiveCategory(c.key)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${activeCategory === c.key ? "bg-[#F97316] text-white border-[#F97316] shadow-sm" : "bg-white text-gray-600 border-gray-100 hover:border-[#F97316]/30 shadow-card"}`}
                        >
                            <span>{c.emoji}</span>
                            <span>{c.label}</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeCategory === c.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                            >
                                {c.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Time Range (mobile) ── */}
            <div className="md:hidden px-4 mb-4">
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
                    {["24h", "7d", "30d"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === t ? "bg-[#F97316] text-white" : "text-gray-500"}`}
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
                        Trending Now · {timeRange}
                    </span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">
                    {filtered.length} issues
                </span>
            </div>

            {/* ── Issues List ── */}
            <div className="px-4 md:px-6 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 xl:grid-cols-2">
                {filtered.map((issue) => (
                    <TrendingCard key={issue.id} issue={issue} />
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-50">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="font-semibold text-gray-700">
                            No issues found
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            Try a different category or search term
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom padding for mobile nav */}
            <div className="h-6" />
        </div>
    );
}
