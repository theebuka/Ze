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
  /** Optional: short looping MP4 or GIF URL for the media cursor */
  previewVideoUrl?: string;
}

export const Home: React.FC = () => {
  const { setCursorType, setCursorMedia } = useCursor();
  const [featuredWorks, setFeaturedWorks] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Image parallax ───────────────────────────────────────────────────
  // Re-fires after `featuredWorks` arrives so ScrollTrigger has real elements
  useImageParallax([featuredWorks]);

  useEffect(() => {
    const fetchFeaturedWorks = async () => {
      try {
        const data = await client.fetch(`
          *[_type == "caseStudy" && isFeatured == true] | order(publishedAt desc)[0...2] {
            _id,
            brand,
            "slug": slug.current,
            category,
            "thumbnailUrl": thumbnail.asset->url,
            "previewVideoUrl": previewVideo.asset->url
          }
        `);
        setFeaturedWorks(data);
      } catch (error) {
        console.error('Error fetching featured works:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedWorks();
  }, []);

  // ── Cursor handlers ──────────────────────────────────────────────────
  const handleMouseEnter = (project: Project) => {
    if (project.previewVideoUrl) {
      // Has a preview video → show it inside the cursor
      setCursorType('media');
      setCursorMedia(project.previewVideoUrl);
    } else {
      // No video → fall back to the standard expanded label cursor
      setCursorType('view-project');
    }
  };

  const handleMouseLeave = () => {
    setCursorType('default');
    setCursorMedia(null);
  };

  return (
    <main className="page-wrapper page-home">
      {/* ── Hero Section ──────────────────────────────────────────── */}
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

        {/*
          Hero image also gets parallax treatment.
          The wrapper already has overflow:hidden implied by existing CSS.
          We just add the hook classes so useImageParallax picks it up.
        */}
        <div className="hero-image-wrapper parallax-wrapper">
          <div className="hero-blur-overlay" />
          <img
            src={heroImage}
            alt="ZE"
            className="parallax-img"
          />
        </div>
      </section>

      {/* ── Selected Works ────────────────────────────────────────── */}
      <section className="selected-works margin-top-huge">
        <header className="works-header">
          <h2>SELECTED WORKS</h2>
          <Link to="/work" className="font-sec-muted">
            SEE ALL
          </Link>
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
                {/*
                  parallax-wrapper → clipping container (overflow:hidden)
                  parallax-img    → the image GSAP will scrub
                */}
                <div className="work-img-wrapper ratio-16-9 parallax-wrapper">
                  {project.thumbnailUrl && (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.brand}
                      className="parallax-img"
                    />
                  )}
                </div>

                <div
                  className="work-meta meta-spaced"
                  style={{ marginTop: '16px' }}
                >
                  <span className="font-bold-white">{project.brand}</span>
                  <span>{project.category || 'CASE STUDY'}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
};