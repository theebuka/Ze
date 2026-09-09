import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/sanity';
import { SanityImage } from '../components/common/SanityImage';
import { WorkIndex } from '../components/work/WorkIndex';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useHomeMotion } from '../hooks/useHomeMotion';
import { useAppReady } from '../context/AppReadyContext';

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
  const { projects, loading } = useProjects('all');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const splashDone = useAppReady();

  // Home mounts immediately, underneath the splash overlay, regardless of
  // splash state — without this gate, ScrollTrigger would fire and complete
  // the whole reveal while still covered, and the page would look static
  // the instant the splash clears.
  const scope = useReveal<HTMLDivElement>({ deps: [projects, settings], enabled: splashDone });

  // The hero open-out is gone with the masthead, so useHomeMotion's first
  // block finds no .hero-section and returns early. It still runs the
  // specialty playhead, which is the part this page keeps.
  useHomeMotion(scope, [projects, settings, splashDone]);

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

  const firstYear = 2019;
  const count = String(projects.length).padStart(3, '0');

  return (
    <div className="page-wrapper page-home page-doc" ref={scope}>
      {/* ── Masthead ─────────────────────────────────────────────────
          No image and no open-out. The opening statement is what the
          practice does; the portrait is an inset at credential size,
          because on a page shaped like a document that is what it is. */}
      <header className="doc-mast">
        <h1 className="doc-statement" data-reveal="text">
          Product design, art direction <span className="dim">&amp;</span> design
          engineering
        </h1>

        {settings && Boolean(settings.heroImage) && (
          <div className="doc-portrait" data-reveal="image" data-reveal-delay="0.2">
            <SanityImage
              source={settings.heroImage}
              alt="Chukwuebuka Arinze Nwaju"
              sizes="210px"
              priority
              maxWidth={640}
            />
          </div>
        )}

        <div className="doc-lede">
          <span className="doc-lede-label u" data-reveal="text">
            Practice
          </span>

          <p className="doc-lede-body" data-reveal="text" data-scrub="words">
            I design systems, then build them. Radiography trained, startup
            taught. Usually the first designer in the room, and close enough to
            the code that the intent survives delivery.
          </p>

          {/* Facts, not claims. Each one is checkable against the rest of
              the site. */}
          <div className="doc-facts u">
            <div className="doc-fact">
              <span>Practising</span>
              <b>since {firstYear}</b>
            </div>
            <div className="doc-fact">
              <span>Case studies</span>
              <b>{loading ? '—' : count}</b>
            </div>
            <div className="doc-fact">
              <span>Based</span>
              <b>Lagos, NG</b>
            </div>
            <div className="doc-fact">
              <span>Status</span>
              <b>Open to work</b>
            </div>
          </div>
        </div>
      </header>

      {/* ── Index ───────────────────────────────────────────────────── */}
      <section className="index-section">
        <header className="sec-rule u">
          <span>01</span>
          <span className="sec-name" data-reveal="text">
            Index
          </span>
          <span className="sec-line" aria-hidden="true" />
          <span>{loading ? '—' : count}</span>
          <Link to="/work">All work &rarr;</Link>
        </header>

        <WorkIndex projects={projects} loading={loading} />
      </section>

      {/* ── Focus ───────────────────────────────────────────────────── */}
      <section className="focus-section">
        <div className="focus-col focus-col-specialties">
          <span className="focus-label u" data-reveal="text">
            02 &mdash; Specialties
          </span>

          <ul className="specialty-list">
            {SPECIALTIES.map((item) => (
              <li className="specialty-item" key={item}>
                {/* data-reveal sits on the inner span, not the <li>: the line
                    mask it generates has overflow:clip, and the active-state
                    treatment must live OUTSIDE that box or it gets clipped. */}
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
            I lean toward brutalist minimalism: structure left visible,
            contrast doing the work, and restraint where a system would
            otherwise start shouting.
          </p>
        </div>
      </section>
    </div>
  );
};
