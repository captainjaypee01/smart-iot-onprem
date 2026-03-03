// src/context/ThemeContext.tsx
// Manages light/dark mode — toggles "dark" class on <html> element

import { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@/types";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem("iot-theme") as Theme) ?? "light";
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        localStorage.setItem("iot-theme", theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme((prev) => (prev === "light" ? "dark" : "light"));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
};