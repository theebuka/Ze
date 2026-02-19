import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';

// Register both the React hook and ScrollTrigger with GSAP
gsap.registerPlugin(useGSAP, ScrollTrigger);

export const useGlobalTextReveal = () => {
  const location = useLocation();

  useGSAP(() => {
    // 1. Broad selector to grab every typography element sitewide
    const textElements = document.querySelectorAll(`
      main h1, main h2, main h3, main p, 
      .footer-cta h2, .footer-email, .footer-bottom,
      .contact-big-link, .focus-list span, .meta-label, .meta-value, .work-meta span
    `);

    // SURGICAL FIX 1: Instantly hide text before the browser paints to prevent FOUC
    if (textElements.length > 0) {
      gsap.set(textElements, { autoAlpha: 0 });
    }

    let splits: SplitType[] = [];

    // 2. Tiny timeout to ensure the DOM is painted before we measure heights
    const timer = setTimeout(() => {
      textElements.forEach((el) => {
        if (el.classList.contains('split-processed')) return;
        el.classList.add('split-processed');

        // Split the text for this specific element into lines
        const split = new SplitType(el as HTMLElement, { types: 'lines' });
        splits.push(split);

        if (split.lines && split.lines.length > 0) {
          // Wrap each line in the overflow:hidden mask
          split.lines.forEach((line) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('reveal-mask');
            
            // Forcing mask properties
            wrapper.style.overflow = 'hidden';
            wrapper.style.display = 'inline-block';
            wrapper.style.verticalAlign = 'top';
            wrapper.style.width = '100%';

            // SURGICAL FIX 2: Expand the mask to prevent cropping of y, g, h, t
            wrapper.style.paddingTop = '0.2em';
            wrapper.style.paddingBottom = '0.2em';
            wrapper.style.marginTop = '-0.2em';
            wrapper.style.marginBottom = '-0.2em';

            line.parentNode?.insertBefore(wrapper, line);
            wrapper.appendChild(line);
          });

          // Text is wrapped, make the parent container visible again
          gsap.set(el, { autoAlpha: 1 });

          // Smart Delay Logic
          const isAboveFold = el.getBoundingClientRect().top < window.innerHeight;

          // Fire the ScrollTrigger GSAP animation
          gsap.fromTo(split.lines,
            { y: '100%', opacity: 0 },
            {
              y: '0%',
              opacity: 1,
              duration: 1.4,
              ease: 'power4.out',
              stagger: { each: 0.12 },
              delay: isAboveFold ? 0.6 : 0, 
              scrollTrigger: {
                trigger: el,
                start: 'top 98%', 
                toggleActions: 'play none none none',
              }
            }
          );
        }
      });

      // SURGICAL FIX 3: Premium Sitewide Image Animations (Clip-Path Wipe)
      const imageElements = document.querySelectorAll('.work-img-wrapper, .about-img-placeholder, .cs-img, .hero-image-wrapper, img');
      
      imageElements.forEach((img) => {
        if (img.classList.contains('img-processed')) return;
        img.classList.add('img-processed');

        const isAboveFold = img.getBoundingClientRect().top < window.innerHeight;

        // Elegant vertical wipe reveal from bottom to top
        gsap.fromTo(img,
          { 
            clipPath: 'inset(100% 0% 0% 0%)', // Starts fully masked out at the bottom
            y: 40 // Starts slightly lower
          },
          {
            clipPath: 'inset(0% 0% 0% 0%)', // Unmasks completely
            y: 0,
            duration: 1.6,
            ease: 'power4.out',
            delay: isAboveFold ? 0.6 : 0,
            scrollTrigger: {
              trigger: img,
              start: 'top 95%',
              toggleActions: 'play none none none',
            }
          }
        );
      });

    }, 50); // Reduced timeout slightly for snappier execution

    // CRITICAL CLEANUP
    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      splits.forEach(s => s.revert());
      document.querySelectorAll('.split-processed').forEach(el => el.classList.remove('split-processed'));
      document.querySelectorAll('.img-processed').forEach(el => el.classList.remove('img-processed'));
    };

  }, [location.pathname]);
};