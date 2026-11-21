import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';
export type FontScale = 'normal' | 'large';

const THEME_KEY = 'nslt_theme';
const FONT_SCALE_KEY = 'nslt_font_scale';

const THEME_COLOR: Record<ThemeMode, string> = {
  light: '#FAF9F6',
  dark: '#121316',
};

interface PreferencesContextValue {
  theme: ThemeMode;
  fontScale: FontScale;
  toggleTheme: () => void;
  setFontScale: (scale: FontScale) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredTheme(): ThemeMode | null {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function readStoredFontScale(): FontScale {
  try {
    return window.localStorage.getItem(FONT_SCALE_KEY) === 'large'
      ? 'large'
      : 'normal';
  } catch {
    return 'normal';
  }
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(
    () => readStoredTheme() ?? getSystemTheme()
  );
  const [fontScale, setFontScaleState] = useState<FontScale>(readStoredFontScale);

  // Áp dụng class `dark` + màu thanh trình duyệt
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  // Áp dụng cỡ chữ lớn (A+)
  useEffect(() => {
    document.documentElement.classList.toggle('text-large', fontScale === 'large');
  }, [fontScale]);

  // Nếu người dùng chưa tự chọn, đi theo theme của thiết bị theo thời gian thực
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (!readStoredTheme()) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
    try {
      window.localStorage.setItem(FONT_SCALE_KEY, scale);
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo(
    () => ({ theme, fontScale, toggleTheme, setFontScale }),
    [theme, fontScale, toggleTheme, setFontScale]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences phải được dùng bên trong PreferencesProvider');
  }
  return ctx;
}
