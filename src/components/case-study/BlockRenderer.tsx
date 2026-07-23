import React from 'react';
import { MediaItem } from './MediaItem';

/**
 * BlockRenderer
 *
 * Changes:
 *   - MediaItem extracted to its own file (it was 60 lines of video logic
 *     living at the bottom of a layout file).
 *   - No useImageParallax call here. The old version invoked a hook that
 *     queried the whole document, while Home and Work did the same, so a
 *     case study got two or three competing scrubs on identical elements.
 *     Parallax is now driven once from CaseStudy's scope ref.
 *   - Every media slot passes a real `sizes` value matching its column, so
 *     a 4-column image does not download a full-width source.
 *   - Section titles, block headings and body copy carry data-reveal="text"
 *     instead of being picked up by a global `main h1, main h2, main p`
 *     selector.
 *   - Keys are the block `_key` from Sanity, not the array index. Index keys
 *     mean reordering blocks in the CMS remounts the wrong DOM nodes.
 *
 * All 8 block types the schema actually defines are handled below —
 * fullWidthMedia, halfWidthMedia, sideBySideMedia, threeColMedia,
 * halfWidthText, sideBySideText, threeColText, threeItems3ColText — each
 * keeping its real column widths (halfWidthText/sideBySideText are a 5/7
 * split via col-5/push-right-5, not col-6) and optional per-panel heading.
 */

interface Block {
  _key?: string;
  _type: string;
  sectionTitle?: string;
  align?: 'left' | 'right';
  media?: unknown;
  leftMedia?: unknown;
  rightMedia?: unknown;
  media1?: unknown;
  media2?: unknown;
  media3?: unknown;
  heading?: string;
  text?: string;
  leftHeading?: string;
  leftText?: string;
  rightHeading?: string;
  rightText?: string;
  heading1?: string;
  text1?: string;
  heading2?: string;
  text2?: string;
  heading3?: string;
  text3?: string;
  [key: string]: unknown;
}

interface Props {
  blocks: Block[];
}

const HALF = '(max-width: 768px) 100vw, 50vw';
const THIRD = '(max-width: 768px) 100vw, 33vw';
const FULL = '100vw';

const SectionTitle: React.FC<{ title?: string }> = ({ title }) =>
  title ? (
    <div className="col-12">
      <h3 className="cs-section-title" data-reveal="text">
        {title}
      </h3>
    </div>
  ) : null;

const BlockHeading: React.FC<{ heading?: string }> = ({ heading }) =>
  heading ? (
    <h4 className="cs-block-title" data-reveal="text">
      {heading}
    </h4>
  ) : null;

export const BlockRenderer: React.FC<Props> = ({ blocks }) => {
  if (!blocks?.length) return null;

  return (
    <div className="case-study-builder">
      {blocks.map((block, i) => {
        const key = block._key ?? `${block._type}-${i}`;

        switch (block._type) {
          case 'fullWidthMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-12">
                  <MediaItem
                    data={block.media as never}
                    sizes={FULL}
                    // First block on the page is above the fold on most
                    // screens: load it eagerly so LCP is not gated on a
                    // lazy-loading decision.
                    priority={i === 0}
                  />
                </div>
              </section>
            );

          case 'halfWidthMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className={block.align === 'right' ? 'push-right-6' : 'col-6'}>
                  <MediaItem data={block.media as never} sizes={HALF} />
                </div>
              </section>
            );

          case 'sideBySideMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-6">
                  <MediaItem data={block.leftMedia as never} sizes={HALF} />
                </div>
                <div className="col-6">
                  <MediaItem data={block.rightMedia as never} sizes={HALF} />
                </div>
              </section>
            );

          case 'threeColMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-4">
                  <MediaItem data={block.media1 as never} sizes={THIRD} />
                </div>
                <div className="col-4">
                  <MediaItem data={block.media2 as never} sizes={THIRD} />
                </div>
                <div className="col-4">
                  <MediaItem data={block.media3 as never} sizes={THIRD} />
                </div>
              </section>
            );

          case 'halfWidthText':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className={block.align === 'right' ? 'push-right-5' : 'col-5'}>
                  <BlockHeading heading={block.heading} />
                  <p className="cs-text-body" data-reveal="text">
                    {block.text}
                  </p>
                </div>
              </section>
            );

          case 'sideBySideText':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-5">
                  <BlockHeading heading={block.leftHeading} />
                  <p className="cs-text-body" data-reveal="text">
                    {block.leftText}
                  </p>
                </div>
                <div className="push-right-5">
                  <BlockHeading heading={block.rightHeading} />
                  <p className="cs-text-body" data-reveal="text">
                    {block.rightText}
                  </p>
                </div>
              </section>
            );

          case 'threeColText':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-4">
                  <BlockHeading heading={block.heading1} />
                  <p className="cs-text-body" data-reveal="text">
                    {block.text1}
                  </p>
                </div>
                <div className="col-4">
                  <BlockHeading heading={block.heading2} />
                  <p className="cs-text-body" data-reveal="text">
                    {block.text2}
                  </p>
                </div>
                <div className="col-4">
                  <BlockHeading heading={block.heading3} />
                  <p className="cs-text-body" data-reveal="text">
                    {block.text3}
                  </p>
                </div>
              </section>
            );

          case 'threeItems3ColText':
            return (
              <section key={key} className="section-padding">
                {block.sectionTitle && (
                  <div
                    className="grid-12-col"
                    style={{ marginBottom: 'clamp(24px, 3vw, 40px)' }}
                  >
                    <div className="col-12">
                      <h3
                        className="cs-section-title"
                        style={{ marginBottom: 0 }}
                        data-reveal="text"
                      >
                        {block.sectionTitle}
                      </h3>
                    </div>
                  </div>
                )}
                <div className="flex-space-between">
                  <div className="flex-col-3">
                    <BlockHeading heading={block.heading1} />
                    <p className="cs-text-body" data-reveal="text">
                      {block.text1}
                    </p>
                  </div>
                  <div className="flex-col-3">
                    <BlockHeading heading={block.heading2} />
                    <p className="cs-text-body" data-reveal="text">
                      {block.text2}
                    </p>
                  </div>
                  <div className="flex-col-3">
                    <BlockHeading heading={block.heading3} />
                    <p className="cs-text-body" data-reveal="text">
                      {block.text3}
                    </p>
                  </div>
                </div>
              </section>
            );

          default:
            if (import.meta.env.DEV) {
              console.warn('[BlockRenderer] unhandled block type:', block._type);
            }
            return null;
        }
      })}
    </div>
  );
};
