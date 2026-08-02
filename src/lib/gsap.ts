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

/**
 * The site's motion vocabulary — one definition, every hook.
 *
 * `expo.out` is the "premium" curve: it covers most of the distance in the
 * first third and then glides, which is what makes a long duration read as
 * composed rather than slow. A long `power2.out` at the same duration just
 * feels laggy, because the eye reads the tail, not the head.
 *
 * Durations are deliberately past the 0.8–1s reflex most UI work sits at.
 * Nothing here is a response to a click; it is all scroll-authored, so the
 * viewer is never waiting on it.
 *
 * CSS counterpart: --ease-out-expo in index.css. Keep the two in sync.
 */
export const MOTION = {
  /** Entrances: reveals, fades, anything arriving. */
  ease: 'expo.out',
  /** Scrubbed A→B moves where both ends need to feel weighted. */
  easeInOut: 'power3.inOut',
  textDuration: 1.5,
  imageDuration: 1.9,
  lineDuration: 1.4,
  /** Between lines of the same block. */
  stagger: 0.11,
  /** Scrub smoothing, in seconds of catch-up. */
  scrub: 0.8,
} as const;

/** True when the device has no fine pointer (phones, tablets). */
export const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches;

/** True when the OS asks for reduced motion. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
