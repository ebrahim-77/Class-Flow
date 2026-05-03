import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return storedTheme === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
}

function persistTheme(theme: Theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Ignore storage failures.
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    useLayoutEffect(() => {
        applyTheme(theme);
        persistTheme(theme);
    }, [theme]);

    const setTheme = (nextTheme: Theme) => {
        applyTheme(nextTheme);
        persistTheme(nextTheme);
        setThemeState(nextTheme);
    };

    const toggleTheme = () => {
        const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    const value = useMemo(
        () => ({
            theme,
            toggleTheme,
            setTheme,
        }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}