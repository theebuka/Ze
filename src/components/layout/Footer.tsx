import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <h2>
          <span className="text-muted">GOT A PROJECT?</span><br />
          LET'S <strong>TALK</strong>
        </h2>
        <a href="mailto:me@theebuka.com" className="footer-email">me@theebuka.com</a>
      </div>
      
      <div className="footer-bottom">
        <p>ZE © {currentYear}. All Rights Reserved.</p>
        <div className="footer-socials">
          <a href="#" target="_blank" rel="noreferrer">IG</a>
          <a href="#" target="_blank" rel="noreferrer">X</a>
          <a href="#" target="_blank" rel="noreferrer">LI</a>
        </div>
      </div>
    </footer>
  );
};