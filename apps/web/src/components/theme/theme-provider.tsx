'use client';

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

/** Same key as public/theme-init.js, which runs before React. */
export const THEME_STORAGE_KEY = 'theme';
const THEMES: readonly Theme[] = ['light', 'dark', 'system'];
const QUERY = '(prefers-color-scheme: dark)';

/**
 * Tiny theme store: the choice lives in localStorage, the `dark` class on
 * <html>. The initial class is set before paint by ThemeScript, so the first
 * client snapshot agrees with the document and nothing flashes.
 */
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(stored as Theme) ? (stored as Theme) : 'system';
  } catch {
    return 'system';
  }
}

function systemDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches;
}

function apply(theme: Theme): void {
  const dark = theme === 'dark' || (theme === 'system' && systemDark());
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function snapshot(): string {
  return `${readTheme()}:${systemDark() ? 'dark' : 'light'}`;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // On mount: the stored choice may not be on <html> yet (client-rendered documents).
  apply(readTheme());
  const media = typeof matchMedia === 'function' ? matchMedia(QUERY) : null;
  const onSystem = () => {
    apply(readTheme());
    listener();
  };
  media?.addEventListener('change', onSystem);
  window.addEventListener('storage', onSystem);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener('change', onSystem);
    window.removeEventListener('storage', onSystem);
  };
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useSyncExternalStore(subscribe, snapshot, () => 'system:light');
  const [theme, system] = value.split(':') as [Theme, Resolved];
  const resolvedTheme: Resolved = theme === 'system' ? system : theme;

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* private mode: the choice lasts for the page only */
    }
    apply(next);
    listeners.forEach((listener) => listener());
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Current theme and setter. `resolvedTheme` is what the page shows right now. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
