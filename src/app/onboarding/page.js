"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ONBOARDING_SEEN_KEY } from "@/lib/constants";
import {
    ALL_ALIASES,
    pickRandom,
    fetchTakenAliases,
    claimAlias,
    releaseAlias,
} from "@/lib/campAliases";

// ── Design palette ──────────────────────────────────────────────────────────
// Brand orange follows the theme via var(--cp) / var(--cp-deeper). The warm
// "paper" neutrals are onboarding-specific (no themed token equivalent), so
// they're defined here for this entry surface only.
const P = {
    paper: "#FDF6EF",
    ink: "#1C1408",
    muted: "#897B6B",
    hair: "#F0E6DA",
    white: "#FFFFFF",
    cpTint: "#FFEEE0",
    purple: "#7C3AED",
    purpleTint: "#F3EDFE",
    red: "#DC2626",
    redTint: "#FDECEC",
    greenTint: "#ECFDF3",
    greenBorder: "#C7EAD4",
    greenInk: "#14532D",
    greenSub: "#3F6B4F",
    green: "#16A34A",
};
const JAK = "Plus Jakarta Sans, sans-serif";
const DM = "DM Sans, sans-serif";

// ── Icons ───────────────────────────────────────────────────────────────────
const Arrow = ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);
const Chevron = ({ s = 17 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const Lock = ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const Shield = ({ s = 17 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l7 4v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <polyline points="9 12 11.5 14.5 16 9.5" />
    </svg>
);
const Pin = ({ s = 15 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
const Search = ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const Shuffle = ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
    </svg>
);
const Tent = ({ s = 32 }) => (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ borderRadius: 10, display: "block" }}>
        <rect width="100" height="100" rx="26" fill="var(--cp)" />
        <polygon points="50,24 18,78 82,78" fill="#fff" />
        <polygon points="50,47 41,78 59,78" fill="var(--cp)" />
        <line x1="50" y1="24" x2="50" y2="13" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <polygon points="50,14 68,18 50,22" fill="#fff" />
    </svg>
);

// ── Data ────────────────────────────────────────────────────────────────────
const CAMPS = [
    { name: "Sokoto — Wamako Camp", count: 312, hot: true },
    { name: "Lagos — Iyana Ipaja Camp", count: 511, hot: false },
    { name: "FCT — Kubwa Camp", count: 289, hot: false },
    { name: "Edo — Ogbe-Ijoh Camp", count: 198, hot: false },
    { name: "Rivers — Nonwa-Tai Camp", count: 423, hot: false },
];

const VOTE_OPTIONS = [
    "Yes — we need more time to bond",
    "No — please God, release us 😭",
    "Meh — camp is camp sha",
];

const VOTE_RESULTS = [
    { label: "No — release us 😭", pct: 61, lead: true },
    { label: "Yes — more time", pct: 27, lead: false },
    { label: "Meh sha", pct: 12, lead: false },
];

// ── Shared primitives ───────────────────────────────────────────────────────
function Screen({ children }) {
    return (
        <div style={{ background: P.paper, minHeight: "100%", display: "flex", flexDirection: "column", padding: "22px 20px 24px" }}>
            <div style={{ width: "100%", maxWidth: 460, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
                {children}
            </div>
        </div>
    );
}

function IconButton({ onClick, label, children }) {
    return (
        <button onClick={onClick} aria-label={label} style={{ width: 34, height: 34, borderRadius: 11, background: P.white, border: `1px solid ${P.hair}`, display: "flex", alignItems: "center", justifyContent: "center", color: P.ink, cursor: "pointer" }}>
            {children}
        </button>
    );
}

function Dots({ active }) {
    return (
        <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: i === active ? 22 : 7, height: 7, borderRadius: 999, background: i === active ? "var(--cp)" : "#E4D6C7", transition: "all .25s" }} />
            ))}
        </div>
    );
}

function Eyebrow({ children }) {
    return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "var(--cp-deeper)", textTransform: "uppercase", marginBottom: 11, fontFamily: DM }}>{children}</div>;
}

function PrimaryCTA({ children, onClick, disabled = false, as = "button", href }) {
    const style = { width: "100%", border: "none", borderRadius: 15, padding: 16, fontFamily: JAK, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "var(--cp)", color: "#fff", boxShadow: "0 9px 20px var(--cp-glow)", cursor: "pointer", opacity: disabled ? 0.5 : 1, textDecoration: "none" };
    if (as === "link") {
        return <Link href={href} style={style}>{children}</Link>;
    }
    return <button onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

function TrustLine({ children }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 11.5, color: P.muted, fontFamily: DM }}>
            <Lock /> {children}
        </div>
    );
}

const cardStyle = { background: P.white, border: `1px solid ${P.hair}`, borderRadius: 18, padding: "14px 15px", marginBottom: 11 };
const tagStyle = (fg, bg) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", color: fg, background: bg, fontFamily: DM });
const gistTextStyle = { fontFamily: JAK, fontWeight: 600, fontSize: 14.5, lineHeight: 1.32, color: P.ink, margin: "9px 0 10px", letterSpacing: "-0.01em" };

// ── SCREEN 1 — Splash ───────────────────────────────────────────────────────
function SplashScreen({ goTo }) {
    return (
        <Screen>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 34, minHeight: 34 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Tent />
                    <span style={{ fontFamily: JAK, fontWeight: 800, fontSize: 15, color: P.ink, letterSpacing: "-0.01em" }}>Camp Connect</span>
                </div>
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: P.muted, textDecoration: "none", fontFamily: DM }}>
                    Just browsing <Arrow s={14} />
                </Link>
            </div>

            <Eyebrow>The voice of NYSC</Eyebrow>
            <h1 style={{ fontFamily: JAK, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.025em", color: P.ink, marginBottom: 14 }}>
                Your camp is<br />already <span style={{ color: "var(--cp)" }}>talking.</span>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: P.muted, maxWidth: 300, marginBottom: 24, fontFamily: DM }}>
                Gist, polls, hot takes and the real issues — everything happening in camp, in one place.
            </p>

            <div style={{ ...cardStyle, boxShadow: "0 12px 26px rgba(28,20,8,0.09)", marginBottom: 0 }}>
                <span style={tagStyle("var(--cp-deeper)", P.cpTint)}>Gist</span>
                <div style={gistTextStyle}>Parade commander thinks 5am counts as &ldquo;morning&rdquo;. Who else is suffering? 😭</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, color: P.muted, fontFamily: DM }}>Sokoto Camp · Anonymous · 23m</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: JAK, fontWeight: 700, fontSize: 12.5, color: "var(--cp-deeper)", background: P.cpTint, padding: "4px 9px", borderRadius: 8 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 15 12 9 18 15" /></svg>63
                    </span>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 18 }} />

            <PrimaryCTA onClick={() => goTo("feed-preview")}>See what your camp is saying <Arrow /></PrimaryCTA>
            <Link href="/login" style={{ display: "block", width: "100%", textAlign: "center", fontFamily: DM, fontWeight: 600, fontSize: 13.5, color: P.muted, padding: "13px 0 2px", textDecoration: "none" }}>
                Already a member? <span style={{ color: P.ink, borderBottom: "1.5px solid var(--cp)" }}>Sign in</span>
            </Link>
            <TrustLine>Anonymous to other corpers. Always.</TrustLine>
        </Screen>
    );
}

// ── SCREEN 2 — Feed peek ────────────────────────────────────────────────────
function FeedPreviewScreen({ goTo }) {
    return (
        <Screen>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, minHeight: 34 }}>
                <IconButton onClick={() => goTo("splash")} label="Back"><Chevron /></IconButton>
                <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: P.muted, textDecoration: "none", fontFamily: DM }}>Just browsing</Link>
            </div>

            <Eyebrow>Inside camp</Eyebrow>
            <h2 style={{ fontFamily: JAK, fontWeight: 800, fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.02em", color: P.ink, marginBottom: 9 }}>Real talk. Zero filter.</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: P.muted, marginBottom: 20, fontFamily: DM }}>A peek at what corpers are saying right now.</p>

            <div style={cardStyle}>
                <span style={tagStyle("var(--cp-deeper)", P.cpTint)}>Gist</span>
                <div style={gistTextStyle}>Mami market prices increased again. This camp wan finish person 😩</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, color: P.muted, fontFamily: DM }}>Kano Camp · 12m</span>
                    <span style={{ fontFamily: JAK, fontWeight: 700, fontSize: 12.5, color: "var(--cp-deeper)", background: P.cpTint, padding: "4px 9px", borderRadius: 8 }}>↑ 41</span>
                </div>
            </div>

            <div style={cardStyle}>
                <span style={tagStyle(P.purple, P.purpleTint)}>Poll</span>
                <div style={gistTextStyle}>Should NYSC extend camp by 2 weeks?</div>
                <div style={{ position: "relative", border: "1px solid var(--cp)", borderRadius: 12, padding: "11px 13px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ position: "absolute", inset: 0, background: P.cpTint, width: "61%" }} />
                    <span style={{ position: "relative", fontWeight: 600, fontSize: 13.5, color: P.ink, fontFamily: DM }}>No — abeg release us</span>
                    <span style={{ position: "relative", fontFamily: JAK, fontWeight: 700, fontSize: 13, color: "var(--cp-deeper)" }}>61%</span>
                </div>
                <div style={{ fontSize: 11.5, color: P.muted, marginTop: 8, fontFamily: DM }}>Lagos Camp · 248 voted</div>
            </div>

            <div style={{ ...cardStyle, marginBottom: 0 }}>
                <span style={tagStyle(P.red, P.redTint)}>Issue</span>
                <div style={gistTextStyle}>Hostel B has had no water since Day 1. Who do we report to?</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, color: P.muted, fontFamily: DM }}>Rivers Camp · 1h</span>
                    <span style={{ fontFamily: JAK, fontWeight: 700, fontSize: 12.5, color: P.red, background: P.redTint, padding: "4px 9px", borderRadius: 8 }}>↑ 38</span>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 18 }} />
            <PrimaryCTA onClick={() => goTo("camp-select")}>Take me in <Arrow /></PrimaryCTA>
        </Screen>
    );
}

// ── SCREEN 3 — Camp select ──────────────────────────────────────────────────
function CampSelectScreen({ goTo, selectedCamp, setSelectedCamp }) {
    const [q, setQ] = useState("");
    const filtered = CAMPS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    return (
        <Screen>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, minHeight: 34 }}>
                <IconButton onClick={() => goTo("feed-preview")} label="Back"><Chevron /></IconButton>
                <Dots active={0} />
            </div>

            <Eyebrow>Step 1 of 3</Eyebrow>
            <h2 style={{ fontFamily: JAK, fontWeight: 800, fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.02em", color: P.ink, marginBottom: 9 }}>Where are you serving?</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: P.muted, marginBottom: 18, fontFamily: DM }}>We&rsquo;ll put your camp&rsquo;s gist front and centre.</p>

            <div style={{ display: "flex", alignItems: "center", gap: 9, background: P.white, border: `1px solid ${P.hair}`, borderRadius: 13, padding: "12px 14px", marginBottom: 13, color: P.muted }}>
                <Search />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your camp…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: P.ink, width: "100%", fontFamily: DM }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {filtered.map((camp) => {
                    const sel = selectedCamp === camp.name;
                    return (
                        <button key={camp.name} onClick={() => setSelectedCamp(camp.name)} style={{ width: "100%", textAlign: "left", background: sel ? "var(--cp)" : P.white, border: `1px solid ${sel ? "var(--cp)" : P.hair}`, borderRadius: 14, padding: "13px 15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                                <span style={{ color: sel ? "#fff" : "var(--cp)", flexShrink: 0 }}><Pin /></span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontFamily: JAK, fontWeight: 700, fontSize: 14, color: sel ? "#fff" : P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{camp.name}</div>
                                    <div style={{ fontSize: 11.5, fontWeight: 600, color: sel ? "rgba(255,255,255,0.8)" : P.muted, marginTop: 1, fontFamily: DM }}>
                                        {camp.count} corpers {camp.hot || sel ? "already here 🔥" : "here"}
                                    </div>
                                </div>
                            </div>
                            <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? "#fff" : "#D0C8C0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {sel && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div style={{ flex: 1, minHeight: 18 }} />
            <PrimaryCTA
                onClick={() => {
                    try {
                        localStorage.setItem("onboardingCamp", selectedCamp);
                    } catch {
                        /* ignore */
                    }
                    goTo("username");
                }}
                disabled={!selectedCamp}
            >
                That&rsquo;s my camp <Arrow />
            </PrimaryCTA>
        </Screen>
    );
}

// ── SCREEN 4 — Username ────────────────────────────────────────────────────────
function UsernameScreen({ goTo, username, setUsername }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loadingAliases, setLoadingAliases] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const sessionIdRef = useRef(Math.random().toString(36).slice(2, 10));
    const pendingAliasRef = useRef(null);
    const takenSetRef = useRef(new Set());

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const taken = await fetchTakenAliases();
                if (cancelled) return;
                takenSetRef.current = taken;
                const available = ALL_ALIASES.filter((a) => !taken.has(a));
                setSuggestions(pickRandom(available, 6));
            } catch {
                setSuggestions(pickRandom(ALL_ALIASES, 6));
            } finally {
                if (!cancelled) setLoadingAliases(false);
            }
        })();
        return () => {
            cancelled = true;
            if (pendingAliasRef.current) {
                releaseAlias(pendingAliasRef.current).catch(() => {});
                pendingAliasRef.current = null;
            }
        };
    }, []);

    async function handleAliasClick(alias) {
        if (claiming || alias === username) return;
        setClaiming(true);
        try {
            if (pendingAliasRef.current && pendingAliasRef.current !== alias) {
                await releaseAlias(pendingAliasRef.current);
                takenSetRef.current.delete(pendingAliasRef.current);
            }
            await claimAlias(alias, sessionIdRef.current);
            pendingAliasRef.current = alias;
            takenSetRef.current.add(alias);
            setUsername(alias);

            const shownNow = suggestions;
            const pool = ALL_ALIASES.filter((a) => !takenSetRef.current.has(a) && !shownNow.includes(a));
            const replacement = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
            setSuggestions(shownNow.map((s) => (s === alias ? replacement : s)).filter(Boolean));
        } catch {
            setUsername(alias);
        } finally {
            setClaiming(false);
        }
    }

    function handleShuffle() {
        if (claiming || suggestions.length === 0) return;
        handleAliasClick(suggestions[Math.floor(Math.random() * suggestions.length)]);
    }

    function handleLockIn() {
        if (!username.trim()) return;
        localStorage.setItem("onboardingAlias", username.trim());
        localStorage.setItem("onboardingAliasSession", sessionIdRef.current);
        pendingAliasRef.current = null;
        goTo("first-vote");
    }

    return (
        <Screen>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, minHeight: 34 }}>
                <IconButton onClick={() => goTo("camp-select")} label="Back"><Chevron /></IconButton>
                <Dots active={1} />
            </div>

            <Eyebrow>Step 2 of 3</Eyebrow>
            <h2 style={{ fontFamily: JAK, fontWeight: 800, fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.02em", color: P.ink, marginBottom: 9 }}>Pick your username.</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: P.muted, marginBottom: 18, fontFamily: DM }}>This is how camp sees you. Your real name stays yours — nobody else gets it.</p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, background: P.white, border: "1.5px solid var(--cp)", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
                <span style={{ fontFamily: JAK, fontWeight: 700, color: "var(--cp)", fontSize: 17 }}>@</span>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Type or tap a suggestion"
                    aria-label="Your camp username"
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: JAK, fontWeight: 700, fontSize: 17, color: P.ink, letterSpacing: "-0.01em", minWidth: 0 }}
                />
                <button onClick={handleShuffle} disabled={claiming} aria-label="Shuffle username" style={{ width: 32, height: 32, borderRadius: 9, background: P.cpTint, color: "var(--cp-deeper)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <Shuffle />
                </button>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "4px 0 9px", fontFamily: DM }}>
                {loadingAliases ? "Finding available usernames…" : "Tap to claim"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                {loadingAliases
                    ? Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} style={{ height: 30, width: 92, borderRadius: 999, background: "#F1E7DB" }} />
                      ))
                    : suggestions.map((name) => {
                          const sel = username === name;
                          return (
                              <button key={name} onClick={() => handleAliasClick(name)} disabled={claiming} style={{ fontSize: 12.5, fontWeight: 600, color: sel ? "#fff" : P.muted, background: sel ? "var(--cp)" : P.white, border: `1px solid ${sel ? "var(--cp)" : P.hair}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer", fontFamily: DM, opacity: claiming ? 0.6 : 1 }}>
                                  {name}
                              </button>
                          );
                      })}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: P.cpTint, border: "1px solid #FBD9BF", borderRadius: 14, padding: "13px 14px", marginBottom: 0 }}>
                <span style={{ color: "var(--cp-deeper)", marginTop: 1, flexShrink: 0 }}><Lock s={16} /></span>
                <span style={{ fontSize: 12.5, color: "#8A4B1E", lineHeight: 1.45, fontFamily: DM }}>
                    Your posts show this username only. Verified behind the scenes, anonymous on the surface.
                </span>
            </div>

            <div style={{ flex: 1, minHeight: 18 }} />
            <PrimaryCTA onClick={handleLockIn} disabled={!username.trim() || claiming}>
                {claiming ? "Claiming username…" : "Continue"} {!claiming && <Arrow />}
            </PrimaryCTA>
        </Screen>
    );
}

// ── SCREEN 5 — First vote ───────────────────────────────────────────────────
function FirstVoteScreen({ goTo }) {
    const [picked, setPicked] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const doVote = (idx) => {
        setPicked(idx);
        setTimeout(() => setShowResult(true), 120);
    };

    return (
        <Screen>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, minHeight: 34 }}>
                <IconButton onClick={() => goTo("username")} label="Back"><Chevron /></IconButton>
                <Dots active={2} />
            </div>

            <Eyebrow>Step 3 of 3</Eyebrow>
            <h2 style={{ fontFamily: JAK, fontWeight: 800, fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.02em", color: P.ink, marginBottom: 9 }}>Cast your first vote.</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: P.muted, marginBottom: 18, fontFamily: DM }}>That&rsquo;s the whole app, basically. Tap one.</p>

            <div style={{ ...cardStyle, marginBottom: 0 }}>
                <span style={tagStyle(P.purple, P.purpleTint)}>Poll</span>
                <div style={gistTextStyle}>Should NYSC extend camp by 2 more weeks?</div>

                {!showResult ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {VOTE_OPTIONS.map((opt, i) => (
                            <button key={i} onClick={() => doVote(i)} style={{ width: "100%", textAlign: "left", border: `1px solid ${picked === i ? "var(--cp)" : P.hair}`, borderRadius: 12, padding: "11px 13px", background: picked === i ? P.cpTint : P.white, fontWeight: 600, fontSize: 13.5, color: P.ink, cursor: "pointer", fontFamily: DM }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {VOTE_RESULTS.map((r, i) => (
                            <div key={i} style={{ position: "relative", border: `1px solid ${r.lead ? "var(--cp)" : P.hair}`, borderRadius: 12, padding: "11px 13px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ position: "absolute", inset: 0, background: r.lead ? P.cpTint : "#F6EFE7", width: `${r.pct}%`, transition: "width .8s ease" }} />
                                <span style={{ position: "relative", fontWeight: 600, fontSize: 13.5, color: P.ink, fontFamily: DM }}>{r.label}</span>
                                <span style={{ position: "relative", fontFamily: JAK, fontWeight: 700, fontSize: 13, color: r.lead ? "var(--cp-deeper)" : P.muted }}>{r.pct}%</span>
                            </div>
                        ))}
                        <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2, fontFamily: DM }}>You voted · 248 corpers in</div>
                    </div>
                )}
            </div>

            {showResult && (
                <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: P.greenTint, border: `1px solid ${P.greenBorder}`, borderRadius: 14, padding: "13px 14px", marginTop: 16 }}>
                    <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, background: P.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield /></span>
                    <div>
                        <div style={{ fontFamily: JAK, fontWeight: 700, fontSize: 13.5, color: P.greenInk, letterSpacing: "-0.01em" }}>Get your Verified Corper badge</div>
                        <div style={{ fontSize: 12, lineHeight: 1.45, color: P.greenSub, marginTop: 2, fontFamily: DM }}>Confirm your NYSC state code after joining. It stays private — never shown, never sold — and makes your vote count in real results.</div>
                    </div>
                </div>
            )}

            <div style={{ flex: 1, minHeight: 18 }} />
            {showResult ? (
                <>
                    <PrimaryCTA as="link" href="/register">Join Camp Connect <Arrow /></PrimaryCTA>
                    <Link href="/login" style={{ display: "block", width: "100%", textAlign: "center", fontFamily: DM, fontWeight: 600, fontSize: 13.5, color: P.muted, padding: "13px 0 2px", textDecoration: "none" }}>
                        Already a member? <span style={{ color: P.ink, borderBottom: "1.5px solid var(--cp)" }}>Sign in</span>
                    </Link>
                </>
            ) : (
                <div style={{ textAlign: "center", fontSize: 12.5, color: P.muted, fontFamily: DM, paddingBottom: 4 }}>Tap an option to cast your vote</div>
            )}
        </Screen>
    );
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function OnboardingFlow() {
    const router = useRouter();
    const [screen, setScreen] = useState("splash");

    // Mark that this visitor has reached onboarding, so the root EntryGate sends
    // them to the feed next time instead of re-onboarding. Also bounce any
    // already-logged-in member straight to the feed (the PWA start_url is
    // /onboarding, so members would otherwise hit this splash every launch).
    useEffect(() => {
        try {
            localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
        } catch {
            /* ignore */
        }
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user && !user.isAnonymous) router.replace("/");
        });
        return () => unsub();
    }, [router]);

    const [selectedCamp, setSelectedCamp] = useState(null);
    const [username, setUsername] = useState("");

    const goTo = (s) => {
        setScreen(s);
        window.scrollTo({ top: 0, behavior: "instant" });
    };

    return (
        <div className="ob-root">
            <style>{`
                .ob-root { min-height: 100vh; background: #E9E5E0; }
                .ob-main { width: 100%; max-width: 520px; min-height: 100vh; margin: 0 auto; background: ${P.paper}; position: relative; overflow-x: hidden; }
                .ob-aside { display: none; }
                @media (min-width: 940px) {
                    .ob-root { display: flex; align-items: stretch; }
                    .ob-aside { display: flex; flex: 1; flex-direction: column; justify-content: center; padding: 56px 64px; background: ${P.paper}; border-right: 1px solid ${P.hair}; }
                    .ob-main { margin: 0; max-width: 460px; flex-shrink: 0; box-shadow: -1px 0 40px rgba(28,20,8,0.06); }
                }
                @media (min-width: 1280px) { .ob-aside { padding: 56px 104px; } }
            `}</style>

            <aside className="ob-aside">
                <div style={{ maxWidth: 440 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
                        <Tent s={38} />
                        <span style={{ fontFamily: JAK, fontWeight: 800, fontSize: 18, color: P.ink, letterSpacing: "-0.01em" }}>Camp Connect</span>
                    </div>
                    <Eyebrow>The voice of NYSC</Eyebrow>
                    <h1 style={{ fontFamily: JAK, fontWeight: 800, fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.03em", color: P.ink, marginBottom: 18 }}>
                        Real corpers.<br />Honest camp <span style={{ color: "var(--cp)" }}>gist.</span>
                    </h1>
                    <p style={{ fontSize: 16.5, lineHeight: 1.55, color: P.muted, maxWidth: 380, marginBottom: 28, fontFamily: DM }}>
                        Gist, polls and the issues that matter — from verified corpers across every camp in Nigeria.
                    </p>
                    <div style={{ ...cardStyle, maxWidth: 360, marginBottom: 0, boxShadow: "0 14px 30px rgba(28,20,8,0.08)" }}>
                        <span style={tagStyle("var(--cp-deeper)", P.cpTint)}>Gist</span>
                        <div style={gistTextStyle}>Mami market prices increased again. This camp wan finish person 😩</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11.5, color: P.muted, fontFamily: DM }}>Kano Camp · Anonymous · 12m</span>
                            <span style={{ fontFamily: JAK, fontWeight: 700, fontSize: 12.5, color: "var(--cp-deeper)", background: P.cpTint, padding: "4px 9px", borderRadius: 8 }}>↑ 41</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 22 }}><TrustLine>Anonymous to other corpers. Always.</TrustLine></div>
                </div>
            </aside>

            <div className="ob-main">
                {screen === "splash" && <SplashScreen goTo={goTo} />}
                {screen === "feed-preview" && <FeedPreviewScreen goTo={goTo} />}
                {screen === "camp-select" && (
                    <CampSelectScreen goTo={goTo} selectedCamp={selectedCamp} setSelectedCamp={setSelectedCamp} />
                )}
                {screen === "username" && (
                    <UsernameScreen goTo={goTo} username={username} setUsername={setUsername} />
                )}
                {screen === "first-vote" && <FirstVoteScreen goTo={goTo} />}
            </div>
        </div>
    );
}
