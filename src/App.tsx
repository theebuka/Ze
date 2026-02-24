import React, { useState, useEffect, useRef } from 'react';
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

// ── Global Styles ────────────────────────────────────────────────────────
// interactions.css is imported here so it's available app-wide.
// It must come AFTER index.css to correctly override base styles.
import './styles/interactions.css';

const RouteTransitions = () => {
  const { pathname } = useLocation();
  const { setCursorType } = useCursor();

  useEffect(() => {
    window.scrollTo(0, 0);
    setCursorType('default');

    const isCaseStudy =
      pathname.includes('/work/') && pathname !== '/work';

    // `theme-light` is the single source of truth for theming.
    // CSS cascade in interactions.css uses it to drive background-color
    // and color on both main.app-main and .site-footer.
    // This replaces `background-color: inherit` which cannot reactively
    // follow inline style changes on a parent element.
    if (isCaseStudy) {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }

    // Keep inline styles for legacy selectors in index.css
    // (e.g. the cs-metadata border-top rule that reads body[style*=...])
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

  // ── Footer Uncover: measure footer height ──────────────────────────
  // The footer is `position: fixed; z-index: 0` (interactions.css).
  // We give <main> a matching margin-bottom so the page content is long
  // enough that scrolling to the very bottom reveals the fixed footer.
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    // Query after first render. Using a ResizeObserver keeps it in sync
    // if the footer height ever changes (font scaling, window resize).
    const footer = document.querySelector<HTMLElement>('.site-footer');
    if (!footer) return;

    const measure = () => setFooterHeight(footer.offsetHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(footer);

    return () => ro.disconnect();
  }, []); // Runs once. ResizeObserver handles subsequent changes.

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

      {/*
        app-main sits above the fixed footer (z-index: 1 vs 0).
        Background is driven by body.theme-light via CSS cascade —
        NOT inherit, which cannot follow runtime inline style changes.
        margin-bottom = footer height creates scroll room to reveal footer.
      */}
      <main
        className="app-main"
        style={{ marginBottom: footerHeight > 0 ? footerHeight : undefined }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/work" element={<Work />} />
          <Route path="/work/:slug" element={<CaseStudy />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/vault"
            element={
              <div className="page-wrapper" style={{ textAlign: 'center' }}>
                Vault Content Coming Soon
              </div>
            }
          />
        </Routes>
      </main>

      {/*
        Footer renders in the DOM normally here.
        Its CSS (`position: fixed; bottom: 0; z-index: 0`) is applied via
        interactions.css — no layout changes needed in this file.
      */}
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