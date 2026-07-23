import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLagosTime } from '../../hooks/useLagosTime';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';
import { useReveal } from '../../hooks/useReveal';

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
  // regardless of route, which is what useReveal replaces here.
  const scope = useReveal<HTMLElement>({ deps: [] });

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

      <div className="header-time" data-reveal="text">
        <span>LOCAL / </span>
        {lagosTime.toUpperCase()}
      </div>

      <button
        ref={toggleRef}
        className="header-menu-toggle magnetic"
        data-reveal="text"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? 'CLOSE' : 'MENU'}
      </button>
    </header>
  );
};