import type { RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP, MOTION } from '../lib/gsap';

/**
 * useHomeMotion — the homepage's scroll choreography.
 *
 * Three independent pieces, deliberately kept in one hook because they all
 * measure the same layout and must be torn down together:
 *
 *   1. HERO OPEN-OUT
 *      `.hero-stage` is `position: sticky` (CSS), NOT a ScrollTrigger pin.
 *      A pin wraps the element in a generated spacer, which fights the
 *      full-bleed negative margin the hero needs, and pin spacers plus Lenis
 *      plus a 100svh element is the classic source of a one-frame jump on
 *      release. Sticky costs nothing, releases exactly at the section bottom,
 *      and leaves ScrollTrigger doing only what it is good at: mapping scroll
 *      distance to a timeline's progress.
 *
 *      The section is taller than the stage; that surplus IS the animation's
 *      scroll budget, so `start: top top` / `end: bottom bottom` lines the
 *      timeline up with the stuck window precisely.
 *
 *   2. SPECIALTY PLAYHEAD
 *      One ScrollTrigger per list item, active while the 55% line sits
 *      between the item's own top and bottom. The items are contiguous
 *      (padding, never gap — see index.css) so exactly one is lit at a time
 *      with no dead zone between them.
 *
 *   3. STICKY SUMMARY OFFSET
 *      CSS sticky needs a `top` in px, but the design is expressed as "stick
 *      when the element's BOTTOM is 15% above the viewport bottom" — i.e.
 *      top = 85vh - height, which CSS cannot express without knowing the
 *      height. Measured here, published as a custom property.
 *
 * All of it is scoped to a ref, so nothing here can reach into another page.
 */

/** Portrait → landscape. The opened frame is full-bleed, capped at stage height. */
// Replace OPEN_ASPECT — no longer used to cap height, image now covers
// the full stage on expand.
const PUSH_DOWN = () => window.innerHeight * 0.6; // matches the removed 70vh

// Fraction of the image's catch-up distance the title also travels.
// 0 = title stays put, 1 = they'd move together (no catch-up visible).
// Must stay < 1 — the solver divides by (1 - ratio); flipping which
// element leads means solving for titleY as the free variable instead.
const TEXT_SPEED_RATIO = 0.35;

// Catch-up must land by this point in the scrubbed timeline (0–1).
const CATCH_UP_END = 0.4;
const EXPAND_DURATION = 0.6;
const EXPAND_END = CATCH_UP_END + EXPAND_DURATION; // 0.85
const FADE_START = CATCH_UP_END + 0.02;
const FADE_DURATION = 0.2;
// const EXPAND_EASE = 'expo.inOut';

export function useHomeMotion(
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
      const mm = gsap.matchMedia();

      // ── 1. HERO OPEN-OUT (desktop, motion allowed) ──────────────────
      mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        const section = q('.hero-section');
        const stage = q<HTMLElement>('.hero-stage');
        const media = q<HTMLElement>('.hero-media');
        const inner = q<HTMLElement>('.hero-media-inner');
        const title = q<HTMLElement>('.hero-title-col');
        const img = media?.querySelector<HTMLElement>('img') ?? null;
        if (!section || !stage || !media || !title) return;
      
        const stageW = () => stage.getBoundingClientRect().width;
        const stageH = () => stage.getBoundingClientRect().height;
        const openW = () => stageW();
        const openH = () => stageH(); // full viewport height on expand, no cap
      
        // Rest-position edges. Safe to read here because onRefreshInit rewinds
        // the timeline (progress 0) before invalidateOnRefresh re-runs these —
        // both elements' own y-offset is guaranteed 0 when this fires, so this
        // only ever measures the static CSS position (padding-top / frame
        // transform), never a mid-scroll state.
        const titleBottom = () => title.getBoundingClientRect().bottom;
        const mediaBottom = () => media.getBoundingClientRect().bottom;
      
        // Solve for the two y-offsets that put both bottom edges on the same
        // line at CATCH_UP_END:
        //   mediaBottom + mediaY == titleBottom + titleY
        //   titleY == mediaY * TEXT_SPEED_RATIO
        const mediaCatchUpY = () => {
          const gap = mediaBottom() - titleBottom();
          return PUSH_DOWN() - gap / (1 - TEXT_SPEED_RATIO);
        };
        const titleCatchUpY = () => (mediaCatchUpY() - PUSH_DOWN()) * TEXT_SPEED_RATIO;
      
        if (img) gsap.set(img, { scale: 1.12, transformOrigin: 'center center' });
      
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: MOTION.scrub,
            invalidateOnRefresh: true,
            onRefreshInit: () => tl.progress(0),
          },
        });
      
        tl
  .fromTo(media, { y: PUSH_DOWN }, { y: mediaCatchUpY, duration: CATCH_UP_END }, 0)
  .fromTo(title, { y: 0 }, { y: titleCatchUpY, duration: CATCH_UP_END }, 0)
  .to(
    media,
    { y: 0, width: openW, height: openH, marginRight: 0, duration: EXPAND_DURATION, ease: MOTION.easeInOut },
    CATCH_UP_END
  )
  .to(img ?? {}, { scale: 1, duration: EXPAND_DURATION, ease: MOTION.easeInOut }, CATCH_UP_END)
  .to(
    title,
    { autoAlpha: 0, y: () => titleCatchUpY() - stageH() * 0.07, duration: FADE_DURATION, ease: 'power2.in' },
    FADE_START
  )
  .to({}, { duration: 1 - EXPAND_END }, EXPAND_END);
      
        if (!inner) return;
      
        const xTo = gsap.quickTo(inner, 'x', { duration: 1.1, ease: 'power3' });
        const yTo = gsap.quickTo(inner, 'y', { duration: 1.1, ease: 'power3' });
      
        const onMove = (e: MouseEvent) => {
          const r = media.getBoundingClientRect();
          xTo(((e.clientX - (r.left + r.width / 2)) / r.width) * 36);
          yTo(((e.clientY - (r.top + r.height / 2)) / r.height) * 28);
        };
        const onEnter = () => gsap.to(inner, { scale: 1.1, duration: 1.1, ease: MOTION.ease });
        const onLeave = () => {
          gsap.to(inner, { scale: 1, duration: 1.2, ease: MOTION.ease });
          xTo(0);
          yTo(0);
        };
      
        media.addEventListener('mousemove', onMove);
        media.addEventListener('mouseenter', onEnter);
        media.addEventListener('mouseleave', onLeave);
      
        return () => {
          media.removeEventListener('mousemove', onMove);
          media.removeEventListener('mouseenter', onEnter);
          media.removeEventListener('mouseleave', onLeave);
        };
      });

      // ── 2. SPECIALTY PLAYHEAD (all widths, motion allowed) ───────────
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.specialty-item', root).forEach((item) => {
          ScrollTrigger.create({
            trigger: item,
            start: 'top 55%',
            end: 'bottom 55%',
            invalidateOnRefresh: true,
            toggleClass: { targets: item, className: 'is-active' },
          });
        });
      });

      // ── 3. STICKY SUMMARY OFFSET (desktop, motion-independent) ───────
      mm.add('(min-width: 769px)', () => {
        const section = q<HTMLElement>('.focus-section');
        const summary = q<HTMLElement>('.focus-summary');
        if (!section || !summary) return;

        const apply = () => {
          // 15% of the viewport clear of the bottom edge, expressed as the
          // `top` sticky offset. Floored so a very tall summary sticks under
          // the header instead of above the viewport.
          const top = Math.max(
            window.innerHeight * 0.85 - summary.offsetHeight,
            96
          );
          section.style.setProperty('--focus-sticky-top', `${Math.round(top)}px`);
        };

        apply();
        // The summary re-wraps on font load; its height is not final at setup.
        const ro = new ResizeObserver(apply);
        ro.observe(summary);
        window.addEventListener('resize', apply);

        return () => {
          ro.disconnect();
          window.removeEventListener('resize', apply);
          section.style.removeProperty('--focus-sticky-top');
        };
      });

      return () => mm.revert();
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  );
}
