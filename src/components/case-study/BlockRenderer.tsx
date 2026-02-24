import React, { useEffect } from 'react';
import ReactPlayer from 'react-player';
import { urlFor } from '../../lib/sanity';
import { useImageParallax } from '../../hooks/useImageParallax';

interface BlockProps {
  blocks: any[];
}

export const BlockRenderer: React.FC<BlockProps> = ({ blocks }) => {
  // ── Image Parallax ─────────────────────────────────────────────────
  // Fires after `blocks` arrives from Sanity. Queries all `.parallax-wrapper`
  // elements rendered by the MediaItem components below.
  useImageParallax([blocks]);

  if (!blocks) return null;

  return (
    <div className="case-study-builder">
      {blocks.map((block, index) => {
        switch (block._type) {
          case 'fullWidthMedia':
            return (
              <section key={index} className="grid-12-col section-padding">
                {block.sectionTitle && (
                  <div className="col-12">
                    <h3 className="cs-section-title">{block.sectionTitle}</h3>
                  </div>
                )}
                <div className="col-12">
                  <MediaItem data={block.media} />
                </div>
              </section>
            );

          case 'halfWidthMedia':
            return (
              <section key={index} className="grid-12-col section-padding">
                {block.sectionTitle && (
                  <div className="col-12">
                    <h3 className="cs-section-title">{block.sectionTitle}</h3>
                  </div>
                )}
                <div className={block.align === 'right' ? 'push-right-6' : 'col-6'}>
                  <MediaItem data={block.media} />
                </div>
              </section>
            );

          case 'sideBySideMedia':
            return (
              <section key={index} className="grid-12-col section-padding">
                {block.sectionTitle && (
                  <div className="col-12">
                    <h3 className="cs-section-title">{block.sectionTitle}</h3>
                  </div>
                )}
                <div className="col-6">
                  <MediaItem data={block.leftMedia} />
                </div>
                <div className="col-6">
                  <MediaItem data={block.rightMedia} />
                </div>
              </section>
            );

          case 'threeColMedia':
            return (
              <section key={index} className="grid-12-col section-padding">
                {block.sectionTitle && (
                  <div className="col-12">
                    <h3 className="cs-section-title">{block.sectionTitle}</h3>
                  </div>
                )}
                <div className="col-4">
                  <MediaItem data={block.media1} />
                </div>
                <div className="col-4">
                  <MediaItem data={block.media2} />
                </div>
                <div className="col-4">
                  <MediaItem data={block.media3} />
                </div>
              </section>
            );

          case 'halfWidthText':
            return (
              <section key={index} className="grid-12-col section-padding">
                {block.sectionTitle && (
                  <div className="col-12">
                    <h3 className="cs-section-title">{block.sectionTitle}</h3>
                  </div>
                )}
                <div className={block.align === 'right' ? 'push-right-5' : 'col-5'}>
                  {block.heading && (
                    <h4 className="cs-block-title">{block.heading}</h4>
                  )}
                  <p className="cs-text-body">{block.text}</p>
                </div>
              </section>
            );

          case 'sideBySideText':
            return (
              <section key={index} className="grid-12-col section-padding">
                {block.sectionTitle && (
                  <div className="col-12">
                    <h3 className="cs-section-title">{block.sectionTitle}</h3>
                  </div>
                )}
                <div className="col-5">
                  {block.leftHeading && (
                    <h4 className="cs-block-title">{block.leftHeading}</h4>
                  )}
                  <p className="cs-text-body">{block.leftText}</p>
                </div>
                <div className="push-right-5">
                  {block.rightHeading && (
                    <h4 className="cs-block-title">{block.rightHeading}</h4>
                  )}
                  <p className="cs-text-body">{block.rightText}</p>
                </div>
              </section>
            );

          case 'threeColText':
            return (
              <section key={index} className="grid-12-col section-padding">
                {block.sectionTitle && (
                  <div className="col-12">
                    <h3 className="cs-section-title">{block.sectionTitle}</h3>
                  </div>
                )}
                <div className="col-4">
                  {block.heading1 && (
                    <h4 className="cs-block-title">{block.heading1}</h4>
                  )}
                  <p className="cs-text-body">{block.text1}</p>
                </div>
                <div className="col-4">
                  {block.heading2 && (
                    <h4 className="cs-block-title">{block.heading2}</h4>
                  )}
                  <p className="cs-text-body">{block.text2}</p>
                </div>
                <div className="col-4">
                  {block.heading3 && (
                    <h4 className="cs-block-title">{block.heading3}</h4>
                  )}
                  <p className="cs-text-body">{block.text3}</p>
                </div>
              </section>
            );

          case 'threeItems3ColText':
            return (
              <section key={index} className="section-padding">
                {block.sectionTitle && (
                  <div
                    className="grid-12-col"
                    style={{ marginBottom: 'clamp(24px, 3vw, 40px)' }}
                  >
                    <div className="col-12">
                      <h3 className="cs-section-title" style={{ marginBottom: 0 }}>
                        {block.sectionTitle}
                      </h3>
                    </div>
                  </div>
                )}
                <div className="flex-space-between">
                  <div className="flex-col-3">
                    {block.heading1 && (
                      <h4 className="cs-block-title">{block.heading1}</h4>
                    )}
                    <p className="cs-text-body">{block.text1}</p>
                  </div>
                  <div className="flex-col-3">
                    {block.heading2 && (
                      <h4 className="cs-block-title">{block.heading2}</h4>
                    )}
                    <p className="cs-text-body">{block.text2}</p>
                  </div>
                  <div className="flex-col-3">
                    {block.heading3 && (
                      <h4 className="cs-block-title">{block.heading3}</h4>
                    )}
                    <p className="cs-text-body">{block.text3}</p>
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

// ── MediaItem ────────────────────────────────────────────────────────────
// The key change: image wrappers now carry `parallax-wrapper` and images
// carry `parallax-img`. These are the hooks that useImageParallax targets.
// Videos are excluded — parallax on a playing video is disorienting.

const MediaItem = ({ data }: { data: any }) => {
  if (!data) return null;

  if (data.mediaType === 'video' && data.videoUrl) {
    return (
      <div
        className="cs-media-wrapper video-container"
        style={{ aspectRatio: '16/9', background: '#111' }}
      >
        <ReactPlayer
          url={data.videoUrl}
          playing
          loop
          muted
          playsInline
          controls={false}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          config={{
            youtube: {
              playerVars: {
                controls: 0,
                modestbranding: 1,
                rel: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
              },
            },
            vimeo: {
              playerOptions: { background: true, controls: false, dnt: true },
            },
          }}
        />
        {data.caption && (
          <span className="cs-caption" style={{ position: 'relative', zIndex: 2 }}>
            {data.caption}
          </span>
        )}
      </div>
    );
  }

  if (data.image) {
    return (
      // ── parallax-wrapper: the clipping container ──────────────────
      <div className="cs-media-wrapper parallax-wrapper">
        <img
          src={urlFor(data.image).url()}
          alt={data.caption || 'Case study visual'}
          // ── parallax-img: GSAP scrubs yPercent on this element ────
          className="cs-img parallax-img"
        />
        {data.caption && (
          <span className="cs-caption">{data.caption}</span>
        )}
      </div>
    );
  }

  return null;
};