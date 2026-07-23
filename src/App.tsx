import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CursorProvider, useCursor } from './context/CursorContext';
import { CustomCursor } from './components/common/CustomCursor';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useSmoothScroll, setScrollLocked, scrollToTop } from './hooks/useSmoothScroll';
import { useScrollTriggerRefresh } from './hooks/useReveal';
import { SplashLoader } from './components/layout/SplashLoader';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MenuOverlay } from './components/layout/MenuOverlay';

// Home stays in the main bundle — it is the entry point for most visits.
import { Home } from './pages/Home';

// Everything else is split. Without this, a first-time visitor downloads the
// case-study renderer, the vault and the contact page before the homepage can
// paint. Each becomes its own chunk fetched on navigation.
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Work = lazy(() => import('./pages/Work').then((m) => ({ default: m.Work })));
const CaseStudy = lazy(() =>
  import('./pages/CaseStudy').then((m) => ({ default: m.CaseStudy }))
);
const Contact = lazy(() =>
  import('./pages/Contact').then((m) => ({ default: m.Contact }))
);
const Vault = lazy(() => import('./pages/Vault').then((m) => ({ default: m.Vault })));

// Cascade order matters: animation.css deliberately overrides rules in the
// two files above it. Remove the index.css import from main.tsx so there is
// exactly one place that decides this order.
import './styles/index.css';
import './styles/interactions.css';
import './styles/animation.css';

/**
 * Theme + scroll reset on route change.
 *
 * Two fixes:
 *   - `window.scrollTo(0, 0)` fought Lenis, which owns scroll position and
 *     overwrote it on the next rAF tick. That is why you sometimes landed
 *     mid-page after navigating — and on a short case study, landing past the
 *     end of the content looks exactly like a blank screen.
 *   - Theme is now a class only (see the `body.theme-light` rule added to
 *     index.css). The old code ALSO wrote inline styles directly on
 *     `document.body`, which forced a CSS selector matching a substring of
 *     the style attribute (`body[style*="background-color: var(--light-bg)"]`)
 *     — fragile enough to break on a whitespace change.
 *
 * `setCursorType('default')` on every route change is preserved from the old
 * RouteTransitions — without it, navigating away while hovering a work item
 * (cursorType 'media' or 'view-project') leaves the enlarged cursor stuck.
 */
const RouteEffects: React.FC = () => {
  const { pathname } = useLocation();
  const { setCursorType } = useCursor();

  useEffect(() => {
    scrollToTop();
    setCursorType('default');
    const isCaseStudy = pathname.startsWith('/work/') && pathname !== '/work';
    document.body.classList.toggle('theme-light', isCaseStudy);
  }, [pathname, setCursorType]);

  return null;
};

const RouteFallback: React.FC = () => (
  <div className="page-wrapper cs-status" aria-busy="true">
    <span className="cs-status-text">Loading</span>
  </div>
);

const AppContent: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  useSmoothScroll();
  useScrollTriggerRefresh();

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>('.site-footer');
    if (!footer) return;
    const measure = () => setFooterHeight(footer.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  // Lenis stop/start, not body overflow. overflow:hidden on body does not
  // lock scroll on iOS Safari and breaks position:sticky everywhere else.
  useEffect(() => {
    setScrollLocked(isMenuOpen || !isLoaded);
  }, [isMenuOpen, isLoaded]);

  return (
    <>
      <CustomCursor />
      <RouteEffects />

      {!isLoaded && <SplashLoader onComplete={() => setIsLoaded(true)} />}

      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <MenuOverlay isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />

      <main
        className="app-main"
        style={{ marginBottom: footerHeight > 0 ? footerHeight : undefined }}
      >
        {/* Keyed on nothing — the boundary should NOT reset per route here,
            or a persistent error would loop. RouteEffects handles navigation. */}
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<CaseStudy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/vault" element={<Vault />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </>
  );
};

const App: React.FC = () => (
  <CursorProvider>
    <Router>
      <AppContent />
    </Router>
  </CursorProvider>
);

export default App;
