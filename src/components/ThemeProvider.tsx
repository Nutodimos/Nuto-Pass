"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "midnight" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "light" | "dark" | "midnight";
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    resolvedTheme: "light",
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = "cpe-theme";

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | "midnight">("light");
    const [mounted, setMounted] = useState(false);

    const applyTheme = useCallback((t: Theme) => {
        const resolved = t === "system" ? getSystemTheme() : t;
        setResolvedTheme(resolved);
        document.documentElement.setAttribute("data-theme", resolved);
    }, []);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem(STORAGE_KEY, t);
        applyTheme(t);
    }, [applyTheme]);

    // Initialize on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
        const initial = saved || "light";
        setThemeState(initial);
        applyTheme(initial);
        setMounted(true);
    }, [applyTheme]);

    // Listen for system theme changes when "system" is selected
    useEffect(() => {
        if (theme !== "system") return;

        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => applyTheme("system");
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme, applyTheme]);

    // Prevent flash of wrong theme
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
