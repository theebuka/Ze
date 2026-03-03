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
    // CaseStudy.tsx owns its reveal lifecycle after async Sanity data lands.
    // We skip all main content here to avoid two GSAP contexts competing.
    // NOT using :not(:has()) — fails silently in some browsers.
    const isCaseStudy = !!document.querySelector('.case-study-page');

    // ── TEXT targets ──────────────────────────────────────────────────────
    // .focus-skill intentionally excluded: the skill rows animate as units
    // via CSS, not line-by-line via SplitType. Splitting them would create
    // incorrect overflow masks on the short all-caps labels.
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

    // ── IMAGE targets ─────────────────────────────────────────────────────
    const imageElements = isCaseStudy
      ? document.querySelectorAll('.hero-image-wrapper')
      : document.querySelectorAll(`
          .work-img-wrapper, .about-img-placeholder,
          .hero-image-wrapper, main img
        `);

    // Pre-hide via JS only. CSS opacity:0 = permanently blank if JS fails.
    gsap.set(textElements, { opacity: 0 });
    gsap.set(imageElements, { opacity: 0 });

    if (!isLoaded) return;

    let splits: SplitType[] = [];
    let timerId: ReturnType<typeof setTimeout>;
    let ctx: gsap.Context;

    Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).then(() => {
      timerId = setTimeout(() => {
        ctx = gsap.context(() => {

          // ── TEXT reveals ───────────────────────────────────────────────
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

          // ── IMAGE reveals ──────────────────────────────────────────────
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