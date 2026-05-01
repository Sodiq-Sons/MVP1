"use client";

import { useState } from "react";
import Link from "next/link";

// ── Icons ──────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-4 h-4 shrink-0"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const GoogleIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
    >
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

// ── Shared primitives ──────────────────────────────────────────────────────

function LiveBadge({ count = 147 }) {
    return (
        <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
            <span
                className="text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap"
                style={{ fontFamily: "DM Sans, sans-serif" }}
            >
                {count} live
            </span>
        </div>
    );
}

function PrimaryBtn({ children, onClick, className = "", disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white font-bold text-sm sm:text-[15px] py-3 sm:py-3.5 md:py-4 rounded-2xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
        >
            {children}
        </button>
    );
}

function GhostBtn({ children, onClick, className = "" }) {
    return (
        <button
            onClick={onClick}
            className={`w-full bg-transparent hover:bg-[#FFF5EF] text-[#F97316] font-bold text-sm sm:text-[15px] py-3 sm:py-3.5 md:py-4 rounded-2xl border-2 border-[#F97316] transition-colors cursor-pointer ${className}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
        >
            {children}
        </button>
    );
}

function WhiteBtn({ children, onClick, outline = false }) {
    const base =
        "w-full font-bold text-sm sm:text-[15px] py-3 sm:py-3.5 md:py-4 rounded-2xl transition-colors cursor-pointer";
    if (outline) {
        return (
            <button
                onClick={onClick}
                className={`${base} bg-white/15 hover:bg-white/25 text-white border-2 border-white/45`}
                style={{ fontFamily: "DM Sans, sans-serif" }}
            >
                {children}
            </button>
        );
    }
    return (
        <button
            onClick={onClick}
            className={`${base} bg-white hover:bg-[#FFF5EF] text-[#F97316]`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
        >
            {children}
        </button>
    );
}

function StepDots({ active = 0, total = 3 }) {
    return (
        <div className="flex gap-1.5 items-center">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${i === active ? "bg-white w-5" : "bg-white/30 w-2"}`}
                />
            ))}
        </div>
    );
}

function StepBar({ pct }) {
    return (
        <div className="h-0.75 bg-white/25 rounded-full overflow-hidden mt-3.5">
            <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

/** Shared page header with orange gradient */
function PageHeader({
    children,
    onBack,
    backLabel = "Back",
    stepDots,
    stepLabel,
    className = "",
}) {
    return (
        <div
            className={`bg-[#F97316] px-4 sm:px-6 md:px-8 lg:px-12 pt-5 sm:pt-6 md:pt-8 pb-6 sm:pb-7 md:pb-10 ${className}`}
        >
            <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto w-full">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-white/30 transition-colors"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            <ChevronLeft /> {backLabel}
                        </button>
                    ) : (
                        <div />
                    )}
                    {stepDots && (
                        <StepDots
                            active={stepDots.active}
                            total={stepDots.total}
                        />
                    )}
                    {stepLabel && (
                        <span className="text-xs text-white/60">
                            {stepLabel}
                        </span>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}

function InputField({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    id,
}) {
    return (
        <div>
            {label && (
                <label
                    htmlFor={id}
                    className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-[1.5px] border-[#E8DDD4] focus:border-[#F97316] outline-none text-sm sm:text-[15px] text-gray-900 placeholder-gray-300 bg-white transition-colors"
                style={{ fontFamily: "DM Sans, sans-serif" }}
            />
        </div>
    );
}

// Shared content wrapper
function ContentWrap({ children, className = "" }) {
    return (
        <div
            className={`px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 md:py-6 ${className}`}
        >
            <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto w-full">
                {children}
            </div>
        </div>
    );
}

// ── SCREEN 1 — Splash ──────────────────────────────────────────────────────

function SplashScreen({ goTo }) {
    return (
        <div className="flex flex-col bg-[#F97316] min-h-screen">
            <div className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 pt-8 sm:pt-10 md:pt-14 lg:pt-16 pb-6 sm:pb-8 max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto w-full">
                {/* Topbar */}
                <div className="flex items-center justify-between mb-16 md:mb-7">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-[13px] flex items-center justify-center text-lg sm:text-xl shrink-0">
                            🛡️
                        </div>
                        <div>
                            <div
                                className="text-white font-extrabold text-sm sm:text-base md:text-lg leading-tight"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Naija Connect
                            </div>
                            <div className="text-white/70 text-[10px] sm:text-xs leading-none mt-0.5">
                                Be the voice. Drive the change.
                            </div>
                        </div>
                    </div>
                    <LiveBadge />
                </div>

                {/* Hero copy */}
                <div className="mt-2 sm:mt-4 md:mt-8 lg:mt-16 mb-5 sm:mb-6 md:mb-8">
                    <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 md:mb-5">
                        🇳🇬
                    </div>
                    <h1
                        className="text-white font-extrabold text-2xl sm:text-[28px] md:text-[32px] lg:text-[40px] leading-tight mb-2.5 sm:mb-3 md:mb-4"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Your camp is already talking.
                    </h1>
                    <p
                        className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Gists. Issues. Hot takes. Polls. Everything happening in
                        camp — in real time, all in one place.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-5 sm:mb-6 md:mb-8">
                    {[
                        ["100", "Corps members"],
                        ["50K+", "Gists dropped"],
                        ["5", "Active camps"],
                    ].map(([n, l]) => (
                        <div
                            key={l}
                            className="bg-white/15 rounded-[13px] py-3.5 sm:py-4 md:py-5 text-center px-1"
                        >
                            <div
                                className="text-white font-extrabold text-base sm:text-lg md:text-xl lg:text-2xl"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                {n}
                            </div>
                            <div
                                className="text-white/70 text-[9px] sm:text-[10px] md:text-xs mt-0.5 leading-snug"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {l}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col md:flex-row gap-3.5 sm:gap-4 mt-4">
                    <WhiteBtn onClick={() => goTo("feed-preview")}>
                        See what they&apos;re saying →
                    </WhiteBtn>
                    <WhiteBtn outline>
                        <Link href="/login" className="block">
                            I already have an account
                        </Link>
                    </WhiteBtn>
                </div>
            </div>
        </div>
    );
}

// ── SCREEN 2 — Feed Preview ────────────────────────────────────────────────

const PREVIEW_POSTS = [
    {
        id: 1,
        tag: "🔥 GIST",
        tagColor: "text-[#F97316]",
        tagBg: "bg-[#FFF0E6]",
        title: 'The parade commander is definitely not from this planet 😭 how does 5am count as "morning"?',
        meta: "Sokoto Camp · 23 min ago · Anonymous",
        votes: 63,
        voteColor: "text-[#F97316]",
        voteBg: "bg-[#FFF0E6]",
        poll: null,
    },
    {
        id: 2,
        tag: "📊 POLL",
        tagColor: "text-purple-700",
        tagBg: "bg-purple-50",
        title: "Should NYSC extend camp by 2 more weeks?",
        meta: "Lagos Camp · 248 voted · 41 min ago",
        votes: null,
        poll: { label: "No — please God, release us 😭", pct: 61 },
    },
    {
        id: 3,
        tag: "🚨 ISSUE",
        tagColor: "text-red-700",
        tagBg: "bg-red-50",
        title: "Hostel block B has no running water since Day 1. Who do we report this to?",
        meta: "Rivers Camp · 38 upvotes · 1h ago",
        votes: 38,
        voteColor: "text-red-600",
        voteBg: "bg-red-50",
        poll: null,
    },
];

function FeedPreviewScreen({ goTo }) {
    return (
        <div
            className="flex flex-col min-h-full"
            style={{ background: "#FDF6EF" }}
        >
            <PageHeader onBack={() => goTo("splash")}>
                <div className="flex items-center justify-between -mt-1 mb-4 sm:mb-5">
                    <div />{" "}
                    {/* spacer — back btn already rendered in PageHeader */}
                    <LiveBadge count={300} />
                </div>
                <h2
                    className="text-white font-extrabold text-xl sm:text-2xl md:text-[26px] leading-snug mb-1.5"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Don&apos;t be the last to know 👀
                </h2>
                <p
                    className="text-white/78 text-xs sm:text-sm"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    These dropped in the last 2 hours
                </p>
            </PageHeader>

            {/* We need a custom header layout here so let's redo it inline */}
            <div className="flex-1 overflow-y-auto">
                <ContentWrap className="flex flex-col gap-3">
                    {PREVIEW_POSTS.map((p) => (
                        <div
                            key={p.id}
                            className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.07] shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start gap-2.5 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                    <span
                                        className={`inline-block text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${p.tagBg} ${p.tagColor}`}
                                    >
                                        {p.tag}
                                    </span>
                                    <p
                                        className="font-bold text-sm sm:text-[15px] text-gray-900 mt-2 leading-snug"
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        {p.title}
                                    </p>
                                    {p.poll && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-1.5">
                                                <span className="truncate pr-2">
                                                    {p.poll.label}
                                                </span>
                                                <span className="font-bold text-[#F97316] shrink-0">
                                                    {p.poll.pct}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-[#F5EDE5] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#F97316] rounded-full"
                                                    style={{
                                                        width: `${p.poll.pct}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        className="text-[11px] sm:text-xs text-gray-400 mt-2"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        {p.meta}
                                    </div>
                                </div>
                                {p.votes !== null && (
                                    <div
                                        className={`${p.voteBg} rounded-xl px-2.5 sm:px-3 md:px-4 py-2 text-center shrink-0 flex flex-col items-center min-w-11`}
                                    >
                                        <span
                                            className={`font-extrabold text-base sm:text-[17px] md:text-[19px] ${p.voteColor}`}
                                            style={{
                                                fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                            }}
                                        >
                                            {p.votes}
                                        </span>
                                        <span
                                            className={`text-[9px] sm:text-[10px] font-semibold ${p.voteColor}`}
                                        >
                                            votes
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Paywall teaser */}
                    <div
                        className="rounded-2xl px-4 sm:px-6 py-6 sm:py-8 text-center"
                        style={{
                            background:
                                "linear-gradient(to bottom, rgba(253,246,239,0.3) 0%, #FDF6EF 55%)",
                        }}
                    >
                        <div className="text-2xl sm:text-[28px] mb-2.5">🔒</div>
                        <p
                            className="font-extrabold text-base sm:text-[17px] text-gray-900 mb-1.5"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            +143 more posts today
                        </p>
                        <p
                            className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 leading-relaxed"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Your camp is ahead of you.
                            <br />
                            Takes 30 seconds to catch up.
                        </p>
                        <div className="max-w-xs mx-auto">
                            <PrimaryBtn onClick={() => goTo("camp-select")}>
                                Get in. It&apos;s free. →
                            </PrimaryBtn>
                        </div>
                    </div>

                    <div className="text-center pb-4">
                        <span className="text-xs sm:text-sm text-gray-400">
                            Already have an account?{" "}
                        </span>
                        <button
                            onClick={() => goTo("login")}
                            className="text-xs sm:text-sm text-[#F97316] font-bold cursor-pointer"
                        >
                            Log in →
                        </button>
                    </div>
                </ContentWrap>
            </div>
        </div>
    );
}

// ── SCREEN 3 — Camp Selection ──────────────────────────────────────────────

const CAMPS = [
    { name: "Sokoto — Wamako Camp", count: 312, hot: true },
    { name: "Lagos — Iyana Ipaja Camp", count: 511, hot: false },
    { name: "FCT — Kubwa Camp", count: 289, hot: false },
    { name: "Edo — Ogbe-Ijoh Camp", count: 198, hot: false },
    { name: "Rivers — Nonwa-Tai Camp", count: 423, hot: false },
];

function CampSelectScreen({ goTo, selectedCamp, setSelectedCamp }) {
    return (
        <div
            className="flex flex-col min-h-full"
            style={{ background: "#FDF6EF" }}
        >
            <div className="bg-[#F97316] px-4 sm:px-6 md:px-8 lg:px-12 pt-5 sm:pt-6 md:pt-8 pb-6 sm:pb-7 md:pb-16">
                <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <button
                            onClick={() => goTo("feed-preview")}
                            className="flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-white/30 transition-colors"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            <ChevronLeft /> Back
                        </button>
                        <StepDots active={0} total={3} />
                        <span className="text-xs text-white/60">1 of 3</span>
                    </div>
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-2">
                        🏕️
                    </div>
                    <h2
                        className="text-white font-extrabold text-xl sm:text-[22px] md:text-[26px] leading-snug mb-1.5"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Which camp are you surviving?
                    </h2>
                    <p
                        className="text-white/80 text-sm sm:text-base leading-relaxed"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        We&apos;ll show gists, issues, and drama from your exact
                        camp.
                    </p>
                    <StepBar pct={33} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <ContentWrap className="flex flex-col gap-3 mb-12 md:mb-6">
                    <input
                        type="text"
                        placeholder="Search camp or state..."
                        className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-[1.5px] border-[#E8DDD4] focus:border-[#F97316] outline-none text-sm sm:text-[15px] text-gray-900 placeholder-gray-300 bg-white transition-colors mb-4"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    />

                    <div className="flex flex-col gap-2 sm:gap-2.5">
                        {CAMPS.map((camp) => (
                            <button
                                key={camp.name}
                                onClick={() => setSelectedCamp(camp.name)}
                                className={`w-full text-left rounded-2xl p-3.5 sm:p-4 border-[1.5px] transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    selectedCamp === camp.name
                                        ? "border-[#F97316] bg-[#FFF0E6]"
                                        : "border-[#E8DDD4] bg-white hover:border-[#F97316] hover:bg-[#FFF8F4]"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div
                                        className="font-bold text-sm sm:text-[15px] text-gray-900 truncate"
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        {camp.name}
                                    </div>
                                    <div
                                        className={`text-xs mt-1 font-semibold ${
                                            camp.hot ||
                                            selectedCamp === camp.name
                                                ? "text-[#F97316]"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {camp.count} corpers{" "}
                                        {camp.hot || selectedCamp === camp.name
                                            ? "already here 🔥"
                                            : "here"}
                                    </div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                        selectedCamp === camp.name
                                            ? "border-[#F97316] bg-[#F97316]"
                                            : "border-[#D0C8C0]"
                                    }`}
                                >
                                    {selectedCamp === camp.name && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 md:pt-6 pb-2">
                        <PrimaryBtn
                            onClick={() => goTo("username")}
                            disabled={!selectedCamp}
                        >
                            That&apos;s my camp →
                        </PrimaryBtn>
                    </div>
                </ContentWrap>
            </div>
        </div>
    );
}

// ── SCREEN 4 — Username + Anon Toggle ──────────────────────────────────────

const SUGGESTED_NAMES = [
    "SilentCorper",
    "CampVoice_88",
    "NaijaRookie_7",
    "BarracksBoss",
    "KhakiVibes",
];

function UsernameScreen({ goTo, username, setUsername, anon, setAnon }) {
    return (
        <div
            className="flex flex-col min-h-full"
            style={{ background: "#FDF6EF" }}
        >
            <div className="bg-[#F97316] px-4 sm:px-6 md:px-8 lg:px-12 pt-5 sm:pt-6 md:pt-8 pb-6 sm:pb-7 md:pb-10">
                <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <button
                            onClick={() => goTo("camp-select")}
                            className="flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-white/30 transition-colors"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            <ChevronLeft /> Back
                        </button>
                        <StepDots active={1} total={3} />
                        <span className="text-xs text-white/60">2 of 3</span>
                    </div>
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-2">
                        ✍️
                    </div>
                    <h2
                        className="text-white font-extrabold text-xl sm:text-[22px] md:text-[26px] leading-snug mb-1.5"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        What should the camp call you?
                    </h2>
                    <p
                        className="text-white/80 text-sm sm:text-base leading-relaxed"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Pick a name — or go fully anonymous. No judgment here.
                    </p>
                    <StepBar pct={66} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <ContentWrap className="flex flex-col gap-4">
                    <InputField
                        label="Your camp alias"
                        type="text"
                        placeholder="Pick a username..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        id="usernameInput"
                    />

                    {/* Suggestion chips — wraps naturally */}
                    <div className="flex flex-wrap gap-2 my-4">
                        {SUGGESTED_NAMES.map((name) => (
                            <button
                                key={name}
                                onClick={() => setUsername(name)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                    username === name
                                        ? "bg-[#F97316] text-white border-2 border-[#F97316]"
                                        : "bg-[#FFF0E6] text-[#C05207] border-2 border-transparent hover:border-[#F97316]"
                                }`}
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    {/* Anon toggle — fixed using proper CSS */}
                    <div className="flex items-center justify-between bg-white rounded-xl p-4 border-[1.5px] border-[#E8DDD4] gap-4 mb-4">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-gray-900">
                                Post anonymously 👀
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                Your secrets are safe. For real.
                            </div>
                        </div>
                        <button
                            onClick={() => setAnon(!anon)}
                            role="switch"
                            aria-checked={anon}
                            className={`relative shrink-0 w-10 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${
                                anon ? "bg-[#F97316]" : "bg-[#E0D8D0]"
                            }`}
                            style={{ minWidth: "2.5rem" }}
                        >
                            <span
                                className="block w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 shadow-sm transition-transform duration-200"
                                style={{
                                    transform: anon
                                        ? "translateX(19px)"
                                        : "translateX(3px)",
                                }}
                            />
                        </button>
                    </div>

                    <div className="bg-[#FFF8F4] rounded-xl p-3.5 border border-[#FDDCCA] flex gap-2.5 sm:gap-3 items-start">
                        <div className="text-base sm:text-lg shrink-0 mt-0.5">
                            🫣
                        </div>
                        <div className="text-xs text-[#C05207] leading-relaxed">
                            Anonymous posts reach{" "}
                            <strong>40% more people</strong> — camp is always
                            more honest when nobody&apos;s watching.
                        </div>
                    </div>

                    <div className="pt-2 pb-2">
                        <PrimaryBtn onClick={() => goTo("first-vote")}>
                            Lock it in →
                        </PrimaryBtn>
                    </div>
                </ContentWrap>
            </div>
        </div>
    );
}

// ── SCREEN 5 — First Vote ──────────────────────────────────────────────────

const VOTE_OPTIONS = [
    "Yes — we need more time to bond 🤝",
    "No — please God, release us 😭",
    "Meh — camp is camp sha 🤷",
];

function FirstVoteScreen({ goTo }) {
    const [picked, setPicked] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const doVote = (idx) => {
        setPicked(idx);
        setTimeout(() => setShowResult(true), 100);
    };

    return (
        <div
            className="flex flex-col min-h-full"
            style={{ background: "#FDF6EF" }}
        >
            <div className="bg-[#F97316] px-4 sm:px-6 md:px-8 lg:px-12 pt-5 sm:pt-6 md:pt-8 pb-6 sm:pb-7 md:pb-10">
                <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <button
                            onClick={() => goTo("username")}
                            className="flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-white/30 transition-colors"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            <ChevronLeft /> Back
                        </button>
                        <StepDots active={2} total={3} />
                        <span className="text-xs text-white/60">3 of 3</span>
                    </div>
                    <div className="text-[10px] text-white/65 font-bold uppercase tracking-wider mb-2">
                        Before you go — settle this debate
                    </div>
                    <h2
                        className="text-white font-extrabold text-lg sm:text-xl md:text-[22px] leading-snug mb-2"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Should NYSC extend camp by 2 more weeks?
                    </h2>
                    <div className="text-xs sm:text-sm text-white/60">
                        248 corpers already voted · Your camp needs your take
                    </div>
                    <StepBar pct={100} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <ContentWrap className="flex flex-col gap-4">
                    {!showResult ? (
                        <>
                            <div className="flex flex-col gap-2.5">
                                {VOTE_OPTIONS.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => doVote(i)}
                                        className={`w-full text-left px-4 py-3.5 sm:py-4 rounded-xl border-[1.5px] bg-white text-sm sm:text-[15px] font-medium transition-all cursor-pointer ${
                                            picked === i
                                                ? "border-[#F97316] bg-[#FFF0E6] text-[#C05207] font-bold"
                                                : "border-[#E8DDD4] hover:border-[#F97316] hover:bg-[#FFF8F4] text-gray-900"
                                        }`}
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <div className="text-center">
                                <span className="text-xs sm:text-sm text-gray-300">
                                    Tap any option to cast your vote
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border border-black/[0.07] shadow-sm">
                                <div className="text-center pb-4">
                                    <div
                                        className="font-extrabold text-2xl sm:text-3xl text-[#F97316]"
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        +10 pts
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-400 mt-1.5">
                                        You voted. The debate just got louder.
                                        🔥
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {[
                                        {
                                            label: "No — release us 😭",
                                            pct: 61,
                                            color: "#F97316",
                                        },
                                        {
                                            label: "Yes — more time 🤝",
                                            pct: 27,
                                            color: "#aaa",
                                        },
                                        {
                                            label: "Meh sha 🤷",
                                            pct: 12,
                                            color: "#ddd",
                                        },
                                    ].map((r, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-1 gap-2">
                                                <span className="truncate">
                                                    {r.label}
                                                </span>
                                                <span
                                                    className={`shrink-0 ${i === 0 ? "font-bold text-[#F97316]" : ""}`}
                                                >
                                                    {r.pct}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-[#F5EDE5] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${r.pct}%`,
                                                        background: r.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pb-2">
                                <Link
                                    href="/login"
                                    className="w-full flex items-center justify-center bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white font-bold text-sm sm:text-[15px] py-3 sm:py-3.5 md:py-4 rounded-2xl transition-all cursor-pointer"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Continue to login →
                                </Link>
                            </div>
                        </>
                    )}
                </ContentWrap>
            </div>
        </div>
    );
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
    const [screen, setScreen] = useState("splash");
    const [selectedCamp, setSelectedCamp] = useState(null);
    const [username, setUsername] = useState("CampVoice_88");
    const [anon, setAnon] = useState(false);

    const goTo = (s) => {
        setScreen(s);
        window.scrollTo({ top: 0, behavior: "instant" });
    };

    return (
        <div className="min-h-screen bg-[#111] flex justify-center">
            <div className="w-full max-w-full min-h-screen bg-[#FDF6EF] relative overflow-x-hidden">
                {screen === "splash" && <SplashScreen goTo={goTo} />}
                {screen === "feed-preview" && <FeedPreviewScreen goTo={goTo} />}
                {screen === "camp-select" && (
                    <CampSelectScreen
                        goTo={goTo}
                        selectedCamp={selectedCamp}
                        setSelectedCamp={setSelectedCamp}
                    />
                )}
                {screen === "username" && (
                    <UsernameScreen
                        goTo={goTo}
                        username={username}
                        setUsername={setUsername}
                        anon={anon}
                        setAnon={setAnon}
                    />
                )}
                {screen === "first-vote" && <FirstVoteScreen goTo={goTo} />}
            </div>
        </div>
    );
}
