import { useEffect, RefObject } from 'react';
import gsap from 'gsap';

/**
 * useMagneticEffect
 *
 * Attaches a magnetic pull to the referenced element. When the cursor
 * enters a `radius`-px field around the element's center, the element
 * drifts toward the cursor proportional to `strength`. On cursor exit,
 * it snaps back with elastic spring physics.
 *
 * Automatically disabled on touch/coarse-pointer devices — no JS overhead
 * on mobile.
 *
 * @param ref      - React ref pointing at the target DOM element
 * @param strength - How far the element moves (0–1). Default 0.4
 * @param radius   - Pixel radius of the magnetic field. Default 60
 */
export const useMagneticEffect = (
  ref: RefObject<HTMLElement | null>,
  strength = 0.4,
  radius = 60
) => {
  useEffect(() => {
    // Guard: only run on pointer-fine devices (mouse, trackpad)
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const el = ref.current;
    if (!el) return;

    // quickTo gives us a pre-compiled, low-overhead animation function
    // that fires on every mousemove without creating a new tween each time.
    const xTo = gsap.quickTo(el, 'x', {
      duration: 0.6,
      ease: 'elastic.out(1, 0.4)',
    });
    const yTo = gsap.quickTo(el, 'y', {
      duration: 0.6,
      ease: 'elastic.out(1, 0.4)',
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        // Pull toward cursor — strength scales the displacement
        xTo(dx * strength);
        yTo(dy * strength);
      } else {
        // Outside field: snap back to origin
        xTo(0);
        yTo(0);
      }
    };

    // Extra safety: also reset on explicit mouse leave
    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      // Hard-reset transform so element doesn't get stuck
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, strength, radius]);
};