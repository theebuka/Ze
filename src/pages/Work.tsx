import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../context/CursorContext';
import { client } from '../lib/sanity';
import { useImageParallax } from '../hooks/useImageParallax';

interface Project {
  _id: string;
  brand: string;
  slug: string;
  category?: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
}

export const Work: React.FC = () => {
  const { setCursorType, setCursorMedia } = useCursor();
  const [works, setWorks] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useImageParallax([works]);

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const data = await client.fetch(`
          *[_type == "caseStudy"] | order(publishedAt desc) {
            _id,
            brand,
            "slug": slug.current,
            category,
            "thumbnailUrl": thumbnail.asset->url,
            "previewVideoUrl": previewVideo.asset->url
          }
        `);
        setWorks(data);
      } catch (error) {
        console.error('Error fetching works from Sanity:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorks();
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
    <main className="page-wrapper page-work">
      <header className="work-page-header">
        <h1 className="work-title">
          Take a look at a few projects that i've
          <br />
          hashed out in recent years
        </h1>
      </header>

      <div className="work-grid">
        {!loading &&
          works.map((project) => (
            <Link
              to={`/work/${project.slug}`}
              key={project._id}
              className="work-item"
              onMouseEnter={() => handleMouseEnter(project)}
              onMouseLeave={handleMouseLeave}
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

              {/* New two-row meta: [category + arrow] / [brand] */}
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
    </main>
  );
};