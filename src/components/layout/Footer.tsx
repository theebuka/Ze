import React from 'react';
import { Link } from 'react-router-dom';
import { RollingText } from '../common/RollingText';

/*
  FOOTER
  
  Nav links use RollingText for the rollover animation.
  onClick scrolls to the top — RouteTransitions in App.tsx also fires
  window.scrollTo(0,0) on pathname change, but this ensures it fires
  even if the user re-clicks the active page link.
  
  Color inversion: interactions.css drives bg/color via body.theme-light.
  Hover states: dim on light bg, brighten on dark bg — handled by CSS.
*/

const MARQUEE_COUNT = 6; // items per set — always exceeds viewport width

const NAV_LINKS = [
  { to: '/',        label: '/Home'    },
  { to: '/about',   label: '/About'   },
  { to: '/work',    label: '/Work'    },
  { to: '/contact', label: '/Contact' },
  { to: '/vault',   label: '/Vault'   },
];

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/theebuka',   aria: 'Instagram',   abbr: 'IG' },
  { href: 'https://x.com/theebuka',           aria: 'X / Twitter', abbr: 'X'  },
  { href: 'https://linkedin.com/in/theebuka', aria: 'LinkedIn',    abbr: 'LI' },
];

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">

      {/* ── Marquee ────────────────────────────────────────────────────── */}
      {/*
        Two identical .footer-marquee-set divs.
        translateX(-50%) loops back to start seamlessly.
        .footer-marquee:hover .footer-marquee-track pauses via CSS.
        aria-hidden: decorative only.
      */}
      <div className="footer-marquee" aria-hidden="true">
        <div className="footer-marquee-track">
          {[0, 1].map((setIdx) => (
            <div className="footer-marquee-set" key={setIdx}>
              {Array.from({ length: MARQUEE_COUNT }).map((_, i) => (
                <React.Fragment key={i}>
                  <span className="footer-marquee-item">ZE ©2026</span>
                  <span className="footer-marquee-sep">&nbsp;•&nbsp;</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      <div className="footer-bottom-bar">

        {/* Left: copyright + social icon links */}
        <div className="footer-bottom-left">
          <span className="footer-copyright">
            All Rights Reserved, Chukwuebuka Arinze Nwaju.
          </span>
          <div className="footer-social-icons">
            {SOCIAL_LINKS.map(({ href, aria, abbr }) => (
              <a
                key={abbr}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
                aria-label={aria}
              >
                <RollingText text={abbr} />
              </a>
            ))}
          </div>
        </div>

        {/* Right: MENU + GOT A PROJECT? stacked vertically */}
        <div className="footer-bottom-right">

          {/* MENU */}
          <nav className="footer-col" aria-label="Site navigation">
            <span className="footer-col-label">Menu</span>
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="footer-col-link"
                onClick={scrollTop}
              >
                {/*
                  RollingText handles its own onMouseEnter/Leave.
                  The Link click triggers scrollTop AND React Router navigation.
                */}
                <RollingText text={label} />
              </Link>
            ))}
          </nav>

          {/* GOT A PROJECT? */}
          <div className="footer-col">
            <span className="footer-col-label">Got a project?</span>
            <a href="mailto:me@theebuka.com" className="footer-cta-email">
              <RollingText text="me@theebuka.com" />
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
};