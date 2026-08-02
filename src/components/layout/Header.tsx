import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLagosTime } from '../../hooks/useLagosTime';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';
import { useReveal } from '../../hooks/useReveal';
import { useAppReady } from '../../context/AppReadyContext';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const lagosTime = useLagosTime();
  const location = useLocation();

  const isCaseStudy =
    location.pathname.includes('/work/') && location.pathname !== '/work';

  // ── Magnetic MENU toggle ─────────────────────────────────────────────
  // Slightly stronger pull (0.5) on a larger radius since this is the
  // primary interactive element in the header.
  const toggleRef = useRef<HTMLButtonElement>(null);
  useMagneticEffect(toggleRef, 0.5, 80);

  // Header sits outside every page's <main>, so it needs its own reveal
  // scope — it used to be targeted by the same document-wide selector query
  // regardless of route, which is what useReveal replaces here. Header is
  // always mounted from the very first paint, underneath the splash overlay,
  // so it needs the same splashDone gate every page does.
  const splashDone = useAppReady();
  const scope = useReveal<HTMLElement>({ deps: [], enabled: splashDone });

  return (
    <header
      ref={scope}
      className={`site-header ${isCaseStudy && !isMenuOpen ? 'invert-text' : ''}`}
    >
      <div className="header-logo">
        <Link to="/" onClick={() => setIsMenuOpen(false)} data-reveal="text">
          Chukwuebuka.
        </Link>
      </div>

      {/* data-reveal="rise", not "text". SplitText replaces this element's
          text node with its own split/mask DOM structure, and useLagosTime
          ticks the content every second via React re-renders — the two then
          fight for ownership of the same nodes and the clock stops rendering.
          "rise" masks with a static CSS box and animates this inner <span>
          instead, so React keeps the text node and re-renders into it freely
          while the transform sits on the wrapper it never touches. */}
      <div className="header-time" data-reveal="rise" data-reveal-delay="0.12">
        <span>local / {lagosTime.toLowerCase()}</span>
      </div>

      {/* Same reason: this button's label toggles between menu/close on every
          click, which under SplitText looked like the button flickering
          between the two words. */}
      <button
        ref={toggleRef}
        className="header-menu-toggle magnetic"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        data-reveal="rise"
        data-reveal-delay="0.22"
      >
        <span>{isMenuOpen ? 'close' : 'menu'}</span>
      </button>
    </header>
  );
};