import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RollingText } from '../common/RollingText';
import { useReveal } from '../../hooks/useReveal';
import { useAppReady } from '../../context/AppReadyContext';

/*
  FOOTER

  Nav links use RollingText for the rollover animation.
  onClick scrolls to the top — RouteTransitions in App.tsx also fires
  window.scrollTo(0,0) on pathname change, but this ensures it fires
  even if the user re-clicks the active page link.

  Color inversion: interactions.css drives bg/color via body.theme-light.
  Hover states: dim on light bg, brighten on dark bg — handled by CSS.

  Reveal: .footer-copyright and the .footer-col-label headings are plain
  static text, safe for data-reveal="text" (SplitText line masks).

  Every nav/social/CTA link is wrapped in RollingText, which pre-splits its
  label into two stacked rows of per-character spans for its hover-roll —
  SplitText cannot own those nodes. They get data-reveal="rise" instead,
  which produces the SAME masked line-rise without a split: the <a> becomes
  the clip box and the tween runs on RollingText's wrapper span. The roll
  animates .rt-top/.rt-bot INSIDE that wrapper, a level below, so reveal and
  hover never touch the same elements and the rollover is untouched.

  (These were data-reveal="image" — a fade + clip — which read as a
  different, flatter piece of motion from everything above it.)

  Reveal timing: see VIEW_TRIGGER below. The footer is position: fixed, so
  every reveal inside it has to be triggered off something else.
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

/**
 * Fraction of the footer that must be uncovered before its reveal fires.
 * ~0.55 is where the top edge of .footer-bottom-bar — everything that
 * actually animates — clears the bottom of main.
 */
const REVEAL_AT = 0.55;

/*
  The footer is `position: fixed; bottom: 0` behind `main` (interactions.css),
  uncovered as main scrolls away over it. To ScrollTrigger that means it is
  permanently in view, so pointing a trigger at the footer itself — or at
  anything inside it — fires the moment the trigger is created, which is why
  the whole footer used to arrive pre-animated on page load.

  "Is the footer in view" is really "how much of it has main stopped covering",
  and that is a question about main. `bottom bottom-=Npx` fires when main's
  bottom edge has risen N pixels above the bottom of the viewport, which is
  exactly N pixels of uncovered footer. N is read at refresh time rather than
  captured, so it survives the footer resizing (App.tsx already watches it with
  a ResizeObserver to set main's bottom margin).
*/
const VIEW_TRIGGER = {
  trigger: 'main.app-main',
  start: () => {
    const footer = document.querySelector<HTMLElement>('.site-footer');
    return `bottom bottom-=${Math.round((footer?.offsetHeight ?? 0) * REVEAL_AT)}px`;
  },
};

export const Footer: React.FC = () => {
  const splashDone = useAppReady();
  const { pathname } = useLocation();
  // Footer is always mounted from the very first paint, underneath the
  // splash overlay, so it needs the same splashDone gate every page does.
  //
  // pathname as a dep because the footer — unlike a page — is never
  // unmounted. Its triggers are `once: true`, so without this the reveal is
  // spent after the first page you scroll to the bottom of, and every page
  // after that gets a footer that is simply already there.
  const scope = useReveal<HTMLElement>({
    deps: [pathname],
    enabled: splashDone,
    viewTrigger: VIEW_TRIGGER,
  });

  return (
    <footer className="site-footer" ref={scope}>

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
        {/*
          Every reveal down here shares one trigger (VIEW_TRIGGER), so without
          data-reveal-delay the whole bar would land in a single flat beat.
          The delays read left column first, then down the right one.
        */}
        <div className="footer-bottom-left">
          <span className="footer-copyright" data-reveal="text">
            All Rights Reserved, Chukwuebuka Nwaju.
          </span>
          <div className="footer-social-icons">
            {SOCIAL_LINKS.map(({ href, aria, abbr }, i) => (
              <a
                key={abbr}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
                aria-label={aria}
                data-reveal="rise"
                data-reveal-delay={0.1 + i * 0.06}
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
            <span className="footer-col-label" data-reveal="text" data-reveal-delay="0.16">Menu</span>
            {NAV_LINKS.map(({ to, label }, i) => (
              <Link
                key={to}
                to={to}
                className="footer-col-link"
                onClick={scrollTop}
                data-reveal="rise"
                data-reveal-delay={0.04 + i * 0.05}
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
            <span className="footer-col-label" data-reveal="text" data-reveal-delay="0.32">Got a project?</span>
            <a
              href="mailto:me@theebuka.com"
              className="footer-cta-email"
              data-reveal="rise"
              data-reveal-delay="0.4"
            >
              <RollingText text="me@theebuka.com" />
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
};