import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

export const useGlobalTextReveal = (isLoaded: boolean) => {
  const location = useLocation();

  useEffect(() => {
    // ── Is this a case study page? ───────────────────────────────────────
    // CaseStudy.tsx owns its own reveal lifecycle after async Sanity data
    // lands. We skip all main content here to avoid two GSAP contexts
    // competing for opacity on the same elements.
    // We do NOT use :not(:has()) in querySelectorAll — :has() selector
    // support in JS is inconsistent across browser versions and fails silently,
    // returning empty NodeLists and breaking all animations.
    const isCaseStudy = !!document.querySelector('.case-study-page');

    const textElements = isCaseStudy
      ? document.querySelectorAll(`
          .footer-cta h2, .footer-email, .footer-bottom,
          .header-logo a, .header-time, .header-menu-toggle
        `)
      : document.querySelectorAll(`
          main h1, main h2, main h3, main p,
          .footer-cta h2, .footer-email, .footer-bottom,
          .contact-big-link, .focus-list span,
          .work-meta span, .header-logo a, .header-time, .header-menu-toggle
        `);

    const imageElements = isCaseStudy
      ? document.querySelectorAll('.hero-image-wrapper')
      : document.querySelectorAll(`
          .work-img-wrapper, .about-img-placeholder, .hero-image-wrapper,
          main img
        `);

    // Pre-hide via JS only — never via CSS.
    // If JS fails for any reason, elements remain visible (degraded but
    // not broken). A CSS opacity:0 failure = permanently blank page.
    gsap.set(textElements, { opacity: 0 });
    gsap.set(imageElements, { opacity: 0 });

    if (!isLoaded) return;

    let splits: SplitType[] = [];
    let timerId: ReturnType<typeof setTimeout>;
    let ctx: gsap.Context;

    // fonts.ready ensures SplitType measures line breaks with the real font,
    // not the fallback. Race with 2s timeout so a stalled font never hangs.
    Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).then(() => {
      timerId = setTimeout(() => {
        ctx = gsap.context(() => {

          // ── TEXT ────────────────────────────────────────────────────
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

              const isAboveFold =
                el.getBoundingClientRect().top < window.innerHeight;

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

          // ── IMAGES ──────────────────────────────────────────────────
          imageElements.forEach((img) => {
            if (img.classList.contains('img-processed')) return;
            img.classList.add('img-processed');

            const isAboveFold =
              img.getBoundingClientRect().top < window.innerHeight;

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

          ScrollTrigger.refresh();
        });
      }, 200);
    });

    return () => {
      clearTimeout(timerId);
      ctx?.revert();
      splits.forEach((s) => s.revert());
      splits = [];
      document.querySelectorAll('.split-processed, .img-processed').forEach((el) => {
        el.classList.remove('split-processed', 'img-processed');
      });
    };
  }, [location.pathname, isLoaded]);
};