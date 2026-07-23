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
          ZE
        </Link>
      </div>

      {/* No data-reveal="text" here: SplitText replaces this element's text
          node with its own split/mask DOM structure. useLagosTime ticks this
          content every second via React re-renders, which then fight
          SplitText for ownership of the same nodes — the clock stops
          rendering because React's reconciliation and SplitText's DOM
          surgery are clobbering each other. */}
      <div className="header-time">
        <span>LOCAL / </span>
        {lagosTime.toUpperCase()}
      </div>

      {/* Same reason: this button's text toggles between MENU/CLOSE on every
          click. Applying data-reveal="text" here caused the exact same
          fight, which looked like the button flickering between the two
          labels. */}
      <button
        ref={toggleRef}
        className="header-menu-toggle magnetic"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? 'CLOSE' : 'MENU'}
      </button>
    </header>
  );
};