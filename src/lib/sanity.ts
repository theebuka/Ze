import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

export const client = createClient({
  projectId: 'rf2m4ovv',
  dataset: 'production',
  // WAS false. That routes every GROQ query to the Sanity origin instead of
  // the edge cache — roughly 300-600ms per query from Lagos, and Home fires
  // two of them before it can render anything. Nothing here reads drafts or
  // uses a token, so the CDN is safe.
  useCdn: true,
  apiVersion: '2024-02-21',
  perspective: 'published',
});

const builder = createImageUrlBuilder(client);

export const urlFor = (source: unknown) => builder.image(source as never);

// ── Intrinsic dimensions ──────────────────────────────────────────────────
// A Sanity asset _ref encodes its dimensions:
//   image-abc123def456-2400x1600-jpg
// Parsing it means we get width/height without expanding asset-> in every
// GROQ query. Explicit width/height on an <img> is what stops layout shift,
// which is what stops ScrollTrigger measuring against a layout that is about
// to change.

const REF_RE = /-(\d+)x(\d+)-[a-z]+$/i;

interface SanityRef {
  asset?: { _ref?: string; url?: string };
  _ref?: string;
}

export function imageDimensions(source: unknown): { width: number; height: number } | null {
  const s = source as SanityRef | undefined;
  const ref = s?.asset?._ref ?? s?._ref;
  if (typeof ref !== 'string') return null;
  const m = ref.match(REF_RE);
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]) };
}

/** Also works on a bare CDN url (`thumbnail.asset->url` style GROQ). */
export function urlDimensions(url: string): { width: number; height: number } | null {
  const m = url.match(/-(\d+)x(\d+)\.[a-z]+/i);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

// ── Responsive sources ────────────────────────────────────────────────────

const WIDTHS = [480, 768, 1024, 1440, 1920, 2560];

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  width?: number;
  height?: number;
}

/**
 * Build a modern, correctly-sized srcSet from a Sanity image object.
 *
 * The old code called `urlFor(data.image).url()` with no transform at all,
 * which serves the designer's original upload. A 12-block case study of 4MB
 * source PNGs is ~48MB over mobile data. This caps at 2560px, converts to
 * AVIF/WebP where supported (`auto('format')`), and lets the browser pick.
 */
export function responsiveImage(source: unknown, maxWidth = 2560): ResponsiveImage {
  const dims = imageDimensions(source);
  const widths = WIDTHS.filter((w) => w <= maxWidth && (!dims || w <= dims.width));
  if (widths.length === 0) widths.push(dims?.width ?? maxWidth);

  const url = (w: number) => urlFor(source).width(w).auto('format').quality(78).url();

  return {
    src: url(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    width: dims?.width,
    height: dims?.height,
  };
}

/** Same, for a raw CDN url returned by GROQ as a string. */
export function responsiveUrl(url: string, maxWidth = 2560): ResponsiveImage {
  const dims = urlDimensions(url);
  const widths = WIDTHS.filter((w) => w <= maxWidth && (!dims || w <= dims.width));
  if (widths.length === 0) widths.push(dims?.width ?? maxWidth);

  const at = (w: number) => `${url}?w=${w}&auto=format&q=78&fit=max`;

  return {
    src: at(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${at(w)} ${w}w`).join(', '),
    width: dims?.width,
    height: dims?.height,
  };
}
