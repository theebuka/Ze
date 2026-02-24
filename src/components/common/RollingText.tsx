import React, { useRef } from 'react';
import gsap from 'gsap';

interface RollingTextProps {
  /** The string to animate. Spaces are preserved as non-breaking spaces. */
  text: string;
  className?: string;
}

/**
 * RollingText
 *
 * Renders two stacked rows of per-character spans inside a clipping wrapper.
 * On hover, GSAP staggers the top row upward (exit) while the bottom row
 * rolls in from below (enter) — creating a mechanical typographic "roller" effect.
 *
 * The component is a11y-safe: the visible text is aria-hidden, and a visually
 * hidden <span> carries the real text for screen readers.
 *
 * Usage:
 *   <RollingText text="VIEW ALL WORK" className="my-link-text" />
 *
 * Pair with `.rolling-text` styles from interactions.css.
 */
export const RollingText: React.FC<RollingTextProps> = ({ text, className = '' }) => {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  // Hold a reference to the active timeline so we can kill it on fast hovers
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const handleMouseEnter = () => {
    if (!wrapperRef.current) return;

    const topSpans = wrapperRef.current.querySelectorAll<HTMLElement>('.rt-top > span');
    const botSpans = wrapperRef.current.querySelectorAll<HTMLElement>('.rt-bot > span');

    tlRef.current?.kill();
    tlRef.current = gsap.timeline();

    tlRef.current
      // Top row exits upward, staggered left-to-right
      .to(topSpans, {
        y: '-110%',
        duration: 0.4,
        ease: 'power3.in',
        stagger: 0.018,
      })
      // Bottom row enters from below, offset slightly so it overlaps the exit
      .fromTo(
        botSpans,
        { y: '110%' },
        {
          y: '0%',
          duration: 0.45,
          ease: 'power3.out',
          stagger: 0.018,
        },
        '-=0.28' // start before top row fully exits
      );
  };

  const handleMouseLeave = () => {
    if (!wrapperRef.current) return;

    const topSpans = wrapperRef.current.querySelectorAll<HTMLElement>('.rt-top > span');
    const botSpans = wrapperRef.current.querySelectorAll<HTMLElement>('.rt-bot > span');

    tlRef.current?.kill();
    tlRef.current = gsap.timeline();

    tlRef.current
      // Bottom row exits downward
      .to(botSpans, {
        y: '110%',
        duration: 0.4,
        ease: 'power3.in',
        stagger: 0.018,
      })
      // Top row returns from above
      .fromTo(
        topSpans,
        { y: '-110%' },
        {
          y: '0%',
          duration: 0.45,
          ease: 'power3.out',
          stagger: 0.018,
        },
        '-=0.28'
      );
  };

  // Split into characters. Spaces become non-breaking spaces so they render
  // correctly as `display: inline-block` elements.
  const chars = [...text].map((char) => (char === ' ' ? '\u00A0' : char));

  return (
    <span
      ref={wrapperRef}
      className={`rolling-text ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top row — visible by default */}
      <span className="rt-top" aria-hidden="true">
        {chars.map((char, i) => (
          <span key={`top-${i}`}>{char}</span>
        ))}
      </span>

      {/* Bottom row — starts translated below the clip, slides up on hover */}
      <span className="rt-bot" aria-hidden="true">
        {chars.map((char, i) => (
          <span key={`bot-${i}`} style={{ transform: 'translateY(110%)' }}>
            {char}
          </span>
        ))}
      </span>

      {/* Accessible label for screen readers */}
      <span className="sr-only">{text}</span>
    </span>
  );
};