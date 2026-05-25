"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggler() {
    const { theme, setTheme, themes } = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <div
            className="fixed z-[200] flex items-center no-theme-transition"
            style={{ right: 12, top: "60%", transform: "translateY(-50%)" }}
        >
            {/* ── Theme panel ── */}
            <div
                className="flex flex-col gap-1.5 p-2 rounded-2xl shadow-2xl border no-theme-transition"
                style={{
                    background: "var(--nav-bg)",
                    borderColor: "var(--cp-border)",
                    marginRight: 8,
                    transform: open ? "translateX(0)" : "translateX(200%)",
                    transition: "transform 220ms cubic-bezier(0.4,0,0.2,1)",
                    pointerEvents: open ? "auto" : "none",
                }}
            >
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => { setTheme(t.id); setOpen(false); }}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl w-full cursor-pointer no-theme-transition"
                        style={{
                            background: t.swatch,
                            color: "white",
                            opacity: theme === t.id ? 1 : 0.65,
                            outline: theme === t.id ? "2px solid white" : "none",
                            outlineOffset: 2,
                        }}
                    >
                        <span className="text-[11px] font-bold whitespace-nowrap">
                            {t.label}
                        </span>
                        {theme === t.id && (
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                className="w-3 h-3 shrink-0"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Pill handle ── */}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle theme picker"
                className="flex flex-col items-center justify-center gap-1.5 shadow-lg cursor-pointer no-theme-transition"
                style={{
                    width: 36,
                    height: 80,
                    background: "var(--cp)",
                    border: "none",
                    borderRadius: 9999,
                    flexShrink: 0,
                }}
            >
                {themes.map((t) => (
                    <div
                        key={t.id}
                        className="rounded-full no-theme-transition"
                        style={{
                            width: theme === t.id ? 10 : 6,
                            height: theme === t.id ? 10 : 6,
                            background: theme === t.id ? "white" : "rgba(255,255,255,0.45)",
                        }}
                    />
                ))}
            </button>
        </div>
    );
}
