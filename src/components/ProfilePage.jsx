// app/profile/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    updateDoc,
    serverTimestamp,
    increment,
    onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";
import { toast } from "sonner";
import Image from "next/image";

// ── Icons ────────────────────────────────────────────────────────────────────
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
const ActivityIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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

// ── Status Map ─────────────────────────────────────────────────────────────
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

function formatTimeAgo(date) {
    if (!date) return "Just now";
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("issues");
    const [issues, setIssues] = useState([]);
    const [badges, setBadges] = useState([]);
    const [stats, setStats] = useState({
        issuesCount: 0,
        upvotesReceived: 0,
        badgesCount: 0,
    });
    const [loading, setLoading] = useState(true);

    // Auth states
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [userProfile, setUserProfile] = useState(null);

    // Auth - same pattern as home page
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
                setAuthReady(true);

                // If user is not anonymous, fetch their profile from Firestore
                if (!user.isAnonymous) {
                    try {
                        const userDoc = await getDoc(
                            doc(db, "users", user.uid),
                        );
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setUserProfile({
                                uid: user.uid,
                                name:
                                    userData.displayName ||
                                    user.displayName ||
                                    "User",
                                email: userData.email || user.email,
                                photoURL: userData.photoURL || user.photoURL,
                                bio: userData.bio || "No bio yet",
                                location:
                                    typeof userData.location === "object"
                                        ? [
                                              userData.location.city,
                                              userData.location.state,
                                              userData.location.country,
                                          ]
                                              .filter(Boolean)
                                              .join(", ") || "Nigeria"
                                        : userData.location || "Nigeria",
                                joinedAt: userData.createdAt
                                    ? typeof userData.createdAt.toDate ===
                                      "function"
                                        ? userData.createdAt.toDate()
                                        : new Date(userData.createdAt)
                                    : new Date(),
                                impactScore: userData.impactScore || 0,
                                level: userData.level || 1,
                                levelName: userData.levelName || "New Voice",
                                pointsToNextLevel:
                                    userData.pointsToNextLevel || 100,
                                role: userData.role || "citizen",
                                isOnline: true,
                            });

                            // Fetch user data after profile is loaded
                            await fetchUserData(user.uid);
                        } else {
                            // Fallback to auth user data if Firestore doc doesn't exist
                            setUserProfile({
                                uid: user.uid,
                                name: user.displayName || "User",
                                email: user.email,
                                photoURL: user.photoURL,
                                bio: "No bio yet",
                                location: "Nigeria",
                                joinedAt: new Date(),
                                impactScore: 0,
                                level: 1,
                                levelName: "New Voice",
                                pointsToNextLevel: 100,
                                role: "citizen",
                                isOnline: true,
                            });
                            setLoading(false);
                        }
                    } catch (error) {
                        console.error("Error fetching user profile:", error);
                        toast.error("Failed to load profile data");
                        setLoading(false);
                    }
                } else {
                    // Anonymous user - redirect to login for profile page
                    router.push("/login");
                }
            } else {
                // No user signed in - sign in anonymously then redirect to login
                try {
                    await signInAnonymously(auth);
                    // After anonymous sign in, redirect to login since profile requires auth
                    router.push("/login");
                } catch (err) {
                    console.error("Anonymous sign-in failed:", err);
                    setAuthReady(true);
                    setLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchUserData = async (uid) => {
        try {
            // Fetch user's issues - FIXED: use createdBy instead of authorId
            const issuesQuery = query(
                collection(db, "issues"),
                where("createdBy", "==", uid),
                orderBy("createdAt", "desc"),
                limit(10),
            );
            const issuesSnapshot = await getDocs(issuesQuery);

            const issuesData = issuesSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    category: data.category,
                    categoryEmoji: getCategoryEmoji(data.category),
                    categoryBg: getCategoryBg(data.category),
                    categoryColor: getCategoryColor(data.category),
                    title: data.title,
                    location: data.location,
                    upvotes: data.totalVotes || 0, // FIXED: use totalVotes instead of upvotes
                    comments: data.commentsCount || 0,
                    status: data.status || "under-review",
                    timeAgo: formatTimeAgo(data.createdAt?.toDate()),
                    createdAt: data.createdAt?.toDate(),
                };
            });
            setIssues(issuesData);

            // Calculate upvotes received from issues
            const totalUpvotes = issuesData.reduce(
                (sum, issue) => sum + issue.upvotes,
                0,
            );

            // Fetch badges
            const badgesQuery = query(collection(db, "users", uid, "badges"));
            const badgesSnapshot = await getDocs(badgesQuery);

            const badgesData = badgesSnapshot.docs.map((doc) => ({
                emoji: doc.data().emoji,
                label: doc.data().label,
                desc: doc.data().description,
                earned: true,
                earnedAt: doc.data().earnedAt?.toDate(),
            }));
            setBadges(badgesData);

            // Calculate stats
            const statsDoc = await getDoc(
                doc(db, "users", uid, "stats", "overview"),
            );

            if (statsDoc.exists()) {
                const s = statsDoc.data();
                setStats({
                    issuesCount: s.issuesCount || issuesData.length,
                    upvotesReceived: s.upvotesReceived || totalUpvotes,
                    badgesCount: s.badgesCount || badgesData.length,
                });
            } else {
                setStats({
                    issuesCount: issuesData.length,
                    upvotesReceived: totalUpvotes,
                    badgesCount: badgesData.length,
                });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    // Real-time updates for stats
    useEffect(() => {
        if (!currentUser || isAnonymous) return;

        // Subscribe to user document changes for real-time impact score updates
        const unsubscribe = onSnapshot(
            doc(db, "users", currentUser.uid),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setUserProfile((prev) => ({
                        ...prev,
                        impactScore: data.impactScore || 0,
                        level: data.level || 1,
                        levelName: data.levelName || "New Voice",
                        pointsToNextLevel: data.pointsToNextLevel || 100,
                    }));
                }
            },
        );

        return () => unsubscribe();
    }, [currentUser, isAnonymous]);

    const getCategoryEmoji = (category) => {
        const map = {
            infrastructure: "🏗️",
            education: "📚",
            healthcare: "❤️",
            water: "💧",
            security: "🛡️",
            electricity: "⚡",
            environment: "🌿",
            other: "📋",
        };
        return map[category] || "📋";
    };

    const getCategoryBg = (category) => {
        const map = {
            infrastructure: "bg-orange-50",
            education: "bg-blue-50",
            healthcare: "bg-rose-50",
            security: "bg-red-50",
            environment: "bg-green-50",
            water: "bg-cyan-50",
            electricity: "bg-yellow-50",
            other: "bg-gray-50",
        };
        return map[category] || "bg-gray-50";
    };

    const getCategoryColor = (category) => {
        const map = {
            infrastructure: "text-orange-700",
            education: "text-blue-700",
            healthcare: "text-rose-700",
            security: "text-red-700",
            environment: "text-green-700",
            water: "text-cyan-700",
            electricity: "text-yellow-700",
            other: "text-gray-700",
        };
        return map[category] || "text-gray-700";
    };

    const handleSignOut = async () => {
        try {
            // Update last seen
            if (auth.currentUser && !auth.currentUser.isAnonymous) {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    lastSeen: serverTimestamp(),
                    isOnline: false,
                });
            }
            await signOut(auth);
            toast.success("Signed out successfully");
            router.push("/login");
        } catch (error) {
            toast.error("Failed to sign out");
        }
    };

    const handleShareProfile = async () => {
        const shareData = {
            title: `${userProfile?.name} on We The People NG`,
            text: `Check out ${userProfile?.name}'s profile on We The People NG - Making Nigeria better together!`,
            url: `${window.location.origin}/profile/${userProfile?.uid}`,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareData.url);
            toast.success("Profile link copied to clipboard!");
        }
    };

    const tabs = [
        { key: "issues", label: "My Issues", count: stats.issuesCount },
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
                    icon: <ShieldIcon />,
                    label: "Privacy & Security",
                    desc: "Manage account security",
                    href: "/profile/privacy",
                },
                {
                    icon: <ActivityIcon />,
                    label: "Notifications",
                    desc: "View your activity",
                    href: "/activity",
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

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "#FDF6EF" }}
            >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
            </div>
        );
    }

    if (!userProfile) return null;

    const progressPercent = Math.min(
        100,
        (userProfile.impactScore / userProfile.pointsToNextLevel) * 100,
    );

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
                            href="/profile/settings"
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
                        <ShareIcon />
                        Share Profile
                    </button>
                    <Link
                        href="/profile/edit"
                        className="flex items-center gap-2 text-xs font-semibold text-white bg-[#F97316] px-3 py-2 rounded-xl hover:bg-[#C2410C] transition-colors shadow-sm cursor-pointer"
                    >
                        <EditIcon />
                        Edit Profile
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
                                    {userProfile.photoURL ? (
                                        <Image
                                            src={userProfile.photoURL}
                                            alt={userProfile.name}
                                            className="w-full h-full object-cover rounded-2xl"
                                        />
                                    ) : (
                                        userProfile.name.charAt(0).toUpperCase()
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
                                <EditIcon />
                                Edit
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
                                    {userProfile.name}
                                </h2>
                                {userProfile.role === "top_reporter" && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">
                                        🔥 Top Reporter
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                {userProfile.bio}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                                <LocationIcon />
                                {userProfile.location}
                            </span>
                            <span className="flex items-center gap-1">
                                <CalendarIcon />
                                Joined{" "}
                                {userProfile.joinedAt.toLocaleDateString(
                                    "en-US",
                                    {
                                        month: "short",
                                        year: "numeric",
                                    },
                                )}
                            </span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                Online
                            </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                {
                                    label: "Issues",
                                    value: stats.issuesCount.toString(),
                                    icon: "📋",
                                },
                                {
                                    label: "Upvotes",
                                    value: formatNum(stats.upvotesReceived),
                                    icon: "⬆️",
                                },
                                {
                                    label: "Badges",
                                    value: stats.badgesCount.toString(),
                                    icon: "🏅",
                                },
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

                {/* Impact Banner */}
                <div className="bg-[#EA580C] rounded-2xl p-4 text-white relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle, #fff 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
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
                            {userProfile.impactScore} pts
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                            <div
                                className="bg-white rounded-full h-2 transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/60">
                            <span>
                                Level {userProfile.level} —{" "}
                                {userProfile.levelName}
                            </span>
                            <span>
                                {userProfile.impactScore} /{" "}
                                {userProfile.pointsToNextLevel} pts to Level{" "}
                                {userProfile.level + 1}
                            </span>
                        </div>
                    </div>
                </div>

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
                                            Be the first to report an issue in
                                            your community
                                        </p>
                                        <Link
                                            href="/create-issue"
                                            className="inline-block mt-4 text-xs font-semibold text-[#F97316] bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors"
                                        >
                                            Report an Issue
                                        </Link>
                                    </div>
                                ) : (
                                    issues.map((issue) => {
                                        const s = statusMap[issue.status];
                                        return (
                                            <Link
                                                href={`/issues/${issue.id}`}
                                                key={issue.id}
                                            >
                                                <div className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#F97316]/20 hover:bg-orange-50/30 transition-all cursor-pointer">
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
                                            </Link>
                                        );
                                    })
                                )}
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
                                {badges.length === 0 ? (
                                    <div className="col-span-full text-center py-10">
                                        <div className="text-4xl mb-3">🏅</div>
                                        <p className="font-semibold text-gray-700 text-sm">
                                            No badges yet
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Start posting issues to earn badges!
                                        </p>
                                    </div>
                                ) : (
                                    badges.map((b, i) => (
                                        <div
                                            key={i}
                                            className="p-3.5 rounded-xl text-center transition-all bg-gray-50 border border-gray-100"
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
                                            <div className="text-[10px] text-gray-400 leading-snug">
                                                {b.desc}
                                            </div>
                                            <div className="mt-2 text-[10px] font-bold text-[#F97316]">
                                                ✓ Earned{" "}
                                                {b.earnedAt &&
                                                    `• ${formatTimeAgo(b.earnedAt)}`}
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
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#F97316] transition-colors cursor-pointer"
                >
                    <LogoutIcon />
                    Sign Out
                </button>

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
