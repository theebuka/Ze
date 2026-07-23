import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/sanity';
import { SanityImage } from '../components/common/SanityImage';
import { WorkGrid } from '../components/work/WorkGrid';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';
import { useAppReady } from '../context/AppReadyContext';

interface SiteSettings {
  heroImage: unknown;
}

const FOCUS_ROWS: [string, string][] = [
  ['Art Direction', 'Product Thinking'],
  ['Creative Strategy', 'User Experience'],
  ['Usability Research', 'Interaction Design'],
  ['Design Systems', 'Visual Design'],
];

export const Home: React.FC = () => {
  const { projects, loading } = useProjects('featured');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const splashDone = useAppReady();

  // Home mounts immediately, underneath the splash overlay, regardless of
  // splash state — without this gate, ScrollTrigger would fire and complete
  // the whole reveal while still covered, and the page would look static
  // the instant the splash clears.
  const scope = useReveal<HTMLElement>({ deps: [projects, settings], enabled: splashDone });
  useParallax(scope, [projects, settings]);

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
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-row">
          <h1 className="hero-title" data-reveal="text">
            <span className="text-muted">CHUKWUEBUKA</span>
            <br />
            <span className="text-muted">ARIN</span>ZE{' '}
            <span className="text-muted">NWAJU</span>
          </h1>
          <p className="hero-subtitle" data-reveal="text" data-reveal-delay="0.15">
            Multidisciplinary Creative,
            <br />
            Design Engineer, Art Director
            <br />
            and Audiophile.
          </p>
        </div>

        <div className="hero-image-wrapper" data-reveal="image" data-parallax data-reveal-delay="0.25">
          <div className="hero-blur-overlay" aria-hidden="true" />
          {settings && Boolean(settings.heroImage) && (
            <SanityImage
              source={settings.heroImage}
              alt="Chukwuebuka Arinze Nwaju"
              className="parallax-img"
              sizes="100vw"
              priority
              maxWidth={1920}
            />
          )}
        </div>
      </section>

      {/* ── Focus ───────────────────────────────────────────────────── */}
      <section className="focus-section grid-12-col margin-top-huge">
        <div className="col-4">
          <h2 className="focus-heading" data-reveal="text">FOCUS</h2>
        </div>

        <div className="col-6">
          <p className="focus-body" data-reveal="text">
            Alongside that, I've worked across agencies and freelance roles,
            designing products for FinTech, EdTech, and marketplace startups —
            sometimes designing interfaces, sometimes shaping brands, sometimes
            building scrappy internal tools. I enjoy getting my hands dirty,
            asking uncomfortable questions early, and turning abstract ideas
            into systems people can actually use. I code just enough (React,
            TypeScript) to collaborate directly with engineers and close the
            gap between intention and implementation.
          </p>

          <div className="focus-skills">
            {FOCUS_ROWS.map(([left, right]) => (
              <div className="focus-row" key={left}>
                <span className="focus-skill">{left}</span>
                <span className="focus-star" aria-hidden="true">✦</span>
                <span className="focus-skill">{right}</span>
                <span className="line-reveal" data-reveal="line" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Selected Works ──────────────────────────────────────────── */}
      <section className="selected-works margin-top-huge">
        <header className="works-header">
          <h2 data-reveal="text">SELECTED WORKS</h2>
          <Link to="/work" className="font-sec-muted">SEE ALL</Link>
          <span className="line-reveal" data-reveal="line" aria-hidden="true" />
        </header>

        <WorkGrid projects={projects} loading={loading} />
      </section>
    </main>
  );
};
