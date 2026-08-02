import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * Whether anything is currently covering the page — the splash loader on a
 * cold load, or the menu overlay (which outlasts its own open state by the
 * length of its slide-up; see App.tsx).
 *
 * Home (and whichever page happens to be the entry route on a fresh load —
 * About, Work, anything) mounts immediately, underneath the splash overlay,
 * regardless of splash state. If its useReveal setup ran on mount as usual,
 * every ScrollTrigger would fire and complete while the splash still covers
 * the screen — the page would look fully "already revealed" (static) the
 * instant the splash clears, since the animation already played invisibly.
 *
 * Navigating from the menu is the same problem wearing a different hat: the
 * link mounts the next page instantly while the overlay is still sliding up,
 * so Contact and Vault used to finish revealing behind the curtain.
 *
 * Every page (and Header, and Footer, which are always mounted) reads this
 * via useAppReady() and passes it as `useReveal`'s `enabled` so reveal setup
 * is deferred until there's actually someone watching.
 *
 * Note this can go BACK to false — the menu can reopen — which is why
 * useReveal latches it rather than gating on it directly. Only a scope that
 * has yet to reveal is held back; one that already has is never taken back.
 */
const AppReadyContext = createContext(true);

export const AppReadyProvider: React.FC<{ ready: boolean; children: ReactNode }> = ({
  ready,
  children,
}) => <AppReadyContext.Provider value={ready}>{children}</AppReadyContext.Provider>;

export const useAppReady = () => useContext(AppReadyContext);
