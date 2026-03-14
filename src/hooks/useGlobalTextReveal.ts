import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

export const useGlobalTextReveal = (isLoaded: boolean) => {
  const location = useLocation();

  useEffect(() => {
    // ── Case study check ─────────────────────────────────────────────────
    // CaseStudy.tsx owns its own reveal lifecycle after async Sanity data.
    // We skip main content to avoid two GSAP contexts competing on the
    // same elements. NOT using :not(:has()) — inconsistent browser support.
    const isCaseStudy = !!document.querySelector('.case-study-page');

    // ── Text targets ──────────────────────────────────────────────────────
    // .focus-skill intentionally excluded: the skill rows animate as CSS
    // hover units, not line-by-line SplitType. Splitting them creates
    // wrong overflow masks on the short uppercase labels.
    const textElements = isCaseStudy
      ? document.querySelectorAll(`
          .header-logo a, .header-time, .header-menu-toggle
        `)
      : document.querySelectorAll(`
          main h1, main h2, main h3, main p,
          .contact-link, .vault-link-label,
          .work-meta-brand,
          .header-logo a, .header-time, .header-menu-toggle
        `);

    // ── Image targets ─────────────────────────────────────────────────────
    const imageElements = isCaseStudy
      ? document.querySelectorAll('.hero-image-wrapper')
      : document.querySelectorAll(`
          .work-img-wrapper, .about-img-placeholder,
          .hero-image-wrapper, main img
        `);

    // ── Line-reveal targets ───────────────────────────────────────────────
    // .line-reveal elements replace CSS borders sitewide.
    // They start at scaleX(0) (set in CSS) and animate to scaleX(1)
    // left-to-right when they enter the viewport.
    const lineElements = document.querySelectorAll('.line-reveal');

    // Pre-hide text and images via JS. CSS opacity:0 = permanently blank if JS fails.
    gsap.set(textElements, { opacity: 0 });
    gsap.set(imageElements, { opacity: 0 });
    // line-reveal starts at scaleX(0) already via CSS — no JS pre-hide needed.

    if (!isLoaded) return;

    let splits: SplitType[] = [];
    let timerId: ReturnType<typeof setTimeout>;
    let ctx: gsap.Context;

    // fonts.ready: ensures SplitType measures with the real font, not fallback.
    // Race with 2s timeout so a stalled font never hangs the page.
    Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).then(() => {
      timerId = setTimeout(() => {
        ctx = gsap.context(() => {

          // ── TEXT reveals ─────────────────────────────────────────────────
          textElements.forEach((el) => {
            if (el.classList.contains('split-processed')) return;
            el.classList.add('split-processed');

            const split = new SplitType(el as HTMLElement, { types: 'lines' });
            splits.push(split);

            if (split.lines && split.lines.length > 0) {
              split.lines.forEach((line) => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('reveal-mask');
                wrapper.style.overflow = 'hidden';
                wrapper.style.display = 'inline-block';
                wrapper.style.verticalAlign = 'top';
                wrapper.style.width = '100%';
                wrapper.style.paddingTop = '0.1em';
                wrapper.style.paddingBottom = '0.1em';
                wrapper.style.marginTop = '-0.1em';
                wrapper.style.marginBottom = '-0.1em';
                line.parentNode?.insertBefore(wrapper, line);
                wrapper.appendChild(line);
              });

              gsap.set(el, { opacity: 1 });
              const isAboveFold = el.getBoundingClientRect().top < window.innerHeight;

              gsap.fromTo(
                split.lines,
                { y: '100%', opacity: 0 },
                {
                  y: '0%',
                  opacity: 1,
                  duration: 1.2,
                  ease: 'power4.out',
                  stagger: 0.12,
                  delay: isAboveFold ? 0.4 : 0,
                  scrollTrigger: {
                    trigger: el,
                    start: 'top 95%',
                    toggleActions: 'play none none none',
                  },
                }
              );
            } else {
              gsap.set(el, { opacity: 1 });
            }
          });

          // ── IMAGE reveals ─────────────────────────────────────────────────
          imageElements.forEach((img) => {
            if (img.classList.contains('img-processed')) return;
            img.classList.add('img-processed');

            const isAboveFold = img.getBoundingClientRect().top < window.innerHeight;

            gsap.fromTo(
              img,
              { clipPath: 'inset(100% 0% 0% 0%)', y: 40, opacity: 0 },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                y: 0,
                opacity: 1,
                duration: 1.6,
                ease: 'power4.out',
                delay: isAboveFold ? 0.4 : 0,
                scrollTrigger: {
                  trigger: img,
                  start: 'top 90%',
                  toggleActions: 'play none none none',
                },
              }
            );
          });

          // ── LINE REVEALS ──────────────────────────────────────────────────
          // Animates each .line-reveal scaleX(0) → scaleX(1), left-to-right.
          // Duration is slightly faster than image reveals (lines are simple).
          // .line-reveal already has transform-origin: left center from CSS.
          lineElements.forEach((line) => {
            if (line.classList.contains('line-processed')) return;
            line.classList.add('line-processed');

            const isAboveFold = line.getBoundingClientRect().top < window.innerHeight;

            gsap.fromTo(
              line,
              { scaleX: 0 },
              {
                scaleX: 1,
                duration: 1.0,
                ease: 'power3.out',
                delay: isAboveFold ? 0.6 : 0,
                scrollTrigger: {
                  trigger: line,
                  start: 'top 98%',
                  toggleActions: 'play none none none',
                },
              }
            );
          });

          ScrollTrigger.refresh();
        });
      }, 200);
    });

    return () => {
      clearTimeout(timerId);
      ctx?.revert();
      splits.forEach((s) => s.revert());
      splits = [];
      document.querySelectorAll('.split-processed, .img-processed, .line-processed').forEach((el) => {
        el.classList.remove('split-processed', 'img-processed', 'line-processed');
      });
    };
  }, [location.pathname, isLoaded]);
};