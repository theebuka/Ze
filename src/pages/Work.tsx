import React from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../context/CursorContext';

const mockProjects = [
  { id: 1, title: 'Sprocket', category: 'E-COMMERCE, PRODUCT DESIGN', slug: 'sprocket' },
  { id: 2, title: 'Monibac', category: 'FINTECH, WEB DESIGN', slug: 'monibac' },
  { id: 3, title: 'Kuda', category: 'FINTECH, MOBILE APP', slug: 'kuda' },
  { id: 4, title: 'Oze', category: 'SAAS, BRANDING', slug: 'oze' },
];

export const Work: React.FC = () => {
  const { setCursorType } = useCursor();
  const handleMouseEnter = () => setCursorType('view-project');
  const handleMouseLeave = () => setCursorType('default');

  return (
    <main className="page-wrapper page-work">
      <header className="work-page-header">
        <h1 className="work-title">
          Take a look at a few projects that i've<br />
          hashed out in recent years
        </h1>
      </header>

      <div className="work-grid">
        {mockProjects.map((project) => (
          <Link to={`/work/${project.slug}`} key={project.id} className="work-item" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="work-img-wrapper" style={{ aspectRatio: '16/9' }}></div>
            {/* 16px Padding Enforced */}
            <div className="work-meta" style={{ marginTop: '16px' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{project.title}</span>
              <span>{project.category}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
};