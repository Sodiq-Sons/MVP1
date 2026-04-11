// app/issue/[id]/page.js
"use client";

import { useState, useEffect, use, useMemo } from "react";
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
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { awardPoints } from "@/lib/gamification";

// ─── Category Meta ────────
const CATEGORY_META = {
    infrastructure: {
        color: "text-orange-700",
        bg: "bg-orange-50",
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
    other: { color: "text-gray-700", bg: "bg-gray-100", label: "Other" },
};

// ─── Updated Demographic Config ───
// NOW INCLUDES: age (raw number), gender, stateOfOrigin, platoon
const DEMOGRAPHIC_CONFIG = {
    age: {
        emoji: "🎂",
        label: "Age Groups",
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
        label: "State of Origin",
        firestoreField: "stateOfOrigin",
        groups: [], // Dynamic based on actual states
        getGroup: (val) => (val && typeof val === "string" ? val : null),
    },
    platoon: {
        emoji: "👥",
        label: "Platoon",
        firestoreField: "platoon",
        groups: [], // Dynamic based on actual platoons
        getGroup: (val) => (val && typeof val === "string" ? val : null),
    },
};

// ─── Chart Colors ─────────
const CHART_COLORS = [
    "#F97316",
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
];

// ─── Helpers ──────────────
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

function formatNumber(n) {
    if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
    return String(n);
}

function getAvatarCount(n) {
    if (n <= 0) return 0;
    return Math.min(n, 4);
}

const AVATAR_LETTERS = ["A", "B", "C", "D"];
const AVATAR_COLORS = [
    "bg-orange-400",
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

// ─── SVG Icons ────────────
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
        fill={active ? "#F97316" : "none"}
        stroke={active ? "#F97316" : "currentColor"}
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
const SvgChart = () => (
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

// ─── Category Icons ───────
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

// ─── Status Badge ─────────
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
            cls: "bg-orange-50 text-orange-600 border-orange-100",
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

// ─── Avatar ───────────────
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

// ─── Demographic Chart Card ───────────────────────────────────────────────────
function DemographicChart({ demographic, data, voteOptions }) {
    const config = DEMOGRAPHIC_CONFIG[demographic];
    if (!config) return null;

    // Get all unique groups that have data
    const allGroups = Object.keys(data || {}).filter((group) =>
        voteOptions.some((opt) => (data?.[group]?.[opt] || 0) > 0),
    );

    // If no groups have data, check if we should show dynamic groups
    const activeGroups = allGroups.length > 0 ? allGroups : config.groups;

    if (activeGroups.length === 0) {
        return (
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{config.emoji}</span>
                    <span className="text-xs font-bold text-gray-700">
                        {config.label}
                    </span>
                </div>
                <p className="text-[11px] text-gray-400 pl-6">
                    No demographic data yet
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{config.emoji}</span>
                    <span className="text-xs font-bold text-gray-800">
                        {config.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {voteOptions.map((opt, i) => (
                        <div key={opt} className="flex items-center gap-1">
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                    backgroundColor:
                                        CHART_COLORS[i % CHART_COLORS.length],
                                }}
                            />
                            <span className="text-[10px] text-gray-500 font-medium max-w-14 truncate">
                                {opt}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-4 py-3 space-y-3">
                {activeGroups.map((group) => {
                    const groupTotal = voteOptions.reduce(
                        (sum, opt) => sum + (data?.[group]?.[opt] || 0),
                        0,
                    );

                    if (groupTotal === 0) return null;

                    return (
                        <div key={group}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-gray-600 truncate max-w-35">
                                    {group}
                                </span>
                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                    {groupTotal} vote
                                    {groupTotal !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="h-6 w-full bg-gray-100 rounded-lg overflow-hidden flex">
                                {voteOptions.map((opt, i) => {
                                    const count = data?.[group]?.[opt] || 0;
                                    const pct =
                                        groupTotal > 0
                                            ? (count / groupTotal) * 100
                                            : 0;
                                    if (pct === 0) return null;
                                    return (
                                        <div
                                            key={opt}
                                            title={`${opt}: ${count} (${pct.toFixed(1)}%)`}
                                            className="h-full relative flex items-center justify-center transition-all duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor:
                                                    CHART_COLORS[
                                                        i % CHART_COLORS.length
                                                    ],
                                            }}
                                        >
                                            {pct >= 14 && (
                                                <span className="text-white text-[9px] font-bold pointer-events-none select-none">
                                                    {Math.round(pct)}%
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Reply Form ───────────
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

            // Send notification to the user being replied to
            if (replyingToUserId && replyingToUserId !== currentUser?.uid) {
                await createNotification({
                    type: NOTIFICATION_TYPES.REPLY,
                    recipientId: replyingToUserId,
                    actorId: currentUser?.uid || "anon",
                    actorName: "Anonymous",
                    issueId,
                    issueTitle,
                    commentId: newReplyRef.id,
                    commentPreview: text.trim(),
                });
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
            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 focus-within:border-[#F97316]/50 focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all overflow-hidden">
                <div className="px-3 pt-2.5">
                    <span className="text-xs font-bold text-[#F97316]">
                        @{replyingTo}{" "}
                    </span>
                    <input
                        autoFocus
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        placeholder="Write a reply..."
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
                            className="flex items-center gap-1.5 text-xs font-bold bg-[#F97316] text-white px-3 py-1.5 rounded-xl hover:bg-[#C2410C] disabled:opacity-40 transition-colors cursor-pointer"
                        >
                            {saving ? <SvgSpinner /> : <SvgSend />} Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Comment Item ─────────
function CommentItem({
    comment,
    allComments,
    depth = 0,
    issueId,
    issueTitle,
    issueOwnerId,
    currentUser,
    authReady,
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

            // Send notification when liking a comment (only on like, not unlike)
            if (
                newLiked &&
                comment.userId &&
                comment.userId !== currentUser?.uid
            ) {
                await createNotification({
                    type: NOTIFICATION_TYPES.LIKE_COMMENT,
                    recipientId: comment.userId,
                    actorId: currentUser?.uid || "anon",
                    actorName: "Anonymous",
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
                        <div className="w-0.5 bg-gray-100 flex-1 min-h-5 mt-1.5 rounded-full" />
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
                                <span className="text-[#F97316] font-semibold">
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
                            <span className="font-bold text-[#F97316] mr-1">
                                @{comment.replyingTo}
                            </span>
                        )}
                        {comment.text}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={toggleLike}
                            className={`flex items-center gap-1 transition-colors cursor-pointer group ${liked ? "text-[#F97316]" : "text-gray-400 hover:text-[#F97316]"}`}
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
                        {authReady && (
                            <button
                                onClick={() => setReplying((r) => !r)}
                                className="flex items-center gap-1 text-gray-400 hover:text-[#F97316] transition-colors cursor-pointer text-xs font-semibold"
                            >
                                <SvgReply /> Reply
                            </button>
                        )}
                        {hasReplies && (
                            <button
                                onClick={() => setShowReplies((s) => !s)}
                                className="flex items-center gap-1 text-xs font-bold text-[#F97316] hover:text-orange-600 transition-colors cursor-pointer ml-auto"
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
                <div className="ml-9 mt-3 pl-3 border-l-2 border-gray-100 space-y-4">
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Loading Screen ───────
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-[#FED7AA] p-8 flex flex-col items-center gap-4 max-w-sm w-full shadow-sm">
                <div className="relative">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-[#F97316]">
                        <SvgDocument />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 bg-orange-300/20 rounded-full animate-ping" />
                </div>
                <div className="text-center">
                    <h2
                        className="text-lg font-bold text-gray-900 mb-1"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Loading Issue
                    </h2>
                    <p
                        className="text-sm text-gray-400"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Fetching details from the community...
                    </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#F97316] h-full rounded-full animate-pulse w-2/3" />
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────
export default function IssueDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [authReady, setAuthReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
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
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [copied, setCopied] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState(null);
    const [demographicData, setDemographicData] = useState({});
    const [demographicsLoading, setDemographicsLoading] = useState(false);

    // ── Auth ──────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setAuthReady(true);
            } else signInAnonymously(auth).catch(console.error);
        });
        return unsub;
    }, []);

    // ── Issue Snapshot ────
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

    // ── Restore local vote/upvote ─────────────────────────────────────────────
    useEffect(() => {
        if (!id || !currentUser) return;
        const v = localStorage.getItem(`vote_${id}_${currentUser.uid}`);
        if (v) setUserVote(v);
        if (localStorage.getItem(`upvote_${id}_${currentUser.uid}`) === "1")
            setUpvoted(true);
    }, [id, currentUser]);

    // ── Comments Snapshot ─
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
                console.error("Comments error:", err);
                setCommentsError("Failed to load comments");
                setCommentsLoading(false);
            },
        );
        return () => unsub();
    }, [id]);

    // ── Demographics Fetch ────────────────────────────────────────────────────
    useEffect(() => {
        if (
            !id ||
            !issue?.demographics?.length ||
            !issue?.voteOptions?.length ||
            !currentUser
        )
            return;

        const fetchDemographicData = async () => {
            setDemographicsLoading(true);

            // Build empty structure
            const demoData = {};
            issue.demographics.forEach((demo) => {
                const config = DEMOGRAPHIC_CONFIG[demo];
                if (!config) return;
                demoData[demo] = {};
                // Initialize with empty groups - will be populated dynamically
            });

            try {
                const votesSnap = await getDocs(
                    collection(db, "issues", id, "votes"),
                );

                for (const voteDoc of votesSnap.docs) {
                    const voteData = voteDoc.data();
                    const userId = voteData.userId;
                    const selectedOption = voteData.option;

                    if (!userId || !selectedOption) continue;
                    if (!issue.voteOptions.includes(selectedOption)) continue;

                    // Fetch real user data from Firestore users collection
                    let userData = {};
                    try {
                        const userSnap = await getDoc(doc(db, "users", userId));
                        if (!userSnap.exists()) {
                            console.log(`User ${userId} not found`);
                            continue;
                        }
                        userData = userSnap.data();
                    } catch (err) {
                        console.error(`Error fetching user ${userId}:`, err);
                        continue;
                    }

                    issue.demographics.forEach((demo) => {
                        const config = DEMOGRAPHIC_CONFIG[demo];
                        if (!config) return;

                        const rawValue =
                            userData[config.firestoreField ?? demo];
                        if (rawValue === undefined || rawValue === null) {
                            console.log(`Missing ${demo} for user ${userId}`);
                            return;
                        }

                        const group = config.getGroup
                            ? config.getGroup(rawValue)
                            : String(rawValue);

                        if (!group) {
                            console.log(`Invalid group ${group} for ${demo}`);
                            return;
                        }

                        // Initialize group if not exists
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
                console.log("Demographics loaded:", demoData);
            } catch (err) {
                console.error("Demographics fetch error:", err);
            } finally {
                setDemographicsLoading(false);
            }
        };

        fetchDemographicData();
    }, [
        id,
        issue?.demographics?.join(","),
        issue?.voteOptions?.join(","),
        currentUser,
    ]);

    // ── Vote Handler ──────
    const handleVote = async (option) => {
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

            // Points & notifications (only on new vote, not unvote)
            if (!wasSameVote) {
                // Voter gets points for engaging
                await awardPoints(currentUser.uid, "VOTE_ON_ISSUE", {
                    issueId: id,
                    issueTitle: issue.title,
                });

                // Issue author gets points for receiving a vote
                if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                    await awardPoints(issue.author.uid, "RECEIVE_VOTE", {
                        issueId: id,
                        issueTitle: issue.title,
                    });
                }

                // Notify issue owner
                if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.VOTE,
                        recipientId: issue.author.uid,
                        actorId: currentUser.uid,
                        actorName: "Anonymous",
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

    // ── Upvote Handler ────
    const handleUpvote = async (e) => {
        e.preventDefault();
        if (!authReady || !currentUser || upvoteLoading) return;
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

            // Points & notifications (only on upvote, not un-upvote)
            if (!wasUpvoted) {
                // Upvoter gets points for engaging
                await awardPoints(currentUser.uid, "UPVOTE_ISSUE", {
                    issueId: id,
                    issueTitle: issue.title,
                });

                // Issue author gets points for receiving an upvote
                if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                    await awardPoints(issue.author.uid, "RECEIVE_UPVOTE", {
                        issueId: id,
                        issueTitle: issue.title,
                    });
                }

                // Notify issue owner
                if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.UPVOTE,
                        recipientId: issue.author.uid,
                        actorId: currentUser.uid,
                        actorName: "Anonymous",
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

    // ── Comment Submit ────
    const handleSubmitComment = async (e) => {
        e.preventDefault();
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

            // Commenter gets points for engaging
            await awardPoints(currentUser.uid, "COMMENT_ON_ISSUE", {
                issueId: id,
                issueTitle: issue.title,
            });

            // Issue author gets points for receiving a comment
            if (issue.author?.uid && issue.author.uid !== currentUser.uid) {
                await awardPoints(issue.author.uid, "RECEIVE_COMMENT", {
                    issueId: id,
                    issueTitle: issue.title,
                });

                // Notify issue owner
                await createNotification({
                    type: NOTIFICATION_TYPES.COMMENT,
                    recipientId: issue.author.uid,
                    actorId: currentUser.uid,
                    actorName: "Anonymous",
                    issueId: id,
                    issueTitle: issue.title,
                    commentId: newCommentRef.id,
                    commentPreview: originalText.trim(),
                });
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

    // ── Share ─────────────
    const handleShare = async () => {
        try {
            const shareText = `We want to get your opinion on "${issue?.title || "this post"}"\n\n${window.location.href}`;
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const topLevel = useMemo(
        () => [...comments.filter((c) => !c.parentId)].reverse(),
        [comments],
    );

    // ── Guards ────────────
    if (loading) return <LoadingScreen />;
    if (error || !issue) {
        return (
            <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
                <div className="text-center bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full shadow-sm">
                    <div className="text-[#F97316] mb-4 flex justify-center">
                        <SvgSearch />
                    </div>
                    <h1
                        className="text-xl font-bold text-gray-900 mb-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Issue Not Found
                    </h1>
                    <p className="text-gray-500 mb-6 text-sm">
                        {error || "This issue may have been removed."}
                    </p>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 bg-[#F97316] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#C2410C] transition-colors"
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

    return (
        <div className="min-h-screen bg-[#FDF6EF] pb-24">
            {/* ── Header ── */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-6 md:pt-4 pb-3">
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
                                Issue Details
                            </h1>
                            <p
                                className="text-orange-100 text-xs"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {meta.label}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleShare}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${copied ? "bg-green-500 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}
                    >
                        {copied ? <SvgCheckCircle /> : <SvgShare />}
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
                {/* ── Issue Card ── */}
                <div className="bg-white rounded-2xl border border-[#FED7AA] overflow-hidden shadow-sm">
                    <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}
                            >
                                <CategoryIcon category={issue.category} />
                                {meta.label}
                            </span>
                            <StatusBadge status={issue.status} />
                        </div>
                        <h1
                            className="text-xl font-bold text-gray-900 leading-tight mb-2"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {issue.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <SvgLocation />
                                {issue.location}
                            </span>
                            <span className="flex items-center gap-1">
                                <SvgClock />
                                {issue.timeAgo}
                            </span>
                        </div>
                    </div>

                    <div className="px-4 py-4">
                        <p
                            className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {issue.description}
                        </p>
                    </div>

                    <div className="px-4 py-3 bg-gray-50/80 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="text-center">
                                <div
                                    className="text-lg font-bold text-green-600"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    {formatNumber(upvoteCount)}
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                    Upvotes
                                </div>
                            </div>
                            <div className="text-center">
                                <div
                                    className="text-lg font-bold text-[#F97316]"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    {formatNumber(totalVotes)}
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                    Votes
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <div
                                        className="text-lg font-bold text-gray-800"
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        {formatNumber(comments.length)}
                                    </div>
                                    <SvgComments className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                    Comments
                                </div>
                            </div>
                        </div>
                        {avatarCount > 0 && (
                            <div className="flex items-center gap-2">
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

                    <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Support this issue
                        </p>
                        <button
                            onClick={handleUpvote}
                            disabled={!authReady || upvoteLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 ${upvoted ? "border-green-500 bg-green-50 text-green-700" : "border-green-200 bg-white text-green-600 hover:border-green-400 hover:bg-green-50"}`}
                        >
                            {upvoteLoading ? (
                                <SvgSpinner />
                            ) : (
                                <SvgUpvote active={upvoted} />
                            )}
                            {upvoted ? "Upvoted" : "Upvote"}
                            <span className="font-bold">
                                {formatNumber(upvoteCount)}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── Voting Section ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <h2
                        className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        <SvgVote />
                        Cast Your Vote
                        {hasVoted && (
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
                                    onClick={() => handleVote(option)}
                                    disabled={!authReady || voteLoading}
                                    className={`w-full relative overflow-hidden rounded-xl border-2 transition-all duration-200 text-left disabled:opacity-60 cursor-pointer ${sel ? "border-[#F97316] bg-orange-50" : "border-gray-100 hover:border-orange-200"}`}
                                >
                                    <div
                                        className={`absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-700 ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                    <div className="relative px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${sel ? "border-[#F97316] bg-[#F97316]" : "border-gray-300"}`}
                                            >
                                                {sel && <SvgCheckFill />}
                                            </div>
                                            <span
                                                className={`font-semibold text-sm ${sel ? "text-[#F97316]" : "text-gray-700"}`}
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
                    </div>
                    {voteLoading && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <SvgSpinner /> Saving your vote...
                        </div>
                    )}
                </div>

                {/* ── Demographic Insights ── */}
                {issue.demographics?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center justify-between">
                            <h2
                                className="text-sm font-bold text-gray-900 flex items-center gap-2"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                <SvgChart />
                                Demographic Insights
                            </h2>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                {totalVotes} total votes
                            </span>
                        </div>

                        <div className="px-4 py-4 space-y-3">
                            {demographicsLoading ? (
                                <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                                    <SvgSpinner />
                                    <span className="text-sm">
                                        Loading insights...
                                    </span>
                                </div>
                            ) : totalVotes === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-gray-400 font-medium">
                                        No votes yet
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">
                                        Demographic breakdown will appear once
                                        people vote
                                    </p>
                                </div>
                            ) : (
                                issue.demographics
                                    .filter((demo) => DEMOGRAPHIC_CONFIG[demo])
                                    .map((demo) => (
                                        <DemographicChart
                                            key={demo}
                                            demographic={demo}
                                            data={demographicData[demo]}
                                            voteOptions={voteOptions}
                                        />
                                    ))
                            )}
                        </div>
                    </div>
                )}

                {/* ── Discussion ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center justify-between">
                        <h2
                            className="text-sm font-bold text-gray-900 flex items-center gap-2"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            <SvgDiscussion />
                            Discussion
                        </h2>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <SvgComments className="w-3 h-3" />
                            {comments.length}
                        </span>
                    </div>

                    <form
                        onSubmit={handleSubmitComment}
                        className="px-4 py-3 border-b border-gray-50"
                    >
                        <div className="flex gap-2.5 items-start">
                            <Avatar name="A" size="md" />
                            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden focus-within:border-[#F97316]/50 focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) =>
                                        setCommentText(e.target.value)
                                    }
                                    placeholder="Share your thoughts..."
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
                                            className="flex items-center gap-1.5 text-xs font-bold bg-[#F97316] text-white px-3 py-1.5 rounded-xl hover:bg-[#C2410C] disabled:opacity-40 transition-colors cursor-pointer"
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
                        <div className="px-4 divide-y divide-gray-50">
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
                                className="mt-2 text-xs text-[#F97316] hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex gap-3">
                    <Link
                        href="/"
                        className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm text-center hover:border-[#F97316]/40 hover:text-[#F97316] transition-all"
                    >
                        Browse Issues
                    </Link>
                    <Link
                        href="/create-issue"
                        className="flex-1 bg-[#F97316] text-white py-3 rounded-xl font-semibold text-sm text-center hover:bg-[#C2410C] transition-all shadow-sm"
                    >
                        Report New Issue
                    </Link>
                </div>
            </div>
        </div>
    );
}
