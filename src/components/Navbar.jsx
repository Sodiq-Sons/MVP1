"use client";

import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";
import { updateStreak } from "@/lib/streaks";

// ── Icons ──────────────────────────────────────────────────────────────────

const HomeIcon = ({ active, cp }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? cp : "none"}
        stroke={active ? cp : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 shrink-0"
    >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const TrendingIcon = ({ active, cp }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? cp : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 shrink-0"
    >
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
    </svg>
);

const PlusIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-5 h-5 shrink-0"
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ActivityIcon = ({ active, cp }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? cp : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 shrink-0"
    >
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
        {active && (
            <circle
                cx="18"
                cy="5"
                r="3"
                fill={cp}
                stroke="white"
                strokeWidth="1.5"
            />
        )}
    </svg>
);

const ProfileIcon = ({ active, cp }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? cp : "none"}
        stroke={active ? cp : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 shrink-0"
    >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const ChevronIcon = ({ direction }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        style={{
            transform:
                direction === "right" ? "rotate(0deg)" : "rotate(180deg)",
        }}
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
        strokeLinejoin="round"
        className="w-4 h-4"
    >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 01-2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

// ── Config ─────────────────────────────────────────────────────────────────

const navItems = [
    { href: "/", label: "Home", Icon: HomeIcon },
    { href: "/trending", label: "Trending", Icon: TrendingIcon },
    { href: "/create-issue", label: "Post to Camp", Icon: null, isPost: true },
    { href: "/activity", label: "Activity", Icon: ActivityIcon },
    { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const isCreateIssue = pathname === "/create-issue";

    const { collapsed, toggle } = useSidebar();
    const { theme } = useTheme();
    const [userData, setUserData] = useState(null);

    // Read the current primary colour from CSS variables at render time.
    // Using a data attribute lookup keeps it in sync without a separate state.
    const cp = `var(--cp)`;
    const cpDark = `var(--cp-dark)`;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login"); // Adjust to your login route
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    useEffect(() => {
        let heartbeatInterval = null;
        let presenceRef = null;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // Clear previous heartbeat when auth state changes
            if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
            if (presenceRef) { deleteDoc(presenceRef).catch(() => {}); presenceRef = null; }

            if (user && !user.isAnonymous) {
                // Presence heartbeat — runs on every page since Navbar is global
                presenceRef = doc(db, "presence", user.uid);
                const writePresence = () => setDoc(presenceRef, {
                    online: true,
                    lastSeen: serverTimestamp(),
                    uid: user.uid,
                    displayName: user.displayName || "",
                }, { merge: true }).catch(() => {});
                writePresence();
                heartbeatInterval = setInterval(writePresence, 30000);

                // Fire-and-forget streak update; re-read after so streak is current
                await updateStreak(user.uid);
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    const data = snap.data();

                    setUserData({
                        name: user.displayName || data.displayName || "User",
                        location:
                            typeof data.location === "object"
                                ? [
                                      data.location.city,
                                      data.location.state,
                                      data.location.country,
                                  ]
                                      .filter(Boolean)
                                      .join(", ")
                                : data.location || "Nigeria",
                        verified: data.isVerified === true,
                        photoURL: data.photoURL || user.photoURL || null,
                        streak: data.streak || 0,
                    });
                } else {
                    setUserData({
                        name: user.displayName || "User",
                        location: "Nigeria",
                        verified: false,
                        photoURL: user.photoURL || null,
                    });
                }
            }
        });

        const handleUnload = () => { if (presenceRef) deleteDoc(presenceRef).catch(() => {}); };
        window.addEventListener("beforeunload", handleUnload);

        return () => {
            unsubscribe();
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            if (presenceRef) deleteDoc(presenceRef).catch(() => {});
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    return (
        <>
            {/* ════════════════════════════════════
                DESKTOP / TABLET — left collapsible sidebar
            ════════════════════════════════════ */}
            <aside
                aria-label="Main navigation"
                className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white z-50 transition-all duration-300 ease-in-out"
                style={{
                    width: collapsed ? 72 : 240,
                    borderRight: "1px solid #F3F4F6",
                    boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
                }}
            >
                {/* ── Brand ── */}
                <div
                    className="relative flex items-center gap-3 overflow-hidden shrink-0"
                    style={{
                        background: cp,
                        padding: collapsed ? "18px 0" : "18px 16px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        minHeight: 68,
                    }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(ellipse at 0% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)",
                        }}
                    />

                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0 relative z-10">
                        <span className="text-white text-[17px] leading-none select-none">
                            ✊
                        </span>
                    </div>

                    {!collapsed && (
                        <div className="min-w-0 relative z-10 overflow-hidden">
                            <div
                                className="text-white font-bold text-[13.5px] leading-tight truncate"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Camp Connect 🏕️
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Collapse toggle ── */}
                <button
                    onClick={toggle}
                    aria-label={
                        collapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    className="absolute flex items-center justify-center bg-white border border-theme rounded-full text-gray-400 transition-all duration-200 hover:shadow-sm cursor-pointer"
                    style={{
                        "--hover-cp": cp,
                        width: 24,
                        height: 24,
                        top: 22,
                        right: -12,
                        zIndex: 60,
                        boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
                    }}
                >
                    <ChevronIcon direction={collapsed ? "right" : "left"} />
                </button>

                {/* ── Nav links ── */}
                <nav aria-label="Sidebar" className="flex flex-col gap-0.5 p-2 flex-1 overflow-hidden">
                    {navItems.map(({ href, label, Icon, isPost }) => {
                        const active = isPost
                            ? isCreateIssue
                            : href === "/"
                              ? pathname === "/"
                              : pathname.startsWith(href);

                        if (isPost) {
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-label={label}
                                    title={collapsed ? label : undefined}
                                    className="flex items-center rounded-xl transition-colors mt-1 mb-0.5 group"
                                    style={{
                                        background: cp,
                                        gap: collapsed ? 0 : 10,
                                        padding: collapsed
                                            ? "10px 0"
                                            : "10px 12px",
                                        justifyContent: collapsed
                                            ? "center"
                                            : "flex-start",
                                    }}
                                >
                                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                                        <PlusIcon />
                                    </div>
                                    {!collapsed && (
                                        <span
                                            className="text-white text-[13px] font-semibold whitespace-nowrap"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {label}
                                        </span>
                                    )}
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-label={collapsed ? label : undefined}
                                aria-current={active ? "page" : undefined}
                                title={collapsed ? label : undefined}
                                className={`flex items-center rounded-xl transition-all duration-150 group ${
                                    active
                                        ? "text-gray-800"
                                        : "text-gray-500 hover:bg-subtle hover:text-gray-800"
                                }`}
                                style={{
                                    ...(active ? { background: "var(--cp-light)", color: cp } : {}),
                                    gap: collapsed ? 0 : 10,
                                    padding: collapsed ? "10px 0" : "10px 12px",
                                    justifyContent: collapsed
                                        ? "center"
                                        : "flex-start",
                                }}
                            >
                                <div
                                    aria-hidden="true"
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${active ? "" : "group-hover:bg-muted/80"}`}
                                    style={active ? { background: "var(--cp-light)" } : {}}
                                >
                                    {Icon && <Icon active={active} cp={cp} />}
                                </div>

                                {!collapsed && (
                                    <>
                                        <span
                                            className={`text-[13px] flex-1 whitespace-nowrap ${active ? "font-semibold" : "font-medium"}`}
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {label}
                                        </span>
                                        {active && (
                                            <div className="w-1 h-4 rounded-full shrink-0" style={{ background: cp }} />
                                        )}
                                    </>
                                )}

                                {collapsed && active && (
                                    <div className="absolute right-2 w-1 h-4 rounded-full" style={{ background: cp }} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── User & Logout Section ── */}
                <div
                    className="shrink-0 border-t border-subtle flex flex-col transition-all"
                    style={{
                        padding: collapsed ? "12px 0" : "16px 14px",
                    }}
                >
                    <div
                        className="flex items-center gap-2.5 mb-3"
                        style={{
                            justifyContent: collapsed ? "center" : "flex-start",
                        }}
                    >
                        {/* Avatar with badge overlay */}
                        <div className="relative shrink-0">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
                                style={{ background: userData?.photoURL ? "transparent" : cp }}
                            >
                                {userData?.photoURL
                                    ? <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                                    : userData?.name?.charAt(0)?.toUpperCase() || "U"
                                }
                            </div>
                            {userData?.verified && (
                                <div
                                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white"
                                    style={{ background: "#1D9BF0" }}
                                    title="Verified corper"
                                >
                                    <svg viewBox="0 0 16 16" fill="white" className="w-2 h-2">
                                        <path d="M13 3.5 6.5 10 3 6.5l-1 1L6.5 12 14 4.5z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-gray-800 truncate leading-none flex items-center gap-1">
                                    {userData?.name || "Loading..."}
                                    {userData?.streak >= 1 && (
                                        <span className="text-[10px]" title={`${userData.streak}-day streak`}>
                                            🔥{userData.streak}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 truncate">
                                    {userData?.location || ""}
                                </div>
                            </div>
                        )}
                        {collapsed && userData?.streak >= 1 && (
                            <span className="absolute right-1 top-1 text-[9px] leading-none" title={`${userData.streak}-day streak`}>🔥</span>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        aria-label="Sign out"
                        className={`flex items-center justify-center cursor-pointer transition-all duration-200 group ${
                            collapsed
                                ? "text-gray-400 hover:text-red-500"
                                : "gap-2.5 px-3 py-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                        title={collapsed ? "Sign out" : undefined}
                    >
                        <LogoutIcon />
                        {!collapsed && (
                            <span className="text-[12px] font-medium cursor-pointer">
                                Sign Out
                            </span>
                        )}
                    </button>
                </div>
            </aside>

            {/* ════════════════════════════════════
                MOBILE — fixed bottom tab bar
            ════════════════════════════════════ */}
            <nav
                aria-label="Tab bar navigation"
                className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${pathname.startsWith("/chat") ? "hidden" : ""}`}
                style={{
                    background: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 -1px 0 rgba(0,0,0,0.04), 0 -8px 32px rgba(0,0,0,0.06)",
                }}
            >
                <div
                    className="flex items-center justify-around px-2"
                    style={{
                        height: 64,
                        paddingBottom: "env(safe-area-inset-bottom, 0px)",
                    }}
                >
                    {navItems.map(({ href, label, Icon, isPost }) => {
                        const active = isPost
                            ? isCreateIssue
                            : href === "/"
                              ? pathname === "/"
                              : pathname.startsWith(href);

                        if (isPost) {
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center justify-center"
                                    style={{ marginTop: -24 }}
                                    aria-label="Post to Camp"
                                >
                                    <div
                                        className="flex items-center justify-center active:scale-95 transition-transform rounded-full"
                                        style={{
                                            width: 52,
                                            height: 52,
                                            background: `linear-gradient(135deg, var(--cp-deeper), var(--cp))`,
                                            boxShadow: `0 6px 20px var(--cp-glow), 0 2px 6px rgba(0,0,0,0.12)`,
                                        }}
                                    >
                                        <PlusIcon />
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-label={label}
                                aria-current={active ? "page" : undefined}
                                className="flex flex-col items-center gap-1 px-3 py-1.5 relative"
                            >
                                {active && (
                                    <div
                                        className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-xl"
                                        style={{ background: "var(--cp-light)" }}
                                    />
                                )}
                                <div className="relative" style={active ? { color: cp } : { color: "#9CA3AF" }}>
                                    {Icon && <Icon active={active} cp={cp} />}
                                </div>
                                <span
                                    className="relative text-[9px] font-bold tracking-wide leading-none"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                        ...(active ? { color: cp } : { color: "#9CA3AF" }),
                                    }}
                                >
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
