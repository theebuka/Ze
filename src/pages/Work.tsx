import React from 'react';
import { WorkGrid } from '../components/work/WorkGrid';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';

export const Work: React.FC = () => {
  const { projects, loading, error } = useProjects('all');

  const scope = useReveal<HTMLElement>({ deps: [projects] });
  useParallax(scope, [projects]);

  return (
    <main className="page-wrapper page-work" ref={scope}>
      <header className="work-page-header">
        <h1 className="work-title" data-reveal="text">
          Take a look at a few projects that i've
          <br />
          hashed out in recent years
        </h1>
      </header>

      <header className="works-header">
        <span />
        <span className="line-reveal" data-reveal="line" aria-hidden="true" />
      </header>

      {error ? (
        <p className="cs-status-text" role="alert">
          Couldn't load the work list right now. Please refresh.
        </p>
      ) : (
        <WorkGrid projects={projects} loading={loading} />
      )}
    </main>
  );
};
