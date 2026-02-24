import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { client } from '../lib/sanity';
import { BlockRenderer } from '../components/case-study/BlockRenderer';

gsap.registerPlugin(ScrollTrigger);

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

  // ── Data fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    setProject(null); // reset on slug change so container returns to opacity:0
    const fetchProject = async () => {
      try {
        const query = `*[_type == "caseStudy" && slug.current == $slug][0] {
          brand, projectType, timeline, role, stack, summary, contentBlocks
        }`;
        const data = await client.fetch(query, { slug });
        if (!data) return navigate('/work');
        setProject(data);
      } catch (error) {
        console.error('Sanity fetch error:', error);
      }
    };
    fetchProject();
  }, [slug, navigate]);

  // ── Self-contained reveal ──────────────────────────────────────────────
  // Fires after setProject(data) re-renders the real DOM.
  // By the time the user reaches this page, SplashLoader has already
  // awaited document.fonts.ready — no need to re-gate on it here.
  // A single rAF is enough to let React flush the render before we measure.
  useEffect(() => {
    if (!project || !containerRef.current) return;

    const container = containerRef.current;
    const splits: SplitType[] = [];
    let rafId: number;
    let ctx: gsap.Context;

    rafId = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        const textEls = container.querySelectorAll<HTMLElement>(
          'h1, h2, h3, .meta-label, .meta-value, .cs-section-title, .cs-block-title, .cs-text-body'
        );
        const imageEls = container.querySelectorAll<HTMLElement>(
          '.cs-img, .cs-media-wrapper'
        );

        // 1. Pre-hide children while container is still opacity:0
        gsap.set(textEls, { opacity: 0 });
        gsap.set(imageEls, { opacity: 0 });

        // 2. Reveal container — children are already invisible, so no flash
        gsap.set(container, { opacity: 1 });

        // 3. Text reveals
        textEls.forEach((el) => {
          if (el.classList.contains('split-processed')) return;
          el.classList.add('split-processed');

          const split = new SplitType(el, { types: 'lines' });
          splits.push(split);

          if (split.lines && split.lines.length > 0) {
            split.lines.forEach((line) => {
              const wrapper = document.createElement('div');
              wrapper.classList.add('reveal-mask');
              wrapper.style.overflow = 'hidden';
              wrapper.style.display = 'inline-block';
              wrapper.style.verticalAlign = 'top';
              wrapper.style.width = '100%';
              wrapper.style.paddingTop = '0.1em';
              wrapper.style.paddingBottom = '0.1em';
              wrapper.style.marginTop = '-0.1em';
              wrapper.style.marginBottom = '-0.1em';
              line.parentNode?.insertBefore(wrapper, line);
              wrapper.appendChild(line);
            });

            gsap.set(el, { opacity: 1 });

            const isAboveFold = el.getBoundingClientRect().top < window.innerHeight;

            gsap.fromTo(
              split.lines,
              { y: '100%', opacity: 0 },
              {
                y: '0%',
                opacity: 1,
                duration: 1.2,
                ease: 'power4.out',
                stagger: 0.1,
                delay: isAboveFold ? 0.2 : 0,
                scrollTrigger: {
                  trigger: el,
                  start: 'top 95%',
                  toggleActions: 'play none none none',
                },
              }
            );
          } else {
            gsap.set(el, { opacity: 1 });
          }
        });

        // 4. Image reveals
        imageEls.forEach((img) => {
          if (img.classList.contains('img-processed')) return;
          img.classList.add('img-processed');

          const isAboveFold = img.getBoundingClientRect().top < window.innerHeight;

          gsap.fromTo(
            img,
            { clipPath: 'inset(100% 0% 0% 0%)', y: 40, opacity: 0 },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              y: 0,
              opacity: 1,
              duration: 1.6,
              ease: 'power4.out',
              delay: isAboveFold ? 0.2 : 0,
              scrollTrigger: {
                trigger: img,
                start: 'top 90%',
                toggleActions: 'play none none none',
              },
            }
          );
        });

        ScrollTrigger.refresh();
      }, container);
    });

    return () => {
      cancelAnimationFrame(rafId);
      ctx?.revert();
      splits.forEach((s) => s.revert());
      container.querySelectorAll('.split-processed, .img-processed').forEach((el) => {
        el.classList.remove('split-processed', 'img-processed');
      });
    };
  }, [project]);

  if (!project) {
    return <div className="page-wrapper" style={{ opacity: 0 }} />;
  }

  return (
    <div
      className="page-wrapper case-study-page"
      ref={containerRef}
      style={{ opacity: 0 }}
    >
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