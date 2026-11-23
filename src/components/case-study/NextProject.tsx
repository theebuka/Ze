import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SanityImage } from '../common/SanityImage';
import { gsap, isCoarsePointer, prefersReducedMotion } from '../../lib/gsap';

interface Props {
  brand: string;
  slug: string;
  projectType?: string;
  thumbnailUrl?: string;
}

/** Thumbnail size, and how far it sits from the pointer. */
const W = 360;
const H = 225;
const OFFSET = 24;

/**
 * The "next project" link at the end of a case study. On a mouse, the next
 * project's cover follows the pointer while it is over the link. On touch
 * there is no pointer to follow, so the cover is shown under the title.
 */
export const NextProject: React.FC<Props> = ({ brand, slug, projectType, thumbnailUrl }) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const floatRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const link = linkRef.current;
    const float = floatRef.current;
    if (!link || !float || !thumbnailUrl || isCoarsePointer()) return;

    // The outer element only ever moves; the show/hide scale and fade live
    // on its child in CSS, so the two never fight over one transform.
    const ease = prefersReducedMotion() ? 0 : 0.55;
    const xTo = gsap.quickTo(float, 'x', { duration: ease, ease: 'power3' });
    const yTo = gsap.quickTo(float, 'y', { duration: ease, ease: 'power3' });

    // Below-right of the pointer, flipped to the left near the right edge
    // so the image never runs off the screen.
    const place = (e: PointerEvent, immediate = false) => {
      const flip = e.clientX + OFFSET + W > window.innerWidth;
      const x = flip ? e.clientX - OFFSET - W : e.clientX + OFFSET;
      const y = Math.min(e.clientY - H / 2, window.innerHeight - H - OFFSET);
      if (immediate) gsap.set(float, { x, y });
      else { xTo(x); yTo(y); }
    };

    const onEnter = (e: PointerEvent) => { place(e, true); setActive(true); };
    const onMove = (e: PointerEvent) => place(e);
    const onLeave = () => setActive(false);

    link.addEventListener('pointerenter', onEnter);
    link.addEventListener('pointermove', onMove);
    link.addEventListener('pointerleave', onLeave);
    return () => {
      link.removeEventListener('pointerenter', onEnter);
      link.removeEventListener('pointermove', onMove);
      link.removeEventListener('pointerleave', onLeave);
    };
  }, [thumbnailUrl]);

  const image = thumbnailUrl && (
    <SanityImage source={thumbnailUrl} alt="" sizes={`${W}px`} maxWidth={1024} />
  );

  return (
    <nav className="d3-row cs-next" aria-label="Next project">
      <span className="d3-label">Next project</span>
      <Link ref={linkRef} to={`/work/${slug}`} className="d3-body cs-next-link">
        <span className="cs-next-text">
          <span className="cs-next-brand">{brand}</span>
          {projectType && <span className="cs-next-desc"> {projectType}</span>}
          <span className="cs-next-arrow" aria-hidden="true"> &rarr;</span>
        </span>
        {image && (
          <span className="cs-next-thumb-static" aria-hidden="true">
            {image}
          </span>
        )}
      </Link>

      {image && (
        <span ref={floatRef} className="cs-next-float" aria-hidden="true">
          <span className={`cs-next-float-inner${active ? ' is-on' : ''}`}>{image}</span>
        </span>
      )}
    </nav>
  );
};
