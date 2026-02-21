import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../context/CursorContext';
import { client } from '../lib/sanity';

interface Project {
  _id: string;
  brand: string;
  slug: string;
  category?: string; // Optional, in case you add it to your Sanity schema later
  thumbnailUrl: string;
}

export const Work: React.FC = () => {
  const { setCursorType } = useCursor();
  const [works, setWorks] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const handleMouseEnter = () => setCursorType('view-project');
  const handleMouseLeave = () => setCursorType('default');

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        // Fetch all case studies from Sanity, ordered by the date you set
        const data = await client.fetch(`
          *[_type == "caseStudy"] | order(publishedAt desc) {
            _id,
            brand,
            "slug": slug.current,
            category,
            "thumbnailUrl": thumbnail.asset->url
          }
        `);
        setWorks(data);
      } catch (error) {
        console.error("Error fetching works from Sanity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, []);

  return (
    <main className="page-wrapper page-work">
      <header className="work-page-header">
        <h1 className="work-title">
          Take a look at a few projects that i've<br />
          hashed out in recent years
        </h1>
      </header>

      <div className="work-grid">
        {!loading && works.map((project) => (
          <Link 
            to={`/work/${project.slug}`} 
            key={project._id} 
            className="work-item" 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
          >
            <div className="work-img-wrapper" style={{ aspectRatio: '16/9' }}>
              {project.thumbnailUrl && (
                <img 
                  src={project.thumbnailUrl} 
                  alt={project.brand} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                />
              )}
            </div>
            {/* 16px Padding Enforced */}
            <div className="work-meta" style={{ marginTop: '16px' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{project.brand}</span>
              <span>{project.category || 'CASE STUDY'}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
};