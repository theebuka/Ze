import React, { useEffect, useRef, useState } from 'react';
import { useCursor } from '../../context/CursorContext';
import { gsap } from '../../lib/gsap';

/**
 * CustomCursor — GSAP instead of framer-motion, and inert on touch devices.
 *
 * Two problems with the old version:
 *   1. It mounted on phones. `* { cursor: none }` hid a cursor that does not
 *      exist, while this component still ran two framer-motion springs on
 *      every frame, mounted a <video>, and listened to mousemove.
 *   2. framer-motion was pulled in (~100KB) for this and the splash screen
 *      only, on top of a GSAP bundle that already does both.
 *
 * gsap.quickTo is the idiomatic way to drive a cursor: it reuses one tween
 * instance rather than creating a new one per mousemove event.
 */

const SIZES: Record<string, number> = {
  default: 24,
  'view-project': 80,
  media: 120,
  expand: 88,
};

export const CustomCursor: React.FC = () => {
  const { cursorType, cursorMedia } = useCursor();
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Evaluate once on mount, not on every render, and never render at all on
  // a coarse pointer. `useState(fn)` so matchMedia runs a single time.
  const [enabled] = useState(
    () => !window.matchMedia('(hover: none), (pointer: coarse)').matches
  );

  // Position
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;

    // Off-screen until the first real mousemove, so the cursor doesn't flash
    // at the top-left corner (the element's `top: 0; left: 0` CSS position)
    // before quickTo has anywhere to animate from.
    gsap.set(el, { x: -200, y: -200 });

    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });

    const move = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [enabled]);

  // Size + blend mode
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const size = SIZES[cursorType] ?? SIZES.default;
    gsap.to(ref.current, {
      width: size,
      height: size,
      xPercent: -50,
      yPercent: -50,
      duration: 0.4,
      ease: 'power3.out',
      backgroundColor: cursorType === 'media' ? 'transparent' : 'var(--text-color)',
      mixBlendMode: cursorType === 'media' ? 'normal' : 'difference',
    });
  }, [cursorType, enabled]);

  // Media source
  useEffect(() => {
    const v = videoRef.current;
    if (!enabled || !v) return;
    if (cursorType === 'media' && cursorMedia) {
      v.src = cursorMedia;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
  }, [cursorType, cursorMedia, enabled]);

  if (!enabled) return null;

  return (
    <div ref={ref} className={`custom-cursor cursor-${cursorType}`} aria-hidden="true">
      <span className="cursor-fallback-label">VIEW</span>
      <div className="cursor-media-wrapper">
        <video ref={videoRef} muted loop playsInline preload="none" />
        <span className="cursor-media-label">PLAY</span>
      </div>
    </div>
  );
};
