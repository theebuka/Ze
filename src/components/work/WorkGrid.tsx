import React from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../../context/CursorContext';
import { SanityImage } from '../common/SanityImage';
import { isCoarsePointer } from '../../lib/gsap';
import type { Project } from '../../hooks/useProjects';

interface Props {
  projects: Project[];
  loading?: boolean;
}

const GRID_SIZES = '(max-width: 768px) 100vw, 50vw';

/** Skeleton cards keep grid height stable so nothing jumps when data lands. */
const Skeleton: React.FC = () => (
  <>
    {[0, 1].map((i) => (
      <div className="work-item work-item--skeleton" key={i} aria-hidden="true">
        <div className="work-img-wrapper" />
        <div className="work-meta" />
      </div>
    ))}
  </>
);

export const WorkGrid: React.FC<Props> = ({ projects, loading }) => {
  const { setCursorType, setCursorMedia } = useCursor();

  // Hover-driven cursor state is meaningless on touch, and setting it fires
  // React state updates from synthetic mouse events that phones emit on tap.
  const touch = isCoarsePointer();

  const onEnter = (project: Project) => {
    if (touch) return;
    if (project.previewVideoUrl) {
      setCursorType('media');
      setCursorMedia(project.previewVideoUrl);
    } else {
      setCursorType('view-project');
    }
  };

  const onLeave = () => {
    if (touch) return;
    setCursorType('default');
    setCursorMedia(null);
  };

  return (
    <div className="work-grid">
      {loading && <Skeleton />}

      {!loading &&
        projects.map((project, i) => (
          <Link
            to={`/work/${project.slug}`}
            key={project._id}
            className="work-item"
            onMouseEnter={() => onEnter(project)}
            onMouseLeave={onLeave}
          >
            <div className="work-img-wrapper" data-reveal="image" data-parallax>
              {project.thumbnailUrl && (
                <SanityImage
                  source={project.thumbnailUrl}
                  alt={project.brand}
                  className="parallax-img"
                  sizes={GRID_SIZES}
                  priority={i < 2}
                  maxWidth={1440}
                />
              )}
            </div>

            <div className="work-meta">
              <div className="work-meta-row">
                <span className="work-meta-category">
                  {project.category || 'Case Study'}
                </span>
                <span className="work-meta-arrow" aria-hidden="true">↗</span>
              </div>
              <div className="work-meta-brand" data-reveal="text">
                {project.brand}
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
};
