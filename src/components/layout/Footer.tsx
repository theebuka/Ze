import React from 'react';
import { Link } from 'react-router-dom';

/*
  FOOTER — Complete rebuild.
  
  Structure:
    [full-bleed marquee: "ZE ©2026 •" auto-scrolling, pauses on hover]
    [bottom bar: copyright + IG/X/LI | MENU links | GOT A PROJECT? + email]
  
  Color inversion logic is entirely handled by interactions.css:
    - Dark pages  → light footer bg (#f3f3f3), dark text (#111)
    - Light pages → dark footer bg (#000), light text (#fff)
  We just inherit from .site-footer — no inline color logic needed here.
  
  Hover states in index.css respond to body.theme-light automatically.
*/

// Enough repetitions per set so the content is always > 1 viewport wide.
// At 13.5vw font on a 1440px viewport, "ZE ©2026 • " ≈ 1200px.
// 4 items per set = ~4800px, well over any viewport.
const MARQUEE_ITEMS = Array(4).fill(null);

const NAV_LINKS = [
  { to: '/',        label: '/Home'    },
  { to: '/about',   label: '/About'   },
  { to: '/work',    label: '/Work'    },
  { to: '/contact', label: '/Contact' },
  { to: '/vault',   label: '/Vault'   },
];

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">

      {/* ── Marquee ──────────────────────────────────────────────────── */}
      {/*
        Two identical .footer-marquee-set elements.
        Animation moves translateX(0) → translateX(-50%), looping seamlessly.
        Hover on .footer-marquee pauses the track via CSS (no JS).
        aria-hidden: purely decorative — screen readers skip it.
      */}
      <div className="footer-marquee" aria-hidden="true">
        <div className="footer-marquee-track">

          {/* Set 1 */}
          <div className="footer-marquee-set">
            {MARQUEE_ITEMS.map((_, i) => (
              <React.Fragment key={`a-${i}`}>
                <span className="footer-marquee-item">ZE ©2026</span>
                <span className="footer-marquee-sep">&nbsp;•&nbsp;</span>
              </React.Fragment>
            ))}
          </div>

          {/* Set 2 — identical, provides the seamless second half */}
          <div className="footer-marquee-set">
            {MARQUEE_ITEMS.map((_, i) => (
              <React.Fragment key={`b-${i}`}>
                <span className="footer-marquee-item">ZE ©2026</span>
                <span className="footer-marquee-sep">&nbsp;•&nbsp;</span>
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div className="footer-bottom-bar">

        {/* Left: copyright + social icon links */}
        <div className="footer-bottom-left">
          <span className="footer-copyright">
            All Rights Reserved, Chukwuebuka Arinze Nwaju.
          </span>
          <div className="footer-social-icons">
            <a
              href="https://instagram.com/theebuka"
              target="_blank"
              rel="noreferrer"
              className="footer-social-link"
              aria-label="Instagram"
            >
              IG
            </a>
            <a
              href="https://x.com/theebuka"
              target="_blank"
              rel="noreferrer"
              className="footer-social-link"
              aria-label="X / Twitter"
            >
              X
            </a>
            <a
              href="https://linkedin.com/in/theebuka"
              target="_blank"
              rel="noreferrer"
              className="footer-social-link"
              aria-label="LinkedIn"
            >
              LI
            </a>
          </div>
        </div>

        {/* Right: MENU nav column + GOT A PROJECT? CTA column */}
        <div className="footer-bottom-right">

          {/* MENU */}
          <nav className="footer-col" aria-label="Site navigation">
            <span className="footer-col-label">Menu</span>
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="footer-col-link">
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="footer-col">
            <span className="footer-col-label">Got a project?</span>
            <a
              href="mailto:me@theebuka.com"
              className="footer-cta-email"
            >
              me@theebuka.com
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
};