import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../context/CursorContext';
import { client, urlFor } from '../lib/sanity';
import { useImageParallax } from '../hooks/useImageParallax';

interface Project {
  _id: string;
  brand: string;
  slug: string;
  category?: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
}

interface SiteSettings {
  heroImage: any;
}

const FOCUS_ROWS: [string, string][] = [
  ['Art Direction',     'Product Thinking'],
  ['Creative Strategy', 'User Experience'],
  ['Usability Research','Interaction Design'],
  ['Design Systems',    'Visual Design'],
];

export const Home: React.FC = () => {
  const { setCursorType, setCursorMedia } = useCursor();
  const [featuredWorks, setFeaturedWorks] = useState<Project[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useImageParallax([featuredWorks]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [works, settings] = await Promise.all([
          client.fetch(`
            *[_type == "caseStudy" && isFeatured == true] | order(publishedAt desc)[0...2] {
              _id, brand,
              "slug": slug.current,
              category,
              "thumbnailUrl": thumbnail.asset->url,
              "previewVideoUrl": previewVideo.asset->url
            }
          `),
          client.fetch(`*[_type == "siteSettings"][0]{ heroImage }`)
        ]);
        setFeaturedWorks(works);
        setSiteSettings(settings);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMouseEnter = (project: Project) => {
    if (project.previewVideoUrl) {
      setCursorType('media');
      setCursorMedia(project.previewVideoUrl);
    } else {
      setCursorType('view-project');
    }
  };
  const handleMouseLeave = () => {
    setCursorType('default');
    setCursorMedia(null);
  };

  return (
    <main className="page-wrapper page-home">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-row">
          <h1 className="hero-title">
            <span className="text-muted">CHUKWUEBUKA</span>
            <br />
            <span className="text-muted">ARIN</span>ZE{' '}
            <span className="text-muted">NWAJU</span>
          </h1>
          <p className="hero-subtitle">
            Multidisciplinary Creative,
            <br />
            Design Engineer, Art Director
            <br />
            and Audiophile.
          </p>
        </div>

        <div className="hero-image-wrapper parallax-wrapper">
          <div className="hero-blur-overlay" />
          {siteSettings?.heroImage && (
            <img
              src={urlFor(siteSettings.heroImage).auto('format').quality(80).width(1920).url()}
              alt="ZE"
              className="parallax-img"
            />
          )}
        </div>
      </section>

      {/* ── Focus ─────────────────────────────────────────────────────── */}
      <section className="focus-section grid-12-col margin-top-huge">
        <div className="col-4">
          <h2 className="focus-heading">FOCUS</h2>
        </div>

        <div className="col-6">
          <p className="focus-body">
            Alongside that, I've worked across agencies and freelance roles,
            designing products for FinTech, EdTech, and marketplace startups —
            sometimes designing interfaces, sometimes shaping brands, sometimes
            building scrappy internal tools. I enjoy getting my hands dirty,
            asking uncomfortable questions early, and turning abstract ideas
            into systems people can actually use. I code just enough (React,
            TypeScript) to collaborate directly with engineers and close the
            gap between intention and implementation.
          </p>

          <div className="focus-skills">
            {FOCUS_ROWS.map(([left, right]) => (
              <div className="focus-row" key={left}>
                <span className="focus-skill">{left}</span>
                <span className="focus-star" aria-hidden="true">✦</span>
                <span className="focus-skill">{right}</span>
                <span className="line-reveal" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Selected Works ────────────────────────────────────────────── */}
      <section className="selected-works margin-top-huge">
        <header className="works-header">
          <h2>SELECTED WORKS</h2>
          <Link to="/work" className="font-sec-muted">SEE ALL</Link>
          <span className="line-reveal" aria-hidden="true" />
        </header>

        <div className="work-grid">
          {!loading &&
            featuredWorks.map((project) => (
              <Link
                to={`/work/${project.slug}`}
                key={project._id}
                className="work-item"
                onMouseEnter={() => handleMouseEnter(project)}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'block' }}
              >
                <div className="work-img-wrapper parallax-wrapper">
                  {project.thumbnailUrl && (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.brand}
                      className="parallax-img"
                    />
                  )}
                </div>
                <div className="work-meta">
                  <div className="work-meta-row">
                    <span className="work-meta-category">
                      {project.category || 'Case Study'}
                    </span>
                    <span className="work-meta-arrow" aria-hidden="true">↗</span>
                  </div>
                  <div className="work-meta-brand">{project.brand}</div>
                </div>
              </Link>
            ))}
        </div>
      </section>

    </main>
  );
};