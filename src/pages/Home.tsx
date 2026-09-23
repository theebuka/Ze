import React from 'react';
import { WorkList } from '../components/work/WorkList';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';
import { useAppReady } from '../context/AppReadyContext';

const CAPABILITIES = [
  'Product thinking',
  'Interaction design',
  'Design systems',
  'User experience',
  'Usability research',
  'Visual design',
  'Art direction',
  'Frontend engineering',
];

/**
 * One layout idea for the whole page: a short label in the first three
 * columns, the content in the other nine. The masthead is the only thing that
 * crosses the whole width.
 *
 * No scroll choreography here. The specialty playhead and the sticky summary
 * are gone with the Display Black type they were built for; useHomeMotion is
 * not called.
 */
export const Home: React.FC = () => {
  const { projects, loading } = useProjects('all');
  const splashDone = useAppReady();

  // Home mounts immediately, underneath the splash overlay, regardless of
  // splash state — without this gate, ScrollTrigger would fire and complete
  // the whole reveal while still covered, and the page would look static
  // the instant the splash clears.
  const scope = useReveal<HTMLDivElement>({ deps: [projects], enabled: splashDone });
  useParallax(scope, [projects]);

  return (
    <div className="page-wrapper page-home page-doc" ref={scope}>
      <header className="d3-mast">
        <h1 className="d3-statement" data-reveal="text">
          I&rsquo;m Chukwuebuka, a product designer and design engineer in Lagos.
        </h1>

        <div className="d3-row d3-mast-sub">
          <p className="d3-lede" data-reveal="text" data-reveal-delay="0.1">
            I design systems, then build them. Usually the first designer in the
            room, and close enough to the code that the intent survives delivery.
          </p>
          <p className="d3-meta">
            Open to new work
            <br />
            <a href="mailto:me@theebuka.com">me@theebuka.com</a>
          </p>
        </div>
      </header>

      <section className="d3-row d3-section">
        <h2 className="d3-label">Selected work</h2>
        <div className="d3-body">
          <WorkList projects={projects} loading={loading} />
        </div>
      </section>

      <section className="d3-row d3-section">
        <h2 className="d3-label">Approach</h2>
        <div className="d3-body">
          <p className="d3-prose">
            I lean toward brutalist minimalism: structure left visible, contrast
            doing the work, and restraint where a system would otherwise start
            shouting. Most of my work has been in fintech, B2B and SaaS, often as
            the first or only designer, working closely with engineers from the
            first sketch to what ships.
          </p>
          <ul className="d3-list">
            {CAPABILITIES.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};
