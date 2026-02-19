import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLagosTime } from '../../hooks/useLagosTime';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const lagosTime = useLagosTime();
  const location = useLocation();
  
  // Check if we are on a specific case study page (e.g., /work/monibac)
  const isCaseStudy = location.pathname.includes('/work/') && location.pathname !== '/work';

  return (
    // Apply an inversion class if on a case study, UNLESS the menu is currently open
    <header className={`site-header ${(isCaseStudy && !isMenuOpen) ? 'invert-text' : ''}`}>
      <div className="header-logo">
        <Link to="/" onClick={() => setIsMenuOpen(false)}>ZE</Link>
      </div>
      
      <div className="header-time">
        <span>LOCAL / </span>{lagosTime.toUpperCase()}
      </div>
      
      <button 
        className="header-menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? 'CLOSE' : 'MENU'}
      </button>
    </header>
  );
};