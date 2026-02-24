import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useImageParallax
 *
 * Queries all `.parallax-wrapper` elements in the DOM and attaches a GSAP
 * ScrollTrigger scrub that moves the inner `.parallax-img` in the opposite
 * direction of scroll — creating an editorial "window pan" effect.
 *
 * The image must be `height: 115%` (set in interactions.css) to provide
 * 7.5% of travel room above and below the wrapper clip.
 *
 * @param deps - React dep array; re-runs when content is dynamically loaded
 *               (e.g. after Sanity data arrives). Pass [] for static content.
 */
export const useImageParallax = (deps: unknown[] = []) => {
  useEffect(() => {
    let ctx: gsap.Context;

    // Small timeout to ensure React has flushed the DOM before we query it.
    // Necessary when `deps` contains async data (Sanity fetch results).
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        const wrappers = gsap.utils.toArray<HTMLElement>('.parallax-wrapper');

        wrappers.forEach((wrapper) => {
          const img = wrapper.querySelector<HTMLElement>('.parallax-img');
          if (!img) return;

          gsap.fromTo(
            img,
            { yPercent: -10 }, // starts slightly high — bottom of extra space shows
            {
              yPercent: 10,    // ends slightly low  — top of extra space shows
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top bottom',   // animation begins as wrapper enters viewport
                end: 'bottom top',     // ends as wrapper leaves at the top
                scrub: 1.5,            // 1.5s lag for a luxurious, weighted feel
              },
            }
          );
        });

        // Refresh after setup so any layout shifts are accounted for
        ScrollTrigger.refresh();
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx?.revert(); // Kills all ScrollTriggers created in this context
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};