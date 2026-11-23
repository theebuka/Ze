import React from 'react';
import { WorkList } from '../components/work/WorkList';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useAppReady } from '../context/AppReadyContext';

export const Work: React.FC = () => {
  const { projects, loading, error } = useProjects('all');
  const splashDone = useAppReady();

  // Work can be the entry route on a fresh load/refresh, mounting underneath
  // the splash overlay same as Home — same gate, same reason.
  const scope = useReveal<HTMLDivElement>({ deps: [projects], enabled: splashDone });

  return (
    <div className="page-wrapper page-work" ref={scope}>
      <header className="work-page-header">
        <h1 className="work-title" data-reveal="text">
          Few projects I&rsquo;ve worked on in recent years
        </h1>
      </header>

      <section className="d3-row d3-section d3-section--first">
        {/* Keyed so the count arriving remounts the label. SplitText owns the
            text nodes once split, so React cannot update them in place. */}
        <h2 className="d3-label" data-reveal="text" key={loading ? 'loading' : 'ready'}>
          All work{!loading && ` (${projects.length})`}
        </h2>
        <div className="d3-body">
          {error ? (
            <p className="cs-status-text" role="alert">
              Couldn&rsquo;t load the work list right now. Please refresh.
            </p>
          ) : (
            <WorkList projects={projects} loading={loading} />
          )}
        </div>
      </section>
    </div>
  );
};
