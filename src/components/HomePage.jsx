"use client";

import Link from "next/link";
import { memo, useEffect, useState, useCallback, useRef } from "react";
import { usePresence } from "@/hooks/usePresence";
import {
    onSnapshot,
    orderBy,
    query,
    collection,
    doc,
    getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { CATEGORY_META, FILTER_MAP, UPVOTE_MILESTONES } from "@/lib/constants";

function timeAgo(seconds) {
    const diff = Math.floor(Date.now() / 1000) - seconds;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return "Yesterday";
    return `${Math.floor(diff / 86400)} days ago`;
}

function getTimeLeft(deadline, enabled) {
    if (!enabled || !deadline) return null;
    const d = deadline?.toDate ? deadline.toDate() : new Date(deadline);
    const ms = d.getTime() - Date.now();
    if (ms <= 0) return "Closed";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 48) return `${Math.floor(h / 24)}d left`;
    if (h >= 1) return `${h}h left`;
    return `${m}m left`;
}

function formatUpvotes(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
}

function getAvatarCount(upvotes) {
    if (upvotes <= 0) return 0;
    return Math.min(upvotes, 4);
}

// Normalise whatever is stored → always renders as "Platoon 3"
function normalisePlatoon(raw) {
    if (!raw) return null;
    const s = raw.toString().trim();
    if (!s) return null;
    if (s.toLowerCase().startsWith("platoon")) return s;
    return `Platoon ${s}`;
}

const CATEGORY_ACCENT = {
    infrastructure: { from: "#F59E0B", to: "#D97706", glow: "rgba(245,158,11,0.22)" },
    education:      { from: "#3B82F6", to: "#2563EB", glow: "rgba(59,130,246,0.22)" },
    healthcare:     { from: "#F43F5E", to: "#E11D48", glow: "rgba(244,63,94,0.22)" },
    water:          { from: "#06B6D4", to: "#0891B2", glow: "rgba(6,182,212,0.22)" },
    security:       { from: "#9333EA", to: "#7C3AED", glow: "rgba(147,51,234,0.22)" },
    electricity:    { from: "#EAB308", to: "#CA8A04", glow: "rgba(234,179,8,0.22)" },
    environment:    { from: "#22C55E", to: "#16A34A", glow: "rgba(34,197,94,0.22)" },
    gist:           { from: "#EC4899", to: "#DB2777", glow: "rgba(236,72,153,0.22)" },
    polls:          { from: "#8B5CF6", to: "#7C3AED", glow: "rgba(139,92,246,0.22)" },
    poll:           { from: "#8B5CF6", to: "#7C3AED", glow: "rgba(139,92,246,0.22)" },
    food:           { from: "#F97316", to: "#EA580C", glow: "rgba(249,115,22,0.22)" },
    issue:          { from: "#EF4444", to: "#DC2626", glow: "rgba(239,68,68,0.22)" },
    other:          { from: "#6B7280", to: "#4B5563", glow: "rgba(107,114,128,0.15)" },
};

const AVATAR_LETTERS = ["A", "B", "C", "D"];
const avatarColors = [
    "bg-amber-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-rose-400",
    "bg-cyan-400",
    "bg-amber-400",
    "bg-indigo-400",
];

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

const SortIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="6" y1="12" x2="18" y2="12" />
        <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
);

const PlatoonIcon = ({ className = "w-3 h-3" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={className}
    >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
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

const DownvoteIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#DC2626" : "none"}
        stroke="#DC2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="6 9 12 15 18 9" />
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

function SkeletonCard() {
    return (
        <div className="bg-[color:var(--card-bg)] rounded-2xl animate-pulse md:h-64 md:flex md:flex-col overflow-hidden">
            <div className="h-[3px] w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shrink-0" />
            <div className="p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2.5 mb-3 shrink-0">
                <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded-full w-24" />
                    <div className="h-2.5 bg-muted rounded-full w-16" />
                </div>
                <div className="h-5 w-16 bg-muted rounded-full shrink-0" />
            </div>
            <div className="space-y-2 mb-3 shrink-0">
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
            </div>
            <div className="flex-1 min-h-0" />
            <div className="pt-3 flex items-center gap-2 shrink-0">
                <div className="h-7 w-14 bg-muted rounded-xl" />
                <div className="h-7 w-14 bg-muted rounded-xl" />
                <div className="ml-auto h-7 w-10 bg-muted rounded-xl" />
            </div>
            </div>
        </div>
    );
}

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
                        Please sign in to like posts and join the
                        conversation.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm border border-theme text-gray-600 hover:bg-subtle transition-colors cursor-pointer"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onLogin}
                            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-colors cursor-pointer"
                            style={{ background: "var(--cp)", fontFamily: "DM Sans, sans-serif" }}
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const IssueCard = memo(function IssueCard({
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
    const [downvoted, setDownvoted] = useState(false);
    const [downvoteCount, setDownvoteCount] = useState(issue.downvotes || 0);
    const [downvoteLoading, setDownvoteLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const meta = CATEGORY_META[issue.category] ?? CATEGORY_META.other;
    const platoonLabel = normalisePlatoon(issue.author?.platoon);

    // Resolve author display name
    const authorName = issue.author?.isAnonymous
        ? "👤 Anonymous"
        : issue.author?.name || issue.author?.displayName || null;

    useEffect(() => {
        if (!currentUser || !issue.id || isAnonymous) return;
        if (
            localStorage.getItem(`upvote_${issue.id}_${currentUser.uid}`) ===
            "1"
        )
            setUpvoted(true);
        if (
            localStorage.getItem(`downvote_${issue.id}_${currentUser.uid}`) ===
            "1"
        )
            setDownvoted(true);
    }, [currentUser, issue.id, isAnonymous]);

    useEffect(() => {
        setCount(issue.upvotes || 0);
    }, [issue.upvotes]);

    useEffect(() => {
        setDownvoteCount(issue.downvotes || 0);
    }, [issue.downvotes]);

    const handleUpvote = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnonymous || !currentUser || currentUser.isAnonymous) {
            setShowLoginPrompt(true);
            return;
        }
        if (!authReady || loading || downvoteLoading) return;

        const wasUpvoted = upvoted;
        const wasDownvoted = downvoted;
        const newCount = wasUpvoted ? Math.max(0, count - 1) : count + 1;

        // Optimistic update — also undo the downvote if switching
        setUpvoted(!wasUpvoted);
        setCount(newCount);
        if (wasDownvoted) {
            setDownvoted(false);
            setDownvoteCount((c) => Math.max(0, c - 1));
        }

        setLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ issueId: issue.id, type: "up" }),
            });
            if (!res.ok) throw new Error("Vote failed");

            if (wasUpvoted) localStorage.removeItem(`upvote_${issue.id}_${currentUser.uid}`);
            else localStorage.setItem(`upvote_${issue.id}_${currentUser.uid}`, "1");
            if (wasDownvoted) localStorage.removeItem(`downvote_${issue.id}_${currentUser.uid}`);

            if (!wasUpvoted) {
                const issueData = issue;
                if (issueData?.author?.uid && issueData.author.uid !== currentUser.uid) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.UPVOTE,
                        recipientId: issueData.author.uid,
                        actorId: currentUser.uid,
                        actorName: currentUser.displayName || "Someone",
                        actorPhotoURL: currentUser.photoURL,
                        issueId: issue.id,
                        issueTitle: issue.title,
                        meta: `${newCount} total likes`,
                    });
                }
                if (UPVOTE_MILESTONES.includes(newCount) && issueData?.author?.uid) {
                    await createNotification({
                        type: NOTIFICATION_TYPES.MILESTONE,
                        recipientId: issueData.author.uid,
                        actorId: "system",
                        actorName: "Camp Voice",
                        issueId: issue.id,
                        issueTitle: issue.title,
                        meta: `🎉 ${newCount} likes reached!`,
                    });
                }
            }
        } catch (err) {
            console.error("Upvote failed:", err);
            setUpvoted(wasUpvoted);
            setDownvoted(wasDownvoted);
            setCount(issue.upvotes || 0);
            setDownvoteCount(issue.downvotes || 0);
        } finally {
            setLoading(false);
        }
    };

    const handleDownvote = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnonymous || !currentUser || currentUser.isAnonymous) {
            setShowLoginPrompt(true);
            return;
        }
        if (!authReady || downvoteLoading || loading) return;

        const wasDownvoted = downvoted;
        const wasUpvoted = upvoted;
        const newCount = wasDownvoted ? Math.max(0, downvoteCount - 1) : downvoteCount + 1;

        // Optimistic update — also undo the upvote if switching
        setDownvoted(!wasDownvoted);
        setDownvoteCount(newCount);
        if (wasUpvoted) {
            setUpvoted(false);
            setCount((c) => Math.max(0, c - 1));
        }

        setDownvoteLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ issueId: issue.id, type: "down" }),
            });
            if (!res.ok) throw new Error("Vote failed");

            if (wasDownvoted) localStorage.removeItem(`downvote_${issue.id}_${currentUser.uid}`);
            else localStorage.setItem(`downvote_${issue.id}_${currentUser.uid}`, "1");
            if (wasUpvoted) localStorage.removeItem(`upvote_${issue.id}_${currentUser.uid}`);
        } catch (err) {
            console.error("Oppose failed:", err);
            setDownvoted(wasDownvoted);
            setUpvoted(wasUpvoted);
            setDownvoteCount(issue.downvotes || 0);
            setCount(issue.upvotes || 0);
        } finally {
            setDownvoteLoading(false);
        }
    };

    const accent = CATEGORY_ACCENT[issue.category] ?? CATEGORY_ACCENT.other;

    return (
        <>
            <Link href={`/issue/${issue.id}`} className="block group">
                <article
                    className="relative bg-[color:var(--card-bg)] rounded-2xl overflow-hidden cursor-pointer md:h-64 md:flex md:flex-col"
                >
                    {/* Category accent bar */}
                    <div
                        className="h-[3px] w-full shrink-0"
                        style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
                    />

                    {rank && (
                        <div
                            className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-lg z-10 text-white"
                            style={{
                                background: rank === 1
                                    ? "linear-gradient(135deg, #FBBF24, #F59E0B)"
                                    : rank === 2
                                    ? "linear-gradient(135deg, #CBD5E1, #94A3B8)"
                                    : rank === 3
                                    ? "linear-gradient(135deg, #FB923C, #EA580C)"
                                    : "#E5E7EB",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            }}
                        >
                            {rank}
                        </div>
                    )}

                    <div className="p-4 flex flex-col flex-1 min-h-0">
                        {/* Author + category row */}
                        <div className="flex items-start justify-between gap-3 mb-2.5 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="shrink-0">
                                    {issue.author?.photoURL && !issue.author?.isAnonymous ? (
                                        <img
                                            src={issue.author.photoURL}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover"
                                            style={{ boxShadow: `0 0 0 2.5px ${accent.from}55` }}
                                        />
                                    ) : (
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold"
                                            style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
                                        >
                                            {issue.author?.isAnonymous ? "?" : (authorName || "?").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {authorName && (
                                    <div className="min-w-0">
                                        <span className="text-[12px] font-bold text-gray-800 leading-none truncate inline-flex items-center gap-1">
                                            {authorName}
                                            {issue.author?.isVerified && (
                                                <svg viewBox="0 0 22 22" aria-label="Verified" className="inline w-3.5 h-3.5 shrink-0" fill="none">
                                                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.246-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                                                    <path d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246-5.683 6.206z" fill="white"/>
                                                </svg>
                                            )}
                                        </span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {platoonLabel && (
                                                <span
                                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white leading-none"
                                                    style={{ background: `linear-gradient(90deg, ${accent.from}CC, ${accent.to}CC)` }}
                                                >
                                                    {platoonLabel}
                                                </span>
                                            )}
                                            {platoonLabel && <span className="text-[10px] text-gray-300">·</span>}
                                            <span className="text-[10px] text-gray-400">{issue.timeAgo}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category badge + timer */}
                            <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                                <span
                                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white flex items-center gap-1 whitespace-nowrap"
                                    style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`, boxShadow: `0 2px 8px ${accent.glow}` }}
                                >
                                    {meta.emoji} {meta.label}
                                </span>
                                {issue.pollTimerEnabled && issue.pollDeadline && (() => {
                                    const tl = getTimeLeft(issue.pollDeadline, issue.pollTimerEnabled);
                                    if (!tl) return null;
                                    return (
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${tl === "Closed" ? "bg-gray-100 text-gray-400" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                                            ⏱ {tl}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Title */}
                        <h3
                            className="font-extrabold text-gray-900 text-[15px] leading-snug mb-2 shrink-0 line-clamp-2"
                            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        >
                            {issue.title}
                        </h3>

                        {/* Tags row */}
                        {(issue.isFlagged || issue.status || issue.locationTag?.label) && (
                            <div className="flex items-center gap-1.5 flex-wrap mb-2 shrink-0">
                                {issue.isFlagged && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                        ⚑ Flagged
                                    </span>
                                )}
                                <StatusBadge status={issue.status} />
                                {issue.locationTag?.label && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const url = issue.locationTag.lat
                                                ? `https://maps.google.com/?q=${issue.locationTag.lat},${issue.locationTag.lng}`
                                                : `https://maps.google.com/?q=${encodeURIComponent(issue.locationTag.label)}`;
                                            window.open(url, "_blank", "noopener,noreferrer");
                                        }}
                                        className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                    >
                                        📍 {issue.locationTag.label}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <p
                                className="text-[13px] text-gray-500 leading-relaxed line-clamp-3"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {issue.description}
                            </p>
                        </div>

                        {/* Engagement footer */}
                        <div
                            className="flex items-center mt-auto pt-2.5 shrink-0"
                            onClick={(e) => e.preventDefault()}
                        >
                            <button
                                onClick={handleUpvote}
                                disabled={loading || downvoted}
                                title={downvoted ? "Remove your dislike first" : "Like this post"}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-40 text-[12px] font-bold"
                                style={upvoted ? {
                                    background: "linear-gradient(135deg, #22C55E, #16A34A)",
                                    color: "white",
                                    boxShadow: "0 2px 10px rgba(34,197,94,0.4)",
                                } : { color: "#9CA3AF" }}
                            >
                                <UpvoteIcon active={upvoted} />
                                {formatUpvotes(count)}
                            </button>

                            <button
                                onClick={handleDownvote}
                                disabled={downvoteLoading || upvoted}
                                title={upvoted ? "Remove your like first" : "Dislike this post"}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-40 text-[12px] font-bold"
                                style={downvoted ? {
                                    background: "linear-gradient(135deg, #EF4444, #DC2626)",
                                    color: "white",
                                    boxShadow: "0 2px 10px rgba(239,68,68,0.4)",
                                } : { color: "#9CA3AF" }}
                            >
                                <DownvoteIcon active={downvoted} />
                                {formatUpvotes(downvoteCount)}
                            </button>

                            <div className="flex-1" />

                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-[12px]"
                                style={{ color: accent.from }}
                            >
                                <CommentIcon />
                                <span>{issue.commentCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </article>
            </Link>
            <LoginPromptModal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                onLogin={onLoginClick}
            />
        </>
    );
});

export default function HomePage() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchWrapperRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const onlineCampers = usePresence();
    const [userProfile, setUserProfile] = useState(null);
    const [sortBy, setSortBy] = useState("newest");
    const [dismissedEmergencies, setDismissedEmergencies] = useState(() => {
        try {
            return new Set(JSON.parse(sessionStorage.getItem("dismissed_emergencies") || "[]"));
        } catch {
            return new Set();
        }
    });

    const dismissEmergency = useCallback((id) => {
        setDismissedEmergencies((prev) => {
            const next = new Set(prev);
            next.add(id);
            try { sessionStorage.setItem("dismissed_emergencies", JSON.stringify([...next])); } catch {}
            return next;
        });
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
                setAuthReady(true);
                if (!user.isAnonymous) {
                    let userName = user.displayName || "User";
                    let userPlatoon = null;
                    try {
                        const userSnap = await getDoc(
                            doc(db, "users", user.uid),
                        );
                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            userPlatoon = userData?.platoon ?? null;
                            if (userData?.fullName)
                                userName = userData.fullName;
                        }
                    } catch (profileErr) {
                        console.warn(
                            "Could not fetch user profile for platoon:",
                            profileErr,
                        );
                    }

                    setUserProfile({
                        name: userName,
                        email: user.email,
                        photoURL: user.photoURL,
                        platoon: userPlatoon,
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
                        category: d.category ?? "other",
                        type: d.type ?? null,
                        isPinned: d.isPinned ?? false,
                        isFlagged: d.isFlagged ?? false,
                        responseType: d.responseType ?? "yes_no",
                        voteOptions: d.voteOptions ?? [],
                        votes: d.votes ?? {},
                        totalVotes: d.totalVotes ?? 0,
                        upvotes: d.upvotes ?? 0,
                        downvotes: d.downvotes ?? 0,
                        commentCount: d.commentCount ?? 0,
                        createdAt: d.createdAt ?? null,
                        timeAgo: seconds ? timeAgo(seconds) : "Just now",
                        status: d.status ?? null,
                        author: d.author ?? {},
                        pollDeadline: d.pollDeadline ?? null,
                        pollTimerEnabled: d.pollTimerEnabled ?? false,
                        locationTag: d.locationTag ?? null,
                    };
                });
                setIssues(fetched);
                setLoading(false);
            },
            (err) => {
                console.error("Firestore error:", err);
                setError("Could not load posts. Please refresh.");
                setLoading(false);
            },
        );
        return () => unsubscribe();
    }, []);

    const handleLoginClick = useCallback(() => {
        window.location.href = "/login";
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const suggestions = search.trim().length >= 2
        ? issues
            .filter((issue) => {
                const q = search.toLowerCase();
                return (
                    issue.title.toLowerCase().includes(q) ||
                    issue.description.toLowerCase().includes(q) ||
                    (normalisePlatoon(issue.author?.platoon) ?? "").toLowerCase().includes(q)
                );
            })
            .slice(0, 6)
        : [];

    const filters = [
        { key: "all", label: "All" },
        { key: "trending", label: "🔥 Trending" },
        { key: "gist", label: "💬 Gist" },
        { key: "polls", label: "🗳️ Polls" },
        { key: "food", label: "🍛 Food" },
        { key: "issues", label: "🚨 Problems" },
        { key: "opposed", label: "👎 Dislike" },
    ];

    const sortLabels = { newest: "Newest", top: "Top", comments: "Comments" };
    const cycleSort = () =>
        setSortBy((prev) =>
            prev === "newest" ? "top" : prev === "top" ? "comments" : "newest",
        );

    const emergencyPosts = issues.filter(
        (i) => i.type === "emergency" && i.isPinned && !dismissedEmergencies.has(i.id)
    );

    const filteredIssues = issues
        .filter((issue) => {
            if (search) {
                const q = search.toLowerCase();
                const platoon =
                    normalisePlatoon(issue.author?.platoon)?.toLowerCase() ??
                    "";
                if (
                    !issue.title.toLowerCase().includes(q) &&
                    !issue.description.toLowerCase().includes(q) &&
                    !platoon.includes(q)
                )
                    return false;
            }
            // "opposed" filter: only posts with at least 1 downvote
            if (activeFilter === "opposed") return (issue.downvotes || 0) > 0;
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
            if (activeFilter === "opposed")
                return (b.downvotes || 0) - (a.downvotes || 0);
            if (sortBy === "top") return (b.upvotes || 0) - (a.upvotes || 0);
            if (sortBy === "comments")
                return (b.commentCount || 0) - (a.commentCount || 0);
            return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
        });

    const displayName = isAnonymous ? "Guest" : userProfile?.name || "User";
    const displayPlatoon = isAnonymous ? "" : userProfile?.platoon || "";

    return (
        <div
            className="min-h-screen pb-24 md:pb-0"
            style={{ background: "var(--bg)" }}
        >
            {/* Mobile Header */}
            <header
                className="md:hidden sticky top-0 z-40 overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, var(--cp-deeper) 0%, var(--cp) 100%)",
                    boxShadow: "0 4px 24px var(--cp-glow)",
                }}
            >
                {/* Dot-grid pattern overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                    }}
                />
                <div className="relative flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <span className="text-white text-[17px] leading-none select-none">✊</span>
                        </div>
                        <div>
                            <div className="text-white font-extrabold text-[14px] leading-none" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                Camp Connect
                            </div>
                            <div className="text-white/60 text-[10px] font-medium mt-0.5">Be the voice. Drive the change.</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1">
                            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                            <span className="text-white text-[11px] font-semibold">{onlineCampers} online</span>
                        </div>
                        {isAnonymous ? (
                            <Link
                                href="/login"
                                className="px-3 py-1.5 bg-white rounded-full font-bold text-[12px] shadow-sm"
                                style={{ color: "var(--cp)", fontFamily: "DM Sans, sans-serif" }}
                            >
                                Login
                            </Link>
                        ) : (
                            <Link href="/profile">
                                <div className="w-8 h-8 rounded-full border-2 border-white/50 overflow-hidden bg-white/20 flex items-center justify-center shadow-sm">
                                    {userProfile?.photoURL
                                        ? <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
                                        : <span className="text-white text-xs font-bold">{displayName.charAt(0).toUpperCase()}</span>
                                    }
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-0">
                <div>
                    <h1
                        className="text-[28px] font-extrabold text-gray-900 leading-none"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Camp Feed
                    </h1>
                    <p className="text-gray-400 text-sm mt-1.5 font-medium">
                        What&apos;s happening across all camps
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAnonymous ? (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
                            style={{ background: "linear-gradient(135deg, var(--cp-deeper), var(--cp))", fontFamily: "DM Sans, sans-serif" }}
                        >
                            <UserIcon />
                            Sign In
                        </Link>
                    ) : (
                        <Link href="/profile" className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-[color:var(--border-subtle)] hover:shadow-md transition-all">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--cp)" }}>
                                {userProfile?.photoURL
                                    ? <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
                                    : displayName.charAt(0).toUpperCase()
                                }
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-800 leading-none" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    {displayName}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">
                                    {displayPlatoon || "No Platoon"}
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Greeting */}
            <div className="md:hidden px-4 pt-4 pb-0.5">
                <p className="text-[18px] font-extrabold text-gray-900 leading-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    Hey, {displayName} 👋
                </p>
            </div>

            {/* Emergency Alerts — pinned at top, unmissable */}
            {emergencyPosts.length > 0 && (
                <div className="px-4 md:px-6 mt-4 space-y-2">
                    {emergencyPosts.map((post) => (
                        <div
                            key={post.id}
                            className="relative rounded-2xl p-4 shadow-lg overflow-hidden"
                            style={{ background: "#DC2626" }}
                        >
                            {/* pulsing glow edge */}
                            <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-pulse pointer-events-none" />
                            <div className="relative flex items-start gap-3">
                                <span className="text-2xl shrink-0 mt-0.5">🚨</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 text-white px-2 py-0.5 rounded-full">
                                            Camp Alert
                                        </span>
                                        <span className="text-[10px] text-red-200 font-medium">
                                            Camp Command · {post.timeAgo}
                                        </span>
                                    </div>
                                    <p
                                        className="font-bold text-sm text-white leading-snug"
                                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                                    >
                                        {post.title}
                                    </p>
                                    {post.description && (
                                        <p
                                            className="text-red-100 text-xs mt-1"
                                            style={{ fontFamily: "DM Sans, sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                                        >
                                            {post.description}
                                        </p>
                                    )}
                                    <Link
                                        href={`/issue/${post.id}`}
                                        className="inline-block mt-2.5 text-xs font-bold bg-white text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                        style={{ fontFamily: "DM Sans, sans-serif" }}
                                    >
                                        View Details →
                                    </Link>
                                </div>
                                <button
                                    onClick={() => dismissEmergency(post.id)}
                                    aria-label="Dismiss alert"
                                    className="shrink-0 w-7 h-7 flex items-center justify-center text-red-200 hover:text-white hover:bg-white/20 rounded-full transition-colors text-base leading-none"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Desktop Greeting — compact */}
            <div className="hidden md:flex items-center gap-3 px-6 mt-5">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: "var(--cp)" }}>
                    {userProfile?.photoURL
                        ? <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
                        : displayName.charAt(0).toUpperCase()
                    }
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-800 leading-none" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        Hey, {displayName} 👋
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{displayPlatoon || "Camp Connect"}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-[color:var(--card-bg)] rounded-full px-3 py-1.5 border border-[color:var(--border-subtle)]">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-gray-600">{onlineCampers} online</span>
                </div>
            </div>

            {/* Search + Sort */}
            <div className="px-4 md:px-6 mt-4 flex gap-2">
                <div className="flex-1 relative" ref={searchWrapperRef}>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => e.key === "Escape" && setShowSuggestions(false)}
                        placeholder="Search posts, platoon..."
                        className="w-full bg-[color:var(--card-bg)] rounded-xl pl-9 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 border border-[color:var(--border-subtle)] shadow-sm focus:outline-none focus:border-[color:var(--cp)] focus:shadow-md transition-all"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card rounded-xl border border-subtle shadow-lg z-50 overflow-hidden">
                            {suggestions.map((issue) => {
                                const meta = CATEGORY_META[issue.category] ?? CATEGORY_META.other;
                                return (
                                    <button
                                        key={issue.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setSearch(issue.title);
                                            setShowSuggestions(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-subtle transition-colors text-left cursor-pointer border-b border-subtle last:border-b-0"
                                    >
                                        <span className="text-base shrink-0">{meta.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-black truncate" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                                {issue.title}
                                            </p>
                                            <p className="text-xs text-muted truncate" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                                {meta.label}{issue.author?.platoon ? ` · ${normalisePlatoon(issue.author.platoon)}` : ""}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <button
                    onClick={cycleSort}
                    className="h-11 bg-[color:var(--card-bg)] rounded-xl flex items-center gap-1.5 px-3 shadow-sm border border-[color:var(--border-subtle)] hover:shadow-md hover:border-[color:var(--border)] transition-all text-gray-700 shrink-0 self-center cursor-pointer"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    <SortIcon />
                    <span className="text-xs font-semibold">
                        {sortLabels[sortBy]}
                    </span>
                </button>
            </div>

            {/* Filter Pills */}
            <div className="px-4 md:px-6 mt-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`shrink-0 snap-start px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                activeFilter === f.key
                                    ? "text-white shadow-md"
                                    : "bg-[color:var(--card-bg)] text-gray-600 border border-[color:var(--border-subtle)] hover:border-[color:var(--border)] hover:shadow-sm"
                            }`}
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                ...(activeFilter === f.key ? { background: "linear-gradient(135deg, var(--cp-deeper), var(--cp))" } : {}),
                            }}
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
                    Sorted by most likes
                </p>
            )}
            {activeFilter === "opposed" && (
                <p
                    className="px-4 md:px-6 mt-2 text-xs text-gray-400"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Posts with the most dislike
                </p>
            )}
            {sortBy !== "newest" &&
                activeFilter !== "trending" &&
                activeFilter !== "opposed" && (
                    <p
                        className="px-4 md:px-6 mt-2 text-xs text-gray-400"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {sortBy === "top"
                            ? "Sorted by most upvotes"
                            : "Sorted by most comments"}
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

            {/* Issues List */}
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
                                ? "No posts yet"
                                : "No posts found"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            {issues.length === 0
                                ? "Be the first to post!"
                                : "Try a different filter or search"}
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Post Button (mobile) */}
            <Link
                href="/create-issue"
                className="md:hidden fixed bottom-20 right-4 flex items-center gap-2 text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-colors"
                style={{
                    fontFamily: "DM Sans, sans-serif",
                    background: "var(--cp-deeper)",
                    boxShadow: "0 4px 20px var(--cp-glow)",
                }}
            >
                <span className="text-lg font-light">+</span>
                Post to Camp
            </Link>
        </div>
    );
}
