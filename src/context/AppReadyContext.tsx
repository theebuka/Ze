import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * Whether the splash loader has finished.
 *
 * Home (and whichever page happens to be the entry route on a fresh load —
 * About, Work, anything) mounts immediately, underneath the splash overlay,
 * regardless of splash state. If its useReveal setup ran on mount as usual,
 * every ScrollTrigger would fire and complete while the splash still covers
 * the screen — the page would look fully "already revealed" (static) the
 * instant the splash clears, since the animation already played invisibly.
 *
 * Every page (and Header, and Footer, which are always mounted) reads this
 * via useAppReady() and passes it as `useReveal`'s `enabled` so reveal setup
 * is deferred until there's actually someone watching.
 */
const AppReadyContext = createContext(true);

export const AppReadyProvider: React.FC<{ ready: boolean; children: ReactNode }> = ({
  ready,
  children,
}) => <AppReadyContext.Provider value={ready}>{children}</AppReadyContext.Provider>;

export const useAppReady = () => useContext(AppReadyContext);
