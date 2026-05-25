"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    startAt,
    endAt,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// ── Icons
const SearchIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5 text-gray-400"
    >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

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
        className="w-3 h-3"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const PostIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const UpvoteIcon = () => (
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

const BadgeIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
);

const UserXIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-12 h-12 text-gray-300"
    >
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="18" y1="8" x2="23" y2="13" />
        <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
);

const TrendingIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
    </svg>
);

// ── Level config ──────────────────────────────────────────────────────────────
const LEVELS = [
    { level: 1, name: "New Voice", min: 0 },
    { level: 2, name: "Active Citizen", min: 100 },
    { level: 3, name: "Community Voice", min: 300 },
    { level: 4, name: "Local Leader", min: 600 },
    { level: 5, name: "Change Maker", min: 1000 },
    { level: 6, name: "Community Champion", min: 1500 },
    { level: 7, name: "City Influencer", min: 2500 },
    { level: 8, name: "State Ambassador", min: 4000 },
    { level: 9, name: "National Voice", min: 6000 },
    { level: 10, name: "Legendary Citizen", min: 10000 },
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-card rounded-2xl p-4 border border-cp-border animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                <div className="h-6 bg-muted rounded-full flex-1" />
                <div className="h-6 bg-muted rounded-full flex-1" />
                <div className="h-6 bg-muted rounded-full flex-1" />
            </div>
        </div>
    );
}

// ── Profile Card ──────────────────────────────────────────────────────────────
function UserProfileCard({ user }) {
    const levelData = getLevelData(user.impactScore || 0);
    const location =
        typeof user.location === "object"
            ? [user.location?.city, user.location?.state]
                  .filter(Boolean)
                  .join(", ") || "Nigeria"
            : user.location || "Nigeria";

    const roleBadge =
        user.role === "top_reporter"
            ? {
                  label: "🔥 Top Reporter",
                  cls: "bg-cp-tint text-cp border-cp/20",
              }
            : user.role === "admin"
              ? {
                    label: "⚡ Admin",
                    cls: "bg-purple-50 text-purple-600 border-purple-100",
                }
              : null;

    return (
        <Link href={`/profile/${user.uid}`}>
            <div className="bg-card rounded-2xl mb-2 md:mb-0 p-4 border border-cp-border hover:border-cp/40 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-cp flex items-center justify-center text-white text-xl font-black border-2 border-white shadow overflow-hidden">
                            {user.photoURL ? (
                                <Image
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (user.displayName || user.fullName || "U")
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>
                        {user.isVerified && (
                            <div
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                                style={{ background: "var(--cp)" }}
                                title="Profile complete"
                            >
                                <svg viewBox="0 0 16 16" fill="white" className="w-2 h-2">
                                    <path d="M13 3.5 6.5 10 3 6.5l-1 1L6.5 12 14 4.5z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3
                                className="font-bold text-gray-900 text-sm group-hover:text-cp transition-colors"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {user.fullName || user.displayName || "User"}
                            </h3>
                            {roleBadge && (
                                <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${roleBadge.cls}`}
                                >
                                    {roleBadge.label}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cp-tint text-cp">
                                Lv.{levelData.level} · {levelData.name}
                            </span>
                        </div>
                        {user.bio && user.bio !== "No bio yet" && (
                            <p
                                className="text-xs text-gray-400 mt-1 line-clamp-1"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {user.bio}
                            </p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                            <LocationIcon />
                            <span>{location}</span>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-subtle">
                    <div className="flex-1 flex flex-col items-center py-1.5 rounded-xl bg-cp-tint">
                        <div className="flex items-center gap-1">
                            <PostIcon />
                            <span className="text-xs font-black text-gray-800">
                                {formatNum(user.stats?.issuesCount || 0)}
                            </span>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                            Posts
                        </span>
                    </div>
                    <div className="w-1.5" />
                    <div className="flex-1 flex flex-col items-center py-1.5 rounded-xl bg-green-50">
                        <div className="flex items-center gap-1">
                            <UpvoteIcon />
                            <span className="text-xs font-black text-gray-800">
                                {formatNum(user.stats?.upvotesReceived || 0)}
                            </span>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                            Upvotes
                        </span>
                    </div>
                    <div className="w-1.5" />
                    <div className="flex-1 flex flex-col items-center py-1.5 rounded-xl bg-purple-50">
                        <div className="flex items-center gap-1">
                            <BadgeIcon />
                            <span className="text-xs font-black text-gray-800">
                                {formatNum(user.stats?.badgesCount || 0)}
                            </span>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                            Badges
                        </span>
                    </div>
                    <div className="w-1.5" />
                    <div className="flex-1 flex flex-col items-center py-1.5 rounded-xl bg-blue-50">
                        <div className="flex items-center gap-1">
                            <TrendingIcon />
                            <span className="text-xs font-black text-gray-800">
                                {formatNum(user.impactScore || 0)}
                            </span>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                            Score
                        </span>
                    </div>
                </div>

                {/* View Profile CTA */}
                <div className="mt-2 text-center">
                    <span className="text-[11px] font-semibold text-cp group-hover:text-cp transition-colors">
                        View Full Profile →
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SearchUsersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [topCampers, setTopCampers] = useState([]);
    const [topLoading, setTopLoading] = useState(true);
    const debounceRef = useRef(null);
    const inputRef = useRef(null);

    // Auth
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
        return () => unsub();
    }, []);

    // Load top campers on mount
    useEffect(() => {
        async function loadTopCampers() {
            try {
                const q = query(
                    collection(db, "users"),
                    where("impactScore", ">", 0),
                    orderBy("impactScore", "desc"),
                    limit(6),
                );
                const snap = await getDocs(q);
                const users = await Promise.all(
                    snap.docs.map(async (d) => {
                        const data = d.data();
                        let statsData = {};
                        try {
                            const { getDoc, doc } =
                                await import("firebase/firestore");
                            const statsSnap = await getDoc(
                                doc(db, "users", d.id, "stats", "overview"),
                            );
                            if (statsSnap.exists())
                                statsData = statsSnap.data();
                        } catch {}
                        return { uid: d.id, ...data, stats: statsData };
                    }),
                );
                setTopCampers(users);
            } catch (err) {
                console.error("Failed to load top campers:", err);
            } finally {
                setTopLoading(false);
            }
        }
        loadTopCampers();
    }, []);

    // Search users by displayName / fullName
    const searchUsers = useCallback(async (q) => {
        if (!q.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        setLoading(true);
        setHasSearched(true);
        try {
            const term = q.trim();
            const termLower = term.toLowerCase();
            const termEnd = termLower.replace(/.$/, (c) =>
                String.fromCharCode(c.charCodeAt(0) + 1),
            );

            // Search by displayName (lowercase prefix)
            const q1 = query(
                collection(db, "users"),
                orderBy("displayNameLower"),
                startAt(termLower),
                endAt(termEnd),
                limit(10),
            );

            // Also try fullName field
            const q2 = query(
                collection(db, "users"),
                orderBy("fullNameLower"),
                startAt(termLower),
                endAt(termEnd),
                limit(10),
            );

            const [snap1, snap2] = await Promise.allSettled([
                getDocs(q1),
                getDocs(q2),
            ]);

            const seen = new Set();
            const allDocs = [];
            if (snap1.status === "fulfilled")
                snap1.value.docs.forEach((d) => {
                    if (!seen.has(d.id)) {
                        seen.add(d.id);
                        allDocs.push(d);
                    }
                });
            if (snap2.status === "fulfilled")
                snap2.value.docs.forEach((d) => {
                    if (!seen.has(d.id)) {
                        seen.add(d.id);
                        allDocs.push(d);
                    }
                });

            // Fallback: get-all and filter client-side (handles apps without lowercase fields)
            if (allDocs.length === 0) {
                const fallbackQ = query(collection(db, "users"), limit(50));
                const fallbackSnap = await getDocs(fallbackQ);
                fallbackSnap.docs.forEach((d) => {
                    const data = d.data();
                    const name = (
                        data.fullName ||
                        data.displayName ||
                        ""
                    ).toLowerCase();
                    if (name.includes(termLower) && !seen.has(d.id)) {
                        seen.add(d.id);
                        allDocs.push(d);
                    }
                });
            }

            // Fetch stats for each user
            const users = await Promise.all(
                allDocs.slice(0, 10).map(async (d) => {
                    const data = d.data();
                    let statsData = {};
                    try {
                        const { getDoc, doc } =
                            await import("firebase/firestore");
                        const statsSnap = await getDoc(
                            doc(db, "users", d.id, "stats", "overview"),
                        );
                        if (statsSnap.exists()) statsData = statsSnap.data();
                    } catch {}
                    return { uid: d.id, ...data, stats: statsData };
                }),
            );

            setResults(users);
        } catch (err) {
            console.error("Search error:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchUsers(searchQuery), 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery, searchUsers]);

    // Auto-focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div
            className="min-h-screen pb-24 md:pb-8"
            style={{ background: "#FDF6EF" }}
        >
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-cp px-4 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white cursor-pointer"
                    >
                        <BackIcon />
                    </button>
                    <div>
                        <h1
                            className="text-white font-bold text-lg leading-tight"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Find Campers
                        </h1>
                        <p className="text-white/60 text-[11px]">
                            Search by name
                        </p>
                    </div>
                </div>
            </header>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-0">
                <div>
                    <h1
                        className="text-2xl font-bold text-gray-900"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Find Campers
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Search for other campers by name
                    </p>
                </div>
            </div>

            {/* Search Box */}
            <div className="px-4 md:px-6 mt-4">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <SearchIcon />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search camper by name…"
                        className="w-full bg-card rounded-2xl pl-12 pr-12 py-4 text-sm text-black placeholder-gray-400 border-2 border-cp-border shadow-sm focus:outline-none focus:border-cp transition-all"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setResults([]);
                                setHasSearched(false);
                                inputRef.current?.focus();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors cursor-pointer text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Results / Default State */}
            <div className="px-4 md:px-6 mt-4 space-y-3">
                {loading && (
                    <>
                        <p
                            className="text-xs text-gray-400 mb-2"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Searching…
                        </p>
                        {[1, 2, 3].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </>
                )}

                {!loading && hasSearched && searchQuery && (
                    <>
                        <p
                            className="text-xs text-gray-400"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            {results.length > 0
                                ? `${results.length} camper${results.length !== 1 ? "s" : ""} found`
                                : "No results"}
                        </p>
                        {results.length > 0 ? (
                            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-3 md:space-y-4">
                                {results.map((user) => (
                                    <UserProfileCard
                                        key={user.uid}
                                        user={user}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="flex justify-center mb-4">
                                    <UserXIcon />
                                </div>
                                <p
                                    className="font-semibold text-gray-700"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    No campers found
                                </p>
                                <p
                                    className="text-gray-400 text-sm mt-1"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Try searching with a different name
                                </p>
                            </div>
                        )}
                    </>
                )}

                {!loading && !searchQuery && (
                    <>
                        {/* Top Campers */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span
                                    className="text-sm font-bold text-gray-800"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    🏆 Top Campers
                                </span>
                                <span className="text-xs text-gray-400">
                                    by impact score
                                </span>
                            </div>
                            {topLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <SkeletonCard key={i} />
                                    ))}
                                </div>
                            ) : topCampers.length > 0 ? (
                                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-3 md:space-y-2">
                                    {topCampers.map((user) => (
                                        <UserProfileCard
                                            key={user.uid}
                                            user={user}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-card rounded-2xl p-8 border border-cp-border text-center">
                                    <div className="text-4xl mb-2">👥</div>
                                    <p
                                        className="text-gray-500 text-sm"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        Start searching to find campers
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
