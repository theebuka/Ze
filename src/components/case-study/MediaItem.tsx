import React, { useEffect, useRef } from 'react';
import { SanityImage } from '../common/SanityImage';

/**
 * MediaItem — replaces the react-player call that was crashing case studies.
 *
 * The old code did `(ReactPlayer as any)({ ...props })`, calling a component
 * as a plain function. That bypasses React entirely (no hooks, no
 * reconciliation, no error boundary) and blew up as
 * `ReactPlayer is not a function` under react-player v3's export shape.
 *
 * react-player is removed rather than repaired. The schema offers exactly two
 * options — "Video (URL)" meaning Vimeo or a raw MP4 — and the playback mode
 * is background: muted, looping, no controls, no UI. Native <video> and a
 * background iframe do that in zero kilobytes, against react-player's
 * ~300-500KB gzipped (@mux/mux-player-react, hls.js, media-chrome and ten
 * *-video-element packages, loaded on every route).
 *
 * The YouTube branch is kept even though the Sanity field only documents
 * "Vimeo/Raw MP4" — react-player auto-detected the provider from URL shape
 * regardless, so a YouTube link was always technically reachable, and a
 * background iframe branch costs nothing to keep.
 */

interface MediaData {
  mediaType?: 'image' | 'video';
  image?: unknown;
  videoUrl?: string;
  caption?: string;
}

interface Props {
  data?: MediaData | null;
  /** `sizes` for the underlying image. Match the grid column it sits in. */
  sizes?: string;
  priority?: boolean;
}

// ── URL parsing ────────────────────────────────────────────────────────────

type Parsed =
  | { kind: 'file'; url: string }
  | { kind: 'vimeo'; id: string }
  | { kind: 'youtube'; id: string }
  | { kind: 'unknown'; url: string };

function parseVideoUrl(raw: string): Parsed {
  const url = raw.trim();

  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return { kind: 'file', url };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return { kind: 'vimeo', id: vimeo[1] };

  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i
  );
  if (yt) return { kind: 'youtube', id: yt[1] };

  return { kind: 'unknown', url };
}

// ── Native file video ──────────────────────────────────────────────────────

const FileVideo: React.FC<{ url: string }> = ({ url }) => {
  const ref = useRef<HTMLVideoElement>(null);

  // Only play while on screen. A case study with eight autoplaying videos
  // decoding simultaneously will pin a phone's CPU and drain battery even
  // when every one of them is off screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {
            /* autoplay policy rejected it — fine, it stays paused */
          });
        } else {
          el.pause();
        }
      },
      { rootMargin: '200px 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="cs-video"
      src={url}
      muted
      loop
      playsInline
      // No autoPlay attribute — IntersectionObserver starts it. Setting both
      // means the browser begins buffering every video on page load.
      preload="metadata"
      disablePictureInPicture
      controls={false}
      aria-hidden="true"
    />
  );
};

// ── Embeds ─────────────────────────────────────────────────────────────────

const EmbedFrame: React.FC<{ src: string; title: string }> = ({ src, title }) => (
  <iframe
    className="cs-embed"
    src={src}
    title={title}
    // loading="lazy" is the whole point: an off-screen embed costs nothing
    // until the user scrolls near it.
    loading="lazy"
    frameBorder={0}
    allow="autoplay; fullscreen; picture-in-picture"
    allowFullScreen
  />
);

// ── Public component ───────────────────────────────────────────────────────

export const MediaItem: React.FC<Props> = ({ data, sizes = '100vw', priority = false }) => {
  if (!data) return null;

  if (data.mediaType === 'video' && data.videoUrl) {
    const parsed = parseVideoUrl(data.videoUrl);

    let inner: React.ReactNode = null;
    if (parsed.kind === 'file') {
      inner = <FileVideo url={parsed.url} />;
    } else if (parsed.kind === 'vimeo') {
      inner = (
        <EmbedFrame
          title={data.caption || 'Vimeo video'}
          src={`https://player.vimeo.com/video/${parsed.id}?background=1&autoplay=1&loop=1&muted=1&dnt=1`}
        />
      );
    } else if (parsed.kind === 'youtube') {
      inner = (
        <EmbedFrame
          title={data.caption || 'YouTube video'}
          src={`https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&mute=1&loop=1&playlist=${parsed.id}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3`}
        />
      );
    } else {
      // Unrecognised host. Say so in dev, render nothing in prod, but never
      // throw — a bad CMS entry must not take the page down.
      if (import.meta.env.DEV) {
        console.warn('[MediaItem] unsupported video url:', data.videoUrl);
      }
      return null;
    }

    return (
      <figure className="cs-media-wrapper cs-media-video" data-reveal="image">
        <div className="cs-media-frame">{inner}</div>
        {data.caption && <figcaption className="cs-caption">{data.caption}</figcaption>}
      </figure>
    );
  }

  if (data.image) {
    return (
      <figure className="cs-media-wrapper" data-reveal="image" data-parallax>
        <SanityImage
          source={data.image}
          alt={data.caption || 'Case study visual'}
          className="cs-img"
          sizes={sizes}
          priority={priority}
        />
        {data.caption && <figcaption className="cs-caption">{data.caption}</figcaption>}
      </figure>
    );
  }

  return null;
};
