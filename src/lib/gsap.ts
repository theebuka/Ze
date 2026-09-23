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
 * `expo.out` covers most of its distance in the first third and then glides.
 * That glide is what reads as composed, but it is also where the time goes:
 * at 1.5s (text) and 1.9s (images) the tail ran long enough that you could
 * scroll a full screen further and still catch blocks settling behind you.
 * These are cut to the point where the arrival still reads as a glide and
 * finishes while the block is still where you're looking.
 *
 * `scrub` is the ONE catch-up value for every scroll-linked tween. Lenis is
 * already smoothing the scroll, so every scrub is a second layer of lag on
 * top of it — and the parallax (0.6) and the hero and word-fill (0.8) used
 * to trail by different amounts, so elements on the same screen drifted
 * apart from each other as well as from the page.
 *
 * CSS counterparts: --ease-out-expo and the --dur-* tiers in index.css.
 */
export const MOTION = {
  /** Entrances: reveals, fades, anything arriving. */
  ease: 'expo.out',
  /** Scrubbed A→B moves where both ends need to feel weighted. */
  easeInOut: 'power3.inOut',
  textDuration: 1.1,
  imageDuration: 1.3,
  lineDuration: 1.0,
  /** Between lines of the same block. */
  stagger: 0.07,
  /** Scrub catch-up, in seconds, for every scroll-linked tween. */
  scrub: 0.5,
  /** Panels that cover the page: menu, splash exit. */
  panelDuration: 1.0,
} as const;

/** True when the device has no fine pointer (phones, tablets). */
export const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches;

/** True when the OS asks for reduced motion. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
