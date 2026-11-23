import React, { useEffect, useState } from 'react';
import { client } from '../lib/sanity';
import { SanityImage } from '../components/common/SanityImage';
import { useReveal } from '../hooks/useReveal';
import { useAppReady } from '../context/AppReadyContext';

/** Whole document, so a newly-added aboutImage3 needs no query change. */
type SiteSettings = Record<string, unknown>;

/**
 * Roles, newest first. Rendered only when it has entries, so an empty list
 * shows nothing rather than a heading over a blank space.
 *
 *   { role: 'Product Designer', company: 'Acme', years: '2023 – Now' },
 */
const EXPERIENCE: { role: string; company: string; years: string }[] = [];

const FOCUS = [
  'Art and creative direction',
  'Product thinking',
  'Strategy',
  'User experience',
  'Usability research',
  'Interaction design',
  'Design systems',
  'Visual design',
  'Growth design',
];

const MEDIA_SIZES = '(max-width: 768px) 100vw, 75vw';

export const About: React.FC = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const splashDone = useAppReady();
  const scope = useReveal<HTMLDivElement>({ deps: [siteSettings], enabled: splashDone });

  useEffect(() => {
    client
      .fetch<SiteSettings>(`*[_type == "siteSettings"][0]`)
      .then(setSiteSettings)
      .catch(console.error);
  }, []);

  const image = (field: string, alt: string) =>
    Boolean(siteSettings?.[field]) && (
      <div className="d3-row d3-section d3-section--tight">
        <div className="d3-body about-media" data-reveal="image">
          <SanityImage
            source={siteSettings![field]}
            alt={alt}
            sizes={MEDIA_SIZES}
            maxWidth={1920}
          />
        </div>
      </div>
    );

  return (
    <div className="page-wrapper page-about page-doc" ref={scope}>
      <header className="d3-mast">
        {/* One plain sentence. Nested muted spans made SplitText break the
            line at each span boundary. */}
        <h1 className="d3-statement about-statement" data-reveal="text">
          I&rsquo;m Chukwuebuka, known professionally as ZE: a product designer
          with a frontend streak.
        </h1>
        <div className="d3-row d3-mast-sub">
          <p className="d3-lede" data-reveal="text" data-reveal-delay="0.1">
            I like building across layers (design, code, research, strategy) and
            making each part feel intentional and human.
          </p>
        </div>
      </header>

      {image('aboutImage1', 'ZE thinking')}

      <section className="d3-row d3-section">
        <h2 className="d3-label" data-reveal="text">Background</h2>
        <div className="d3-body d3-copy">
          <p data-reveal="text">
            I came to design through medical radiography. Working inside complex
            systems of care, and helping other people make sense of them, I
            realised what I cared about most was how people experience systems.
          </p>
          <p data-reveal="text">
            From there I joined tech startups, where I&rsquo;ve spent the last few
            years designing products from the ground up, often as the first or
            only designer, working closely with engineers and product teams.
            I&rsquo;ve led design systems and UI overhauls, navigation, onboarding,
            identity authentication, and adaptations across mobile, tablet and
            wearables. I stay close to the build so that what ships matches what
            was designed.
          </p>
        </div>
      </section>

      <section className="d3-row d3-section">
        <h2 className="d3-label" data-reveal="text">How I work</h2>
        <div className="d3-body d3-copy">
          <p data-reveal="text">
            Most of my work is in fintech, B2B enterprise and SaaS, across
            product roles and freelance. I ask a lot of questions, I&rsquo;m
            practical, and I&rsquo;d rather make small moves that keep getting it
            right than wait for a perfect plan. I lean on product thinking and
            on typography: alignment, space, and the gap between what something
            means and how it&rsquo;s presented.
          </p>
          <p data-reveal="text">
            My taste runs to brutalist minimalism: structure and contrast first,
            restraint over decoration. Less, but it has to hold up.
          </p>
        </div>
      </section>

      {EXPERIENCE.length > 0 && (
        <section className="d3-row d3-section">
          <h2 className="d3-label" data-reveal="text">Experience</h2>
          <ul className="d3-body about-experience">
            {EXPERIENCE.map((e) => (
              <li key={`${e.company}-${e.years}`} data-reveal="text">
                <span>
                  {e.role}, <span className="text-muted">{e.company}</span>
                </span>
                <span className="text-muted">{e.years}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {image('aboutImage2', 'ZE smiling')}

      <section className="d3-row d3-section">
        <h2 className="d3-label" data-reveal="text">Outside work</h2>
        <div className="d3-body d3-copy">
          <p data-reveal="text">
            Music, pop culture and collecting. I keep mood boards and a deep
            library of underground, lo-fi and alternative hip-hop. I&rsquo;m drawn
            to physical things (books, magazines, sneakers) because material,
            form and texture are where my eye for detail comes from.
          </p>
        </div>
      </section>

      <section className="d3-row d3-section">
        <h2 className="d3-label" data-reveal="text">Focus</h2>
        <ul className="d3-body d3-list about-focus-list">
          {FOCUS.map((f, i) => (
            <li key={f} data-reveal="text" data-reveal-delay={i * 0.04}>
              {f}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
