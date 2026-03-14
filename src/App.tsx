import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CursorProvider, useCursor } from './context/CursorContext';
import { CustomCursor } from './components/common/CustomCursor';
import { useGlobalTextReveal } from './hooks/useGlobalTextReveal';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { SplashLoader } from './components/layout/SplashLoader';

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
import { Vault } from './pages/Vault';

// Global Styles — interactions.css must come AFTER index.css to override base styles
import './styles/interactions.css';

const RouteTransitions = () => {
  const { pathname } = useLocation();
  const { setCursorType } = useCursor();

  useEffect(() => {
    window.scrollTo(0, 0);
    setCursorType('default');

    const isCaseStudy = pathname.includes('/work/') && pathname !== '/work';

    if (isCaseStudy) {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }

    document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
    if (isCaseStudy) {
      document.body.style.backgroundColor = 'var(--light-bg)';
      document.body.style.color = 'var(--light-text)';
    } else {
      document.body.style.backgroundColor = 'var(--bg-color)';
      document.body.style.color = 'var(--text-color)';
    }
  }, [pathname, setCursorType]);

  return null;
};

const AppContent: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>('.site-footer');
    if (!footer) return;
    const measure = () => setFooterHeight(footer.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  useSmoothScroll();
  useGlobalTextReveal(isLoaded);

  useEffect(() => {
    if (isMenuOpen || !isLoaded) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isMenuOpen, isLoaded]);

  return (
    <>
      <CustomCursor />
      <RouteTransitions />

      {!isLoaded && <SplashLoader onComplete={() => setIsLoaded(true)} />}

      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <MenuOverlay isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />

      <main
        className="app-main"
        style={{ marginBottom: footerHeight > 0 ? footerHeight : undefined }}
      >
        <Routes>
          <Route path="/"            element={<Home />}      />
          <Route path="/about"       element={<About />}     />
          <Route path="/work"        element={<Work />}      />
          <Route path="/work/:slug"  element={<CaseStudy />} />
          <Route path="/contact"     element={<Contact />}   />
          <Route path="/vault"       element={<Vault />}     />
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