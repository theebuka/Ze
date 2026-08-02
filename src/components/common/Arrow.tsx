import React from 'react';

interface ArrowProps {
  /** Passed straight through so existing hover/colour rules keep matching. */
  className?: string;
}

/**
 * Arrow — the site's ↗ glyph, as geometry rather than text.
 *
 * This used to be the character U+2197 (NORTH EAST ARROW). That codepoint
 * carries an emoji presentation variant, so on a good number of platforms it
 * renders as a full-colour emoji instead of a hairline mark — wrong for a
 * monochrome site, and unfixable from CSS. Forcing text presentation with a
 * U+FE0E selector works but pulls the glyph from whichever fallback font
 * happens to win, which is not Neue Haas and does not match the weight of
 * anything next to it.
 *
 * Drawn instead: exact stroke weight, exact box, and a clean rotation origin.
 *
 * - `width/height: 1em` — keeps sizing off the existing font-size rules
 *   (--font-vault-arrow, --font-work-category), so nothing else changes.
 * - `stroke: currentColor` — the existing `color` transitions still drive it.
 * - Points up-right at rest; the `rotate(-45deg)` hover rules in index.css
 *   turn it into a → exactly as before.
 */
export const Arrow: React.FC<ArrowProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="square"
    aria-hidden="true"
    focusable="false"
  >
    {/* Shaft corner to corner, then the two barbs of the head. */}
    <path d="M3.5 12.5 12.5 3.5" />
    <path d="M5.5 3.5h7v7" />
  </svg>
);
