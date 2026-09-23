import React from 'react';
import { Link } from 'react-router-dom';
import { SanityImage } from '../common/SanityImage';
import { yearOf } from '../../hooks/useProjects';
import type { Project } from '../../hooks/useProjects';

interface Props {
  projects: Project[];
  loading?: boolean;
}

const SIZES = '(max-width: 768px) 100vw, 75vw';

/**
 * Sanity stores projectType as a headline in Title Case ("Turning Business
 * Chaos Into a Single, Calm Dashboard"). Set as the grey half of a caption it
 * reads as shouting, so it goes to sentence case here. Words with a capital
 * after the first letter (EdTech, SaaS) or all caps are left alone, since
 * those are names rather than headline styling.
 */
const sentenceCase = (s: string) =>
  s
    .split(' ')
    .map((w, i) => {
      if (i === 0) return w;
      if (/[A-Z]/.test(w.slice(1))) return w;
      return w.toLowerCase();
    })
    .join(' ');

/**
 * The work as pictures with captions under them, one per row.
 *
 * Replaces the index table. The table made you hover to see anything, which
 * is a fair trade for a type designer and a bad one for someone whose work is
 * interfaces: the images are the case. Every caption field already exists in
 * Sanity; a project missing one simply shows less.
 */
export const WorkList: React.FC<Props> = ({ projects, loading }) => {
  if (loading) {
    return (
      <div className="work-list" aria-busy="true">
        {[0, 1].map((i) => (
          <div className="work-entry work-entry--skeleton" key={i} aria-hidden="true">
            <div className="work-entry-media" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ol className="work-list">
      {projects.map((project, i) => {
        const year = yearOf(project);
        const meta = [project.category, year].filter(Boolean).join(' · ');

        return (
          <li className="work-entry" key={project._id}>
            <Link to={`/work/${project.slug}`} className="work-entry-link">
              <div className="work-entry-media" data-reveal="image" data-parallax>
                {project.thumbnailUrl && (
                  <SanityImage
                    source={project.thumbnailUrl}
                    alt=""
                    className="parallax-img"
                    sizes={SIZES}
                    priority={i === 0}
                    maxWidth={1920}
                  />
                )}
              </div>

              <div className="work-entry-caption">
                <p className="work-entry-title">
                  <span className="work-entry-brand">{project.brand}</span>
                  {project.projectType && (
                    <span className="work-entry-desc">
                      {sentenceCase(project.projectType)}
                    </span>
                  )}
                </p>
                {meta && <p className="work-entry-meta">{meta}</p>}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
};
