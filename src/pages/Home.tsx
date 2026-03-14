import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../context/CursorContext';
import { client } from '../lib/sanity';
import { useImageParallax } from '../hooks/useImageParallax';
import heroImage from '../assets/hero-placeholder.jpg';

interface Project {
  _id: string;
  brand: string;
  slug: string;
  category?: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
}

/*
  FOCUS_ROWS — [left skill, right skill] pairs.
  ✦ (focus-star) sits between them in a 3-col sub-grid.
  CSS @keyframes starSpin rotates it 360° once on row hover.
  .line-reveal inside each row is the animated border-bottom — GSAP
  handles scaleX(0) → scaleX(1) left-to-right via useGlobalTextReveal.
*/
const FOCUS_ROWS: [string, string][] = [
  ['Art Direction',     'Product Thinking'],
  ['Creative Strategy', 'User Experience'],
  ['Usability Research','Interaction Design'],
  ['Design Systems',    'Visual Design'],
];

export const Home: React.FC = () => {
  const { setCursorType, setCursorMedia } = useCursor();
  const [featuredWorks, setFeaturedWorks] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useImageParallax([featuredWorks]);

  useEffect(() => {
    const fetchFeaturedWorks = async () => {
      try {
        const data = await client.fetch(`
          *[_type == "caseStudy" && isFeatured == true] | order(publishedAt desc)[0...2] {
            _id, brand,
            "slug": slug.current,
            category,
            "thumbnailUrl": thumbnail.asset->url,
            "previewVideoUrl": previewVideo.asset->url
          }
        `);
        setFeaturedWorks(data);
      } catch (err) {
        console.error('Error fetching featured works:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedWorks();
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
          <img src={heroImage} alt="ZE" className="parallax-img" />
        </div>
      </section>

      {/* ── Focus ─────────────────────────────────────────────────────── */}
      {/*
        12-col grid: heading = col 1-4 (sticky), content = col 7-12 (6 cols).
        CSS uses > :first-child and > :last-child selectors for the column positions.
        .focus-skills intentionally excluded from useGlobalTextReveal —
        .focus-skill spans animate as CSS units (hover), not SplitType lines.
      */}
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
                {/*
                  .line-reveal replaces CSS border-bottom.
                  GSAP in useGlobalTextReveal animates scaleX(0) → scaleX(1).
                  position: relative on .focus-row allows this to sit at bottom.
                */}
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
          {/*
            .line-reveal replaces the border-bottom on .works-header.
            It spans the full width of the header row.
          */}
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

                {/* Two-row meta: [category + arrow] / [brand] */}
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