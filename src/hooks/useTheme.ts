import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeChoice = Theme | 'system';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

/** An explicit choice (data-theme, set here or by index.html) wins over the OS. */
const readChoice = (): ThemeChoice => {
  const set = document.documentElement.dataset.theme;
  return set === 'dark' || set === 'light' ? set : 'system';
};

const resolve = (choice: ThemeChoice): Theme =>
  choice === 'system' ? (media().matches ? 'dark' : 'light') : choice;

/**
 * Light/dark theme. 'system' leaves <html> unstamped so the CSS follows the
 * OS; 'light' or 'dark' stamps data-theme and saves the choice.
 */
export function useTheme() {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  const [theme, setTheme] = useState<Theme>(() => resolve(readChoice()));

  // Follow the OS while the choice is 'system'.
  useEffect(() => {
    const mq = media();
    const onChange = () => setTheme(resolve(readChoice()));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setChoice = useCallback((next: ThemeChoice) => {
    const root = document.documentElement;
    try {
      if (next === 'system') {
        delete root.dataset.theme;
        localStorage.removeItem('theme');
      } else {
        root.dataset.theme = next;
        localStorage.setItem('theme', next);
      }
    } catch {
      // Private mode: the choice applies now but won't survive a reload.
      if (next !== 'system') root.dataset.theme = next;
    }
    setChoiceState(next);
    setTheme(resolve(next));
  }, []);

  return { theme, choice, setChoice };
}
