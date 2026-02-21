import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../context/CursorContext';
import { client } from '../lib/sanity';
import heroImage from '../assets/hero-placeholder.jpg';

interface Project {
  _id: string;
  brand: string;
  slug: string;
  category?: string;
  thumbnailUrl: string;
}

export const Home: React.FC = () => {
  const { setCursorType } = useCursor();
  const [featuredWorks, setFeaturedWorks] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const handleMouseEnter = () => setCursorType('view-project');
  const handleMouseLeave = () => setCursorType('default');

  useEffect(() => {
    const fetchFeaturedWorks = async () => {
      try {
        const data = await client.fetch(`
          *[_type == "caseStudy" && isFeatured == true] | order(publishedAt desc)[0...2] {
            _id,
            brand,
            "slug": slug.current,
            category,
            "thumbnailUrl": thumbnail.asset->url
          }
        `);
        setFeaturedWorks(data);
      } catch (error) {
        console.error("Error fetching featured works:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedWorks();
  }, []);

  return (
    <main className="page-wrapper page-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-row">
          <h1 className="hero-title">
            <span className="text-muted">CHUKWUEBUKA</span><br />
            <span className="text-muted">ARIN</span>ZE <span className="text-muted">NWAJU</span>
          </h1>
          <p className="hero-subtitle">
            Multidisciplinary Creative,<br />
            Design Engineer, Art Director<br />
            and Audiophile.
          </p>
        </div>
        
        <div className="hero-image-wrapper">
          <div className="hero-blur-overlay"></div>
          <img src={heroImage} alt="ZE" />
        </div>
      </section>

      {/* Selected Works (Preview Grid) */}
      <section className="selected-works margin-top-huge">
        <header className="works-header">
          <h2>SELECTED WORKS</h2>
          <Link to="/work" className="font-sec-muted">SEE ALL</Link>
        </header>
        
        <div className="work-grid">
          {!loading && featuredWorks.map((project) => (
            <Link 
              to={`/work/${project.slug}`} 
              key={project._id} 
              className="work-item"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ display: 'block' }}
            >
              <div className="work-img-wrapper ratio-16-9">
                {project.thumbnailUrl && (
                  <img 
                    src={project.thumbnailUrl} 
                    alt={project.brand} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  />
                )}
              </div>
              <div className="work-meta meta-spaced" style={{ marginTop: '16px' }}>
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