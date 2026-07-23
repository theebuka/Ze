/**
 * Single GSAP registration point.
 *
 * Every module imports gsap/ScrollTrigger/SplitText from HERE, never from
 * 'gsap' directly. Registering a plugin more than once is harmless but
 * scattering registration across five files means you can never be sure
 * which plugins are live at any given moment.
 *
 * SplitText is bundled free with GSAP 3.13+. `split-type` is no longer used.
 */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Mobile browsers fire a resize event every time the address bar collapses or
// expands. Without this, ScrollTrigger recalculates every start/end position
// mid-scroll, which is the single largest cause of mobile scroll jank.
ScrollTrigger.config({ ignoreMobileResize: true });

// Never skip frames. Lenis drives off this ticker (see useSmoothScroll).
gsap.ticker.lagSmoothing(0);

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** True when the device has no fine pointer (phones, tablets). */
export const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches;

/** True when the OS asks for reduced motion. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
