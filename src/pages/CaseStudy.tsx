import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { client } from '../lib/sanity';
import { BlockRenderer } from '../components/case-study/BlockRenderer';

interface ProjectData {
  brand: string;
  projectType: string;
  timeline: string;
  role: string;
  stack: string[];
  summary: string;
  contentBlocks: any[];
}

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const query = `*[_type == "caseStudy" && slug.current == $slug][0] {
          brand, projectType, timeline, role, stack, summary, contentBlocks
        }`;
        const data = await client.fetch(query, { slug });
        if (!data) return navigate('/work');
        
        setProject(data);
      } catch (error) {
        console.error("Sanity fetch error:", error);
      }
    };
    fetchProject();
  }, [slug, navigate]);

  // LOCAL GSAP TRIGGER: Runs only after data is injected into the DOM
  useEffect(() => {
    if (project && containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { opacity: 0, y: 40 }, 
        { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: 0.1 }
      );
    }
  }, [project]);

  // FIX: Renders a completely invisible div while fetching to prevent FOUC
  if (!project) return <div className="page-wrapper" style={{ opacity: 0 }}></div>;

  return (
    <div className="page-wrapper case-study-page" ref={containerRef} style={{ opacity: 0 }}>
      <header className="cs-hero section-padding">
        <h1 className="cs-title">
          <span>{project.brand}</span>
          <span className="font-sec-muted">{project.projectType}</span>
        </h1>

        <div className="cs-metadata grid-12-col">
          <div className="col-2">
            <span className="meta-label">TIMELINE</span>
            <span className="meta-value">{project.timeline}</span>
          </div>
          
          <div className="col-3">
            <span className="meta-label">ROLE</span>
            <span className="meta-value">{project.role}</span>
          </div>
          
          <div className="col-2">
            <span className="meta-label">STACK</span>
            <ul className="meta-stack-list">
              {project.stack?.map((item, index) => (
                <li key={index} className="meta-value">{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="col-5">
            <span className="meta-label">SUMMARY</span>
            <p className="meta-value">{project.summary}</p>
          </div>
        </div>
      </header>

      <BlockRenderer blocks={project.contentBlocks || []} />
    </div>
  );
};