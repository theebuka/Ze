import type { RefObject } from 'react';
import { gsap, useGSAP } from '../lib/gsap';

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

          gsap.fromTo(
            img,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top bottom',
                end: 'bottom top',
                // 1.5 was heavy enough to visibly trail the scroll on a slow
                // connection. 0.6 keeps the weight without the lag.
                scrub: 0.6,
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
