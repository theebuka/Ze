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

// 2880 and 3200 cover a full-width image on a 1440-1600px retina screen.
// Case study uploads are 3200 x 2000, and capping at 2560 left them soft.
const WIDTHS = [480, 768, 1024, 1440, 1920, 2560, 2880, 3200];
// Screenshots are mostly flat colour and small type; at q78 AVIF/WebP smears
// the type. 90 keeps edges crisp for a modest size increase.
const QUALITY = 90;

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
export function responsiveImage(source: unknown, maxWidth = 3200): ResponsiveImage {
  const dims = imageDimensions(source);
  const widths = WIDTHS.filter((w) => w <= maxWidth && (!dims || w <= dims.width));
  if (widths.length === 0) widths.push(dims?.width ?? maxWidth);

  const url = (w: number) => urlFor(source).width(w).fit('max').auto('format').quality(QUALITY).url();

  return {
    src: url(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    width: dims?.width,
    height: dims?.height,
  };
}

/** Same, for a raw CDN url returned by GROQ as a string. */
export function responsiveUrl(url: string, maxWidth = 3200): ResponsiveImage {
  const dims = urlDimensions(url);
  const widths = WIDTHS.filter((w) => w <= maxWidth && (!dims || w <= dims.width));
  if (widths.length === 0) widths.push(dims?.width ?? maxWidth);

  const at = (w: number) => `${url}?w=${w}&auto=format&q=${QUALITY}&fit=max`;

  return {
    src: at(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${at(w)} ${w}w`).join(', '),
    width: dims?.width,
    height: dims?.height,
  };
}
