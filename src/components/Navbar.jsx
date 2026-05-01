"use client";

import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// ── Icons ──────────────────────────────────────────────────────────────────

const HomeIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#F97316" : "none"}
        stroke={active ? "#F97316" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4.5 h-4.5 shrink-0"
    >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const TrendingIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#F97316" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4.5 h-4.5 shrink-0"
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
        className="w-4.5 h-4.5 shrink-0"
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ActivityIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#F97316" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4.5 h-4.5 shrink-0"
    >
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
        {active && (
            <circle
                cx="18"
                cy="5"
                r="3"
                fill="#F97316"
                stroke="white"
                strokeWidth="1.5"
            />
        )}
    </svg>
);

const ProfileIcon = ({ active }) => (
    <svg
        viewBox="0 0 24 24"
        fill={active ? "#F97316" : "none"}
        stroke={active ? "#F97316" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4.5 h-4.5 shrink-0"
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
        className="w-3.5 h-3.5"
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
    const [userData, setUserData] = useState(null);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login"); // Adjust to your login route
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && !user.isAnonymous) {
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
                    });
                } else {
                    setUserData({
                        name: user.displayName || "User",
                        location: "Nigeria",
                    });
                }
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <>
            {/* ════════════════════════════════════
                DESKTOP / TABLET — left collapsible sidebar
            ════════════════════════════════════ */}
            <aside
                className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white z-50 transition-all duration-300 ease-in-out"
                style={{
                    width: collapsed ? 72 : 240,
                    borderRight: "1px solid #F3F4F6",
                    boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
                }}
            >
                {/* ── Brand ── */}
                <div
                    className="relative flex items-center gap-3 bg-[#F97316] overflow-hidden shrink-0"
                    style={{
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
                            <div className="text-white/55 text-[10px] font-medium mt-0.5 tracking-wide truncate">
                                Be the voice. Drive the change.
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
                    className="absolute flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-[#F97316] hover:border-[#F97316]/40 transition-all duration-200 hover:shadow-sm cursor-pointer"
                    style={{
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
                <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-hidden">
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
                                    title={collapsed ? label : undefined}
                                    className="flex items-center rounded-xl bg-[#F97316] hover:bg-[#D45516] active:bg-[#C2410C] transition-colors mt-1 mb-0.5 group"
                                    style={{
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
                                title={collapsed ? label : undefined}
                                className={`flex items-center rounded-xl transition-all duration-150 group ${
                                    active
                                        ? "bg-[#FFF4EE] text-[#F97316]"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                }`}
                                style={{
                                    gap: collapsed ? 0 : 10,
                                    padding: collapsed ? "10px 0" : "10px 12px",
                                    justifyContent: collapsed
                                        ? "center"
                                        : "flex-start",
                                }}
                            >
                                <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${active ? "bg-[#F97316]/10" : "group-hover:bg-gray-100/80"}`}
                                >
                                    {Icon && <Icon active={active} />}
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
                                            <div className="w-1 h-4 bg-[#F97316] rounded-full shrink-0" />
                                        )}
                                    </>
                                )}

                                {collapsed && active && (
                                    <div className="absolute right-2 w-1 h-4 bg-[#F97316] rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── User & Logout Section ── */}
                <div
                    className="shrink-0 border-t border-gray-100 flex flex-col transition-all"
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
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                            style={{
                                background:
                                    "linear-gradient(135deg, #fb923c 0%, #c2410c 100%)",
                            }}
                        >
                            {userData?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-gray-800 truncate leading-none">
                                    {userData?.name || "Loading..."}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 truncate">
                                    {userData?.location || ""}
                                </div>
                            </div>
                        )}
                        {!collapsed && (
                            <div
                                className="w-2 h-2 bg-emerald-400 rounded-full shrink-0"
                                title="Online"
                            />
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center justify-center cursor-pointer transition-all duration-200 group ${
                            collapsed
                                ? "text-gray-400 hover:text-red-500"
                                : "gap-2.5 px-3 py-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                        title={collapsed ? "Logout" : undefined}
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
                className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
                style={{
                    boxShadow: "0 -1px 0 #F3F4F6, 0 -4px 20px rgba(0,0,0,0.06)",
                }}
            >
                <div
                    className="flex items-center justify-around px-1"
                    style={{
                        height: 60,
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
                                    style={{ marginTop: -22 }}
                                    aria-label="Post to Camp"
                                >
                                    <div
                                        className="bg-[#F97316] flex items-center justify-center active:scale-95 transition-transform rounded-full"
                                        style={{
                                            width: 50,
                                            height: 50,
                                            boxShadow:
                                                "0 4px 16px rgba(232,97,26,0.42), 0 1px 4px rgba(232,97,26,0.2)",
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
                                className="flex flex-col items-center gap-0.75 px-3 py-1.5"
                            >
                                <div
                                    className={
                                        active
                                            ? "text-[#F97316]"
                                            : "text-gray-400"
                                    }
                                >
                                    {Icon && <Icon active={active} />}
                                </div>
                                <span
                                    className={`text-[9.5px] font-semibold tracking-wide leading-none ${active ? "text-[#F97316]" : "text-gray-400"}`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
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
