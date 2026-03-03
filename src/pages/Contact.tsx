import React from 'react';

export const Contact: React.FC = () => {
  return (
    <main className="page-wrapper page-contact">

      {/*
        Two-column layout: heading (left 4fr) + content (right 8fr).
        The heading uses CSS sticky so it pins while the right side grows.
        The divider and 3 link columns live inside the right column —
        they're automatically right-aligned with the paragraph above.
      */}
      <div className="contact-top">

        {/* Left: heading */}
        <div>
          <h1 className="contact-heading">
            Let's <span className="contact-muted">talk.</span>
          </h1>
        </div>

        {/* Right: intro paragraph + divider + 3 link columns */}
        <div>
          <p className="contact-intro">
            Have a project in mind, a collaboration opportunity, or just want to
            say hello? I'd love to hear from you. Whether it's a quick question
            or the start of something bigger, I'm always open to good
            conversations. Ready when you are.
          </p>

          <hr className="contact-divider" />

          <div className="contact-cols">

            {/* SOCIALS */}
            <div className="contact-col">
              <span className="contact-col-label">Socials</span>
              <a
                href="https://instagram.com/theebuka"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                Instagram
              </a>
              <a
                href="https://x.com/theebuka"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                X (Twitter)
              </a>
              <a
                href="https://linkedin.com/in/theebuka"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                LinkedIn
              </a>
            </div>

            {/* CRAFT */}
            <div className="contact-col">
              <span className="contact-col-label">Craft</span>
              <a
                href="https://theebuka.substack.com"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                Substack
              </a>
              <a
                href="https://medium.com/@theebuka"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                Medium
              </a>
              <a
                href="https://behance.net/theebuka"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                Behance
              </a>
              <a
                href="https://dribbble.com/theebuka"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                Dribbble
              </a>
              <a
                href="https://are.na/theebuka"
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                Are.na
              </a>
            </div>

            {/* EMAIL */}
            <div className="contact-col">
              <span className="contact-col-label">Email</span>
              <a
                href="mailto:me@theebuka.com"
                className="contact-link"
              >
                me@theebuka.com
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};