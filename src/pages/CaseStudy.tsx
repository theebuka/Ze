import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { client } from '../lib/sanity';
import { BlockRenderer } from '../components/case-study/BlockRenderer';
import { NextProject } from '../components/case-study/NextProject';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';
import { useAppReady } from '../context/AppReadyContext';

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
  liveUrl?: string;
  summary: string;
  contentBlocks: never[];
  next?: NextProject | null;
  first?: NextProject | null;
}

interface NextProject {
  brand: string;
  slug: string;
  projectType?: string;
  thumbnailUrl?: string;
}

type Status = 'loading' | 'ready' | 'notfound' | 'error';

// `next` is the project after this one in the same order the work list uses
// (newest first); `first` is where the last project wraps round to.
const QUERY = `*[_type == "caseStudy" && slug.current == $slug][0]{
  brand, projectType, timeline, role, stack, liveUrl, summary, contentBlocks,
  "next": *[_type == "caseStudy" && publishedAt < ^.publishedAt]
    | order(publishedAt desc)[0]{ brand, "slug": slug.current, projectType, "thumbnailUrl": thumbnail.asset->url },
  "first": *[_type == "caseStudy"]
    | order(publishedAt desc)[0]{ brand, "slug": slug.current, projectType, "thumbnailUrl": thumbnail.asset->url }
}`;

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const splashDone = useAppReady();

  // Reveals wait for data; the dep array re-runs setup once blocks are in the
  // DOM. `enabled` also requires splashDone: a case study can be the entry
  // route on a fresh load/refresh, mounting underneath the splash overlay.
  const scope = useReveal<HTMLDivElement>({
    deps: [project],
    enabled: status === 'ready' && splashDone,
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

  const next = project.next ?? project.first;
  const facts = [
    { label: 'Role', value: project.role },
    { label: 'Timeline', value: project.timeline },
    { label: 'Stack', value: project.stack?.join(', ') },
  ].filter((f) => f.value);

  return (
    <div className="page-wrapper case-study-page" ref={scope}>
      {/* Same shape as the homepage masthead: a statement across the full
          width, then the summary and the facts in the label/content row. */}
      <header className="cs-head">
        <h1 className="d3-statement cs-head-title">
          <span data-reveal="text">{project.brand}</span>
          {project.projectType && (
            <span className="text-muted" data-reveal="text" data-reveal-delay="0.08">
              {project.projectType}
            </span>
          )}
        </h1>

        <div className="d3-row d3-mast-sub">
          {project.summary && (
            <p className="d3-lede cs-head-summary" data-reveal="text" data-reveal-delay="0.12">
              {project.summary}
            </p>
          )}
          {facts.length > 0 && (
            <dl className="cs-facts">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt data-reveal="text" data-reveal-delay="0.16">{f.label}</dt>
                  <dd data-reveal="text" data-reveal-delay="0.2">{f.value}</dd>
                </div>
              ))}
              {project.liveUrl && (
                <div>
                  <dt data-reveal="text" data-reveal-delay="0.16">Live</dt>
                  <dd data-reveal="text" data-reveal-delay="0.2">
                    <a className="cs-live-link" href={project.liveUrl} target="_blank" rel="noreferrer">
                      {project.liveUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </header>

      <BlockRenderer blocks={project.contentBlocks || []} />

      {next && next.slug !== slug && (
        <NextProject
          brand={next.brand}
          slug={next.slug}
          projectType={next.projectType}
          thumbnailUrl={next.thumbnailUrl}
        />
      )}
    </div>
  );
};
