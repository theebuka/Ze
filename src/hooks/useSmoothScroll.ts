import { useEffect } from 'react';
import Lenis from 'lenis';

export const useSmoothScroll = () => {
  useEffect(() => {
    // Initialize the vanilla Lenis engine
    const lenis = new Lenis({
      lerp: 0.08, // The "heaviness" of the glide
      smoothWheel: true,
    });

    // Tie it to the browser's native render cycle
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Clean up memory when unmounting
    return () => {
      lenis.destroy();
    };
  }, []);
};