import React, { useRef } from 'react';
import { RollingText } from '../common/RollingText';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // ── Magnetic refs for each social link ──────────────────────────────
  // Strength is slightly higher here (0.5) since these are small targets —
  // the pull needs to be perceptible from a 70px radius.
  const igRef = useRef<HTMLAnchorElement>(null);
  const xRef = useRef<HTMLAnchorElement>(null);
  const liRef = useRef<HTMLAnchorElement>(null);

  useMagneticEffect(igRef, 0.5, 70);
  useMagneticEffect(xRef, 0.5, 70);
  useMagneticEffect(liRef, 0.5, 70);

  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <h2>
          <span className="text-muted">GOT A PROJECT?</span><br />
          LET'S <strong>TALK</strong>
        </h2>

        {/*
          The <a> tag handles the mailto link.
          RollingText wraps the visible label — the href is on the anchor,
          so the link is fully accessible even though the inner text is split.
        */}
        <a href="mailto:me@theebuka.com" className="footer-email">
          <RollingText text="me@theebuka.com" />
        </a>
      </div>

      <div className="footer-bottom">
        <p>ZE © {currentYear}. All Rights Reserved.</p>

        <div className="footer-socials">
          {/* Each social link is wrapped in a magnetic container */}
          <a ref={igRef} href="#" target="_blank" rel="noreferrer" className="magnetic">
            IG
          </a>
          <a ref={xRef} href="#" target="_blank" rel="noreferrer" className="magnetic">
            X
          </a>
          <a ref={liRef} href="#" target="_blank" rel="noreferrer" className="magnetic">
            LI
          </a>
        </div>
      </div>
    </footer>
  );
};