import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CursorProvider, useCursor } from './context/CursorContext';
import { CustomCursor } from './components/common/CustomCursor';
import { useGlobalTextReveal } from './hooks/useGlobalTextReveal';
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

const RouteTransitions = () => {
  const { pathname } = useLocation();
  const { setCursorType } = useCursor();

  useEffect(() => {
    window.scrollTo(0, 0);
    setCursorType('default'); 

    const isCaseStudy = pathname.includes('/work/') && pathname !== '/work';
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
  
  // FIX: Introduce the master loading lock
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Pass the lock to the animation hook so it waits
  useGlobalTextReveal(isLoaded);

  // Lock the body scroll if the menu is open OR if the splash screen is active
  useEffect(() => {
    if (isMenuOpen || !isLoaded) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isMenuOpen, isLoaded]);

  return (
    <>
      <CustomCursor />
      <RouteTransitions />
      
      {/* The Splash Screen only renders once. 
        When the counter hits 100 and the curtain slides away, it fires onComplete. 
      */}
      {!isLoaded && <SplashLoader onComplete={() => setIsLoaded(true)} />}
      
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