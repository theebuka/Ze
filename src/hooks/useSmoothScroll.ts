import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Expose the lenis instance globally so other hooks (useImageParallax)
// can access it for ScrollTrigger synchronisation without prop-drilling.
declare global {
  interface Window {
    lenis: Lenis | null;
  }
}

export const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });

    // Store globally so ScrollTrigger-based hooks can read scroll position
    window.lenis = lenis;

    // ── CRITICAL BRIDGE ─────────────────────────────────────────────────
    // Inform GSAP ScrollTrigger of every Lenis scroll tick.
    // Without this, ScrollTrigger reads native scrollY which lags behind
    // the Lenis-interpolated position, causing jitter on scrubbed tweens.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from the GSAP ticker instead of requestAnimationFrame.
    // This keeps both systems perfectly in sync on the same frame.
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000); // GSAP time is in seconds; Lenis expects ms
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0); // Prevent GSAP from skipping frames on tab focus

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      window.lenis = null;
    };
  }, []);
};