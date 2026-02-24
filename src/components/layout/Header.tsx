import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLagosTime } from '../../hooks/useLagosTime';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';

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

  return (
    <header
      className={`site-header ${isCaseStudy && !isMenuOpen ? 'invert-text' : ''}`}
    >
      <div className="header-logo">
        <Link to="/" onClick={() => setIsMenuOpen(false)}>
          ZE
        </Link>
      </div>

      <div className="header-time">
        <span>LOCAL / </span>
        {lagosTime.toUpperCase()}
      </div>

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