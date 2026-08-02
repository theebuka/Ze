import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/sanity';
import { isCoarsePointer } from '../lib/gsap';
import { SanityImage } from '../components/common/SanityImage';
import { WorkGrid } from '../components/work/WorkGrid';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';
import { useHomeMotion } from '../hooks/useHomeMotion';
import { useAppReady } from '../context/AppReadyContext';
import { useCursor } from '../context/CursorContext';

interface SiteSettings {
  heroImage: unknown;
}

/**
 * Order matters: this is the playhead sequence, not a grid. One item lights up
 * at a time as it crosses the middle of the viewport (useHomeMotion).
 */
const SPECIALTIES = [
  'Art Direction',
  'Creative Strategy',
  'Product Thinking',
  'User Experience',
  'Interaction Design',
  'Usability Research',
  'Design Systems',
  'Visual Design',
];

export const Home: React.FC = () => {
  const { projects, loading } = useProjects('featured');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const splashDone = useAppReady();
  const { setCursorType } = useCursor();

  // Home mounts immediately, underneath the splash overlay, regardless of
  // splash state — without this gate, ScrollTrigger would fire and complete
  // the whole reveal while still covered, and the page would look static
  // the instant the splash clears.
  const scope = useReveal<HTMLElement>({ deps: [projects, settings], enabled: splashDone });
  useParallax(scope, [projects, settings]);
  useHomeMotion(scope, [projects, settings, splashDone]);

  // Hover cursor state is meaningless on touch, and phones synthesise mouse
  // events on tap — the same guard WorkGrid uses.
  const touch = isCoarsePointer();

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<SiteSettings>(`*[_type == "siteSettings"][0]{ heroImage }`)
      .then((data) => !cancelled && setSettings(data))
      .catch((err) => console.error('[Home] siteSettings fetch failed:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page-wrapper page-home" ref={scope}>
      {/* ── Hero ─────────────────────────────────────────────────────
          .hero-section is deliberately taller than the viewport: the
          surplus is the scroll budget the open-out animation spends while
          .hero-stage is stuck. See useHomeMotion. */}
      <section className="hero-section">
        <div className="hero-stage">
          <div className="hero-title-col">
            <h1 className="hero-title" data-reveal="text">
              <span className="text-muted">Chukwuebuka</span>
              <br />
              {/* <span className="text-muted">Arin</span>ze{' '} */}
              <span className="text-muted">Nwaju</span>
            </h1>
          </div>

          {/* The frame spans the stage and right-aligns the media, so growing
              the media's width is what carries its left edge outward. */}
          <div className="hero-media-frame">
            <div
              className="hero-media"
              data-reveal="image"
              data-reveal-delay="0.25"
              onMouseEnter={() => !touch && setCursorType('expand')}
              onMouseLeave={() => !touch && setCursorType('default')}
            >
              <div className="hero-media-inner">
                {settings && Boolean(settings.heroImage) && (
                  <SanityImage
                    source={settings.heroImage}
                    alt="Chukwuebuka Arinze Nwaju"
                    className="hero-img"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                    maxWidth={2560}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Focus ───────────────────────────────────────────────────── */}
      <section className="focus-section">
        <div className="focus-col focus-col-specialties">
          <span className="focus-label" data-reveal="text">
            Specialties
          </span>

          <ul className="specialty-list">
            {SPECIALTIES.map((item) => (
              <li className="specialty-item" key={item}>
                {/* data-reveal sits on the inner span, not the <li>: the line
                    mask it generates has overflow:clip, and the active-state
                    scale must live OUTSIDE that box or it gets clipped. */}
                <span className="specialty-text" data-reveal="text">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* data-scrub-trigger: the summary itself is position:sticky, so the
            word-fill scrub measures against this stable wrapper instead. */}
        <div className="focus-col focus-col-summary" data-scrub-trigger>
          <p className="focus-summary" data-reveal="text" data-scrub="words">
            Creative Design engineer with a design background, crafting
            immersive digital experiences that combine creativity and
            functionality.
          </p>
        </div>
      </section>

      {/* ── Selected Works ──────────────────────────────────────────── */}
      <section className="selected-works margin-top-huge">
        <header className="works-header">
          <h2 data-reveal="text">Selected Works</h2>
          <Link to="/work" className="font-sec-muted">SEE ALL</Link>
          <span className="line-reveal" data-reveal="line" aria-hidden="true" />
        </header>

        <WorkGrid projects={projects} loading={loading} />
      </section>
    </main>
  );
};
