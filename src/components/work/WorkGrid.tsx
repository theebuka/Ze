import React from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../../context/CursorContext';
import { Arrow } from '../common/Arrow';
import { SanityImage } from '../common/SanityImage';
import { isCoarsePointer } from '../../lib/gsap';
import { yearOf, roleOf } from '../../hooks/useProjects';
import type { Project } from '../../hooks/useProjects';

interface Props {
  projects: Project[];
  loading?: boolean;
  /**
   * 'stagger' puts the cards on the 12-column grid at four alternating
   * widths, ratios and offsets (direction-2.css). 'grid' is the original
   * two-up. Both read the same markup; only the class differs.
   */
  variant?: 'grid' | 'stagger';
}

const GRID_SIZES = '(max-width: 768px) 100vw, 50vw';

/** Two digits reads as a catalogue; one reads as an accident. */
const pad = (n: number) => String(n + 1).padStart(2, '0');

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

export const WorkGrid: React.FC<Props> = ({ projects, loading, variant = 'stagger' }) => {
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
    <div className={`work-grid${variant === 'stagger' ? ' work-grid--stagger' : ''}`}>
      {loading && <Skeleton />}

      {!loading &&
        projects.map((project, i) => {
          // Sanity holds all of this already; the card used to show two
          // fields of it. Nothing here is invented — a project with no
          // timeline or role simply drops that item from the row.
          const year = yearOf(project);
          const role = roleOf(project);
          const facts = [project.category, role].filter(Boolean) as string[];

          return (
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
                <div className="work-index-row u">
                  <span className="idx">{pad(i)}</span>
                  <span className="rule" aria-hidden="true" />
                  {year && <span>{year}</span>}
                  <Arrow className="work-meta-arrow" />
                </div>

                <div className="work-meta-brand" data-reveal="text">
                  {project.brand}
                </div>

                {facts.length > 0 && (
                  <div className="work-meta-sub u">
                    {facts.map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
    </div>
  );
};
