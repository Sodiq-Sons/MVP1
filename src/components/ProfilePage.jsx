// app/profile/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    increment,
    writeBatch,
    getDocs,
    setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";
import { toast } from "sonner";
import Image from "next/image";

// ── Icons
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
const NotificationIcon = () => (
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
const TrophyIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 006 6 6 6 0 006-6V2z" />
    </svg>
);
const LockIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

// ─── Status Map ───────────────────────────────────────────────────────────────
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

// ─── Level Configuration ──────────────────────────────────────────────────────
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

// ─── Badges Configuration ─────────────────────────────────────────────────────
const BADGES_CONFIG = {
    first_issue: {
        emoji: "📝",
        label: "First Steps",
        description: "Dropped your first post",
    },
    pro_reporter: {
        emoji: "📋",
        label: "Pro Reporter",
        description: "Dropped 5 posts",
    },
    community_watch: {
        emoji: "👁️",
        label: "Community Watch",
        description: "Dropped 10 posts",
    },
    local_hero: {
        emoji: "🏆",
        label: "Local Hero",
        description: "Dropped 25 posts",
    },
    voice_heard: {
        emoji: "📢",
        label: "Voice Heard",
        description: "Received 10 upvotes total",
    },
    crowd_favorite: {
        emoji: "⭐",
        label: "Crowd Favorite",
        description: "Received 50 upvotes total",
    },
    viral_sensation: {
        emoji: "🔥",
        label: "Viral Sensation",
        description: "Received 100 upvotes total",
    },
    conversation_starter: {
        emoji: "💬",
        label: "Conversation Starter",
        description: "Received 5 comments on your posts",
    },
    discussion_leader: {
        emoji: "🗣️",
        label: "Discussion Leader",
        description: "Received 20 comments on your posts",
    },
    poll_master: {
        emoji: "📊",
        label: "Poll Master",
        description: "Created an issue with 10+ votes",
    },
    popular_vote: {
        emoji: "🗳️",
        label: "Popular Vote",
        description: "Created an issue with 50+ votes",
    },
    engaged_citizen: {
        emoji: "🤝",
        label: "Engaged Citizen",
        description: "Upvoted 10 posts",
    },
    active_voter: {
        emoji: "✅",
        label: "Active Voter",
        description: "Voted on 10 polls",
    },
    helpful_commenter: {
        emoji: "💡",
        label: "Helpful Commenter",
        description: "Posted 10 comments",
    },
    resolution_champion: {
        emoji: "✨",
        label: "Resolution Champion",
        description: "Had an issue marked as resolved",
    },
    trending_creator: {
        emoji: "📈",
        label: "Trending Creator",
        description: "Had an issue reach trending status",
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
}
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
function getCategoryEmoji(cat) {
    return (
        {
            infrastructure: "🏗️",
            education: "📚",
            healthcare: "❤️",
            water: "💧",
            security: "🛡️",
            electricity: "⚡",
            environment: "🌿",
            other: "📋",
        }[cat] || "📋"
    );
}
function getCategoryBg(cat) {
    return (
        {
            infrastructure: "bg-orange-50",
            education: "bg-blue-50",
            healthcare: "bg-rose-50",
            security: "bg-red-50",
            environment: "bg-green-50",
            water: "bg-cyan-50",
            electricity: "bg-yellow-50",
            other: "bg-gray-50",
        }[cat] || "bg-gray-50"
    );
}
function getCategoryColor(cat) {
    return (
        {
            infrastructure: "text-orange-700",
            education: "text-blue-700",
            healthcare: "text-rose-700",
            security: "text-red-700",
            environment: "text-green-700",
            water: "text-cyan-700",
            electricity: "text-yellow-700",
            other: "text-gray-700",
        }[cat] || "text-gray-700"
    );
}
function getLevelData(points) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].min) return LEVELS[i];
    }
    return LEVELS[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function LevelProgress({ stats }) {
    if (!stats) return null;
    return (
        <div className="bg-linear-to-br from-[#EA580C] to-[#F97316] rounded-2xl p-4 text-white relative overflow-hidden">
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
                        Level {stats.level} • {stats.levelName}
                    </div>
                    <div className="text-xs font-bold text-white/90">
                        {stats.impactScore} pts
                    </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                    <div
                        className="bg-white rounded-full h-2.5 transition-all duration-500"
                        style={{ width: `${Math.min(100, stats.progress)}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-white/60">
                    <span>
                        {stats.pointsToNextLevel > 0
                            ? `${stats.pointsToNextLevel} pts to next level`
                            : "Max level reached!"}
                    </span>
                    {stats.nextLevel && <span>Level {stats.nextLevel}</span>}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, value, label, color = "orange" }) {
    const colors = {
        orange: "bg-orange-50 text-orange-600",
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
    };
    return (
        <div className="text-center bg-gray-50 rounded-xl py-3 px-2">
            <div
                className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mx-auto mb-1.5`}
            >
                {icon}
            </div>
            <div
                className="text-lg font-black text-gray-900"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
                {value}
            </div>
            <div className="text-[10px] text-gray-400 font-medium">{label}</div>
        </div>
    );
}

function LoginPrompt({ onLogin }) {
    return (
        <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockIcon />
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
                    Please log in to view your profile and track your impact.
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
    const router = useRouter();

    // ── Auth state (identical pattern to homepage) ────────────────────────────
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);

    // ── Auth-sourced profile: name/email/photoURL read directly from the
    //    Firebase Auth user object — same source as homepage's userProfile. ──
    const [authProfile, setAuthProfile] = useState(null);

    // ── Firestore-only extras: bio, location, role, joinedAt ─────────────────
    // These fields do not exist on the Auth user, so we still pull them from
    // Firestore, but only these fields — not name/photo which are already above.
    const [firestoreProfile, setFirestoreProfile] = useState(null);

    // ── Gamification & activity ───────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("issues");
    const [issues, setIssues] = useState([]);
    const [badges, setBadges] = useState([]);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [stats, setStats] = useState({
        issuesCount: 0,
        upvotesReceived: 0,
        badgesCount: 0,
    });
    const [gamificationStats, setGamificationStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Subscriptions in a ref so cleanup never causes re-renders ────────────
    const subscriptionsRef = useRef([]);

    const cleanupSubscriptions = useCallback(() => {
        subscriptionsRef.current.forEach((u) => u && u());
        subscriptionsRef.current = [];
    }, []);

    const checkAndAwardBadges = useCallback(async (uid, currentStats) => {
        const earned = [];
        if (currentStats.issuesCount >= 1) earned.push("first_issue");
        if (currentStats.issuesCount >= 5) earned.push("pro_reporter");
        if (currentStats.issuesCount >= 10) earned.push("community_watch");
        if (currentStats.issuesCount >= 25) earned.push("local_hero");
        if (currentStats.upvotesReceived >= 10) earned.push("voice_heard");
        if (currentStats.upvotesReceived >= 50) earned.push("crowd_favorite");
        if (currentStats.upvotesReceived >= 100) earned.push("viral_sensation");
        if (currentStats.commentsReceived >= 5)
            earned.push("conversation_starter");
        if (currentStats.commentsReceived >= 20)
            earned.push("discussion_leader");
        if (currentStats.upvotesGiven >= 10) earned.push("engaged_citizen");
        if (currentStats.votesCast >= 10) earned.push("active_voter");
        if (currentStats.commentsPosted >= 10) earned.push("helpful_commenter");

        const snap = await getDocs(collection(db, "users", uid, "badges"));
        const existing = new Set(snap.docs.map((d) => d.data().badgeId));
        const newBadges = earned.filter((id) => !existing.has(id));

        if (newBadges.length > 0) {
            const batch = writeBatch(db);
            for (const badgeId of newBadges) {
                const cfg = BADGES_CONFIG[badgeId];
                batch.set(doc(collection(db, "users", uid, "badges")), {
                    badgeId,
                    emoji: cfg.emoji,
                    label: cfg.label,
                    description: cfg.description,
                    earnedAt: serverTimestamp(),
                });
            }
            await batch.commit();
            await updateDoc(doc(db, "users", uid, "stats", "overview"), {
                badgesCount: increment(newBadges.length),
                updatedAt: serverTimestamp(),
            });
            toast.success(
                `Earned ${newBadges.length} new badge${newBadges.length > 1 ? "s" : ""}! 🎉`,
            );
        }
    }, []);

    const setupSubscriptions = useCallback(
        (uid) => {
            cleanupSubscriptions();
            const subs = [];

            // User doc → gamification stats + Firestore-only profile fields
            subs.push(
                onSnapshot(
                    doc(db, "users", uid),
                    (snap) => {
                        if (snap.exists()) {
                            const data = snap.data();
                            const impactScore = data.impactScore || 0;
                            const levelData = getLevelData(impactScore);
                            const nextLevel = LEVELS.find(
                                (l) => l.level === levelData.level + 1,
                            );

                            setGamificationStats({
                                impactScore,
                                level: levelData.level,
                                levelName: levelData.name,
                                nextLevel: nextLevel?.level || null,
                                pointsToNextLevel: nextLevel
                                    ? nextLevel.min - impactScore
                                    : 0,
                                progress: nextLevel
                                    ? ((impactScore - levelData.min) /
                                          (nextLevel.min - levelData.min)) *
                                      100
                                    : 100,
                            });

                            // Only Firestore-specific fields — name/photo stay from auth
                            setFirestoreProfile({
                                bio: data.bio || "No bio yet",
                                location:
                                    typeof data.location === "object"
                                        ? [
                                              data.location.city,
                                              data.location.state,
                                              data.location.country,
                                          ]
                                              .filter(Boolean)
                                              .join(", ") || "Nigeria"
                                        : data.location || "Nigeria",
                                role: data.role || "citizen",
                                joinedAt: data.createdAt?.toDate
                                    ? data.createdAt.toDate()
                                    : new Date(),
                            });
                        }
                        setLoading(false);
                    },
                    (err) => {
                        console.error("User sub error:", err);
                        setLoading(false);
                    },
                ),
            );

            // Stats doc
            subs.push(
                onSnapshot(
                    doc(db, "users", uid, "stats", "overview"),
                    async (snap) => {
                        const d = snap.exists() ? snap.data() : {};
                        const s = {
                            issuesCount: d.issuesCount || 0,
                            upvotesReceived: d.upvotesReceived || 0,
                            upvotesGiven: d.upvotesGiven || 0,
                            votesCast: d.votesCast || 0,
                            commentsPosted: d.commentsPosted || 0,
                            commentsReceived: d.commentsReceived || 0,
                            badgesCount: d.badgesCount || 0,
                        };
                        setStats(s);
                        if (snap.exists()) await checkAndAwardBadges(uid, s);
                    },
                    (err) => console.error("Stats sub error:", err),
                ),
            );

            // Badges collection
            subs.push(
                onSnapshot(
                    collection(db, "users", uid, "badges"),
                    (snap) =>
                        setBadges(
                            snap.docs.map((d) => ({
                                id: d.id,
                                badgeId: d.data().badgeId,
                                emoji: d.data().emoji,
                                label: d.data().label,
                                desc: d.data().description,
                                earnedAt: d.data().earnedAt?.toDate(),
                            })),
                        ),
                    (err) => console.error("Badges sub error:", err),
                ),
            );

            // Issues query
            subs.push(
                onSnapshot(
                    query(
                        collection(db, "issues"),
                        where("author.uid", "==", uid),
                        orderBy("createdAt", "desc"),
                        limit(10),
                    ),
                    (snap) =>
                        setIssues(
                            snap.docs.map((d) => {
                                const data = d.data();
                                return {
                                    id: d.id,
                                    category: data.category,
                                    categoryEmoji: getCategoryEmoji(
                                        data.category,
                                    ),
                                    categoryBg: getCategoryBg(data.category),
                                    categoryColor: getCategoryColor(
                                        data.category,
                                    ),
                                    title: data.title,
                                    location: data.location,
                                    upvotes: data.upvotes || 0,
                                    comments: data.commentCount || 0,
                                    status: data.status || "under-review",
                                    timeAgo: formatTimeAgo(
                                        data.createdAt?.toDate(),
                                    ),
                                };
                            }),
                        ),
                    (err) => console.error("Issues sub error:", err),
                ),
            );

            subscriptionsRef.current = subs;
        },
        [cleanupSubscriptions, checkAndAwardBadges],
    );

    // Ensure Firestore docs exist, then kick off subscriptions
    const initializeUserData = useCallback(
        async (uid) => {
            try {
                const userRef = doc(db, "users", uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    // Seed using auth user data — same source as homepage
                    await setDoc(userRef, {
                        uid,
                        displayName: auth.currentUser?.displayName || "User",
                        email: auth.currentUser?.email,
                        photoURL: auth.currentUser?.photoURL || null,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        impactScore: 0,
                        level: 1,
                        levelName: "New Voice",
                        role: "citizen",
                        isOnline: true,
                    });
                } else {
                    await updateDoc(userRef, {
                        isOnline: true,
                        lastActive: serverTimestamp(),
                    });
                }

                const statsRef = doc(db, "users", uid, "stats", "overview");
                if (!(await getDoc(statsRef)).exists()) {
                    await setDoc(statsRef, {
                        userId: uid,
                        issuesCount: 0,
                        upvotesReceived: 0,
                        upvotesGiven: 0,
                        votesCast: 0,
                        commentsPosted: 0,
                        commentsReceived: 0,
                        repliesPosted: 0,
                        repliesReceived: 0,
                        likesGiven: 0,
                        likesReceived: 0,
                        badgesCount: 0,
                        resolvedIssues: 0,
                        trendingIssues: 0,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                }

                setupSubscriptions(uid);
            } catch (err) {
                console.error("Error initializing user data:", err);
                toast.error("Failed to load profile");
                setLoading(false);
            }
        },
        [setupSubscriptions],
    );

    // ── Auth effect — mirrors homepage's onAuthStateChanged exactly ───────────
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
                setAuthReady(true);

                if (!user.isAnonymous) {
                    // ✅ Populate name/email/photo from auth user directly,
                    //    no Firestore read needed — same as homepage does it.
                    setAuthProfile({
                        name: user.displayName || "User",
                        email: user.email,
                        photoURL: user.photoURL,
                    });
                    await initializeUserData(user.uid);
                } else {
                    setLoading(false);
                }
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (err) {
                    console.error("Anonymous sign-in failed:", err);
                    setAuthReady(true);
                    setLoading(false);
                }
            }
        });

        return () => {
            unsubscribe();
            cleanupSubscriptions();
        };
    }, [cleanupSubscriptions, initializeUserData]);

    // ── Handlers
    const handleSignOut = async () => {
        if (isSigningOut) return;

        setIsSigningOut(true);
        try {
            if (auth.currentUser && !auth.currentUser.isAnonymous) {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    lastSeen: serverTimestamp(),
                    isOnline: false,
                });
            }

            await signOut(auth);
            toast.success("Signed out successfully");
            router.push("/login");
        } catch {
            toast.error("Failed to sign out");
        } finally {
            setIsSigningOut(false);
        }
    };

    const handleShareProfile = async () => {
        const url = `${window.location.origin}/profile/${currentUser?.uid}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${authProfile?.name} on We The People NG`,
                    url,
                });
            } catch {}
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Profile link copied!");
        }
    };

    const handleLoginClick = () => {
        router.push(
            `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
        );
    };

    // ── Render guards ─────────────────────────────────────────────────────────
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

    if (!currentUser || isAnonymous) {
        return <LoginPrompt onLogin={handleLoginClick} />;
    }

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "#FDF6EF" }}
            >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]" />
            </div>
        );
    }

    // ── Derived display values ────────────────────────────────────────────────
    // Auth is the source of truth for name & photo (matches homepage).
    // Firestore fills in bio, location, role, joinedAt.
    const displayName = authProfile?.name || "User";
    const displayPhoto = authProfile?.photoURL || null;
    const displayBio = firestoreProfile?.bio || "No bio yet";
    const displayLoc = firestoreProfile?.location || "Nigeria";
    const displayRole = firestoreProfile?.role || "citizen";
    const displayJoined = firestoreProfile?.joinedAt || new Date();

    const tabs = [
        { key: "issues", label: "My Posts", count: stats.issuesCount },
        { key: "badges", label: "Badges", count: stats.badgesCount },
    ];

    const settingsGroups = [
        {
            title: "Account",
            items: [
                {
                    icon: <EditIcon />,
                    label: "Edit Profile",
                    desc: "Update your name & bio",
                    href: "/profile/edit",
                },
                {
                    icon: <NotificationIcon />,
                    label: "Notifications",
                    desc: "View your activity",
                    href: "/activity",
                },
                {
                    icon: <TrophyIcon />,
                    label: "Achievements",
                    desc: "View all badges & progress",
                    href: "/profile/achievements",
                },
                {
                    icon: <ShieldIcon />,
                    label: "Privacy & Security",
                    desc: "Manage account security",
                    href: "/profile/privacy",
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
                    href: "/profile/help",
                },
                {
                    icon: <ShareIcon />,
                    label: "Invite Friends",
                    desc: "Grow the community",
                    href: "/profile/invite",
                },
            ],
        },
    ];

    // ── JSX ─────
    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-[#F97316] px-4 pt-4 pb-4 mb-6">
                <div className="flex items-center justify-between">
                    <h1
                        className="text-white font-bold text-lg"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        My Profile
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShareProfile}
                            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"
                        >
                            <ShareIcon />
                        </button>
                        <Link
                            href="/profile/edit"
                            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"
                        >
                            <SettingsIcon />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Desktop Header */}
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
                    <button
                        onClick={handleShareProfile}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-100 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <ShareIcon /> Share Profile
                    </button>
                    <Link
                        href="/profile/edit"
                        className="flex items-center gap-2 text-xs font-semibold text-white bg-[#F97316] px-3 py-2 rounded-xl hover:bg-[#C2410C] transition-colors shadow-sm"
                    >
                        <EditIcon /> Edit Profile
                    </Link>
                </div>
            </div>

            <div className="px-4 md:px-6 space-y-4">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-50 shadow-sm">
                    <div
                        className="h-24 md:h-32 relative"
                        style={{ background: "#EA580C" }}
                    >
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
                        <div className="flex items-end justify-between -mt-10 mb-3">
                            <div className="relative">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-black bg-[#EA580C]">
                                    {displayPhoto ? (
                                        <Image
                                            src={displayPhoto}
                                            alt={displayName}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover rounded-2xl"
                                        />
                                    ) : (
                                        displayName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div
                                    className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"
                                    title="Online"
                                />
                            </div>
                            <Link
                                href="/profile/edit"
                                className="md:hidden flex items-center gap-1.5 text-xs font-semibold text-[#F97316] bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl"
                            >
                                <EditIcon /> Edit
                            </Link>
                        </div>

                        <div className="mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2
                                    className="text-lg font-black text-gray-900"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    {displayName}
                                </h2>
                                {displayRole === "top_reporter" && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">
                                        🔥 Top Reporter
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                {displayBio}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                                <LocationIcon />
                                {displayLoc}
                            </span>
                            <span className="flex items-center gap-1">
                                <CalendarIcon />
                                Joined{" "}
                                {displayJoined.toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                Online
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <StatCard
                                icon={<span className="text-lg">📋</span>}
                                value={formatNum(stats.issuesCount)}
                                label="Posts"
                                color="orange"
                            />
                            <StatCard
                                icon={<span className="text-lg">⬆️</span>}
                                value={formatNum(stats.upvotesReceived)}
                                label="Upvotes"
                                color="green"
                            />
                            <StatCard
                                icon={<span className="text-lg">🏅</span>}
                                value={formatNum(stats.badgesCount)}
                                label="Badges"
                                color="purple"
                            />
                        </div>
                    </div>
                </div>

                {/* Level Progress */}
                <LevelProgress stats={gamificationStats} />

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
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
                    <div className="p-4">
                        {activeTab === "issues" && (
                            <div className="space-y-3">
                                {issues.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="text-4xl mb-3">📋</div>
                                        <p className="font-semibold text-gray-700 text-sm">
                                            No issues posted yet
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Be the first to post to camp in your
                                            community
                                        </p>
                                        <Link
                                            href="/create-issue"
                                            className="inline-block mt-4 text-xs font-semibold text-[#F97316] bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors"
                                        >
                                            Post to Camp
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {issues.map((issue) => {
                                            const s =
                                                statusMap[issue.status] ||
                                                statusMap["under-review"];
                                            return (
                                                <Link
                                                    href={`/issue/${issue.id}`}
                                                    key={issue.id}
                                                >
                                                    <div className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#F97316]/20 hover:bg-orange-50/30 transition-all cursor-pointer">
                                                        <div
                                                            className={`w-9 h-9 rounded-xl ${issue.categoryBg} flex items-center justify-center text-lg shrink-0`}
                                                        >
                                                            {
                                                                issue.categoryEmoji
                                                            }
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
                                                                    {
                                                                        issue.comments
                                                                    }
                                                                </span>
                                                                <span className="text-[11px] text-gray-400 ml-auto">
                                                                    {
                                                                        issue.timeAgo
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                        <Link
                                            href="/create-issue"
                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-[#F97316]/30 text-[#F97316] text-sm font-semibold hover:bg-orange-50 transition-colors"
                                        >
                                            <span className="text-lg">+</span>{" "}
                                            Post to Camp
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                        {activeTab === "badges" && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {badges.length === 0 ? (
                                    <div className="col-span-full text-center py-10">
                                        <div className="text-4xl mb-3">🏅</div>
                                        <p className="font-semibold text-gray-700 text-sm">
                                            No badges yet
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Start posting issues and engaging to
                                            earn badges!
                                        </p>
                                        <div className="mt-4 text-xs text-gray-500">
                                            <p>
                                                💡 Tip: Create issues, get
                                                upvotes,
                                            </p>
                                            <p>and engage with the community</p>
                                        </div>
                                    </div>
                                ) : (
                                    badges.map((b) => (
                                        <div
                                            key={b.id}
                                            className="p-3.5 rounded-xl text-center transition-all bg-linear-to-br from-gray-50 to-white border border-gray-100 hover:border-[#F97316]/30 hover:shadow-sm"
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
                                                {b.desc}
                                            </div>
                                            <div className="text-[10px] font-bold text-[#F97316] bg-orange-50 rounded-full py-1">
                                                ✓ Earned
                                                {b.earnedAt && (
                                                    <span className="font-normal text-gray-400 ml-1">
                                                        •{" "}
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
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-3">
                    {settingsGroups.map((group) => (
                        <div
                            key={group.title}
                            className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden"
                        >
                            <div className="px-4 pt-3 pb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {group.title}
                                </span>
                            </div>
                            {group.items.map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.href}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-50 first:border-t-0"
                                >
                                    <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-black shrink-0">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
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
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 text-sm font-semibold transition-colors cursor-pointer ${
                        isSigningOut
                            ? "bg-orange-300 cursor-not-allowed"
                            : "bg-[#EA580C] text-white hover:bg-[#F97316]"
                    }`}
                >
                    {isSigningOut ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Signing out...
                        </>
                    ) : (
                        <>
                            <LogoutIcon /> Sign Out
                        </>
                    )}
                </button>

                <p
                    className="text-center text-[10px] text-black pb-2"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Camp Connect · v1.0.0 · Made with ❤️ for Nigerian Campers
                </p>
            </div>
        </div>
    );
}
