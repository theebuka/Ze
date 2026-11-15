import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

/** An explicit choice (data-theme, set here or by index.html) wins over the OS. */
const current = (): Theme => {
  const set = document.documentElement.dataset.theme;
  if (set === 'dark' || set === 'light') return set;
  return media().matches ? 'dark' : 'light';
};

/**
 * Light/dark theme. With no saved choice the CSS follows the OS setting and
 * nothing is stamped on <html>; toggling stamps data-theme and saves it.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  // Follow the OS while the visitor hasn't chosen for themselves.
  useEffect(() => {
    const mq = media();
    const onChange = () => setTheme(current());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode: the choice just won't survive a reload.
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
