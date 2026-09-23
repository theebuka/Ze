import type { RefObject } from 'react';
import { gsap, useGSAP, MOTION } from '../lib/gsap';

/**
 * useParallax — scoped replacement for useImageParallax.
 *
 * The old hook queried `.parallax-wrapper` across the entire document and was
 * called from Home, Work AND BlockRenderer. On a case study that meant two
 * mounted instances attaching competing scrubs to the same images, and on any
 * page it meant grabbing wrappers that belonged to other components.
 *
 * This version is scoped to a ref and disabled below 769px. Scrubbed
 * transforms plus Lenis plus a collapsing mobile address bar is a bad trade:
 * you pay real frame budget for an effect nobody notices on a phone.
 */
export function useParallax(
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useGSAP(
    () => {
      if (!scope.current) return;
      const mm = gsap.matchMedia();

      mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        const wrappers = gsap.utils.toArray<HTMLElement>('[data-parallax]', scope.current);

        wrappers.forEach((wrapper) => {
          const img = wrapper.querySelector<HTMLElement>('[data-parallax-img]');
          if (!img) return;

          // The drift needs somewhere to drift FROM, or it exposes an edge at
          // the extremes. Two ways to buy that room:
          //
          //   default          .parallax-img's `height: 115%`. Resolves only
          //                    against a frame with a definite height, i.e. a
          //                    fixed aspect-ratio (Home, Work).
          //   data-parallax    ="cover" — scale the image instead. For frames
          //                    that have NO fixed ratio because the asset's
          //                    own proportions are the point (About), where a
          //                    percentage height has nothing to resolve
          //                    against and would collapse to 0.
          //
          // 1.12 against ±5% of travel: 6% of overhang per edge covers 5%.
          // ±7% was enough drift that the picture visibly swam in its frame;
          // at 5 it reads as depth rather than as movement.
          if (wrapper.dataset.parallax === 'cover') {
            gsap.set(img, { scale: 1.12, transformOrigin: 'center center' });
          }

          gsap.fromTo(
            img,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top bottom',
                end: 'bottom top',
                // Shared with every other scrub so nothing on screen trails
                // the page by a different amount.
                scrub: MOTION.scrub,
                invalidateOnRefresh: true,
              },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  );
}
