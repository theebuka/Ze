import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main className="page-wrapper page-case-study">
      {/* Header Section */}
      <header className="cs-header">
        <h1 className="cs-title">Monibac</h1>
        <h2 className="cs-subtitle">Marketing website</h2>
        
        <div className="cs-meta-grid">
          <div>
            <span className="meta-label">CLIENT</span>
            <span className="meta-value">Monibac</span>
          </div>
          <div>
            <span className="meta-label">ROLE</span>
            <span className="meta-value">Product Designer</span>
          </div>
          <div>
            <span className="meta-label">YEAR</span>
            <span className="meta-value">2023</span>
          </div>
          <div>
            <span className="meta-label">SERVICES</span>
            <span className="meta-value">Web Design, Art Direction, UI/UX, Interaction Design, Webflow Development.</span>
          </div>
        </div>
      </header>

      {/* Content Section (Staggered Grid) */}
      <article className="cs-content">
        
        {/* Block 1: Full Width Image */}
        <div className="cs-row grid-12">
          <div className="col-full">
            <div className="cs-img hero"></div>
          </div>
        </div>

        {/* Block 2: Right-aligned Text (5 cols) */}
        <div className="cs-row grid-12">
          <div className="text-span-right">
            <p className="cs-text">
              Monibac is a digital financial solution dedicated to making banking seamless and accessible. 
              The objective was to redesign their marketing website to reflect a modern, trustworthy, and 
              highly engaging presence. The new design had to balance dense data with approachability, 
              guiding users naturally through complex financial products while maintaining an aesthetic 
              that felt distinctly premium and secure.
            </p>
          </div>
        </div>

        {/* Block 3: 50/50 Images */}
        <div className="cs-row grid-12">
          <div className="col-half-left">
            <div className="cs-img standard"></div>
          </div>
          <div className="col-half-right">
            <div className="cs-img standard"></div>
          </div>
        </div>

        {/* Block 4: Left-aligned Text (5 cols) */}
        <div className="cs-row grid-12">
          <div className="text-span-left">
            <p className="cs-text">
              We focused heavily on typography and whitespace to create a structural hierarchy. 
              By utilizing a stark contrasting palette, we were able to draw immediate attention 
              to primary calls-to-action and core value propositions. Interactive elements were 
              kept subtle but deliberate, ensuring they guided the user without overwhelming 
              the reading experience.
            </p>
          </div>
        </div>

        {/* Block 5: 50/50 Images */}
        <div className="cs-row grid-12">
          <div className="col-half-left">
            <div className="cs-img standard"></div>
          </div>
          <div className="col-half-right">
            <div className="cs-img standard"></div>
          </div>
        </div>

        {/* Block 6: 50/50 Text Blocks (5 cols each) */}
        <div className="cs-row grid-12">
          <div className="text-span-left">
            <p className="cs-text">
              The development phase required a tight integration of Framer Motion for scroll-triggered 
              animations, ensuring that the visual storytelling remained fluid. The architecture was 
              built on a headless CMS, allowing the marketing team to rapidly deploy new landing pages 
              and update product details without requiring engineering resources.
            </p>
          </div>
          <div className="text-span-right">
            <p className="cs-text">
              Ultimately, the redesigned Monibac platform achieved a 40% increase in user retention 
              during the onboarding flow. The minimalist approach, combined with highly readable 
              typography and strategic interaction design, successfully positioned the brand as a 
              forward-thinking leader in the digital finance space.
            </p>
          </div>
        </div>
      </article>

      {/* Next Work Footer */}
      <div className="cs-footer">
        <Link to="/work/next-project" className="next-work-link">
          NEXT<br />WORK ↗
        </Link>
      </div>
    </main>
  );
};