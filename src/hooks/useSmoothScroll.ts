import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';

declare global {
  interface Window {
    lenis: Lenis | null;
  }
}

/**
 * Lenis + ScrollTrigger bridge.
 *
 * Changes from the previous version:
 *   - Bails out entirely under prefers-reduced-motion. Smooth-scroll
 *     hijacking is one of the things that setting exists for.
 *   - `autoRaf: false` is explicit. Lenis is driven by the GSAP ticker; the
 *     old code did this too but relied on the default, which changed between
 *     Lenis majors and would silently give you two rAF loops.
 *   - `syncTouch: false` (Lenis default, now explicit): touch scrolling stays
 *     native. Synthesising momentum on a phone is the classic Lenis mobile
 *     jank, and it is the reason iOS feels worse than desktop here.
 *   - lagSmoothing moved to lib/gsap.ts so it is set once.
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    if (prefersReducedMotion()) {
      window.lenis = null;
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });

    window.lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      window.lenis = null;
    };
  }, []);
};

/**
 * Lock and unlock scroll.
 *
 * `document.body.style.overflow = 'hidden'` does NOT lock scrolling on iOS
 * Safari, and it fights Lenis on every platform. Use Lenis' own stop/start,
 * with the body rule kept only as the no-Lenis fallback.
 */
export const setScrollLocked = (locked: boolean) => {
  if (window.lenis) {
    if (locked) window.lenis.stop();
    else window.lenis.start();
    return;
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
};

/** Jump to top on route change without fighting Lenis' interpolated position. */
export const scrollToTop = () => {
  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo(0, 0);
  }
};
