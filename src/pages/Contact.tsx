import React from 'react';

export const Contact: React.FC = () => {
  return (
    <main className="page-wrapper page-contact">
      <h1 className="contact-headline">
        Inquiry or saying hi? I'd love to hear from you.<br />
        Ready when you are.
      </h1>

      <div className="contact-links">
        {/* Email Block */}
        <div className="link-group">
          <span className="contact-label">EMAIL</span>
          <a href="mailto:me@theebuka.com" className="contact-big-link">me@theebuka.com</a>
        </div>

        {/* Socials Block */}
        <div className="link-group">
          <span className="contact-label">SOCIALS</span>
          <a href="#" target="_blank" rel="noreferrer" className="contact-big-link">Instagram</a>
          <a href="#" target="_blank" rel="noreferrer" className="contact-big-link">X (Twitter)</a>
          <a href="#" target="_blank" rel="noreferrer" className="contact-big-link">LinkedIn</a>
        </div>
      </div>
    </main>
  );
};