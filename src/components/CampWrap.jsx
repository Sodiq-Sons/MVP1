"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from "firebase/firestore";
import Link from "next/link";

const SLIDES = [
    "intro",
    "posts",
    "upvotes",
    "comments",
    "streak",
    "personality",
    "badge",
    "platoon",
    "outro",
];

const BG_GRADIENTS = [
    "from-indigo-900 via-purple-900 to-pink-900",
    "from-orange-900 via-red-900 to-pink-900",
    "from-emerald-900 via-teal-900 to-cyan-900",
    "from-sky-900 via-blue-900 to-indigo-900",
    "from-amber-900 via-orange-900 to-red-900",
    "from-purple-900 via-violet-900 to-indigo-900",
    "from-fuchsia-900 via-pink-900 to-rose-900",
    "from-blue-900 via-indigo-900 to-purple-900",
    "from-rose-900 via-pink-900 to-fuchsia-900",
];

const SLIDE_DURATION = 8000;

function getPersonality(data) {
    const { posts = 0, upvotes = 0, streak = 0, comments = 0 } = data || {};
    if (streak >= 10) return { emoji: "🎯", title: "The Consistent One", desc: "You showed up every single day. Iron discipline." };
    if (upvotes >= 50) return { emoji: "🌟", title: "The Crowd Pleaser", desc: "People love what you share. Camp's fan favourite!" };
    if (posts >= 15) return { emoji: "📢", title: "The Voice of Camp", desc: "You never ran out of things to say. Camp MVP." };
    if (comments >= 20) return { emoji: "💬", title: "The Connector", desc: "Always in the conversation. Camp's social butterfly." };
    if (posts >= 5) return { emoji: "⭐", title: "The Rising Star", desc: "You're finding your voice. The best is yet to come." };
    return { emoji: "👀", title: "The Observer", desc: "Taking it all in. Sometimes the quiet ones see the most." };
}

// ── Slide components ─────────────────────────────────────────────────────

function SlideIntro({ name }) {
    return (
        <div className="flex flex-col items-center justify-center text-center gap-6 px-8">
            <div className="text-7xl animate-bounce">🏕️</div>
            <h1 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                Your Camp<br />Experience
            </h1>
            <p className="text-white/70 text-base max-w-xs">
                {name ? `Here's your 2026 NYSC wrap, ${name.split(" ")[0]}.` : "Here's your 2026 NYSC wrap."}
            </p>
            <div className="flex flex-col gap-1 items-center mt-2">
                <p className="text-white/40 text-xs animate-pulse">Swipe or tap to continue</p>
                <span className="text-white/40 text-lg">→</span>
            </div>
        </div>
    );
}

function SlideNumber({ emoji, value, label, sublabel, accent }) {
    return (
        <div className="flex flex-col items-center justify-center text-center gap-4 px-8">
            <div className="text-5xl">{emoji}</div>
            <div
                className="text-8xl font-black leading-none"
                style={{ color: accent || "white", fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
                {value}
            </div>
            <div>
                <p className="text-xl font-bold text-white">{label}</p>
                {sublabel && <p className="text-white/60 text-sm mt-2 max-w-xs">{sublabel}</p>}
            </div>
        </div>
    );
}

function SlidePersonality({ data }) {
    const p = getPersonality(data);
    return (
        <div className="flex flex-col items-center justify-center text-center gap-5 px-8">
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Your camp personality</p>
            <div className="text-7xl">{p.emoji}</div>
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                {p.title}
            </h2>
            <p className="text-white/60 text-sm max-w-xs">{p.desc}</p>
        </div>
    );
}

function SlideTopBadge({ badges }) {
    const top = badges[0];
    if (!top) {
        return (
            <div className="flex flex-col items-center justify-center text-center gap-4 px-8">
                <div className="text-5xl">🏅</div>
                <p className="text-2xl font-black text-white">No badges yet</p>
                <p className="text-white/60 text-sm max-w-xs">Keep engaging to earn your first badge!</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center text-center gap-4 px-8">
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Your top badge</p>
            <div className="text-7xl">{top.emoji}</div>
            <p className="text-3xl font-black text-white">{top.label}</p>
            {badges.length > 1 && (
                <div className="flex gap-2 flex-wrap justify-center mt-1">
                    {badges.slice(1, 4).map((b, i) => (
                        <span key={i} className="text-2xl">{b.emoji}</span>
                    ))}
                    {badges.length > 4 && (
                        <span className="text-white/50 text-sm self-center">+{badges.length - 4} more</span>
                    )}
                </div>
            )}
        </div>
    );
}

function SlideOutro({ name }) {
    return (
        <div className="flex flex-col items-center justify-center text-center gap-6 px-8">
            <div className="text-7xl">🎉</div>
            <h2 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                Keep making<br />an impact!
            </h2>
            <p className="text-white/60 text-sm max-w-xs">
                This is just the beginning. Your voice matters. Keep sharing, keep connecting, and keep building.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
                <Link
                    href="/"
                    className="block bg-white text-gray-900 font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95"
                >
                    Back to Feed
                </Link>
                <Link
                    href="/create-issue"
                    className="block bg-white/10 text-white font-bold py-3.5 rounded-2xl text-sm border border-white/20 transition-all active:scale-95"
                >
                    Share something new
                </Link>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────

export default function CampWrap() {
    const [current, setCurrent] = useState(0);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authed, setAuthed] = useState(false);
    const [muted, setMuted] = useState(false);
    const [started, setStarted] = useState(false);
    const touchStart = useRef(null);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const hasPlayedRef = useRef(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user || user.isAnonymous) { setLoading(false); return; }
            setAuthed(true);
            try {
                const [userSnap, statsSnap, badgesSnap, issuesSnap] = await Promise.all([
                    getDoc(doc(db, "users", user.uid)),
                    getDoc(doc(db, "users", user.uid, "stats", "overview")),
                    getDocs(collection(db, "users", user.uid, "badges")),
                    getDocs(query(
                        collection(db, "issues"),
                        where("author.uid", "==", user.uid),
                        orderBy("upvotes", "desc"),
                    )),
                ]);

                const u = userSnap.exists() ? userSnap.data() : {};
                const s = statsSnap.exists() ? statsSnap.data() : {};
                const badges = badgesSnap.docs.map((d) => d.data());
                const topPost = issuesSnap.docs[0]?.data() || null;

                setData({
                    name: user.displayName || u.displayName || "Corper",
                    posts: s.issuesCount || issuesSnap.size || 0,
                    upvotes: s.upvotesReceived || 0,
                    comments: s.commentsPosted || 0,
                    streak: u.streak || 0,
                    maxStreak: u.maxStreak || 0,
                    score: u.impactScore || 0,
                    platoon: u.platoon || null,
                    badges,
                    topPost,
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    // Mute/unmute sync + stop audio on unmount
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = muted;

        return () => {
            audio.pause();
            audio.currentTime = 0;
            hasPlayedRef.current = false;
        };
    }, [muted]);

    const tryPlayAudio = () => {
        const audio = audioRef.current;
        if (!audio || hasPlayedRef.current) return;
        audio.play().catch(() => {});
        hasPlayedRef.current = true;
    };

    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrent((c) => (c < SLIDES.length - 1 ? c + 1 : c));
        }, SLIDE_DURATION);
    };

    const goTo = (idx) => {
        const clamped = Math.max(0, Math.min(SLIDES.length - 1, idx));
        setCurrent(clamped);
        startTimer();
    };

    const handleStart = () => {
        setStarted(true);
        setTimeout(() => {
            tryPlayAudio();
            startTimer();
        }, 50);
    };

    const handleTouchStart = (e) => {
        touchStart.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (touchStart.current == null) return;
        const delta = touchStart.current - e.changedTouches[0].clientX;
        if (delta > 40) goTo(current + 1);
        if (delta < -40) goTo(current - 1);
        touchStart.current = null;
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
        );
    }

    // ── Auth gate ──
    if (!authed) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-6">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-white font-bold text-lg">Sign in to see your wrap</p>
                    <Link href="/login" className="mt-4 inline-block bg-white text-black font-bold px-6 py-3 rounded-2xl text-sm">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    // ── Splash / tap-to-start screen ──
    if (!started) {
        return (
            <div
                className={`min-h-screen bg-gradient-to-br ${BG_GRADIENTS[0]} flex flex-col items-center justify-center gap-6 cursor-pointer select-none`}
                onClick={handleStart}
            >
                <div className="text-7xl animate-bounce">🏕️</div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    Your Camp Wrap
                </h1>
                <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl animate-pulse">
                        🎵
                    </div>
                    <p className="text-white/60 text-sm">Tap anywhere to begin</p>
                </div>
            </div>
        );
    }

    const slide = SLIDES[current];

    // ── Main wrap UI ──
    return (
        <div
            className={`min-h-screen bg-gradient-to-br ${BG_GRADIENTS[current]} flex flex-col items-stretch transition-all duration-700`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <audio ref={audioRef} src="/audio/wrap-theme.mp3" loop preload="auto" />

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-safe pt-4">
                <div className="flex gap-1 flex-1">
                    {SLIDES.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => goTo(i)}
                            className={`flex-1 h-1 rounded-full cursor-pointer transition-all duration-300 ${
                                i <= current ? "bg-white" : "bg-white/25"
                            }`}
                        />
                    ))}
                </div>
                <button
                    onClick={() => setMuted((m) => !m)}
                    className="ml-3 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm shrink-0"
                    aria-label={muted ? "Unmute" : "Mute"}
                >
                    {muted ? "🔇" : "🎵"}
                </button>
            </div>

            {/* Slide content */}
            <div
                className="flex-1 flex items-center justify-center"
                onClick={() => goTo(current + 1)}
            >
                {slide === "intro" && <SlideIntro name={data?.name} />}
                {slide === "posts" && (
                    <SlideNumber
                        emoji="📋"
                        value={data?.posts ?? 0}
                        label="Posts shared"
                        sublabel={
                            data?.topPost
                                ? `Your top post: "${(data.topPost.title || "").slice(0, 45)}…"`
                                : "Every post makes camp better."
                        }
                        accent="#FED7AA"
                    />
                )}
                {slide === "upvotes" && (
                    <SlideNumber
                        emoji="👍"
                        value={data?.upvotes ?? 0}
                        label="Likes received"
                        sublabel="Real people liked your posts. Your voice landed."
                        accent="#86EFAC"
                    />
                )}
                {slide === "comments" && (
                    <SlideNumber
                        emoji="💬"
                        value={data?.comments ?? 0}
                        label="Comments left"
                        sublabel="Every comment you left sparked a conversation."
                        accent="#93C5FD"
                    />
                )}
                {slide === "streak" && (
                    <SlideNumber
                        emoji="🔥"
                        value={data?.maxStreak ?? 0}
                        label="Longest streak"
                        sublabel={`Current streak: ${data?.streak ?? 0} day${data?.streak !== 1 ? "s" : ""}. Keep the flame alive.`}
                        accent="#FCA5A5"
                    />
                )}
                {slide === "personality" && <SlidePersonality data={data} />}
                {slide === "badge" && <SlideTopBadge badges={data?.badges ?? []} />}
                {slide === "platoon" && (
                    data?.platoon
                        ? <SlideNumber
                            emoji="👥"
                            value={data.platoon}
                            label="Your platoon"
                            sublabel="Check the leaderboard to see how your platoon ranks"
                            accent="#C4B5FD"
                          />
                        : <SlideNumber
                            emoji="👥"
                            value="?"
                            label="No platoon set"
                            sublabel="Update your profile to join the platoon competition"
                          />
                )}
                {slide === "outro" && <SlideOutro name={data?.name} />}
            </div>

            {/* Nav dots */}
            <div className="flex justify-center gap-2 pb-8">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); goTo(i); }}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                            i === current ? "bg-white scale-125" : "bg-white/30"
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}