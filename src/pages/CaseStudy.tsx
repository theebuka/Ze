import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { client } from '../lib/sanity';
import { BlockRenderer } from '../components/case-study/BlockRenderer';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';

/**
 * CaseStudy
 *
 * The old version had three failure modes that all looked identical to the
 * user (a blank page):
 *
 *   1. `catch { console.error }` left `project` null forever and rendered
 *      `<div style={{opacity: 0}} />`. A fetch failure was indistinguishable
 *      from a page that simply had not arrived.
 *   2. Page visibility depended on a requestAnimationFrame callback calling
 *      `gsap.set(container, {opacity: 1})`. If that rAF was throttled — a
 *      backgrounded tab, iOS low power mode — the page never appeared.
 *   3. Any throw below (MediaItem) unmounted the root, since there was no
 *      error boundary.
 *
 * Now: explicit status machine, container is never opacity-gated, reveals are
 * handled by the shared useReveal hook via data-reveal attributes. A
 * not-found slug now renders an in-place message instead of the old
 * `navigate('/work')` redirect — deliberate, part of this status machine.
 */

interface ProjectData {
  brand: string;
  projectType: string;
  timeline: string;
  role: string;
  stack: string[];
  summary: string;
  contentBlocks: never[];
}

type Status = 'loading' | 'ready' | 'notfound' | 'error';

const QUERY = `*[_type == "caseStudy" && slug.current == $slug][0]{
  brand, projectType, timeline, role, stack, summary, contentBlocks
}`;

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  // Reveals wait for data; the dep array re-runs setup once blocks are in the
  // DOM. `enabled` prevents a pass over an empty container.
  const scope = useReveal<HTMLDivElement>({
    deps: [project],
    enabled: status === 'ready',
  });
  useParallax(scope, [project]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setProject(null);

    client
      .fetch<ProjectData | null>(QUERY, { slug })
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setStatus('notfound');
          return;
        }
        setProject(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[CaseStudy] Sanity fetch failed:', err);
        setStatus('error');
      });

    // Abandon the result of a stale slug rather than letting it land after a
    // newer one. The old code had no guard, so fast back-and-forth navigation
    // could render the previous project's data.
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="page-wrapper cs-status" aria-busy="true">
        <span className="cs-status-text">Loading</span>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="page-wrapper cs-status">
        <h1>That project isn't here.</h1>
        <p>
          It may have been renamed or unpublished. <Link to="/work">See all work</Link>.
        </p>
      </div>
    );
  }

  if (status === 'error' || !project) {
    return (
      <div className="page-wrapper cs-status" role="alert">
        <h1>Couldn't load this project.</h1>
        <p>
          Something went wrong fetching it. <Link to="/work">See all work</Link>, or
          try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="page-wrapper case-study-page" ref={scope}>
      <header className="cs-hero section-padding">
        <h1 className="cs-title">
          <span data-reveal="text">{project.brand}</span>
          <span className="font-sec-muted" data-reveal="text" data-reveal-delay="0.1">
            {project.projectType}
          </span>
        </h1>

        <div className="cs-metadata grid-12-col">
          <div className="col-2">
            <span className="meta-label" data-reveal="text">TIMELINE</span>
            <span className="meta-value" data-reveal="text">{project.timeline}</span>
          </div>
          <div className="col-3">
            <span className="meta-label" data-reveal="text">ROLE</span>
            <span className="meta-value" data-reveal="text">{project.role}</span>
          </div>
          <div className="col-2">
            <span className="meta-label" data-reveal="text">STACK</span>
            <ul className="meta-stack-list">
              {project.stack?.map((item) => (
                <li key={item} className="meta-value" data-reveal="text">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="col-5">
            <span className="meta-label" data-reveal="text">SUMMARY</span>
            <p className="meta-value" data-reveal="text">{project.summary}</p>
          </div>
        </div>
      </header>

      <BlockRenderer blocks={project.contentBlocks || []} />
    </div>
  );
};
