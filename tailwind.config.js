/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    // Protect dynamically-constructed class names from being purged
    safelist: [
        "border-t-cp",
        "skeleton",
        "snap-x-mandatory",
        "snap-start",
        "no-theme-transition",
        "sr-only",
        "btn-primary",
        { pattern: /^(w|h)-(5|6|7|8|9|10|11|12|14)$/ },
        { pattern: /^rounded-(xl|2xl|full)$/ },
        { pattern: /^(text|bg)-(cp|muted|card|page|subtle|nav)$/ },
    ],
    theme: {
        extend: {
            colors: {
                // Semantic CSS-variable-backed aliases usable in Tailwind classes
                cp: "var(--cp)",
                "cp-dark": "var(--cp-dark)",
                "cp-tint": "var(--cp-tint)",
                "cp-light": "var(--cp-light)",
                "cp-border": "var(--cp-border)",
                "page-bg": "var(--bg)",
                "card-bg": "var(--card-bg)",
                // Static colour palette (same as before)
                orange: {
                    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74",
                    400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c",
                    800: "#9a3412", 900: "#7c2d12", 950: "#431407",
                },
                green: {
                    50: "#f0fdf4", 400: "#4ade80", 500: "#22c55e",
                    600: "#16a34a", 700: "#15803d",
                },
                red: {
                    50: "#fef2f2", 100: "#fee2e2", 400: "#f87171",
                    500: "#ef4444", 600: "#dc2626", 700: "#b91c1c",
                },
                blue: {
                    50: "#eff6ff", 100: "#dbeafe", 400: "#60a5fa",
                    500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
                },
                yellow: { 50: "#fefce8", 600: "#ca8a04", 700: "#a16207" },
                violet: { 50: "#f5f3ff", 700: "#6d28d9" },
                purple: { 50: "#faf5ff", 700: "#7e22ce" },
                rose: { 50: "#fff1f2", 700: "#be123c" },
                cyan: { 50: "#ecfeff", 700: "#0e7490" },
                amber: { 50: "#fffbeb", 700: "#b45309" },
                pink: { 50: "#fdf2f8", 700: "#be185d" },
                gray: {
                    50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb",
                    300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280",
                    600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827",
                },
            },
            boxShadow: {
                card: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
                cp: "0 4px 20px var(--cp-glow)",
            },
            fontFamily: {
                sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
                jakarta: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
            },
            animation: {
                shimmer: "shimmer 1.5s infinite",
            },
        },
    },
    plugins: [],
};
