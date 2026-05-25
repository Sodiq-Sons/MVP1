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
    const [theme, setThemeState] = useState("orange");

    // Read persisted theme on mount (runs client-side only)
    useEffect(() => {
        const saved = localStorage.getItem("cc-theme");
        if (saved && THEMES.some((t) => t.id === saved)) {
            setThemeState(saved);
            document.documentElement.setAttribute("data-theme", saved);
        }
    }, []);

    const setTheme = (id) => {
        setThemeState(id);
        localStorage.setItem("cc-theme", id);
        document.documentElement.setAttribute("data-theme", id);
    };

    // Keep data-theme in sync when state changes
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
