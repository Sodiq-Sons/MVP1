"use client";

import { useState, useEffect, use, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    doc,
    collection,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    runTransaction,
    getDoc,
    getDocs,
    where,
    limit,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { awardPoints } from "@/lib/gamification";
import { isProfileComplete } from "@/lib/profileCompletion";
import Image from "next/image";

// ─── Category Meta ─────────────────────────────────────────────────────────────
const CATEGORY_META = {
    infrastructure: {
        color: "text-cp",
        bg: "bg-cp-tint",
        label: "Infrastructure",
    },
    education: { color: "text-blue-700", bg: "bg-blue-50", label: "Education" },
    healthcare: {
        color: "text-rose-700",
        bg: "bg-rose-50",
        label: "Healthcare",
    },
    water: { color: "text-cyan-700", bg: "bg-cyan-50", label: "Water" },
    security: {
        color: "text-purple-700",
        bg: "bg-purple-50",
        label: "Security",
    },
    electricity: {
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        label: "Electricity",
    },
    environment: {
        color: "text-green-700",
        bg: "bg-green-50",
        label: "Environment",
    },
    other: { color: "text-gray-700", bg: "bg-muted", label: "Other" },
};

// ─── Demographic Config ────────────────────────────────────────────────────────
const DEMOGRAPHIC_CONFIG = {
    age: {
        emoji: "🎂",
        label: "Age group",
        firestoreField: "age",
        groups: ["Teens (13-19)", "Youth (20-35)", "Adult (35+)"],
        getGroup: (rawAge) => {
            const n = parseInt(String(rawAge), 10);
            if (isNaN(n)) return null;
            if (n >= 13 && n <= 19) return "Teens (13-19)";
            if (n >= 20 && n <= 35) return "Youth (20-35)";
            if (n > 35) return "Adult (35+)";
            return null;
        },
    },
    gender: {
        emoji: "⚧️",
        label: "Gender",
        firestoreField: "gender",
        groups: ["Male", "Female", "Other"],
        getGroup: (val) =>
            ["Male", "Female", "Other"].includes(val) ? val : null,
    },
    stateOfOrigin: {
        emoji: "📍",
        label: "State",
        firestoreField: "stateOfOrigin",
        groups: [],
        getGroup: (val) => (val && typeof val === "string" ? val : null),
    },
    platoon: {
        emoji: "👥",
        label: "Platoon",
        firestoreField: "platoon",
        groups: [],
        getGroup: (val) => (val && typeof val === "string" ? val : null),
    },
};

const DEMO_COLORS = [
    "var(--cp)",
    "#1D9E75",
    "#7F77DD",
    "#D85A30",
    "#185FA5",
    "#BA7517",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function cloudinaryOpt(url, opts = "f_auto,q_auto,w_900") {
    if (!url?.includes("res.cloudinary.com")) return url;
    return url.replace("/upload/", `/upload/${opts}/`);
}

function timeAgo(seconds) {
    const diff = Math.floor(Date.now() / 1000) - seconds;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    const weeks = Math.floor(diff / 604800);
    if (diff < 2592000) return `${weeks}w`;
    const months = Math.floor(diff / 2592000);
    if (diff < 31536000) return `${months}mo`;
    return `${Math.floor(diff / 31536000)}y`;
}

function getDeadlineLabel(deadline, enabled) {
    if (!enabled || !deadline) return null;
    const d = deadline?.toDate ? deadline.toDate() : new Date(deadline);
    const ms = d.getTime() - Date.now();
    if (ms <= 0) return { label: "Voting closed", closed: true };
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h >= 48) return { label: `${Math.floor(h / 24)}d ${h % 24}h left`, closed: false };
    if (h >= 1) return { label: `${h}h ${m}m left`, closed: false };
    if (m >= 1) return { label: `${m}m ${s}s left`, closed: false };
    return { label: `${s}s left`, closed: false };
}

function formatNumber(n) {
    if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
    return String(n);
}

function getAvatarCount(n) {
    return Math.min(Math.max(n, 0), 4);
}

const AVATAR_LETTERS = ["A", "B", "C", "D"];
const AVATAR_COLORS = [
    "bg-amber-400",
    "bg-blue-400",
    "bg-green-500",
    "bg-purple-400",
    "bg-rose-400",
    "bg-cyan-500",
    "bg-amber-400",
    "bg-indigo-400",
];
const BAR_COLORS = [
    "bg-green-500",
    "bg-red-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
];

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const SvgBack = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const SvgLocation = ({ className = "w-4 h-4" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
const SvgClock = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);
const SvgShare = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);
const SvgCheckCircle = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const SvgCheckFill = () => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-3.5 h-3.5 text-white"
    >
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
);
const SvgSend = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
    >
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const SvgUpvote = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#16A34A" : "none"}
        stroke="#16A34A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
    >
        <polyline points="18 15 12 9 6 15" />
    </svg>
);
const SvgDownvote = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#DC2626" : "none"}
        stroke="#DC2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const SvgReply = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
    >
        <polyline points="9 17 4 12 9 7" />
        <path d="M20 18v-2a4 4 0 00-4-4H4" />
    </svg>
);
const SvgHeart = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "var(--cp)" : "none"}
        stroke={active ? "var(--cp)" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
    >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
);
const SvgChevronDown = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const SvgChevronUp = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
    >
        <polyline points="18 15 12 9 6 15" />
    </svg>
);
const SvgSpinner = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5 animate-spin"
    >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0110 10" />
    </svg>
);
const SvgBubbleEmpty = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 text-gray-200"
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path
            d="M8 10h.01M12 10h.01M16 10h.01"
            strokeWidth="2.5"
            strokeLinecap="round"
        />
    </svg>
);
const SvgDots = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
    </svg>
);
const SvgDocument = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-16 h-16"
    >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="9" y2="9" />
    </svg>
);
const SvgSearch = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-20 h-20"
    >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const SvgComments = ({ className = "w-4 h-4" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);
const SvgVote = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);
const SvgDiscussion = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
);
const SvgUser = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
    >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const categoryIcons = {
    infrastructure: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <path d="M2 22h20M2 6h20M2 10h20M2 14h20M6 2v20M18 2v20" />
        </svg>
    ),
    education: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <path d="M4 19.5A2.5 2.5 0 016.5 22H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
    ),
    healthcare: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    ),
    water: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
        </svg>
    ),
    security: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    ),
    electricity: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    environment: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <path d="M2 22h20M7 22v-6a2 2 0 012-2h6a2 2 0 012 2v6M12 2v10" />
            <circle cx="12" cy="8" r="2" />
        </svg>
    ),
    other: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
        </svg>
    ),
};
function CategoryIcon({ category }) {
    return categoryIcons[category] || categoryIcons.other;
}

function StatusBadge({ status }) {
    const map = {
        trending: {
            label: "Trending",
            cls: "bg-red-50 text-red-600 border-red-100",
        },
        "under-review": {
            label: "Under Review",
            cls: "bg-blue-50 text-blue-600 border-blue-100",
        },
        resolved: {
            label: "Resolved",
            cls: "bg-green-50 text-green-600 border-green-100",
        },
        "needs-attention": {
            label: "Needs Attention",
            cls: "bg-yellow-50 text-yellow-600 border-yellow-100",
        },
        viral: {
            label: "Viral",
            cls: "bg-cp-tint text-cp border-cp/20",
        },
    };
    if (!status || !map[status]) return null;
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${map[status].cls}`}
        >
            {map[status].label}
        </span>
    );
}

function Avatar({ name, size = "md", isBot = false }) {
    const color = isBot
        ? "bg-gradient-to-br from-purple-500 to-indigo-600"
        : AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
    const dim =
        size === "sm"
            ? "w-7 h-7 text-[10px]"
            : size === "lg"
              ? "w-10 h-10 text-sm"
              : "w-8 h-8 text-xs";
    return (
        <div
            className={`${dim} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none`}
        >
            {isBot ? (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                >
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
            ) : (
                name.charAt(0).toUpperCase()
            )}
        </div>
    );
}

// ─── Incomplete Profile Modal ───────────────────────────────────────────────────
function IncompleteProfileModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl p-6 mx-4 max-w-sm w-full z-10 shadow-2xl">
                <div className="text-center">
                    <div className="w-16 h-16 bg-cp-tint rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        🔒
                    </div>
                    <h3
                        className="text-lg font-bold text-gray-900 mb-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Complete Your Profile
                    </h3>
                    <p
                        className="text-sm text-gray-500 mb-2"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        You need a{" "}
                        <span className="font-semibold text-cp">
                            complete profile
                        </span>{" "}
                        to vote and interact with posts.
                    </p>
                    <p className="text-xs text-gray-400 mb-6">
                        Fill in all your details — it only takes a minute and
                        you&apos;ll earn a <strong>Verified Corper</strong>{" "}
                        badge 🏅
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm border border-theme text-gray-600 hover:bg-subtle transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                window.location.href = "/profile/edit";
                            }}
                            className="flex-1 py-3 rounded-xl font-bold text-sm btn-primary transition-colors cursor-pointer"
                        >
                            Complete Profile →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Login Prompt Modal ────────────────────────────────────────────────────────
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
                    <div className="w-16 h-16 bg-cp-tint rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        🔒
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
                        Please sign in to upvote, vote, and join the
                        conversation.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm border border-theme text-gray-600 hover:bg-subtle transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onLogin}
                            className="flex-1 py-3 rounded-xl font-bold text-sm btn-primary transition-colors cursor-pointer"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Demographic Insights ──────────────────────────────────────────────────────
function DemographicInsights({
    issue,
    demographicData,
    demographicsLoading,
    totalVotes,
}) {
    const voteOptions = issue.voteOptions || [];
    const demographics = (issue.demographics || []).filter(
        (d) => DEMOGRAPHIC_CONFIG[d],
    );
    const [activeTab, setActiveTab] = useState(demographics[0] ?? null);

    const overallPcts = voteOptions.map((opt) => ({
        opt,
        count: issue.votes?.[opt] || 0,
        pct:
            totalVotes > 0
                ? Math.round(((issue.votes?.[opt] || 0) / totalVotes) * 100)
                : 0,
    }));

    const leadingOpt = [...overallPcts].sort((a, b) => b.pct - a.pct)[0]?.opt;
    let topGroupName = null,
        topGroupPct = 0,
        strongestDemoLabel = null;

    if (leadingOpt && activeTab) {
        const tabData = demographicData[activeTab] || {};
        Object.entries(tabData).forEach(([group, counts]) => {
            const groupTotal = Object.values(counts).reduce((s, v) => s + v, 0);
            const pct =
                groupTotal > 0
                    ? Math.round(((counts[leadingOpt] || 0) / groupTotal) * 100)
                    : 0;
            if (pct > topGroupPct) {
                topGroupPct = pct;
                topGroupName = group;
                strongestDemoLabel = DEMOGRAPHIC_CONFIG[activeTab]?.label;
            }
        });
    }

    if (demographics.length === 0) return null;

    const activeConfig = DEMOGRAPHIC_CONFIG[activeTab];
    const activeData = demographicData[activeTab] || {};
    const activeGroups = Object.keys(activeData).filter((g) =>
        voteOptions.some((opt) => (activeData[g]?.[opt] || 0) > 0),
    );

    return (
        <div className="bg-card rounded-2xl border border-subtle shadow-sm overflow-hidden">
            <div className="bg-cp px-4 pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2
                        className="text-sm font-bold text-white flex items-center gap-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="w-4 h-4"
                        >
                            <path d="M18 20V10" />
                            <path d="M12 20V4" />
                            <path d="M6 20v-6" />
                        </svg>
                        How people voted
                    </h2>
                    <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                        {totalVotes} votes
                    </span>
                </div>
                <div className="space-y-2">
                    {voteOptions.map((opt) => {
                        const count = issue.votes?.[opt] || 0;
                        const pct =
                            totalVotes > 0
                                ? Math.round((count / totalVotes) * 100)
                                : 0;
                        return (
                            <div
                                key={opt}
                                className="flex items-center gap-2.5"
                            >
                                <span className="text-xs text-white/80 w-22.5 shrink-0 leading-tight truncate">
                                    {opt}
                                </span>
                                <div className="flex-1 h-7 bg-white/15 rounded-lg overflow-hidden">
                                    <div
                                        className="h-full bg-white/30 rounded-lg flex items-center px-2.5 transition-all duration-700"
                                        style={{
                                            width: `${Math.max(pct, 4)}%`,
                                        }}
                                    >
                                        {pct >= 12 && (
                                            <span className="text-xs font-semibold text-white">
                                                {pct}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-white w-5 text-right shrink-0">
                                    {formatNumber(count)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {topGroupName && (
                <div className="grid grid-cols-2 divide-x divide-subtle border-b border-subtle">
                    <div className="px-4 py-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                            Leading choice
                        </p>
                        <p
                            className="text-sm font-bold text-gray-900 truncate"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {leadingOpt}
                        </p>
                        <p className="text-[11px] text-cp font-semibold mt-0.5">
                            {overallPcts[0]?.pct ?? 0}% of all votes
                        </p>
                    </div>
                    <div className="px-4 py-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                            Strongest support
                        </p>
                        <p
                            className="text-sm font-bold text-gray-900 truncate"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {topGroupName}
                        </p>
                        <p className="text-[11px] text-cp font-semibold mt-0.5">
                            {topGroupPct}% chose yes · {strongestDemoLabel}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex border-b border-subtle overflow-x-auto scrollbar-hide">
                {demographics.map((demo) => {
                    const cfg = DEMOGRAPHIC_CONFIG[demo];
                    return (
                        <button
                            key={demo}
                            onClick={() => setActiveTab(demo)}
                            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === demo ? "border-cp text-cp" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                            {cfg.label}
                        </button>
                    );
                })}
            </div>

            <div className="px-4 py-4 space-y-4">
                {demographicsLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                        <SvgSpinner />
                        <span className="text-sm">Loading insights...</span>
                    </div>
                ) : totalVotes === 0 ? (
                    <div className="py-8 text-center">
                        <div className="w-12 h-12 bg-cp-tint rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--cp)"
                                strokeWidth="1.5"
                                className="w-6 h-6"
                            >
                                <path d="M18 20V10" />
                                <path d="M12 20V4" />
                                <path d="M6 20v-6" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-500">
                            No votes yet
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                            Demographic breakdown appears once people vote
                        </p>
                    </div>
                ) : activeGroups.length === 0 ? (
                    <div className="py-6 text-center">
                        <p className="text-sm text-gray-400">
                            No data for this demographic yet
                        </p>
                    </div>
                ) : (
                    activeGroups.map((group) => {
                        const groupCounts = activeData[group] || {};
                        const groupTotal = voteOptions.reduce(
                            (s, o) => s + (groupCounts[o] || 0),
                            0,
                        );
                        if (groupTotal === 0) return null;
                        return (
                            <div key={group}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-800">
                                        {group}
                                    </span>
                                    <span className="text-[10px] text-gray-400 bg-muted px-2 py-0.5 rounded-full">
                                        {groupTotal} vote
                                        {groupTotal !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="h-8 w-full flex rounded-xl overflow-hidden">
                                    {voteOptions.map((opt, i) => {
                                        const count = groupCounts[opt] || 0;
                                        const pct =
                                            groupTotal > 0
                                                ? (count / groupTotal) * 100
                                                : 0;
                                        if (pct === 0) return null;
                                        return (
                                            <div
                                                key={opt}
                                                title={`${opt}: ${count} (${Math.round(pct)}%)`}
                                                className="h-full flex items-center justify-center relative group"
                                                style={{
                                                    width: `${pct}%`,
                                                    backgroundColor:
                                                        DEMO_COLORS[
                                                            i %
                                                                DEMO_COLORS.length
                                                        ],
                                                }}
                                            >
                                                {pct >= 14 && (
                                                    <span className="text-white text-[10px] font-bold pointer-events-none select-none">
                                                        {Math.round(pct)}%
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                    {voteOptions.map((opt, i) => {
                                        const count = groupCounts[opt] || 0;
                                        if (count === 0) return null;
                                        const pct =
                                            groupTotal > 0
                                                ? Math.round(
                                                      (count / groupTotal) *
                                                          100,
                                                  )
                                                : 0;
                                        return (
                                            <div
                                                key={opt}
                                                className="flex items-center gap-1"
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-sm shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            DEMO_COLORS[
                                                                i %
                                                                    DEMO_COLORS.length
                                                            ],
                                                    }}
                                                />
                                                <span className="text-[10px] text-gray-500 max-w-22.5 truncate">
                                                    {opt}
                                                </span>
                                                <span className="text-[10px] font-semibold text-gray-700">
                                                    {pct}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Reply Form ────────────────────────────────────────────────────────────────
function ReplyForm({
    parentId,
    replyingTo,
    replyingToUserId,
    issueId,
    issueTitle,
    currentUser,
    authReady,
    onCancel,
    onSuccess,
}) {
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const [replySuggestions, setReplySuggestions] = useState([]);
    const [replyMentionQuery, setReplyMentionQuery] = useState(null);
    const replyInputRef = useRef(null);
    const replyUserCache = useRef(null);

    const handleReplyChange = async (val) => {
        setText(val);
        const el = replyInputRef.current;
        const caret = el ? el.selectionStart : val.length;
        const match = val.slice(0, caret).match(/@(\S*)$/);
        if (!match) { setReplyMentionQuery(null); setReplySuggestions([]); return; }
        const q = match[1];
        setReplyMentionQuery(q);
        if (!replyUserCache.current) {
            try {
                const snap = await getDocs(query(collection(db, "users"), limit(40)));
                replyUserCache.current = snap.docs
                    .map((d) => ({ uid: d.id, name: d.data().displayName || d.data().name || "", photoURL: d.data().photoURL || null }))
                    .filter((u) => u.name);
            } catch { replyUserCache.current = []; }
        }
        const lq = q.toLowerCase();
        setReplySuggestions((replyUserCache.current || []).filter((u) => u.name.toLowerCase().includes(lq)).slice(0, 4));
    };

    const insertReplyMention = (u) => {
        const el = replyInputRef.current;
        const caret = el ? el.selectionStart : text.length;
        const beforeCaret = text.slice(0, caret).replace(/@(\S*)$/, "@" + u.name + " ");
        const next = beforeCaret + text.slice(caret);
        setText(next);
        setReplyMentionQuery(null);
        setReplySuggestions([]);
        requestAnimationFrame(() => {
            if (replyInputRef.current) {
                replyInputRef.current.focus();
                replyInputRef.current.setSelectionRange(beforeCaret.length, beforeCaret.length);
            }
        });
    };

    const submit = async () => {
        if (!text.trim() || !authReady || saving) return;
        setSaving(true);
        try {
            const issueRef = doc(db, "issues", issueId);
            let newReplyRef;
            await runTransaction(db, async (transaction) => {
                const issueSnap = await transaction.get(issueRef);
                const currentCount = issueSnap.data()?.commentCount || 0;
                const commentsRef = collection(
                    db,
                    "issues",
                    issueId,
                    "comments",
                );
                newReplyRef = doc(commentsRef);
                transaction.set(newReplyRef, {
                    text: text.trim(),
                    userName: "Anonymous",
                    userId: currentUser?.uid ?? "anon",
                    parentId,
                    replyingTo,
                    createdAt: serverTimestamp(),
                    likes: 0,
                });
                transaction.update(issueRef, {
                    commentCount: currentCount + 1,
                });
            });
            const actorName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Corper";
            if (replyingToUserId && replyingToUserId !== currentUser?.uid) {
                await createNotification({
                    type: NOTIFICATION_TYPES.REPLY,
                    recipientId: replyingToUserId,
                    actorId: currentUser?.uid || "anon",
                    actorName,
                    actorPhotoURL: currentUser?.photoURL || null,
                    issueId,
                    issueTitle,
                    commentId: newReplyRef.id,
                    commentPreview: text.trim(),
                });
            }
            // Notify @mentioned users in the reply text
            const replyCache = replyUserCache.current || [];
            if (replyCache.length > 0) {
                const notified = new Set([currentUser?.uid, replyingToUserId].filter(Boolean));
                for (const u of replyCache) {
                    if (!notified.has(u.uid) && text.trim().includes("@" + u.name)) {
                        notified.add(u.uid);
                        createNotification({
                            type: NOTIFICATION_TYPES.MENTION,
                            recipientId: u.uid,
                            actorId: currentUser?.uid || "anon",
                            actorName,
                            actorPhotoURL: currentUser?.photoURL || null,
                            issueId,
                            issueTitle,
                            commentId: newReplyRef.id,
                            commentPreview: text.trim(),
                        }).catch(() => {});
                    }
                }
            }
            setText("");
            onSuccess();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-2 flex gap-2 items-start">
            <Avatar name="A" size="sm" />
            <div className="flex-1">
                {replySuggestions.length > 0 && (
                    <div className="mb-1 bg-white border border-subtle rounded-xl shadow-xl overflow-hidden">
                        {replySuggestions.map((u) => (
                            <button
                                key={u.uid}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); insertReplyMention(u); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left cursor-pointer border-b border-subtle last:border-0"
                            >
                                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {u.photoURL
                                        ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                        : <span className="text-[10px] font-bold text-gray-600">{u.name?.charAt(0)}</span>}
                                </div>
                                <span className="text-xs font-semibold text-gray-800">{u.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            <div className="bg-subtle rounded-2xl border border-subtle focus-within:border-cp/50 focus-within:ring-2 focus-within:ring-gray-200 transition-all overflow-hidden">
                <div className="px-3 pt-2.5">
                    <span className="text-xs font-bold text-cp">
                        @{replyingTo}{" "}
                    </span>
                    <input
                        ref={replyInputRef}
                        autoFocus
                        type="text"
                        value={text}
                        onChange={(e) => handleReplyChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        placeholder="Write a reply… (@ to mention)"
                        maxLength={280}
                        className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    />
                </div>
                <div className="flex items-center justify-between px-3 pb-2 mt-1">
                    {text.length > 0 ? (
                        <span className="text-[11px] text-gray-400">
                            {text.length}/280
                        </span>
                    ) : (
                        <span />
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submit}
                            disabled={!text.trim() || saving}
                            className="flex items-center gap-1.5 text-xs font-bold bg-cp text-white px-3 py-1.5 rounded-xl  disabled:opacity-40 transition-colors cursor-pointer"
                        >
                            {saving ? <SvgSpinner /> : <SvgSend />} Reply
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

// ─── Comment Item ──────────────────────────────────────────────────────────────
function CommentItem({
    comment,
    allComments,
    depth = 0,
    issueId,
    issueTitle,
    issueOwnerId,
    currentUser,
    authReady,
    isAnonymous,
}) {
    const [replying, setReplying] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likes || 0);
    const [showReplies, setShowReplies] = useState(false);

    const timeText = useMemo(() => {
        const sec = comment.createdAt?.seconds;
        return sec ? timeAgo(sec) : "just now";
    }, [comment.createdAt?.seconds]);
    const replies = allComments.filter((c) => c.parentId === comment.id);
    const hasReplies = replies.length > 0;
    const nextDepth = depth < 4 ? depth + 1 : 4;
    const avatarSize = depth === 0 ? "md" : "sm";

    const toggleLike = async () => {
        if (!authReady) return;
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
        try {
            const commentRef = doc(
                db,
                "issues",
                issueId,
                "comments",
                comment.id,
            );
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(commentRef);
                if (!snap.exists()) return;
                const current = snap.data().likes || 0;
                tx.update(commentRef, {
                    likes: newLiked ? current + 1 : Math.max(0, current - 1),
                });
            });
            if (
                newLiked &&
                comment.userId &&
                comment.userId !== currentUser?.uid
            ) {
                await createNotification({
                    type: NOTIFICATION_TYPES.LIKE_COMMENT,
                    recipientId: comment.userId,
                    actorId: currentUser?.uid || "anon",
                    actorName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Corper",
                    issueId,
                    issueTitle,
                    commentId: comment.id,
                    commentPreview: comment.text,
                });
            }
        } catch (err) {
            console.error("Like failed:", err);
            setLiked(liked);
            setLikeCount(comment.likes || 0);
        }
    };

    return (
        <div className="relative">
            <div className="flex gap-2.5">
                <div className="flex flex-col items-center shrink-0">
                    <Avatar name={comment.userName} size={avatarSize} />
                    {hasReplies && showReplies && (
                        <div className="w-0.5 bg-muted flex-1 min-h-5 mt-1.5 rounded-full" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 leading-none">
                            {comment.userName}
                        </span>
                        {comment.replyingTo && depth === 0 && (
                            <span className="text-xs text-gray-400">
                                · replying to{" "}
                                <span className="text-cp font-semibold">
                                    @{comment.replyingTo}
                                </span>
                            </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto shrink-0">
                            {timeText}
                        </span>
                        <button className="p-0.5 rounded-md text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                            <SvgDots />
                        </button>
                    </div>
                    <p
                        className="text-sm text-gray-700 leading-relaxed"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {comment.replyingTo && depth > 0 && (
                            <span className="font-bold text-cp mr-1">
                                @{comment.replyingTo}
                            </span>
                        )}
                        {comment.text}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={toggleLike}
                            className={`flex items-center gap-1 transition-colors cursor-pointer group ${liked ? "text-cp" : "text-gray-400 hover:text-cp"}`}
                        >
                            <span className="group-hover:scale-110 transition-transform">
                                <SvgHeart active={liked} />
                            </span>
                            {likeCount > 0 && (
                                <span className="text-xs font-semibold">
                                    {likeCount}
                                </span>
                            )}
                        </button>
                        {authReady && !isAnonymous && (
                            <button
                                onClick={() => setReplying((r) => !r)}
                                className="flex items-center gap-1 text-gray-400 hover:text-cp transition-colors cursor-pointer text-xs font-semibold"
                            >
                                <SvgReply /> Reply
                            </button>
                        )}
                        {hasReplies && (
                            <button
                                onClick={() => setShowReplies((s) => !s)}
                                className="flex items-center gap-1 text-xs font-bold text-cp hover:text-cp transition-colors cursor-pointer ml-auto"
                            >
                                {showReplies ? (
                                    <SvgChevronUp />
                                ) : (
                                    <SvgChevronDown />
                                )}
                                {showReplies
                                    ? "Hide replies"
                                    : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                            </button>
                        )}
                    </div>
                    {replying && (
                        <div className="mt-3">
                            <ReplyForm
                                parentId={comment.id}
                                replyingTo={comment.userName}
                                replyingToUserId={comment.userId}
                                issueId={issueId}
                                issueTitle={issueTitle}
                                currentUser={currentUser}
                                authReady={authReady}
                                onCancel={() => setReplying(false)}
                                onSuccess={() => {
                                    setReplying(false);
                                    setShowReplies(true);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
            {hasReplies && showReplies && (
                <div className="ml-9 mt-3 pl-3 border-l-2 border-subtle space-y-4">
                    {replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            allComments={allComments}
                            depth={nextDepth}
                            issueId={issueId}
                            issueTitle={issueTitle}
                            issueOwnerId={issueOwnerId}
                            currentUser={currentUser}
                            authReady={authReady}
                            isAnonymous={isAnonymous}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4">
            <div className="bg-card rounded-2xl border border-cp-border p-8 flex flex-col items-center gap-4 max-w-sm w-full shadow-sm">
                <div className="relative">
                    <div className="w-16 h-16 bg-cp-tint rounded-full flex items-center justify-center text-cp">
                        <SvgDocument />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 bg-gray-300/20 rounded-full animate-ping" />
                </div>
                <div className="text-center">
                    <h2
                        className="text-lg font-bold text-gray-900 mb-1"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Loading Post
                    </h2>
                    <p
                        className="text-sm text-gray-400"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Fetching details from the community...
                    </p>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cp h-full rounded-full animate-pulse w-2/3" />
                </div>
            </div>
        </div>
    );
}

// ─── Deadline Timer ────────────────────────────────────────────────────────────
function DeadlineTimer({ deadline, enabled }) {
    const [label, setLabel] = useState(null);
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        if (!enabled || !deadline) return;
        const update = () => {
            const result = getDeadlineLabel(deadline, enabled);
            if (result) { setLabel(result.label); setClosed(result.closed); }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [deadline, enabled]);

    if (!label) return null;
    return (
        <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                closed
                    ? "bg-gray-50 text-gray-400 border-gray-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
        >
            {closed ? "🔒" : "⏱️"} {label}
        </span>
    );
}

// ─── Report Modal ──────────────────────────────────────────────────────────────
function ReportModal({ isOpen, onClose, issueId, issueTitle, currentUser }) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const REASONS = ["Offensive / inappropriate", "Spam or misleading", "Harassment", "False information", "Other"];

    const submit = async () => {
        if (!reason || submitting) return;
        setSubmitting(true);
        try {
            const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
            await addDoc(collection(db, "reports"), {
                issueId,
                issueTitle,
                reason,
                reportedBy: currentUser?.uid || "anon",
                reportedAt: serverTimestamp(),
                status: "pending",
            });
            setDone(true);
        } catch (e) {
            console.error("Report failed:", e);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-2xl p-6 mx-4 max-w-sm w-full z-10 shadow-2xl">
                {done ? (
                    <div className="text-center">
                        <div className="text-4xl mb-3">✅</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Report Submitted</h3>
                        <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "DM Sans, sans-serif" }}>Our team will review this post. Thank you for keeping camp safe.</p>
                        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm btn-primary cursor-pointer">Close</button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-xl">🚩</div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Report Post</h3>
                                <p className="text-xs text-gray-400">Help keep Camp Connect safe</p>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            {REASONS.map((r) => (
                                <button key={r} onClick={() => setReason(r)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border-2 transition-all cursor-pointer ${reason === r ? "border-red-400 bg-red-50 text-red-700 font-semibold" : "border-subtle text-gray-700 hover:border-gray-300"}`}
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
                                >{r}</button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold text-sm border border-theme text-gray-600 hover:bg-subtle transition-colors cursor-pointer">Cancel</button>
                            <button onClick={submit} disabled={!reason || submitting}
                                className="flex-[2] py-3 rounded-xl font-bold text-sm bg-red-500 text-white disabled:opacity-40 hover:bg-red-600 transition-colors cursor-pointer"
                            >{submitting ? "Sending…" : "Submit Report"}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Share Modal (kept identical to original) ──────────────────────────────────
function ShareModal({ isOpen, onClose, imageDataUrl, capturing, issue }) {
    const [linkCopied, setLinkCopied] = useState(false);
    if (!isOpen) return null;

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `We want to get your opinion on "${issue?.title || "this issue"}"`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2500);
        } catch {}
    };
    const handleNativeShare = async () => {
        try {
            if (imageDataUrl && navigator.canShare) {
                const blob = await (await fetch(imageDataUrl)).blob();
                const file = new File([blob], "post.png", {
                    type: "image/png",
                });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: issue?.title,
                        text: shareText,
                        url: shareUrl,
                    });
                    return;
                }
            }
            if (navigator.share)
                await navigator.share({
                    title: issue?.title,
                    text: shareText,
                    url: shareUrl,
                });
        } catch {}
    };
    const handleDownload = () => {
        if (!imageDataUrl) return;
        const a = document.createElement("a");
        a.href = imageDataUrl;
        a.download = `${(issue?.title || "post").replace(/\s+/g, "-").toLowerCase().slice(0, 40)}.png`;
        a.click();
    };

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-auto z-10 shadow-2xl overflow-hidden">
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>
                <div className="flex items-center justify-between px-5 pt-3 pb-3">
                    <h3
                        className="text-base font-bold text-gray-900"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Share Post
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            className="w-4 h-4"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="px-5 pb-4">
                    <div
                        className="rounded-2xl overflow-hidden border border-subtle shadow-sm bg-subtle relative"
                        style={{ minHeight: "120px" }}
                    >
                        {capturing || !imageDataUrl ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-subtle">
                                <div className="w-8 h-8 border-2 border-cp border-t-transparent rounded-full animate-spin" />
                                <span
                                    className="text-xs text-gray-400 font-medium"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Generating preview…
                                </span>
                            </div>
                        ) : (
                            <Image
                                src={imageDataUrl}
                                alt="Post preview"
                                width={1200}
                                height={560}
                                className="w-full object-cover object-top rounded-2xl"
                                style={{ maxHeight: "240px" }}
                            />
                        )}
                    </div>
                </div>
                <div className="px-5 pb-4 grid grid-cols-5 gap-2">
                    {[
                        {
                            href: twitterUrl,
                            bg: "bg-black",
                            icon: (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-4 h-4"
                                >
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            ),
                            label: "X",
                        },
                        {
                            href: whatsappUrl,
                            bg: "bg-[#25D366]",
                            icon: (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-4 h-4"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            ),
                            label: "WhatsApp",
                        },
                        {
                            href: telegramUrl,
                            bg: "bg-[#229ED9]",
                            icon: (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-4 h-4"
                                >
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                </svg>
                            ),
                            label: "Telegram",
                        },
                        {
                            href: facebookUrl,
                            bg: "bg-[#1877F2]",
                            icon: (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-4 h-4"
                                >
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            ),
                            label: "Facebook",
                        },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                            <div
                                className={`w-11 h-11 ${item.bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm`}
                            >
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500">
                                {item.label}
                            </span>
                        </a>
                    ))}
                    <button
                        onClick={handleDownload}
                        disabled={!imageDataUrl || capturing}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer disabled:opacity-40"
                    >
                        <div className="w-11 h-11 bg-gray-800 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                            >
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500">
                            Save
                        </span>
                    </button>
                </div>
                <div className="px-5 pb-4">
                    <div className="flex items-center gap-2 bg-subtle rounded-2xl border border-subtle px-3 py-2.5">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="w-3.5 h-3.5 text-gray-400 shrink-0"
                        >
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                        </svg>
                        <span
                            className="flex-1 text-xs text-gray-400 truncate"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {shareUrl}
                        </span>
                        <button
                            onClick={handleCopyLink}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${linkCopied ? "bg-green-500 text-white" : "btn-primary"}`}
                        >
                            {linkCopied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>
                {typeof navigator !== "undefined" && navigator.share && (
                    <div className="px-5 pb-6">
                        <button
                            onClick={handleNativeShare}
                            className="w-full py-3 rounded-2xl bg-muted text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                            >
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line
                                    x1="8.59"
                                    y1="13.51"
                                    x2="15.42"
                                    y2="17.49"
                                />
                                <line
                                    x1="15.41"
                                    y1="6.51"
                                    x2="8.59"
                                    y2="10.49"
                                />
                            </svg>
                            More options
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function IssueDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const postCardRef = useRef(null);

    const [authReady, setAuthReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userVote, setUserVote] = useState(null);
    const [voteCounts, setVoteCounts] = useState({});
    const [totalVotes, setTotalVotes] = useState(0);
    const [voteLoading, setVoteLoading] = useState(false);
    const [upvoted, setUpvoted] = useState(false);
    const [upvoteCount, setUpvoteCount] = useState(0);
    const [upvoteLoading, setUpvoteLoading] = useState(false);
    const [downvoted, setDownvoted] = useState(false);
    const [downvoteCount, setDownvoteCount] = useState(0);
    const [downvoteLoading, setDownvoteLoading] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState(null);
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [mentionQuery, setMentionQuery] = useState(null);
    const commentInputRef = useRef(null);
    const userCacheRef = useRef(null); // populated once on first @ keystroke
    const [demographicData, setDemographicData] = useState({});
    const [demographicsLoading, setDemographicsLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [showProfilePrompt, setShowProfilePrompt] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [shareImageUrl, setShareImageUrl] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const carouselTouchStart = useRef(null);

    // ── Auth + profile check ──
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
                setAuthReady(true);
                if (!user.isAnonymous) {
                    try {
                        const snap = await getDoc(doc(db, "users", user.uid));
                        if (snap.exists()) {
                            const d = snap.data();
                            setProfileComplete(
                                isProfileComplete({
                                    email: user.email || d.email,
                                    phone: d.phoneNumber || d.phone,
                                    stateOfOrigin: d.stateOfOrigin,
                                    gender: d.gender,
                                    educationLevel: d.educationLevel,
                                    institutionType: d.institutionType,
                                    campLocation: d.campLocation,
                                    religion: d.religion,
                                    bio: d.bio,
                                }),
                            );
                        }
                    } catch {
                        /* non-fatal */
                    }
                }
            } else {
                signInAnonymously(auth).catch(console.error);
            }
        });
        return unsub;
    }, []);

    // ── Issue snapshot ──
    useEffect(() => {
        if (!id) return;
        const ref = doc(db, "issues", id);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (!snap.exists()) {
                    setError("Issue not found");
                    setLoading(false);
                    return;
                }
                const d = snap.data();
                const meta = CATEGORY_META[d.category] ?? CATEGORY_META.other;
                setIssue({
                    id: snap.id,
                    ...d,
                    meta,
                    timeAgo: d.createdAt?.seconds
                        ? timeAgo(d.createdAt.seconds)
                        : "just now",
                });
                setVoteCounts(d.votes || {});
                setTotalVotes(d.totalVotes || 0);
                setUpvoteCount(d.upvotes || 0);
                setDownvoteCount(d.downvotes || 0);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError("Failed to load issue");
                setLoading(false);
            },
        );
        return unsub;
    }, [id]);

    // ── Local vote state ──
    useEffect(() => {
        if (!id || !currentUser) return;
        const v = localStorage.getItem(`vote_${id}_${currentUser.uid}`);
        if (v) setUserVote(v);
        if (localStorage.getItem(`upvote_${id}_${currentUser.uid}`) === "1")
            setUpvoted(true);
        if (localStorage.getItem(`downvote_${id}_${currentUser.uid}`) === "1")
            setDownvoted(true);
    }, [id, currentUser]);

    // ── Comments ──
    useEffect(() => {
        if (!id) return;
        setCommentsLoading(true);
        setCommentsError(null);
        const q = query(
            collection(db, "issues", id, "comments"),
            orderBy("createdAt", "asc"),
        );
        const unsub = onSnapshot(
            q,
            (snap) => {
                setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setCommentsLoading(false);
            },
            (err) => {
                console.error(err);
                setCommentsError("Failed to load comments");
                setCommentsLoading(false);
            },
        );
        return () => unsub();
    }, [id]);

    // ── Demographics ──
    useEffect(() => {
        if (
            !id ||
            !issue?.demographics?.length ||
            !issue?.voteOptions?.length ||
            !currentUser
        )
            return;
        const fetch = async () => {
            setDemographicsLoading(true);
            const demoData = {};
            issue.demographics.forEach((demo) => {
                if (DEMOGRAPHIC_CONFIG[demo]) demoData[demo] = {};
            });
            try {
                const votesSnap = await getDocs(
                    collection(db, "issues", id, "votes"),
                );
                for (const voteDoc of votesSnap.docs) {
                    const voteData = voteDoc.data();
                    const { userId, option: selectedOption } = voteData;
                    if (
                        !userId ||
                        !selectedOption ||
                        !issue.voteOptions.includes(selectedOption)
                    )
                        continue;
                    let userData = {};
                    try {
                        const s = await getDoc(doc(db, "users", userId));
                        if (!s.exists()) continue;
                        userData = s.data();
                    } catch {
                        continue;
                    }
                    issue.demographics.forEach((demo) => {
                        const config = DEMOGRAPHIC_CONFIG[demo];
                        if (!config) return;
                        const rawValue =
                            userData[config.firestoreField ?? demo];
                        if (rawValue === undefined || rawValue === null) return;
                        const group = config.getGroup
                            ? config.getGroup(rawValue)
                            : String(rawValue);
                        if (!group) return;
                        if (!demoData[demo][group]) {
                            demoData[demo][group] = {};
                            issue.voteOptions.forEach((opt) => {
                                demoData[demo][group][opt] = 0;
                            });
                        }
                        demoData[demo][group][selectedOption] =
                            (demoData[demo][group][selectedOption] || 0) + 1;
                    });
                }
                setDemographicData(demoData);
            } catch (err) {
                console.error("Demographics fetch error:", err);
            } finally {
                setDemographicsLoading(false);
            }
        };
        fetch();
    }, [
        id,
        issue?.demographics?.join(","),
        issue?.voteOptions?.join(","),
        currentUser,
    ]);

    // ─── Gate helper ──────────────────────────────────────────────────────────────
    // Returns true if user can interact; shows appropriate modal and returns false otherwise.
    const requireCompleteProfile = () => {
        if (isAnonymous || !currentUser || currentUser.isAnonymous) {
            setShowLoginPrompt(true);
            return false;
        }
        if (!profileComplete) {
            setShowProfilePrompt(true);
            return false;
        }
        return true;
    };

    // ─── Handlers ─────────────────────────────────────────────────────────────────
    const handleVote = async (option) => {
        if (!requireCompleteProfile()) return;
        if (!authReady || !currentUser || voteLoading) return;
        if (!issue.voteOptions?.includes(option)) return;

        const prev = userVote;
        const wasSameVote = prev === option;
        setVoteLoading(true);
        const newCounts = { ...voteCounts };
        if (wasSameVote) {
            newCounts[option] = Math.max(0, (newCounts[option] || 0) - 1);
            setUserVote(null);
            setTotalVotes((p) => Math.max(0, p - 1));
        } else {
            if (prev) newCounts[prev] = Math.max(0, (newCounts[prev] || 0) - 1);
            newCounts[option] = (newCounts[option] || 0) + 1;
            setUserVote(option);
            setTotalVotes((p) => (prev ? p : p + 1));
        }
        setVoteCounts(newCounts);
        try {
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(doc(db, "issues", id));
                if (!snap.exists()) throw new Error("missing");
                const d = snap.data();
                const cv = { ...(d.votes || {}) };
                let ct = d.totalVotes || 0;
                if (wasSameVote) {
                    cv[option] = Math.max(0, (cv[option] || 0) - 1);
                    ct = Math.max(0, ct - 1);
                    tx.delete(doc(db, "issues", id, "votes", currentUser.uid));
                } else {
                    if (prev) {
                        cv[prev] = Math.max(0, (cv[prev] || 0) - 1);
                    } else {
                        ct += 1;
                    }
                    cv[option] = (cv[option] || 0) + 1;
                    tx.set(doc(db, "issues", id, "votes", currentUser.uid), {
                        userId: currentUser.uid,
                        option,
                        votedAt: serverTimestamp(),
                    });
                }
                tx.update(doc(db, "issues", id), { votes: cv, totalVotes: ct });
            });
            if (!wasSameVote) {
                await awardPoints(currentUser.uid, "VOTE_ON_ISSUE", {
                    issueId: id,
                    issueTitle: issue.title,
                });
                if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                    await awardPoints(issue.author.uid, "RECEIVE_VOTE", {
                        issueId: id,
                        issueTitle: issue.title,
                    });
                    await createNotification({
                        type: NOTIFICATION_TYPES.VOTE,
                        recipientId: issue.author.uid,
                        actorId: currentUser.uid,
                        actorName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Corper",
                        issueId: id,
                        issueTitle: issue.title,
                        meta: { option },
                    });
                }
            }
            if (wasSameVote)
                localStorage.removeItem(`vote_${id}_${currentUser.uid}`);
            else localStorage.setItem(`vote_${id}_${currentUser.uid}`, option);
        } catch (err) {
            console.error("Vote failed:", err);
            setVoteCounts(voteCounts);
            setTotalVotes(totalVotes);
            setUserVote(prev);
        } finally {
            setVoteLoading(false);
        }
    };

    const handleUpvote = async (e) => {
        e.preventDefault();
        if (!requireCompleteProfile()) return;
        if (
            !authReady ||
            !currentUser ||
            upvoteLoading ||
            downvoteLoading ||
            downvoted
        )
            return;
        const wasUpvoted = upvoted;
        setUpvoted(!wasUpvoted);
        setUpvoteCount((c) => (wasUpvoted ? Math.max(0, c - 1) : c + 1));
        setUpvoteLoading(true);
        try {
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(doc(db, "issues", id));
                if (!snap.exists()) throw new Error("not found");
                const current = snap.data().upvotes || 0;
                tx.update(doc(db, "issues", id), {
                    upvotes: wasUpvoted
                        ? Math.max(0, current - 1)
                        : current + 1,
                });
            });
            if (!wasUpvoted) {
                await awardPoints(currentUser.uid, "UPVOTE_ISSUE", {
                    issueId: id,
                    issueTitle: issue.title,
                });
                if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                    await awardPoints(issue.author.uid, "RECEIVE_UPVOTE", {
                        issueId: id,
                        issueTitle: issue.title,
                    });
                    await createNotification({
                        type: NOTIFICATION_TYPES.UPVOTE,
                        recipientId: issue.author.uid,
                        actorId: currentUser.uid,
                        actorName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Corper",
                        issueId: id,
                        issueTitle: issue.title,
                    });
                }
            }
            if (wasUpvoted)
                localStorage.removeItem(`upvote_${id}_${currentUser.uid}`);
            else localStorage.setItem(`upvote_${id}_${currentUser.uid}`, "1");
        } catch (err) {
            console.error("Upvote failed:", err);
            setUpvoted(wasUpvoted);
            setUpvoteCount(upvoteCount);
        } finally {
            setUpvoteLoading(false);
        }
    };

    const handleDownvote = async (e) => {
        e.preventDefault();
        if (!requireCompleteProfile()) return;
        if (
            !authReady ||
            !currentUser ||
            downvoteLoading ||
            upvoteLoading ||
            upvoted
        )
            return;
        const wasDownvoted = downvoted;
        setDownvoted(!wasDownvoted);
        setDownvoteCount((c) => (wasDownvoted ? Math.max(0, c - 1) : c + 1));
        setDownvoteLoading(true);
        try {
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(doc(db, "issues", id));
                if (!snap.exists()) throw new Error("not found");
                const current = snap.data().downvotes || 0;
                tx.update(doc(db, "issues", id), {
                    downvotes: wasDownvoted
                        ? Math.max(0, current - 1)
                        : current + 1,
                });
            });
            if (wasDownvoted)
                localStorage.removeItem(`downvote_${id}_${currentUser.uid}`);
            else localStorage.setItem(`downvote_${id}_${currentUser.uid}`, "1");
        } catch (err) {
            console.error("Downvote failed:", err);
            setDownvoted(wasDownvoted);
            setDownvoteCount(downvoteCount);
        } finally {
            setDownvoteLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!requireCompleteProfile()) return;
        if (!commentText.trim() || !authReady || submittingComment) return;

        const tempId = `temp-${Date.now()}`;
        const tempComment = {
            id: tempId,
            text: commentText.trim(),
            userName: "Anonymous",
            userId: currentUser?.uid ?? "anon",
            parentId: null,
            replyingTo: null,
            createdAt: { seconds: Math.floor(Date.now() / 1000) },
            likes: 0,
            _pending: true,
        };
        setComments((prev) => [...prev, tempComment]);
        const originalText = commentText;
        setCommentText("");
        setSubmittingComment(true);
        try {
            const issueRef = doc(db, "issues", id);
            let newCommentRef;
            await runTransaction(db, async (transaction) => {
                const issueSnap = await transaction.get(issueRef);
                const currentCount = issueSnap.data()?.commentCount || 0;
                newCommentRef = doc(collection(db, "issues", id, "comments"));
                transaction.set(newCommentRef, {
                    text: originalText.trim(),
                    userName: "Anonymous",
                    userId: currentUser?.uid ?? "anon",
                    parentId: null,
                    replyingTo: null,
                    createdAt: serverTimestamp(),
                    likes: 0,
                });
                transaction.update(issueRef, {
                    commentCount: currentCount + 1,
                });
            });
            await awardPoints(currentUser.uid, "COMMENT_ON_ISSUE", {
                issueId: id,
                issueTitle: issue.title,
            });
            if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                await awardPoints(issue.author.uid, "RECEIVE_COMMENT", {
                    issueId: id,
                    issueTitle: issue.title,
                });
                await createNotification({
                    type: NOTIFICATION_TYPES.COMMENT,
                    recipientId: issue.author.uid,
                    actorId: currentUser.uid,
                    actorName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Corper",
                    actorPhotoURL: currentUser?.photoURL || null,
                    issueId: id,
                    issueTitle: issue.title,
                    commentId: newCommentRef.id,
                    commentPreview: originalText.trim(),
                });
            }
            // Notify @mentioned users
            const cache = userCacheRef.current || [];
            if (cache.length > 0) {
                const notified = new Set([currentUser.uid, issue.author?.uid].filter(Boolean));
                for (const u of cache) {
                    if (!notified.has(u.uid) && originalText.includes("@" + u.name)) {
                        notified.add(u.uid);
                        createNotification({
                            type: NOTIFICATION_TYPES.MENTION,
                            recipientId: u.uid,
                            actorId: currentUser.uid,
                            actorName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Corper",
                            actorPhotoURL: currentUser?.photoURL || null,
                            issueId: id,
                            issueTitle: issue.title,
                            commentId: newCommentRef.id,
                            commentPreview: originalText.trim(),
                        }).catch(() => {});
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setComments((prev) => prev.filter((c) => c.id !== tempId));
            setCommentText(originalText);
            setCommentsError("Failed to post comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    // ── @Mention handling ──
    const handleCommentChange = async (val) => {
        setCommentText(val);
        const el = commentInputRef.current;
        const caret = el ? el.selectionStart : val.length;
        const before = val.slice(0, caret);
        const match = before.match(/@(\S*)$/);
        if (!match) { setMentionQuery(null); setMentionSuggestions([]); return; }
        const q = match[1];
        setMentionQuery(q);
        if (!userCacheRef.current) {
            try {
                const snap = await getDocs(query(collection(db, 'users'), limit(40)));
                userCacheRef.current = snap.docs
                    .map((d) => ({ uid: d.id, name: d.data().displayName || d.data().name || '', photoURL: d.data().photoURL || null }))
                    .filter((u) => u.name);
            } catch { userCacheRef.current = []; }
        }
        const lq = q.toLowerCase();
        setMentionSuggestions((userCacheRef.current || []).filter((u) => u.name.toLowerCase().includes(lq)).slice(0, 5));
    };

    const insertMention = (user) => {
        const el = commentInputRef.current;
        const caret = el ? el.selectionStart : commentText.length;
        const beforeCaret = commentText.slice(0, caret).replace(/@(\S*)$/, '@' + user.name + ' ');
        const afterCaret = commentText.slice(caret);
        const next = beforeCaret + afterCaret;
        setCommentText(next);
        setMentionQuery(null);
        setMentionSuggestions([]);
        requestAnimationFrame(() => {
            if (commentInputRef.current) {
                commentInputRef.current.focus();
                commentInputRef.current.setSelectionRange(beforeCaret.length, beforeCaret.length);
            }
        });
    };

    // ── Capture & Share ──
    const captureAndShare = async () => {
        setShowShareModal(true);
        setShareImageUrl(null);
        setCapturing(true);
        try {
            if (!postCardRef.current) throw new Error("No ref");
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(postCardRef.current, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: "#ffffff",
                logging: false,
                ignoreElements: (el) => el.hasAttribute("data-share-ignore"),
            });
            setShareImageUrl(canvas.toDataURL("image/png"));
        } catch (err) {
            console.error("Capture failed:", err);
        } finally {
            setCapturing(false);
        }
    };

    const topLevel = useMemo(
        () => [...comments.filter((c) => !c.parentId)].reverse(),
        [comments],
    );

    if (loading) return <LoadingScreen />;
    if (error || !issue) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center px-4">
                <div className="text-center bg-card rounded-2xl border border-subtle p-8 max-w-sm w-full shadow-sm">
                    <div className="text-cp mb-4 flex justify-center">
                        <SvgSearch />
                    </div>
                    <h1
                        className="text-xl font-bold text-gray-900 mb-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Post Not Found
                    </h1>
                    <p className="text-gray-500 mb-6 text-sm">
                        {error || "This post may have been removed."}
                    </p>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 bg-cp text-white px-6 py-3 rounded-xl font-semibold  transition-colors"
                    >
                        <SvgBack /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const meta = issue.meta;
    const voteOptions = issue.voteOptions || [];
    const hasVoted = userVote !== null;
    const avatarCount = getAvatarCount(totalVotes);
    const isPollClosed = (() => {
        if (!issue?.pollTimerEnabled || !issue?.pollDeadline) return false;
        const deadline = issue.pollDeadline?.toDate
            ? issue.pollDeadline.toDate()
            : new Date(issue.pollDeadline);
        return Date.now() > deadline.getTime();
    })();
    const authorName = issue.author?.isAnonymous
        ? "👤 Anonymous"
        : issue.author?.name || issue.author?.displayName || null;

    // Banner shown above voting when profile is incomplete
    const showProfileBanner = !isAnonymous && currentUser && !profileComplete;

    return (
        <div className="min-h-screen bg-page pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-cp px-4 pt-6 md:pt-4 pb-3">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors text-white cursor-pointer"
                        >
                            <SvgBack />
                        </button>
                        <div>
                            <h1
                                className="text-white font-bold text-base leading-tight"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Post Details
                            </h1>
                            <p
                                className="text-white/80 text-xs"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {meta.label}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-1.5 px-3 h-9 bg-red-500/80 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                            aria-label="Report post"
                            title="Report this post"
                        >
                            🚩 <span>Report</span>
                        </button>
                        <button
                            onClick={captureAndShare}
                            className="w-9 h-9 bg-white/20 text-white hover:bg-white/30 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                            aria-label="Share post"
                        >
                            <SvgShare />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
                {/* Issue card */}
                <div
                    ref={postCardRef}
                    className="bg-card rounded-2xl border border-cp-border overflow-hidden shadow-sm"
                >
                    {/* ── Title block ── */}
                    <div className="px-4 pt-4 pb-4">
                        {authorName && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
                                <SvgUser />
                                <span style={{ fontFamily: "DM Sans, sans-serif" }}>{authorName}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                                <CategoryIcon category={issue.category} />
                                {meta.label}
                            </span>
                            <StatusBadge status={issue.status} />
                        </div>
                        <h1
                            className="text-xl font-bold text-gray-900 leading-tight mb-3"
                            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        >
                            {issue.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><SvgLocation />{issue.location}</span>
                            <span className="flex items-center gap-1"><SvgClock />{issue.timeAgo}</span>
                            <DeadlineTimer deadline={issue.pollDeadline} enabled={issue.pollTimerEnabled} />
                            {issue.locationTag?.label && (
                                <a
                                    href={issue.locationTag.lat
                                        ? `https://maps.google.com/?q=${issue.locationTag.lat},${issue.locationTag.lng}`
                                        : `https://maps.google.com/?q=${encodeURIComponent(issue.locationTag.label)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    📍 {issue.locationTag.label}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* ── Image carousel ── */}
                    {issue.images?.length > 0 && (
                        <div className="border-t border-subtle">
                            <div
                                className="relative overflow-hidden bg-black select-none"
                                style={{ aspectRatio: "16/9" }}
                                onTouchStart={(e) => { carouselTouchStart.current = e.touches[0].clientX; }}
                                onTouchEnd={(e) => {
                                    const diff = carouselTouchStart.current - e.changedTouches[0].clientX;
                                    if (Math.abs(diff) > 40) {
                                        if (diff > 0) setCarouselIdx(i => Math.min(i + 1, issue.images.length - 1));
                                        else setCarouselIdx(i => Math.max(i - 1, 0));
                                    }
                                }}
                            >
                                {/* Slides */}
                                <div
                                    className="flex h-full transition-transform duration-300 ease-out"
                                    style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
                                >
                                    {issue.images.map((img, i) => (
                                        <div
                                            key={i}
                                            className="relative shrink-0 w-full h-full cursor-zoom-in"
                                            onClick={() => { setCarouselIdx(i); setLightboxOpen(true); }}
                                        >
                                            <Image
                                                src={cloudinaryOpt(img)}
                                                alt={`Image ${i + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 800px"
                                                className="object-contain"
                                                priority={i === 0}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Arrows (only if multiple) */}
                                {issue.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCarouselIdx(i => Math.max(i - 1, 0))}
                                            disabled={carouselIdx === 0}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/70 transition-all cursor-pointer"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
                                        </button>
                                        <button
                                            onClick={() => setCarouselIdx(i => Math.min(i + 1, issue.images.length - 1))}
                                            disabled={carouselIdx === issue.images.length - 1}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/70 transition-all cursor-pointer"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </>
                                )}

                                {/* Expand hint */}
                                <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    Tap to expand
                                </div>

                                {/* Dot indicators */}
                                {issue.images.length > 1 && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {issue.images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCarouselIdx(i)}
                                                className="rounded-full transition-all cursor-pointer"
                                                style={{
                                                    width: i === carouselIdx ? 16 : 6,
                                                    height: 6,
                                                    background: i === carouselIdx ? "white" : "rgba(255,255,255,0.45)",
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Description ── */}
                    <div className="px-4 py-4 border-t border-subtle">
                        <p
                            className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {issue.description}
                        </p>
                    </div>

                    {/* ── Lightbox ── */}
                    {lightboxOpen && issue.images?.length > 0 && (
                        <div
                            className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center no-theme-transition"
                            onClick={() => setLightboxOpen(false)}
                        >
                            {/* Close */}
                            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 cursor-pointer z-10">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>

                            {/* Counter */}
                            {issue.images.length > 1 && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full">
                                    {carouselIdx + 1} / {issue.images.length}
                                </div>
                            )}

                            {/* Image */}
                            <div
                                className="relative w-full h-full max-w-5xl mx-auto px-12 flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Image
                                    src={cloudinaryOpt(issue.images[carouselIdx], "f_auto,q_auto,w_1600")}
                                    alt={`Image ${carouselIdx + 1}`}
                                    fill
                                    sizes="100vw"
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {/* Prev/Next in lightbox */}
                            {issue.images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCarouselIdx(i => Math.max(i - 1, 0)); }}
                                        disabled={carouselIdx === 0}
                                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-20 hover:bg-white/20 transition-all cursor-pointer"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCarouselIdx(i => Math.min(i + 1, issue.images.length - 1)); }}
                                        disabled={carouselIdx === issue.images.length - 1}
                                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-20 hover:bg-white/20 transition-all cursor-pointer"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><polyline points="9 18 15 12 9 6"/></svg>
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="px-4 py-3 bg-subtle/80 flex flex-wrap items-center justify-between gap-y-2">
                        <div className="flex items-center gap-4 flex-wrap">
                            {[
                                {
                                    val: upvoteCount,
                                    label: "Like",
                                    color: "text-green-600",
                                },
                                {
                                    val: downvoteCount,
                                    label: "Dislike",
                                    color: "text-red-500",
                                },
                                {
                                    val: totalVotes,
                                    label: "Votes",
                                    color: "text-cp",
                                },
                                {
                                    val: comments.length,
                                    label: "Comments",
                                    color: "text-gray-800",
                                },
                            ].map((item) => (
                                <div key={item.label} className="text-center">
                                    <div
                                        className={`text-lg font-bold ${item.color}`}
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        {formatNumber(item.val)}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {avatarCount > 0 && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {AVATAR_LETTERS.slice(0, avatarCount).map(
                                        (l, i) => (
                                            <div
                                                key={i}
                                                className={`w-7 h-7 rounded-full ${AVATAR_COLORS[i]} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}
                                            >
                                                {l}
                                            </div>
                                        ),
                                    )}
                                </div>
                                <span className="text-xs text-gray-400">
                                    {totalVotes} voted
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action row */}
                    <div
                        data-share-ignore
                        className="px-4 py-3 border-t border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2"
                    >
                        <p className="hidden sm:block text-xs text-gray-400 shrink-0">
                            React to this post
                        </p>
                        <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={captureAndShare}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer flex-1 sm:flex-none border-theme bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4 shrink-0"
                                >
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line
                                        x1="8.59"
                                        y1="13.51"
                                        x2="15.42"
                                        y2="17.49"
                                    />
                                    <line
                                        x1="15.41"
                                        y1="6.51"
                                        x2="8.59"
                                        y2="10.49"
                                    />
                                </svg>
                                Share
                            </button>
                            <button
                                onClick={handleDownvote}
                                disabled={
                                    !authReady || downvoteLoading || upvoted
                                }
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 flex-1 sm:flex-none ${downvoted ? "border-red-500 bg-red-50 text-red-700" : "border-red-200 bg-white text-red-500 hover:border-red-400 hover:bg-red-50"}`}
                            >
                                {downvoteLoading ? (
                                    <SvgSpinner />
                                ) : (
                                    <SvgDownvote active={downvoted} />
                                )}
                                {downvoted ? "Disliked" : "Dislike"}{" "}
                                <span className="font-bold">
                                    {formatNumber(downvoteCount)}
                                </span>
                            </button>
                            <button
                                onClick={handleUpvote}
                                disabled={
                                    !authReady || upvoteLoading || downvoted
                                }
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 flex-1 sm:flex-none ${upvoted ? "border-green-500 bg-green-50 text-green-700" : "border-green-200 bg-white text-green-600 hover:border-green-400 hover:bg-green-50"}`}
                            >
                                {upvoteLoading ? (
                                    <SvgSpinner />
                                ) : (
                                    <SvgUpvote active={upvoted} />
                                )}
                                {upvoted ? "Liked" : "Like"}{" "}
                                <span className="font-bold">
                                    {formatNumber(upvoteCount)}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile complete banner (above voting) */}
                {showProfileBanner && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-cp-tint border border-theme rounded-2xl">
                        <span className="text-xl">🔒</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-cp">
                                Complete your profile to vote
                            </p>
                            <p className="text-xs text-cp">
                                Voting and reacting require a complete profile
                            </p>
                        </div>
                        <Link
                            href="/profile/edit"
                            className="shrink-0 text-xs font-bold text-white bg-cp-deeper  px-3 py-2 rounded-xl transition-colors"
                        >
                            Complete →
                        </Link>
                    </div>
                )}

                {/* Voting section */}
                <div className="bg-card rounded-2xl border border-subtle p-4 shadow-sm">
                    <h2
                        className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        <SvgVote />
                        Cast Your Vote
                        {isPollClosed && (
                            <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full ml-auto flex items-center gap-1">
                                ⏱️ Voting closed
                            </span>
                        )}
                        {!isPollClosed && hasVoted && (
                            <span className="text-xs font-normal text-green-600 ml-auto flex items-center gap-1">
                                <SvgCheckCircle /> Voted
                            </span>
                        )}
                    </h2>
                    <div className="space-y-2.5">
                        {voteOptions.map((option, idx) => {
                            const count = voteCounts[option] || 0;
                            const pct =
                                totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                            const sel = userVote === option;
                            return (
                                <button
                                    key={option}
                                    onClick={() =>
                                        !isPollClosed && handleVote(option)
                                    }
                                    disabled={
                                        !authReady ||
                                        voteLoading ||
                                        isPollClosed
                                    }
                                    className={`w-full relative overflow-hidden rounded-xl border-2 transition-all duration-200 text-left ${isPollClosed ? "cursor-not-allowed opacity-75 border-subtle" : "cursor-pointer disabled:opacity-60"} ${sel && !isPollClosed ? "border-cp bg-cp-tint" : "border-subtle hover:border-cp/30"}`}
                                >
                                    <div
                                        className={`absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-700 ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                    <div className="relative px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${sel ? "border-cp bg-cp" : "border-gray-300"}`}
                                            >
                                                {sel && <SvgCheckFill />}
                                            </div>
                                            <span
                                                className={`font-semibold text-sm ${sel ? "text-cp" : "text-gray-700"}`}
                                            >
                                                {option}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="block text-sm font-bold text-gray-900">
                                                {formatNumber(count)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {pct.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {isPollClosed && (
                            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
                                <span className="text-sm">🔒</span>
                                <span
                                    className="text-xs font-semibold text-red-600"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    This poll has closed. Results are final —
                                    but you can still comment below.
                                </span>
                            </div>
                        )}
                    </div>
                    {voteLoading && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <SvgSpinner /> Saving your vote...
                        </div>
                    )}
                </div>

                {/* Demographics */}
                {issue.demographics?.length > 0 && (
                    <DemographicInsights
                        issue={issue}
                        demographicData={demographicData}
                        demographicsLoading={demographicsLoading}
                        totalVotes={totalVotes}
                    />
                )}

                {/* Discussion */}
                <div className="bg-card rounded-2xl border border-subtle shadow-sm">
                    <div className="px-4 pt-4 pb-3 border-b border-subtle flex items-center justify-between">
                        <h2
                            className="text-sm font-bold text-gray-900 flex items-center gap-2"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            <SvgDiscussion />
                            Discussion
                        </h2>
                        <span className="text-xs font-bold text-gray-400 bg-muted px-2.5 py-1 rounded-full flex items-center gap-1">
                            <SvgComments className="w-3 h-3" />
                            {comments.length}
                        </span>
                    </div>

                    <form
                        onSubmit={handleSubmitComment}
                        className="px-4 py-3 border-b border-subtle"
                    >
                        {/* @mention dropdown — sits outside overflow containers */}
                        {mentionSuggestions.length > 0 && (
                            <div className="mx-0 mb-2 bg-white border border-subtle rounded-xl shadow-xl overflow-hidden">
                                {mentionSuggestions.map((u) => (
                                    <button
                                        key={u.uid}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left cursor-pointer border-b border-subtle last:border-0"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {u.photoURL
                                                ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                : <span className="text-xs font-bold text-gray-600">{u.name?.charAt(0)?.toUpperCase() || "?"}</span>
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                                            <p className="text-xs text-gray-400">Tap to mention</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2.5 items-start">
                            <Avatar name="A" size="md" />
                            <div className="flex-1 bg-subtle rounded-2xl border border-subtle overflow-hidden focus-within:border-cp/50 focus-within:ring-2 focus-within:ring-gray-200 transition-all">
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => handleCommentChange(e.target.value)}
                                    placeholder="Share your thoughts… (@ to mention)"
                                    maxLength={280}
                                    disabled={!authReady || submittingComment}
                                    className="w-full px-4 py-3 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                />
                                {commentText.length > 0 && (
                                    <div className="flex items-center justify-between px-4 pb-2.5">
                                        <span className="text-xs text-gray-400">
                                            {commentText.length}/280
                                        </span>
                                        <button
                                            type="submit"
                                            disabled={
                                                !commentText.trim() ||
                                                !authReady ||
                                                submittingComment
                                            }
                                            className="flex items-center gap-1.5 text-xs font-bold bg-cp text-white px-3 py-1.5 rounded-xl  disabled:opacity-40 transition-colors cursor-pointer"
                                        >
                                            {submittingComment ? (
                                                <SvgSpinner />
                                            ) : (
                                                <SvgSend />
                                            )}{" "}
                                            Post
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>

                    {commentsLoading && (
                        <div className="px-4 py-8 text-center">
                            <SvgSpinner />
                            <p className="text-xs text-gray-400 mt-2">
                                Loading comments...
                            </p>
                        </div>
                    )}

                    {!commentsLoading && !commentsError && (
                        <div className="px-4 divide-y divide-subtle">
                            {topLevel.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="flex justify-center mb-3">
                                        <SvgBubbleEmpty />
                                    </div>
                                    <p className="text-gray-400 text-sm font-semibold">
                                        No comments yet
                                    </p>
                                    <p className="text-gray-300 text-xs mt-1">
                                        Be the first to share your thoughts
                                    </p>
                                </div>
                            ) : (
                                topLevel.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`py-4 first:pt-3 last:pb-3 ${comment._pending ? "opacity-60" : ""}`}
                                    >
                                        <CommentItem
                                            comment={comment}
                                            allComments={comments}
                                            depth={0}
                                            issueId={id}
                                            issueTitle={issue.title}
                                            issueOwnerId={issue.userId}
                                            currentUser={currentUser}
                                            authReady={authReady}
                                            isAnonymous={isAnonymous}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {commentsError && !commentsLoading && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-red-400 text-sm">
                                {commentsError}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-2 text-xs text-cp hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom CTAs */}
                <div className="flex gap-3">
                    <Link
                        href="/"
                        className="flex-1 bg-white border border-theme text-gray-700 py-3 rounded-xl font-semibold text-sm text-center hover:border-cp/40 hover:text-cp transition-all"
                    >
                        Browse Posts
                    </Link>
                    <Link
                        href="/create-issue"
                        className="flex-1 bg-cp text-white py-3 rounded-xl font-semibold text-sm text-center  transition-all shadow-sm"
                    >
                        Post to Camp
                    </Link>
                </div>
            </div>

            {/* Modals */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                imageDataUrl={shareImageUrl}
                capturing={capturing}
                issue={issue}
            />
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                onLogin={() => {
                    window.location.href = "/login";
                }}
            />
            <IncompleteProfileModal
                isOpen={showProfilePrompt}
                onClose={() => setShowProfilePrompt(false)}
            />
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                issueId={id}
                issueTitle={issue?.title}
                currentUser={currentUser}
            />
        </div>
    );
}
