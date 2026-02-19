import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CursorProvider } from './context/CursorContext';
import { CustomCursor } from './components/common/CustomCursor';
import { useGlobalTextReveal } from './hooks/useGlobalTextReveal';
import { useSmoothScroll } from './hooks/useSmoothScroll';

// Layout Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MenuOverlay } from './components/layout/MenuOverlay';

// Pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Work } from './pages/Work';
import { CaseStudy } from './pages/CaseStudy';
import { Contact } from './pages/Contact';

// Helper: Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// We wrap the inner app content here so hooks can access the Router context
const AppContent: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 1. Initialize our native smooth scroller
  useSmoothScroll();
  
  // 2. Triggers the sitewide text animation automatically on every page
  useGlobalTextReveal();

  // Prevent scrolling when the full-page menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  return (
    <>
      <CustomCursor />
      <ScrollToTop />
      
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <MenuOverlay isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/work" element={<Work />} />
          <Route path="/work/:slug" element={<CaseStudy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/vault" element={<div className="page-wrapper" style={{textAlign: 'center'}}>Vault Content Coming Soon</div>} />
        </Routes>
      </main>

      <Footer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <CursorProvider>
      <Router>
        <AppContent />
      </Router>
    </CursorProvider>
  );
};

export default App;