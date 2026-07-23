import React, { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

interface Props {
  onComplete: () => void;
}

/**
 * SplashLoader — same look, no framer-motion, deliberately paced.
 *
 * The old version was a fake progress bar on a two-phase fixed schedule
 * (~42 ticks x 80ms to reach 85, hold, then a final sprint to 100) — that
 * two-speed shape is exactly what read as "staggers randomly": the rate the
 * number climbs at visibly changes partway through. This is one continuous,
 * linear 4-second count instead — no phase change, no deceleration curve,
 * just a steady climb from 0 to 100.
 *
 * Every page's own useReveal is gated on AppReadyContext (see App.tsx), so
 * nothing behind the splash depends on real load signals finishing by a
 * particular moment — the count length here is purely a deliberate,
 * unhurried held first impression, not a readiness gate. Exit is a zoom +
 * fade dissolve (not the old curtain slide) using the original splash's
 * cubic-bezier easing.
 */

const COUNT_DURATION = 4; // seconds — the whole point: deterministic, not load-dependent
const HOLD_BEFORE_EXIT = 0.4;
const EXIT_DURATION = 1.4;
const EASE_CUSTOM = 'cubic-bezier(0.76, 0, 0.24, 1)';

/**
 * One rolling digit column, odometer-style.
 *
 * `place` is the digit's positional value (100/10/1). `position` is a
 * MONOTONICALLY INCREASING index (never wraps back to 0) — floor(value /
 * place) — used directly as the strip's scroll offset, with the strip
 * itself built from `position`-many rows of `i % 10`. That's what keeps the
 * roll always moving forward through 9->0 transitions instead of jumping
 * backward: rather than resetting the transform to a repeated "0" further
 * down a short strip, the strip already has a real row waiting at every
 * position 0-100 could ever reach, so there's never a reset to fake.
 */
const OdometerColumn: React.FC<{ place: number; value: number }> = ({ place, value }) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const position = Math.floor(value / place);
  const rows = Math.floor(100 / place) + 1;

  useEffect(() => {
    if (!stripRef.current) return;
    gsap.to(stripRef.current, {
      y: `${-position}em`,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [position]);

  return (
    <div className="splash-odometer-col">
      <div className="splash-odometer-strip" ref={stripRef}>
        {Array.from({ length: rows }, (_, i) => (
          <div className="splash-odometer-digit" key={i}>
            {i % 10}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SplashLoader: React.FC<Props> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onComplete();
      return;
    }

    const tl = gsap.timeline();

    tl.to(
      { v: 0 },
      {
        v: 100,
        duration: COUNT_DURATION,
        ease: 'none',
        onUpdate() {
          setCount(Math.round((this.targets()[0] as { v: number }).v));
        },
      }
    ).to(
      rootRef.current,
      {
        scale: 1.08,
        opacity: 0,
        duration: EXIT_DURATION,
        ease: EASE_CUSTOM,
        onComplete,
      },
      `+=${HOLD_BEFORE_EXIT}`
    );

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="splash-screen" ref={rootRef}>
      <div className="splash-counter">
        <OdometerColumn place={100} value={count} />
        <OdometerColumn place={10} value={count} />
        <OdometerColumn place={1} value={count} />
      </div>
    </div>
  );
};
