"use client";

import Link from "next/link";
import { useState } from "react";

// ── Icons ──────────────────────────────────────────────
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
        stroke={active ? "#16A34A" : "#16A34A"}
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

const BellIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5 md:stroke-[#F97316]"
    >
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
);

const FireIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="#EA580C"
        stroke="none"
        className="w-3.5 h-3.5"
    >
        <path d="M12 2c0 0-6 6-6 12a6 6 0 0012 0c0-6-6-12-6-12zm0 16a4 4 0 01-4-4c0-3.5 2.5-6.5 4-9 1.5 2.5 4 5.5 4 9a4 4 0 01-4 4z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#16A34A"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

// ── Sample Data ─────────────────────────────────────────
const issues = [
    {
        id: "1",
        category: "Infrastructure",
        categoryColor: "text-orange-700",
        categoryBg: "bg-orange-50",
        categoryEmoji: "🏗️",
        title: "Fix Bad Road at Allen Junction, Lagos",
        description:
            "This road has been abandoned for months. It's affecting commuters, businesses & school children daily.",
        location: "Lagos, Nigeria",
        timeAgo: "2h ago",
        upvotes: 1200,
        comments: 48,
        status: "trending",
        avatars: ["A", "B", "C", "D"],
        upvotedBy: 234,
    },
    {
        id: "2",
        category: "Education",
        categoryColor: "text-blue-700",
        categoryBg: "bg-blue-50",
        categoryEmoji: "📚",
        title: "Our School Needs More Classrooms!",
        description:
            "Government Secondary School, Ibadan needs urgent attention. Students are learning under trees.",
        location: "Ibadan, Oyo State",
        timeAgo: "5h ago",
        upvotes: 876,
        comments: 32,
        status: "under-review",
        avatars: ["C", "D", "E", "F"],
        upvotedBy: 143,
    },
    {
        id: "3",
        category: "Healthcare",
        categoryColor: "text-rose-700",
        categoryBg: "bg-rose-50",
        categoryEmoji: "❤️",
        title: "No Clinic in My Community – Help!",
        description:
            "We've had no functional clinic for over 2 years. Pregnant women travel 10km for care.",
        location: "Kano State",
        timeAgo: "Yesterday",
        upvotes: 532,
        comments: 21,
        status: "needs-attention",
        avatars: ["G", "H", "I"],
        upvotedBy: 98,
    },
    {
        id: "4",
        category: "Water",
        categoryColor: "text-cyan-700",
        categoryBg: "bg-cyan-50",
        categoryEmoji: "💧",
        title: "No Pipe-borne Water for 6 Months",
        description:
            "Our entire street has been without running water. We rely on hawkers and it is too expensive.",
        location: "Port Harcourt, Rivers State",
        timeAgo: "2 days ago",
        upvotes: 412,
        comments: 17,
        status: "needs-attention",
        avatars: ["J", "K", "L"],
        upvotedBy: 76,
    },
    {
        id: "5",
        category: "Security",
        categoryColor: "text-purple-700",
        categoryBg: "bg-purple-50",
        categoryEmoji: "🔒",
        title: "Street Lights Out for 3 Months",
        description:
            "Entire road from junction to market has no street lights. Armed robbery has increased.",
        location: "Enugu State",
        timeAgo: "3 days ago",
        upvotes: 298,
        comments: 14,
        status: null,
        avatars: ["M", "N"],
        upvotedBy: 54,
    },
];

const avatarColors = [
    "bg-orange-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-rose-400",
    "bg-cyan-400",
    "bg-amber-400",
    "bg-indigo-400",
    "bg-teal-400",
    "bg-pink-400",
    "bg-lime-500",
    "bg-sky-400",
    "bg-violet-400",
    "bg-emerald-400",
];

function formatUpvotes(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
}

function StatusBadge({ status }) {
    if (!status) return null;
    const map = {
        trending: { label: "🔥 Trending", className: "badge-trending" },
        "under-review": { label: "✅ Under Review", className: "badge-review" },
        resolved: { label: "✔ Resolved", className: "badge-resolved" },
        "needs-attention": {
            label: "⚠ Needs Attention",
            className: "badge-attention",
        },
    };
    const s = map[status];
    return (
        <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.className}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
        >
            {s.label}
        </span>
    );
}

function IssueCard({ issue }) {
    const [upvoted, setUpvoted] = useState(false);
    const [count, setCount] = useState(issue.upvotes);

    const handleUpvote = (e) => {
        e.preventDefault();
        if (upvoted) {
            setCount((c) => c - 1);
        } else {
            setCount((c) => c + 1);
        }
        setUpvoted((u) => !u);
    };

    return (
        <div className="issue-card bg-white rounded-2xl p-4 shadow-card border border-[#FED7AA]">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2.5">
                <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${issue.categoryBg} ${issue.categoryColor} flex items-center gap-1.5`}
                >
                    <span>{issue.categoryEmoji}</span>
                    {issue.category}
                </span>
                <span
                    className="text-xs text-gray-400"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    • {issue.timeAgo}
                </span>
            </div>

            {/* Content + Upvote */}
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    <h3
                        className="font-bold text-gray-900 text-sm leading-snug mb-1.5"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
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

                {/* Upvote box */}
                <div className="shrink-0">
                    <button
                        onClick={handleUpvote}
                        className={`upvote-btn flex flex-col items-center gap-0.5 w-14 h-16 rounded-xl border-2 transition-all cursor-pointer ${
                            upvoted
                                ? "border-green-500 bg-green-50"
                                : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
                        }`}
                    >
                        <span className="mt-2">
                            <UpvoteIcon active={upvoted} />
                        </span>
                        <span
                            className={`text-sm font-bold ${upvoted ? "text-green-600" : "text-green-600"}`}
                        >
                            {formatUpvotes(count)}
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
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <CommentIcon />
                    <span
                        className="text-xs"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {issue.comments}
                    </span>
                </button>
            </div>

            {/* Avatars + upvote count */}
            <div className="flex items-center gap-2 mt-2.5">
                <div className="avatar-stack flex items-center">
                    {issue.avatars.map((a, i) => (
                        <div
                            key={i}
                            className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold -ml-1.5 first:ml-0`}
                        >
                            {a}
                        </div>
                    ))}
                </div>
                <span
                    className="text-xs text-gray-400"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    {issue.upvotedBy} people upvoted
                </span>
            </div>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────
export default function HomePage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");

    const filters = [
        { key: "all", label: "All" },
        { key: "trending", label: "🔥 Trending" },
        { key: "nearby", label: "📍 Nearby" },
        { key: "resolved", label: "✅ Resolved" },
    ];

    const filteredIssues = issues.filter((issue) => {
        if (activeFilter === "trending") return issue.status === "trending";
        if (activeFilter === "resolved") return issue.status === "resolved";
        if (search)
            return (
                issue.title.toLowerCase().includes(search.toLowerCase()) ||
                issue.description.toLowerCase().includes(search.toLowerCase())
            );
        return true;
    });

    return (
        <div
            className="min-h-screen pb-24 md:pb-0"
            style={{ background: "#FDF6EF" }}
        >
            {/* ── TOP HEADER (mobile only) ── */}
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
                        <button className="relative w-9 h-9 flex items-center justify-center cursor-pointer">
                            <BellIcon />
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white text-[#F97316] text-[9px] font-bold rounded-full flex items-center justify-center">
                                3
                            </span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-200 to-orange-400 border-2 border-white overflow-hidden flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                                A
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── PAGE HEADER (desktop) ── */}
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
                    <button className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                        <BellIcon />
                        <span className="absolute top-1 right-1 w-4 h-4 bg-[#F97316] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            3
                        </span>
                    </button>
                    <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                            A
                        </div>
                        <div>
                            <div
                                className="text-sm font-semibold text-gray-800 leading-none"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Ada
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                Lagos
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── GREETING (mobile) ── */}
            <div className="md:hidden px-4 pt-5 pb-2">
                <h1
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Hello, Ada 👋
                </h1>
                <p
                    className="text-gray-500 text-sm mt-0.5"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Be the voice. Drive the change.
                </p>
            </div>

            {/* ── GREETING (desktop) ── */}
            <div className="hidden md:block px-6 mt-4">
                <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                        A
                    </div>
                    <div>
                        <h2
                            className="text-lg font-bold text-gray-900"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Hello, Ada 👋
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
                                12
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
                                847
                            </div>
                            <div className="text-xs text-gray-400">Upvotes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SEARCH + FILTER ── */}
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

            {/* ── FILTER PILLS ── */}
            <div className="px-4 md:px-6 mt-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                                activeFilter === f.key
                                    ? "bg-[#F97316] text-white shadow-sm"
                                    : "bg-white text-black border border-gray-200 hover:border-[#F97316]/40 hover:text-[#F97316]"
                            }`}
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── ISSUES LIST ── */}
            <div className="px-4 md:px-6 my-4 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-2">
                {filteredIssues.length > 0 ? (
                    filteredIssues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                    ))
                ) : (
                    <div className="col-span-2 text-center py-16">
                        <div className="text-4xl mb-3">🔍</div>
                        <p
                            className="text-gray-500 font-medium"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            No issues found
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            Try a different filter or search
                        </p>
                    </div>
                )}
            </div>

            {/* ── FLOATING POST BUTTON (mobile only) ── */}
            <Link
                href="/create-issue"
                className="md:hidden fixed bottom-20 right-4 flex items-center gap-2 bg-[#EA580C] text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:bg-[#C2410C] transition-colors"
                style={{
                    fontFamily: "DM Sans, sans-serif",
                    boxShadow: "0 4px 20px rgba(232,97,26,0.45)",
                }}
            >
                <span className="text-lg font-light">+</span>
                Post Issue
            </Link>
        </div>
    );
}
