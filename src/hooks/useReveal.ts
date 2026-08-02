import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP, MOTION } from '../lib/gsap';

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
 * Reveal types:
 *   text  — SplitText line masks. Owns the element's text nodes, so it can
 *           only be used on copy React never re-renders.
 *   rise  — the same masked rise, done on the element's own children instead
 *           of a split. Nothing inside is replaced, so the content can keep
 *           re-rendering (a ticking clock, a MENU/CLOSE toggle) while the
 *           reveal runs on the wrapper.
 *   image — fade + clip (desktop) or fade + translate (mobile).
 *   line  — scaleX on a hairline divider.
 *
 * Usage:
 *   const scope = useReveal({ deps: [works] });
 *   return <main ref={scope}>…</main>;
 */

interface RevealOptions {
  /** Re-run when async content arrives. Same semantics as a dep array. */
  deps?: unknown[];
  /**
   * Hold setup until nothing is covering the screen — the splash on a cold
   * load, the menu overlay on a navigation out of it (see AppReadyContext).
   *
   * Latching, not gating: see `unlocked` below. Once a scope has revealed,
   * this going false again cannot take it back.
   */
  enabled?: boolean;
  /**
   * Drive every reveal in this scope off a DIFFERENT element's scroll
   * position.
   *
   * ScrollTrigger measures the trigger's position in the viewport, which is a
   * meaningless question for a `position: fixed` scope — it is always in view,
   * so every reveal inside it fires the instant it is created. That is the
   * footer: it sits fixed behind `main`, uncovered as `main` scrolls away, so
   * "is the footer visible" is really "how far past the bottom of main are
   * we". Point the triggers at main and ask that question instead.
   */
  viewTrigger?: {
    trigger: string | Element;
    /** Function form is re-evaluated on every refresh (see invalidateOnRefresh). */
    start: string | (() => string);
  };
}

const delayOf = (el: HTMLElement) => parseFloat(el.dataset.revealDelay ?? '0') || 0;

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {}
): RefObject<T | null> {
  const scope = useRef<T>(null);
  const { deps = [], enabled = true, viewTrigger } = options;

  // `enabled` may only ever unlock, never re-lock.
  //
  // The gate is app-wide (AppReadyContext), so it closes for EVERY mounted
  // component whenever something covers the screen — including the menu
  // overlay opening on top of a page that has already revealed. Since the
  // gate sits in useGSAP's dependency array with revertOnUpdate, feeding
  // `enabled` straight in would revert that page's splits and replay its
  // whole reveal the moment you closed the menu again without navigating.
  //
  // Latching means only a FRESHLY MOUNTED scope is ever held back: it
  // initialises to whatever the gate reads right now (false while covered),
  // and an already-revealed scope keeps its `true` no matter what the gate
  // does afterwards.
  // Adjusted during render rather than in an effect: this is derived state,
  // and React resolves a render-phase set by re-rendering before it commits,
  // so `unlocked` is correct on the very first paint after the gate opens.
  // An effect would commit one render with the stale value first, which for
  // a reveal means a frame of already-visible content before it hides again.
  const [unlocked, setUnlocked] = useState(enabled);
  if (enabled && !unlocked) setUnlocked(true);

  useGSAP(
    () => {
      const root = scope.current;
      if (!unlocked || !root) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: '(prefers-reduced-motion: reduce)',
          motion: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 769px)',
        },
        (ctx) => {
          const { reduced, desktop } = ctx.conditions as Record<string, boolean>;

          // Anything created inside SplitText's onSplit callback is invisible
          // to gsap.context — the callback fires long after the context has
          // finished collecting. Track those by hand so a dep change or an
          // unmount cannot leave a scrub bound to detached word elements.
          const splits: SplitText[] = [];
          const orphans: gsap.core.Tween[] = [];
          const disposeOrphans = () =>
            orphans.splice(0).forEach((t) => {
              t.scrollTrigger?.kill();
              t.kill();
            });

          const textEls = gsap.utils.toArray<HTMLElement>('[data-reveal="text"]', root);
          const riseEls = gsap.utils.toArray<HTMLElement>('[data-reveal="rise"]', root);
          const imageEls = gsap.utils.toArray<HTMLElement>('[data-reveal="image"]', root);
          const lineEls = gsap.utils.toArray<HTMLElement>('[data-reveal="line"]', root);

          // ── Reduced motion: show everything, animate nothing ───────────
          if (reduced) {
            gsap.set([...textEls, ...riseEls, ...imageEls], {
              autoAlpha: 1,
              clearProps: 'clipPath,transform',
            });
            gsap.set(lineEls, { scaleX: 1 });
            return;
          }

          // A resolved viewTrigger replaces the per-element trigger for every
          // reveal in this scope. Resolved once, here, rather than per
          // element: the answer cannot differ between them.
          const overrideEl =
            typeof viewTrigger?.trigger === 'string'
              ? document.querySelector(viewTrigger.trigger)
              : viewTrigger?.trigger ?? null;

          /** ScrollTrigger vars for one element, honouring any viewTrigger. */
          const triggerFor = (el: HTMLElement, start: string) => ({
            trigger: overrideEl ?? el,
            start: overrideEl && viewTrigger ? viewTrigger.start : start,
            once: true,
            // invalidateOnRefresh re-reads start/end after images settle, so a
            // late-loading image can no longer push an element past its own
            // trigger. It is also what re-evaluates a function-form start.
            invalidateOnRefresh: true,
          });

          // ── TEXT ────────────────────────────────────────────────────────
          // `mask: 'lines'` builds the overflow:hidden wrapper that the old
          // code assembled by hand with eight inline styles per line.
          // `autoSplit: true` re-splits on font load and resize; creating the
          // tween inside onSplit means it re-binds to the NEW line elements
          // rather than orphaned ones from the previous split.
          //
          // The hidden state is set with an explicit gsap.set() BEFORE the
          // parent is revealed and BEFORE the scroll-triggered tween is
          // created, rather than leaning on .from()'s implicit
          // immediateRender. Doing it explicitly means the lines are
          // guaranteed to already be translated out of view the instant the
          // parent becomes visible — no dependence on exactly when GSAP
          // decides to apply a tween's starting values, which is what
          // caused a visible "shutter" flash of already-revealed text
          // before it animated back in.
          textEls.forEach((el) => {
            // `data-scrub="words"` adds the second pass: the copy settles at
            // 40% white, then fills to solid word by word as you scroll. The
            // fill is a separate tween on a separate ScrollTrigger because the
            // reveal is a one-shot (`once: true`) and this one is scrubbed —
            // a single timeline cannot be both.
            const scrubWords = el.dataset.scrub === 'words';
            let fill: gsap.core.Tween | null = null;

            splits.push(SplitText.create(el, {
              type: scrubWords ? 'lines,words' : 'lines',
              mask: 'lines',
              autoSplit: true,
              linesClass: 'reveal-line',
              wordsClass: 'reveal-word',
              onSplit(self) {
                // autoSplit re-runs this with brand-new word nodes on every
                // font load and resize; the previous fill still points at the
                // discarded ones.
                if (fill) {
                  fill.scrollTrigger?.kill();
                  fill.kill();
                  orphans.splice(orphans.indexOf(fill), 1);
                }

                if (scrubWords) {
                  // Trigger off a stable ancestor where one is offered: the
                  // element itself may be position:sticky, and ScrollTrigger
                  // measures a stuck element wherever it is currently pinned,
                  // not where it sits in flow.
                  const trigger =
                    el.closest<HTMLElement>('[data-scrub-trigger]') ?? el;

                  // The default range assumes the block scrolls past at page
                  // speed. A block that PARKS needs its own: otherwise the
                  // fill finishes on the way in and the whole effect is over
                  // before the text settles where the reader looks at it.
                  // Override with data-scrub-start / data-scrub-end on the
                  // trigger element (see About's sticky pairs).
                  const startAt = trigger.dataset.scrubStart ?? 'top 78%';
                  const endAt = trigger.dataset.scrubEnd ?? '+=70%';

                  fill = gsap.fromTo(
                    self.words,
                    { opacity: 0.4 },
                    {
                      opacity: 1,
                      ease: 'none',
                      // Ratio, not seconds — a scrub maps the timeline onto
                      // distance. Overlapping by 4x keeps it a soft wave
                      // rather than a row of switches flipping.
                      duration: 2,
                      stagger: 0.5,
                      scrollTrigger: {
                        trigger,
                        start: startAt,
                        end: endAt,
                        scrub: MOTION.scrub,
                        // NOT invalidateOnRefresh. On refresh that calls
                        // `animation.revert().invalidate()`, which strips the
                        // inline opacity from every word and only re-renders
                        // children that declare immediateRender — which a
                        // staggered fromTo does not. Every word past the
                        // playhead would silently lose its 40% resting state
                        // and sit at full white. Nothing here needs
                        // re-measuring anyway: autoSplit re-splits on resize
                        // and this tween is rebuilt from scratch below.
                      },
                    }
                  );
                  orphans.push(fill);
                }

                gsap.set(self.lines, { yPercent: 110 });
                gsap.set(el, { autoAlpha: 1 });
                // No stagger: every line of a block leaves its mask on the
                // same frame, so the paragraph arrives as one object rather
                // than assembling itself line by line. Choreography between
                // SEPARATE blocks is still available via data-reveal-delay.
                return gsap.to(self.lines, {
                  yPercent: 0,
                  duration: MOTION.textDuration,
                  ease: MOTION.ease,
                  delay: delayOf(el),
                  // 88%, not 92%. At MOTION.textDuration (1.5s) a reveal
                  // fired 8% from the bottom edge spends most of its run
                  // off-screen — the block is already settled by the time you
                  // can read it. Four points later is the difference between
                  // a reveal you watch and one you only catch the end of.
                  scrollTrigger: triggerFor(el, 'top 88%'),
                });
              },
            }));
          });

          // ── RISE ────────────────────────────────────────────────────────
          // Same look as a single-line text reveal, without SplitText.
          //
          // SplitText takes ownership of an element's text nodes, replacing
          // them with its own split/mask DOM. Anything React re-renders — the
          // Lagos clock ticking every second, the MENU/CLOSE label flipping on
          // click — then fights it for those nodes, and the content either
          // stops updating or flickers between the two versions. Here the mask
          // is a static CSS box (see [data-reveal='rise'] in animation.css)
          // and the tween runs on the element's own children, which React
          // keeps and re-renders into. Nothing is ever replaced.
          riseEls.forEach((el) => {
            const inner = Array.from(el.children) as HTMLElement[];
            if (!inner.length) return;

            gsap.set(inner, { yPercent: 110 });
            gsap.set(el, { autoAlpha: 1 });
            gsap.to(inner, {
              yPercent: 0,
              duration: MOTION.textDuration,
              ease: MOTION.ease,
              stagger: MOTION.stagger,
              delay: delayOf(el),
              scrollTrigger: triggerFor(el, 'top 88%'),
            });
          });

          // ── IMAGES ──────────────────────────────────────────────────────
          // clip-path is a compositor-friendly reveal on desktop but forces
          // repaints on mobile GPUs. Phones get opacity + translate instead.
          // Same explicit-set-then-.to() pattern as text, for the same
          // reason — no reliance on implicit initial-render timing.
          imageEls.forEach((el) => {
            const from = desktop
              ? { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 0 }
              : { y: 24, autoAlpha: 0 };
            const to = desktop
              ? { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1 }
              : { y: 0, autoAlpha: 1 };

            gsap.set(el, from);
            gsap.to(el, {
              ...to,
              duration: desktop ? MOTION.imageDuration : 1,
              ease: MOTION.ease,
              delay: delayOf(el),
              scrollTrigger: triggerFor(el, 'top 90%'),
            });
          });

          // ── LINES (animated hairline dividers) ──────────────────────────
          lineEls.forEach((el) => {
            gsap.set(el, { scaleX: 0 });
            gsap.to(el, {
              scaleX: 1,
              duration: MOTION.lineDuration,
              ease: MOTION.ease,
              delay: delayOf(el),
              scrollTrigger: triggerFor(el, 'top 98%'),
            });
          });

          // Reverting the splits restores the original markup. Without it, a
          // dep change (Home re-runs when its Sanity fetch lands) re-splits
          // text that is ALREADY split, nesting a second set of line masks
          // inside the first.
          return () => {
            disposeOrphans();
            splits.forEach((s) => s.revert());
          };
        }
      );

      // gsap.context (which useGSAP wraps) invokes a returned function on
      // revert, so matchMedia is torn down on unmount and on dep change.
      return () => mm.revert();
    },
    { scope, dependencies: [unlocked, ...deps], revertOnUpdate: true }
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
