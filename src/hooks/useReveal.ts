import { useRef } from 'react';
import type { RefObject } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap';

/**
 * useReveal — the ONE reveal system.
 *
 * Replaces useGlobalTextReveal + CaseStudy's inline reveal effect. The three
 * problems with the old approach were:
 *
 *   1. Targets were selected by tag name across the whole document
 *      (`main h1, main h2, main p`). Any page could steal another page's
 *      elements, and route detection depended on DOM state at effect time.
 *   2. Setup was gated on arbitrary timers (setTimeout 150 / 200, one rAF).
 *      Those timers are tuned to localhost. On a CDN, images and fonts land
 *      later, layout is still moving, and every measurement is wrong.
 *   3. `isAboveFold` was measured once at setup, so a late-loading image
 *      shifted everything below it past its own trigger point — and with
 *      `toggleActions: 'play none none none'` a trigger that never fires
 *      leaves the element at opacity 0 forever. That is the blank text.
 *
 * The fix:
 *   - Opt in per element with `data-reveal="text|image|line"`. Declarative,
 *     scoped to a ref, impossible for one page to grab another's nodes.
 *   - No timers. SplitText's `autoSplit` re-splits and re-creates the
 *     animation whenever the font loads or the container resizes.
 *   - No manual above-fold delay. Anything already in view fires on the
 *     first ScrollTrigger refresh. Use `data-reveal-delay="0.2"` to
 *     choreograph a hero.
 *   - `gsap.matchMedia()` gives free teardown across breakpoints and a real
 *     prefers-reduced-motion branch.
 *
 * Usage:
 *   const scope = useReveal({ deps: [works] });
 *   return <main ref={scope}>…</main>;
 */

interface RevealOptions {
  /** Re-run when async content arrives. Same semantics as a dep array. */
  deps?: unknown[];
  /** Hold setup until the splash screen is gone. */
  enabled?: boolean;
}

const delayOf = (el: HTMLElement) => parseFloat(el.dataset.revealDelay ?? '0') || 0;

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {}
): RefObject<T | null> {
  const scope = useRef<T>(null);
  const { deps = [], enabled = true } = options;

  useGSAP(
    () => {
      const root = scope.current;
      if (!enabled || !root) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: '(prefers-reduced-motion: reduce)',
          motion: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 769px)',
        },
        (ctx) => {
          const { reduced, desktop } = ctx.conditions as Record<string, boolean>;

          const textEls = gsap.utils.toArray<HTMLElement>('[data-reveal="text"]', root);
          const imageEls = gsap.utils.toArray<HTMLElement>('[data-reveal="image"]', root);
          const lineEls = gsap.utils.toArray<HTMLElement>('[data-reveal="line"]', root);

          // ── Reduced motion: show everything, animate nothing ───────────
          if (reduced) {
            gsap.set([...textEls, ...imageEls], { autoAlpha: 1, clearProps: 'clipPath,transform' });
            gsap.set(lineEls, { scaleX: 1 });
            return;
          }

          // ── TEXT ────────────────────────────────────────────────────────
          // `mask: 'lines'` builds the overflow:hidden wrapper that the old
          // code assembled by hand with eight inline styles per line.
          // `autoSplit: true` re-splits on font load and resize; creating the
          // tween inside onSplit means it re-binds to the NEW line elements
          // rather than orphaned ones from the previous split.
          textEls.forEach((el) => {
            SplitText.create(el, {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              linesClass: 'reveal-line',
              onSplit(self) {
                gsap.set(el, { autoAlpha: 1 });
                return gsap.from(self.lines, {
                  yPercent: 110,
                  duration: 1,
                  ease: 'power4.out',
                  stagger: 0.08,
                  delay: delayOf(el),
                  scrollTrigger: {
                    trigger: el,
                    start: 'top 92%',
                    once: true,
                    // invalidateOnRefresh re-reads start/end after images
                    // settle, so a late-loading image can no longer push an
                    // element past its own trigger.
                    invalidateOnRefresh: true,
                  },
                });
              },
            });
          });

          // ── IMAGES ──────────────────────────────────────────────────────
          // clip-path is a compositor-friendly reveal on desktop but forces
          // repaints on mobile GPUs. Phones get opacity + translate instead.
          imageEls.forEach((el) => {
            const from = desktop
              ? { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 0 }
              : { y: 24, autoAlpha: 0 };

            gsap.from(el, {
              ...from,
              duration: desktop ? 1.4 : 0.8,
              ease: 'power4.out',
              delay: delayOf(el),
              scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                once: true,
                invalidateOnRefresh: true,
              },
            });
          });

          // ── LINES (animated hairline dividers) ──────────────────────────
          lineEls.forEach((el) => {
            gsap.from(el, {
              scaleX: 0,
              duration: 0.9,
              ease: 'power3.out',
              delay: delayOf(el),
              scrollTrigger: {
                trigger: el,
                start: 'top 98%',
                once: true,
                invalidateOnRefresh: true,
              },
            });
          });
        }
      );

      // gsap.context (which useGSAP wraps) invokes a returned function on
      // revert, so matchMedia is torn down on unmount and on dep change.
      return () => mm.revert();
    },
    { scope, dependencies: [enabled, ...deps], revertOnUpdate: true }
  );

  return scope;
}

/**
 * Refresh ScrollTrigger once every image has settled.
 *
 * Mount ONCE at app root. Belt-and-braces: every image should also carry
 * explicit width/height (see SanityImage) so layout never moves in the first
 * place. This covers anything that slips through.
 */
export function useScrollTriggerRefresh() {
  useGSAP(() => {
    // gsap.utils has no debounce (checked against the installed 3.14.2 type
    // declarations — it isn't there), so this is a minimal hand-rolled one.
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 200);
    };

    const pending = Array.from(document.images).filter((img) => !img.complete);
    pending.forEach((img) => {
      img.addEventListener('load', refresh, { once: true });
      img.addEventListener('error', refresh, { once: true });
    });

    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', refresh);
      pending.forEach((img) => {
        img.removeEventListener('load', refresh);
        img.removeEventListener('error', refresh);
      });
    };
  }, []);
}
