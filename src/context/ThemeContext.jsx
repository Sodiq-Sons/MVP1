"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
    { id: "orange", label: "Camp Orange", swatch: "#F97316" },
    { id: "earth",  label: "Earth",       swatch: "#556B2F" },
    { id: "ocean",  label: "Ocean Blue",  swatch: "#2563EB" },
];

const ThemeContext = createContext({
    theme: "orange",
    setTheme: () => {},
    themes: THEMES,
});

export function ThemeProvider({ children }) {
    // SSR-safe default. The inline script in the root layout has already applied
    // the persisted theme to <html data-theme> before this mounts, so we only
    // need to sync React state to it — never overwrite it back to the default.
    const [theme, setThemeState] = useState("orange");

    // Adopt the persisted theme on mount (idempotent with the pre-paint script).
    useEffect(() => {
        let saved = null;
        try {
            saved =
                document.documentElement.getAttribute("data-theme") ||
                localStorage.getItem("cc-theme");
        } catch (e) {
            saved = null;
        }
        if (saved && THEMES.some((t) => t.id === saved)) {
            setThemeState(saved);
            document.documentElement.setAttribute("data-theme", saved);
        }
    }, []);

    const setTheme = (id) => {
        setThemeState(id);
        try {
            localStorage.setItem("cc-theme", id);
        } catch (e) {
            /* ignore */
        }
        document.documentElement.setAttribute("data-theme", id);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
