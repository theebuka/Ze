import React from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAppReady } from '../context/AppReadyContext';

/*
  CONTACT PAGE

  .contact-divider-line is a .line-reveal element replacing the <hr>.
  useReveal (data-reveal="line") animates it left-to-right on scroll.
*/

export const Contact: React.FC = () => {
  const splashDone = useAppReady();
  // Contact can be the entry route on a fresh load/refresh, mounting
  // underneath the splash overlay same as Home — same gate, same reason.
  const scope = useReveal<HTMLElement>({ deps: [], enabled: splashDone });

  return (
    <main className="page-wrapper page-contact" ref={scope}>
      <div className="contact-top">

        {/* Left col: heading (sticky on desktop) */}
        <div>
          <h1 className="contact-heading" data-reveal="text">
            Let's <span className="contact-muted">talk.</span>
          </h1>
        </div>

        {/* Right col: intro + line + 3-col links */}
        <div>
          <p className="contact-intro" data-reveal="text">
            Have a project in mind, a collaboration opportunity, or just want to
            say hello? I'd love to hear from you. Whether it's a quick question
            or the start of something bigger, I'm always open to good
            conversations. Ready when you are.
          </p>

          {/* Animated divider — replaces <hr> */}
          <span
            className="line-reveal contact-divider-line"
            data-reveal="line"
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
                <a key={label} href={href} target="_blank" rel="noreferrer" className="contact-link" data-reveal="text">
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
                <a key={label} href={href} target="_blank" rel="noreferrer" className="contact-link" data-reveal="text">
                  {label}
                </a>
              ))}
            </div>

            {/* EMAIL */}
            <div className="contact-col">
              <span className="contact-col-label">Email</span>
              <a href="mailto:me@theebuka.com" className="contact-link" data-reveal="text">
                me@theebuka.com
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};