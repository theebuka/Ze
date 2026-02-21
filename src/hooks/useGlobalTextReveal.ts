import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

export const useGlobalTextReveal = (isLoaded: boolean) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Grab elements instantly
    const textElements = document.querySelectorAll(`
      main h1, main h2, main h3, main p, 
      .footer-cta h2, .footer-email, .footer-bottom,
      .contact-big-link, .focus-list span, .meta-label, .meta-value, .work-meta span,
      .header-logo a, .header-time, .header-menu-toggle
    `);
    
    const imageElements = document.querySelectorAll('.work-img-wrapper, .about-img-placeholder, .cs-img, .hero-image-wrapper, img');

    // THE FOUC FIX: Apply opacity: 0 OUTSIDE the GSAP context. 
    // This makes it a permanent inline style that survives the context revert.
    gsap.set(textElements, { opacity: 0 });
    gsap.set(imageElements, { opacity: 0 });

    // If the splash is still active, abort here. No context is created, no cleanup is registered. 
    // They safely stay at opacity: 0.
    if (!isLoaded) return;

    let splits: SplitType[] = [];
    let timer: ReturnType<typeof setTimeout>;
    
    let ctx = gsap.context(() => {
      
      timer = setTimeout(() => {
        
        // 1. TEXT ANIMATIONS
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

            // CRUCIAL: The parent block is currently locked at opacity: 0. 
            // We must restore its visibility now that the child lines are ready to animate from 0.
            gsap.set(el, { opacity: 1 });

            const isAboveFold = el.getBoundingClientRect().top < window.innerHeight;

            gsap.fromTo(split.lines,
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
                }
              }
            );
          } else {
            // Failsafe: If text is empty or couldn't be split, just make it visible
            gsap.set(el, { opacity: 1 });
          }
        });

        // 2. IMAGE ANIMATIONS
        imageElements.forEach((img) => {
          if (img.classList.contains('img-processed')) return;
          img.classList.add('img-processed');

          const isAboveFold = img.getBoundingClientRect().top < window.innerHeight;

          gsap.fromTo(img,
            { 
              clipPath: 'inset(100% 0% 0% 0%)', // Masks the image completely from the top down to the bottom
              y: 40, 
              opacity: 0 
            },
            {
              clipPath: 'inset(0% 0% 0% 0%)', // Unmasks it completely
              y: 0, 
              opacity: 1, 
              duration: 1.6,
              ease: 'power4.out',
              delay: isAboveFold ? 0.4 : 0, // Using your newly tweaked tight delay
              scrollTrigger: {
                trigger: img,
                start: 'top 90%',
                toggleActions: 'play none none none',
              }
            }
          );
        });

        ScrollTrigger.refresh();

      }, 150); 
    });

    return () => {
      if (timer) clearTimeout(timer);
      ctx.revert(); 
      splits.forEach(split => split.revert());
      splits = [];
      
      document.querySelectorAll('.split-processed, .img-processed').forEach(el => {
        el.classList.remove('split-processed', 'img-processed');
      });
    };

  }, [location.pathname, isLoaded]); 
};