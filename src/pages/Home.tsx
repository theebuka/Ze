import React from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../context/CursorContext';
import heroImage from '../assets/hero-placeholder.jpg';

export const Home: React.FC = () => {
  const { setCursorType } = useCursor();

  const handleMouseEnter = () => setCursorType('view-project');
  const handleMouseLeave = () => setCursorType('default');

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
          <div 
            className="work-item"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="work-img-wrapper ratio-16-9"></div>
            <div className="work-meta meta-spaced">
              <span className="font-bold-white">Sprocket</span>
              <span>E-COMMERCE, PRODUCT DESIGN</span>
            </div>
          </div>
          
          <div 
            className="work-item"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="work-img-wrapper ratio-16-9"></div>
            <div className="work-meta meta-spaced">
              <span className="font-bold-white">Monibac</span>
              <span>FINTECH, WEB DESIGN</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};