import React from 'react';

/*
  CONTACT PAGE
  
  .contact-divider-line is a .line-reveal element replacing the <hr>.
  GSAP in useGlobalTextReveal animates it left-to-right on scroll.
*/

export const Contact: React.FC = () => {
  return (
    <main className="page-wrapper page-contact">
      <div className="contact-top">

        {/* Left col: heading (sticky on desktop) */}
        <div>
          <h1 className="contact-heading">
            Let's <span className="contact-muted">talk.</span>
          </h1>
        </div>

        {/* Right col: intro + line + 3-col links */}
        <div>
          <p className="contact-intro">
            Have a project in mind, a collaboration opportunity, or just want to
            say hello? I'd love to hear from you. Whether it's a quick question
            or the start of something bigger, I'm always open to good
            conversations. Ready when you are.
          </p>

          {/* Animated divider — replaces <hr> */}
          <span
            className="line-reveal contact-divider-line"
            aria-hidden="true"
          />

          <div className="contact-cols">

            {/* SOCIALS */}
            <div className="contact-col">
              <span className="contact-col-label">Socials</span>
              {[
                { href: 'https://instagram.com/theebuka', label: 'Instagram' },
                { href: 'https://x.com/theebuka',         label: 'X (Twitter)' },
                { href: 'https://linkedin.com/in/theebuka', label: 'LinkedIn' },
              ].map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="contact-link">
                  {label}
                </a>
              ))}
            </div>

            {/* CRAFT */}
            <div className="contact-col">
              <span className="contact-col-label">Craft</span>
              {[
                { href: 'https://theebuka.substack.com',   label: 'Substack' },
                { href: 'https://medium.com/@theebuka',    label: 'Medium'   },
                { href: 'https://behance.net/theebuka',    label: 'Behance'  },
                { href: 'https://dribbble.com/theebuka',   label: 'Dribbble' },
                { href: 'https://are.na/theebuka',         label: 'Are.na'   },
              ].map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="contact-link">
                  {label}
                </a>
              ))}
            </div>

            {/* EMAIL */}
            <div className="contact-col">
              <span className="contact-col-label">Email</span>
              <a href="mailto:me@theebuka.com" className="contact-link">
                me@theebuka.com
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};