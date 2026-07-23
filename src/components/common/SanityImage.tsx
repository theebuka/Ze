import React from 'react';
import { responsiveImage, responsiveUrl } from '../../lib/sanity';

interface Props {
  /** Either a Sanity image object, or a raw CDN url string from GROQ. */
  source: unknown;
  alt: string;
  className?: string;
  /** The `sizes` attribute. Get this right or srcSet does nothing useful. */
  sizes?: string;
  /** Above the fold? Then eager + high priority, no lazy. */
  priority?: boolean;
  maxWidth?: number;
}

/**
 * One image component for the whole site.
 *
 * What this gives you that a bare <img src={urlFor(x).url()}> did not:
 *   - srcSet/sizes, so a phone downloads ~60KB instead of ~4MB
 *   - auto('format') → AVIF/WebP where supported
 *   - width/height attributes → zero layout shift → ScrollTrigger measures a
 *     layout that will not move underneath it
 *   - loading="lazy" + decoding="async" on everything below the fold
 *   - fetchPriority="high" on the hero so it is not queued behind thumbnails
 *
 * Always carries data-parallax-img: useParallax scopes its query to inside a
 * [data-parallax] ancestor, so this is inert everywhere else — but every call
 * site was passing className="parallax-img" for CSS while useParallax reads
 * the data attribute, and none of them were setting it. Without this the
 * parallax scrub would never find a target.
 */
export const SanityImage: React.FC<Props> = ({
  source,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  maxWidth = 2560,
}) => {
  if (!source) return null;

  let img;
  try {
    img =
      typeof source === 'string'
        ? responsiveUrl(source, maxWidth)
        : responsiveImage(source, maxWidth);
  } catch (err) {
    // A published document can reference an unpublished or deleted asset.
    // @sanity/image-url throws on those. Render nothing rather than take the
    // page down.
    console.warn('[SanityImage] could not resolve source', err);
    return null;
  }

  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={alt}
      className={className}
      data-parallax-img=""
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
    />
  );
};
