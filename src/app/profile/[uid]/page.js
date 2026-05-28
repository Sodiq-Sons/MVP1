"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    getDocs,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
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
const UpvoteSmIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#16A34A"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <polyline points="18 15 12 9 6 15" />
    </svg>
);
const DownvoteSmIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#DC2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
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
        className="w-3.5 h-3.5"
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const LEVELS = [
    { level: 1, name: "New Voice", min: 0, max: 100 },
    { level: 2, name: "Active Citizen", min: 100, max: 300 },
    { level: 3, name: "Community Voice", min: 300, max: 600 },
    { level: 4, name: "Local Leader", min: 600, max: 1000 },
    { level: 5, name: "Change Maker", min: 1000, max: 1500 },
    { level: 6, name: "Community Champion", min: 1500, max: 2500 },
    { level: 7, name: "City Influencer", min: 2500, max: 4000 },
    { level: 8, name: "State Ambassador", min: 4000, max: 6000 },
    { level: 9, name: "National Voice", min: 6000, max: 10000 },
    { level: 10, name: "Legendary Citizen", min: 10000, max: Infinity },
];

function getLevelData(points = 0) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].min) return LEVELS[i];
    }
    return LEVELS[0];
}

function formatNum(n = 0) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
}

function formatTimeAgo(date) {
    if (!date) return "Just now";
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(seconds) {
    const diff = Math.floor(Date.now() / 1000) - seconds;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return "Yesterday";
    return `${Math.floor(diff / 86400)} days ago`;
}

const CATEGORY_META = {
    infrastructure: {
        emoji: "🏗️",
        color: "text-cp",
        bg: "bg-cp-tint",
    },
    education: { emoji: "📚", color: "text-blue-700", bg: "bg-blue-50" },
    healthcare: { emoji: "❤️", color: "text-rose-700", bg: "bg-rose-50" },
    water: { emoji: "💧", color: "text-cyan-700", bg: "bg-cyan-50" },
    security: { emoji: "🔒", color: "text-purple-700", bg: "bg-purple-50" },
    electricity: { emoji: "⚡", color: "text-yellow-700", bg: "bg-yellow-50" },
    environment: { emoji: "🌿", color: "text-green-700", bg: "bg-green-50" },
    gist: { emoji: "💬", color: "text-pink-700", bg: "bg-pink-50" },
    polls: { emoji: "🗳️", color: "text-violet-700", bg: "bg-violet-50" },
    poll: { emoji: "🗳️", color: "text-violet-700", bg: "bg-violet-50" },
    food: { emoji: "🍛", color: "text-amber-700", bg: "bg-amber-50" },
    issue: { emoji: "🚨", color: "text-red-700", bg: "bg-red-50" },
    other: { emoji: "📌", color: "text-gray-700", bg: "bg-muted" },
};

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        trending: {
            label: "🔥 Trending",
            cls: "bg-red-50 text-red-600 border border-red-100",
        },
        "under-review": {
            label: "✅ Under Review",
            cls: "bg-blue-50 text-blue-600 border border-blue-100",
        },
        resolved: {
            label: "✔ Resolved",
            cls: "bg-green-50 text-green-600 border border-green-100",
        },
        "needs-attention": {
            label: "⚠ Needs Attention",
            cls: "bg-yellow-50 text-yellow-600 border border-yellow-100",
        },
    };
    const s = map[status];
    if (!s) return null;
    return (
        <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}
        >
            {s.label}
        </span>
    );
}

// ── Issue Card (mini) ─────────────────────────────────────────────────────────
function IssueCard({ issue }) {
    const meta = CATEGORY_META[issue.category] ?? CATEGORY_META.other;
    return (
        <Link href={`/issue/${issue.id}`}>
            <div className="flex gap-3 p-3.5 rounded-xl bg-subtle border border-subtle hover:border-cp/30 hover:bg-cp-tint/30 transition-all cursor-pointer">
                <div
                    className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center text-lg shrink-0`}
                >
                    {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <h4
                        className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        {issue.title}
                    </h4>
                    <p
                        className="text-xs text-gray-400 line-clamp-1 mb-1.5"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {issue.description}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <UpvoteSmIcon /> {formatNum(issue.upvotes || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                            <DownvoteSmIcon /> {formatNum(issue.downvotes || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <CommentIcon /> {issue.commentCount || 0}
                        </span>
                        <StatusBadge status={issue.status} />
                        <span className="text-xs text-gray-400 ml-auto">
                            {issue.timeAgo}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonProfile() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="bg-card rounded-2xl overflow-hidden border border-subtle">
                <div className="h-28 bg-muted" />
                <div className="px-4 pb-4">
                    <div className="flex items-end justify-between -mt-10 mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-gray-200 border-4 border-white" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-5 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-16 bg-muted rounded-xl"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
    const { uid } = useParams();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [issues, setIssues] = useState([]);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState("posts");
    const [currentUser, setCurrentUser] = useState(null);
    const [copied, setCopied] = useState(false);

    // Auth
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
        return () => unsub();
    }, []);

    // Redirect own profile to /profile
    useEffect(() => {
        if (
            currentUser &&
            !currentUser.isAnonymous &&
            currentUser.uid === uid
        ) {
            router.replace("/profile");
        }
    }, [currentUser, uid, router]);

    // Fetch profile data
    useEffect(() => {
        if (!uid) return;
        let unsubStats = null;
        let unsubBadges = null;
        let unsubIssues = null;

        async function fetchProfile() {
            try {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (!userSnap.exists()) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                setProfile({ uid, ...userSnap.data() });

                // Stats (realtime)
                unsubStats = onSnapshot(
                    doc(db, "users", uid, "stats", "overview"),
                    (snap) => setStats(snap.exists() ? snap.data() : {}),
                    () => setStats({}),
                );

                // Badges (realtime)
                unsubBadges = onSnapshot(
                    collection(db, "users", uid, "badges"),
                    (snap) =>
                        setBadges(
                            snap.docs.map((d) => ({
                                id: d.id,
                                ...d.data(),
                                earnedAt: d.data().earnedAt?.toDate(),
                            })),
                        ),
                    () => setBadges([]),
                );

                // Issues (realtime)
                unsubIssues = onSnapshot(
                    query(
                        collection(db, "issues"),
                        where("author.uid", "==", uid),
                        orderBy("createdAt", "desc"),
                        limit(20),
                    ),
                    (snap) =>
                        setIssues(
                            snap.docs.map((d) => {
                                const data = d.data();
                                const seconds = data.createdAt?.seconds ?? null;
                                return {
                                    id: d.id,
                                    ...data,
                                    timeAgo: seconds
                                        ? timeAgo(seconds)
                                        : "Just now",
                                };
                            }),
                        ),
                    () => setIssues([]),
                );

                setLoading(false);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setNotFound(true);
                setLoading(false);
            }
        }

        fetchProfile();
        return () => {
            if (unsubStats) unsubStats();
            if (unsubBadges) unsubBadges();
            if (unsubIssues) unsubIssues();
        };
    }, [uid]);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${displayName} on Camp Connect`,
                    url,
                });
            } catch {}
        } else {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div
                className="min-h-screen pb-24 md:pb-8 px-4 md:px-6"
                style={{ background: "#FDF6EF" }}
            >
                <header className="md:hidden sticky top-0 z-40 bg-cp -mx-4 px-4 pt-6 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white cursor-pointer"
                        >
                            <BackIcon />
                        </button>
                        <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                    </div>
                </header>
                <SkeletonProfile />
            </div>
        );
    }

    if (notFound) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-4"
                style={{ background: "#FDF6EF" }}
            >
                <div className="text-6xl mb-4">👤</div>
                <h2
                    className="text-xl font-bold text-gray-800 mb-2"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Camper not found
                </h2>
                <p
                    className="text-gray-500 text-sm mb-6"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    This profile doesn&apos;t exist or has been removed.
                </p>
                <Link
                    href="/search-users"
                    className="px-6 py-3 bg-cp text-white rounded-xl font-semibold text-sm  transition-colors"
                >
                    Back to Search
                </Link>
            </div>
        );
    }

    // ── Derived display values ────────────────────────────────────────────────
    const displayName = profile?.fullName || profile?.displayName || "Camper";
    const displayPhoto = profile?.photoURL || null;
    const displayBio = profile?.bio || "No bio yet";
    const displayLoc =
        typeof profile?.location === "object"
            ? [
                  profile?.location?.city,
                  profile?.location?.state,
                  profile?.location?.country,
              ]
                  .filter(Boolean)
                  .join(", ") || "Nigeria"
            : profile?.location || "Nigeria";
    const joinedDate = profile?.createdAt?.toDate
        ? profile.createdAt.toDate()
        : new Date();
    const impactScore = profile?.impactScore || 0;
    const levelData = getLevelData(impactScore);
    const nextLevel = LEVELS.find((l) => l.level === levelData.level + 1);
    const progress = nextLevel
        ? ((impactScore - levelData.min) / (nextLevel.min - levelData.min)) *
          100
        : 100;

    const isOnline = profile?.isOnline === true;
    const roleBadge =
        profile?.role === "top_reporter"
            ? {
                  label: "🔥 Top Reporter",
                  cls: "bg-cp-tint text-cp border-cp/20",
              }
            : profile?.role === "admin"
              ? {
                    label: "⚡ Admin",
                    cls: "bg-purple-50 text-purple-600 border-purple-100",
                }
              : null;

    // Post stats derived from issues
    const totalUpvotesGiven = issues.reduce(
        (sum, i) => sum + (i.upvotes || 0),
        0,
    );
    const totalDownvotesGiven = issues.reduce(
        (sum, i) => sum + (i.downvotes || 0),
        0,
    );

    const tabs = [
        { key: "posts", label: "Posts", count: issues.length },
        { key: "badges", label: "Badges", count: badges.length },
        { key: "stats", label: "Stats", count: null },
    ];

    return (
        <div
            id="main-content"
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-cp px-4 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            aria-label="Go back"
                            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white cursor-pointer"
                        >
                            <BackIcon />
                        </button>
                        <div>
                            <h1
                                className="text-white font-bold text-base leading-tight"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {displayName}
                            </h1>
                            <p className="text-white/60 text-[11px]">
                                Lv.{levelData.level} · {levelData.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleShare}
                        aria-label={copied ? "Link copied" : "Share profile"}
                        className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white cursor-pointer"
                    >
                        <ShareIcon />
                    </button>
                </div>
            </header>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="w-9 h-9 bg-white border border-theme rounded-xl flex items-center justify-center text-gray-600 hover:bg-subtle transition-colors cursor-pointer shadow-sm"
                    >
                        <BackIcon />
                    </button>
                    <div>
                        <h1
                            className="text-2xl font-bold text-gray-900"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {displayName}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Lv.{levelData.level} · {levelData.name}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-theme rounded-xl text-sm font-semibold text-gray-600 hover:bg-subtle transition-colors shadow-sm cursor-pointer"
                >
                    <ShareIcon /> {copied ? "Copied!" : "Share Profile"}
                </button>
            </div>

            <div className="px-4 md:px-6 mt-4 space-y-4">
                {/* Profile Card */}
                <div className="bg-card rounded-2xl overflow-hidden border border-subtle shadow-sm">
                    {/* Banner */}
                    <div className="h-28 md:h-36 relative bg-gradient-to-br from-[color:var(--cp-deeper)] to-[color:var(--cp)]">
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle, #fff 1px, transparent 1px)",
                                backgroundSize: "20px 20px",
                            }}
                        />
                    </div>

                    <div className="px-4 md:px-5 pb-4 md:pb-5">
                        <div className="flex items-end justify-between -mt-11 mb-3">
                            <div className="relative">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-lg bg-cp flex items-center justify-center text-white text-3xl font-black overflow-hidden">
                                    {displayPhoto ? (
                                        <Image
                                            src={displayPhoto}
                                            alt={displayName}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        displayName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                {isOnline && (
                                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
                                )}
                            </div>
                            {roleBadge && (
                                <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${roleBadge.cls}`}
                                >
                                    {roleBadge.label}
                                </span>
                            )}
                        </div>

                        {/* Name & Bio */}
                        <div className="mb-3">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h2
                                    className="text-lg font-black text-gray-900"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    {displayName}
                                </h2>
                                {isOnline && (
                                    <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{" "}
                                        Online
                                    </span>
                                )}
                            </div>
                            <p
                                className="text-gray-500 text-sm leading-relaxed"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {displayBio}
                            </p>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                                <LocationIcon />
                                {displayLoc}
                            </span>
                            <span className="flex items-center gap-1">
                                <CalendarIcon />
                                Joined{" "}
                                {joinedDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                {
                                    label: "Posts",
                                    value: formatNum(
                                        stats?.issuesCount || issues.length,
                                    ),
                                    emoji: "📋",
                                    bg: "bg-cp-tint",
                                },
                                {
                                    label: "Likes",
                                    value: formatNum(
                                        stats?.upvotesReceived || 0,
                                    ),
                                    emoji: "⬆️",
                                    bg: "bg-green-50",
                                },
                                {
                                    label: "Badges",
                                    value: formatNum(badges.length),
                                    emoji: "🏅",
                                    bg: "bg-purple-50",
                                },
                                {
                                    label: "Score",
                                    value: formatNum(impactScore),
                                    emoji: "⭐",
                                    bg: "bg-blue-50",
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className={`text-center ${s.bg} rounded-xl py-2.5 px-1`}
                                >
                                    <div className="text-xl mb-0.5">
                                        {s.emoji}
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
                                    <div className="text-[9px] text-gray-400 font-medium">
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Level Progress */}
                <div className="bg-gradient-to-br from-[color:var(--cp-deeper)] to-[color:var(--cp)] rounded-2xl p-4 text-white relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle, #fff 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
                        }}
                    />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-white/70">
                                Level {levelData.level} · {levelData.name}
                            </div>
                            <div className="text-xs font-bold text-white/90">
                                {impactScore} pts
                            </div>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                            <div
                                className="bg-white rounded-full h-2.5 transition-all duration-700"
                                style={{ width: `${Math.min(100, progress)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/60">
                            <span>
                                {nextLevel
                                    ? `${nextLevel.min - impactScore} pts to next level`
                                    : "Max level reached! 🎉"}
                            </span>
                            {nextLevel && <span>Level {nextLevel.level}</span>}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-card rounded-2xl border border-subtle shadow-sm overflow-hidden">
                    <div role="tablist" aria-label="Profile sections" className="flex border-b border-subtle">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                role="tab"
                                aria-selected={activeTab === t.key}
                                aria-controls={`tabpanel-${t.key}`}
                                onClick={() => setActiveTab(t.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === t.key ? "border-cp text-cp" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {t.label}
                                {t.count !== null && (
                                    <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-cp/10 text-cp" : "bg-muted text-gray-400"}`}
                                    >
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4">
                        {/* Posts Tab */}
                        {activeTab === "posts" && (
                            <div className="space-y-3">
                                {issues.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-3">📋</div>
                                        <p
                                            className="font-semibold text-gray-700 text-sm"
                                            style={{
                                                fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                            }}
                                        >
                                            No posts yet
                                        </p>
                                        <p
                                            className="text-gray-400 text-xs mt-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            This camper hasn&apos;t posted
                                            anything yet
                                        </p>
                                    </div>
                                ) : (
                                    issues.map((issue) => (
                                        <IssueCard
                                            key={issue.id}
                                            issue={issue}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Badges Tab */}
                        {activeTab === "badges" && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {badges.length === 0 ? (
                                    <div className="col-span-full text-center py-12">
                                        <div className="text-4xl mb-3">🏅</div>
                                        <p
                                            className="font-semibold text-gray-700 text-sm"
                                            style={{
                                                fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                            }}
                                        >
                                            No badges yet
                                        </p>
                                        <p
                                            className="text-gray-400 text-xs mt-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            This camper hasn&apos;t earned any
                                            badges yet
                                        </p>
                                    </div>
                                ) : (
                                    badges.map((b) => (
                                        <div
                                            key={b.id}
                                            className="p-3.5 rounded-xl text-center bg-gradient-to-br from-gray-50 to-white border border-subtle hover:border-cp/30 hover:shadow-sm transition-all"
                                        >
                                            <div className="text-3xl mb-2">
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
                                            <div className="text-[10px] text-gray-400 leading-snug mb-2">
                                                {b.description}
                                            </div>
                                            <div className="text-[10px] font-bold text-cp bg-cp-tint rounded-full py-1">
                                                ✓ Earned
                                                {b.earnedAt && (
                                                    <span className="font-normal text-gray-400 ml-1">
                                                        ·{" "}
                                                        {formatTimeAgo(
                                                            b.earnedAt,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Stats Tab */}
                        {activeTab === "stats" && (
                            <div className="space-y-3">
                                {/* Activity Summary */}
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Activity
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            {
                                                label: "Posts Created",
                                                value: formatNum(
                                                    stats?.issuesCount ||
                                                        issues.length,
                                                ),
                                                emoji: "📋",
                                                desc: "Total posts shared",
                                            },
                                            {
                                                label: "Likes Received",
                                                value: formatNum(
                                                    stats?.upvotesReceived || 0,
                                                ),
                                                emoji: "⬆️",
                                                desc: "Likes on their posts",
                                            },
                                            {
                                                label: "Comments Posted",
                                                value: formatNum(
                                                    stats?.commentsPosted || 0,
                                                ),
                                                emoji: "💬",
                                                desc: "Comments left",
                                            },
                                            {
                                                label: "Comments Received",
                                                value: formatNum(
                                                    stats?.commentsReceived ||
                                                        0,
                                                ),
                                                emoji: "📩",
                                                desc: "Replies to their posts",
                                            },
                                            {
                                                label: "Likes Given",
                                                value: formatNum(
                                                    stats?.upvotesGiven || 0,
                                                ),
                                                emoji: "👍",
                                                desc: "Posts supported",
                                            },
                                            {
                                                label: "Votes Cast",
                                                value: formatNum(
                                                    stats?.votesCast || 0,
                                                ),
                                                emoji: "🗳️",
                                                desc: "Poll votes",
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="bg-subtle rounded-xl p-3"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl">
                                                        {item.emoji}
                                                    </span>
                                                    <span
                                                        className="text-lg font-black text-gray-900"
                                                        style={{
                                                            fontFamily:
                                                                "Plus Jakarta Sans, sans-serif",
                                                        }}
                                                    >
                                                        {item.value}
                                                    </span>
                                                </div>
                                                <p
                                                    className="text-xs font-semibold text-gray-700"
                                                    style={{
                                                        fontFamily:
                                                            "DM Sans, sans-serif",
                                                    }}
                                                >
                                                    {item.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Post Engagement */}
                                {issues.length > 0 && (
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-3">
                                            Post Engagement
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-green-50 rounded-xl p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl">
                                                        ⬆️
                                                    </span>
                                                    <span
                                                        className="text-lg font-black text-green-700"
                                                        style={{
                                                            fontFamily:
                                                                "Plus Jakarta Sans, sans-serif",
                                                        }}
                                                    >
                                                        {formatNum(
                                                            totalUpvotesGiven,
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-green-700">
                                                    Total Likes
                                                </p>
                                                <p className="text-[10px] text-green-500">
                                                    Across all posts
                                                </p>
                                            </div>
                                            <div className="bg-red-50 rounded-xl p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl">
                                                        ⬇️
                                                    </span>
                                                    <span
                                                        className="text-lg font-black text-red-600"
                                                        style={{
                                                            fontFamily:
                                                                "Plus Jakarta Sans, sans-serif",
                                                        }}
                                                    >
                                                        {formatNum(
                                                            totalDownvotesGiven,
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-red-600">
                                                    Total Dislikes
                                                </p>
                                                <p className="text-[10px] text-red-400">
                                                    Across all posts
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Top Post */}
                                {issues.length > 0 &&
                                    (() => {
                                        const topPost = [...issues].sort(
                                            (a, b) =>
                                                (b.upvotes || 0) -
                                                (a.upvotes || 0),
                                        )[0];
                                        return (
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-3">
                                                    🏆 Top Post
                                                </p>
                                                <IssueCard issue={topPost} />
                                            </div>
                                        );
                                    })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
