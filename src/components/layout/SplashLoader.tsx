import React, { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

interface Props {
  onComplete: () => void;
}

/**
 * SplashLoader — same look, real timing, no framer-motion.
 *
 * The old version was a fake progress bar on a fixed schedule:
 *   ~42 ticks x 80ms to reach 85, + 600ms hold, + ~10 ticks x 120ms,
 *   + 400ms, + 1400ms exit  ≈  7 seconds, every single visit.
 *
 * Locally that hid the load. On a CDN the real load time stacks on top of it
 * instead of behind it, so a fixed schedule tuned for localhost either feels
 * rushed on a fast connection or gets bulldozed by real load time on a slow
 * one. The counter is still driven by actual readiness (fonts + window load,
 * with a MAX_WAIT ceiling so a stalled connection never hangs it forever),
 * but MIN_SHOW keeps the deliberate, unhurried pacing intentional here —
 * this isn't just a loading indicator, it's a held first impression before
 * the exit reveals the page. Slide-exit uses the same cubic-bezier and 1.4s
 * duration as the original.
 */

const MAX_WAIT = 4000;
const MIN_SHOW = 2800;
const EASE_CUSTOM = 'cubic-bezier(0.76, 0, 0.24, 1)';

export const SplashLoader: React.FC<Props> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onComplete();
      return;
    }

    const started = performance.now();
    let done = false;

    // Creep toward 90 while we wait. Never claims 100 until it is true.
    const creep = gsap.to(
      { v: 0 },
      {
        v: 90,
        duration: 2.4,
        ease: 'power2.out',
        onUpdate() {
          setCount(Math.round((this.targets()[0] as { v: number }).v));
        },
      }
    );

    const ready = Promise.race([
      Promise.all([
        document.fonts?.ready ?? Promise.resolve(),
        document.readyState === 'complete'
          ? Promise.resolve()
          : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true })),
      ]),
      new Promise<void>((r) => setTimeout(r, MAX_WAIT)),
    ]);

    ready.then(() => {
      if (done) return;
      done = true;
      creep.kill();

      const elapsed = performance.now() - started;
      const hold = Math.max(0, MIN_SHOW - elapsed);

      gsap
        .timeline({ delay: hold / 1000 })
        .to(
          { v: count },
          {
            v: 100,
            duration: 0.6,
            ease: 'power2.out',
            onUpdate() {
              setCount(Math.round((this.targets()[0] as { v: number }).v));
            },
          }
        )
        .to(rootRef.current, {
          yPercent: -100,
          duration: 1.4,
          ease: EASE_CUSTOM,
          onComplete,
        }, '+=0.4');
    });

    return () => {
      done = true;
      creep.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="splash-screen" ref={rootRef}>
      <div className="splash-counter">{count}</div>
    </div>
  );
};
