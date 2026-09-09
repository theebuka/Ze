import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SanityImage } from '../common/SanityImage';
import { isCoarsePointer } from '../../lib/gsap';
import { yearOf, roleOf } from '../../hooks/useProjects';
import type { Project } from '../../hooks/useProjects';

interface Props {
  projects: Project[];
  loading?: boolean;
}

/** Three digits reads as an archive; two reads as a short list. */
const pad = (n: number) => String(n + 1).padStart(3, '0');

/**
 * The work as a table rather than a grid.
 *
 * Every column is a field that already exists in Sanity, so nothing here
 * is invented and a project missing a field simply leaves that cell empty
 * rather than showing a placeholder.
 *
 * The image is held back until hover. That is the whole idea of the
 * direction: the first screen is a document, and the pictures are what you
 * get for reading it. On touch, where there is no hover, the preview is
 * removed entirely (direction-3.css) rather than bolted onto tap — a
 * preview that appears on tap is just a second thing to dismiss before you
 * reach the page you asked for.
 */
export const WorkIndex: React.FC<Props> = ({ projects, loading }) => {
  const [hovered, setHovered] = useState<Project | null>(null);
  const touch = isCoarsePointer();

  return (
    <>
      <div className="index-head u" aria-hidden="true">
        <span>No.</span>
        <span>Client</span>
        <span>Discipline</span>
        <span>Role</span>
        <span>Year</span>
        <span />
      </div>

      {loading && (
        <p className="cs-status-text" style={{ padding: '24px 0' }}>
          Loading index
        </p>
      )}

      {!loading &&
        projects.map((project, i) => (
          <Link
            to={`/work/${project.slug}`}
            key={project._id}
            className="index-row"
            onMouseEnter={() => !touch && setHovered(project)}
            onMouseLeave={() => !touch && setHovered(null)}
            onFocus={() => !touch && setHovered(project)}
            onBlur={() => !touch && setHovered(null)}
          >
            <span className="u">{pad(i)}</span>
            <span className="index-brand" data-reveal="text">
              {project.brand}
            </span>
            <span className="u">{project.category ?? ''}</span>
            <span className="u">{roleOf(project) ?? ''}</span>
            <span className="u">{yearOf(project) ?? ''}</span>
            {/* A rotating character, not an SVG: it sits in a table cell
                next to five other mono cells and has to share their
                metrics. U+2192 has no emoji presentation variant, which
                U+2197 (the one the cards use) does. */}
            <span className="index-arrow u" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        ))}

      {/* One preview element reused by every row, so hovering down the
          list crossfades a single node instead of mounting five. */}
      {!touch && (
        <div
          className={`index-preview${hovered ? ' is-on' : ''}`}
          aria-hidden="true"
        >
          {hovered?.thumbnailUrl && (
            <SanityImage
              key={hovered._id}
              source={hovered.thumbnailUrl}
              alt=""
              sizes="380px"
              maxWidth={768}
            />
          )}
        </div>
      )}
    </>
  );
};
