import React, { useEffect, useState } from 'react';
import { client, urlFor } from '../lib/sanity';

interface SiteSettings {
  aboutImage1: any;
  aboutImage2: any;
}

export const About: React.FC = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    client.fetch(`*[_type == "siteSettings"][0]{ aboutImage1, aboutImage2 }`)
      .then(setSiteSettings)
      .catch(console.error);
  }, []);

  return (
    <main className="page-wrapper page-about">
      {/* Hero Intro */}
      <header className="about-hero">
        <h1 className="about-intro-text">
          I'm Chukwuebuka, <span className="text-muted">professionally known as</span> ZE, a product designer with a frontend streak. Is it curiosity or restlessness? I'm not sure. But I've learned to embrace the fact that I like building <span className="text-muted">across layers — design, code, research, strategy — making each part feel intentional, and human.</span>
        </h1>
      </header>

      {/* Editorial Grid Section */}
      <section className="about-grid grid-12">

        {/* Row 1: Image Right */}
        <div className="col-half-right">
          {siteSettings?.aboutImage1 && (
            <img
              src={urlFor(siteSettings.aboutImage1).auto('format').quality(80).width(1200).url()}
              alt="ZE thinking"
            />
          )}
        </div>

        {/* Row 2: Text Left, Text Right */}
        <div className="text-span-left">
          <p>
            I fell into creative tech through the usual route. I started in medical radiography, working around complex systems of care structure, out of pure passion, and the desire to build for the unknown. Somewhere in between managing care, understanding human patterns, and helping others make sense of what I learned, I realized I was deeply invested in systems. I fell in love with shaping how people experience them. From there, I joined tech startups, where I've spent the last few years designing products from the ground up—often as the first or sole designer, working closely with engineers and product teams. In that space, I led the design of core platform experiences from full design system and UI overhauls, navigation, onboarding, identity authentication, and cross-platform adaptations across mobile, tablet, and wearables. I like to stay close to the process, bridging the gap between design and engineering to ensure integrity and consistency across the delivery cycle.
          </p>
        </div>
        <div className="text-span-right">
          <p>
            A large chunk of my work is across product and freelance roles, designing products for FinTech, B2B enterprise solutions, and SaaS — I am always deeply inquisitive, sometimes deeply practical, sometimes making scrappy micro-moves to keep getting it right, bringing order to chaos, asking the right questions, and turning abstract ideas into system experiences. I heavily lean into product thought process, typography to orchestrate harmony in alignment and space, the gap between the intent and presentation.
          </p>
        </div>

        {/* Row 3: Image Left */}
        <div className="col-half-left">
          {siteSettings?.aboutImage2 && (
            <img
              src={urlFor(siteSettings.aboutImage2).auto('format').quality(80).width(1200).url()}
              alt="ZE smiling"
            />
          )}
        </div>

        {/* Row 4: Text Left, Text Right */}
        <div className="text-span-left">
          <p>
            Outside of design, I'm probably fueled by three things: music, pop culture, and collecting pieces of repetitive bass which usually find their way onto my personal mood boards which I share. I've curated a solid, diverse, and somewhat surprising mix of strictly underground, lo-fi, and alternative rap/hip-hop artists. I'm deep into physical artifacts—books, magazines, accessories, and sneakers—where the tactile nature of material, form, and texture heavily, implicitly, explains my sensitivity to detail and systems. These days, I'm constantly learning, building, breaking, unbuilding elements—expanding where design, technology, and art/human interact across contexts, outside screens, into actual views, and how visual noise translates seamlessly, gently along the xy-board.
          </p>
        </div>
        <div className="text-span-right">
          <p>
            As you can already probably tell from this site, the center of my interests, my design philosophy leans toward brutalist minimalism and visual storytelling—a structural yet raw aesthetic, heavy entirely on the core, contrast, hierarchy, and commanding attention with intent. Living in a world of visual noise, one of the loudest or smoothest devices in the world, less cluttered, has inherent beauty in restraint, asymmetry and scale, the intersection where form, utility and strong character. This carries across up in my work. Less but sustained, functional yet expressive, unapologetic cut-through noise while retaining a human delay.
          </p>
        </div>
      </section>

      {/* Focus Section */}
      <section className="about-focus">
        <h2 className="focus-heading">FOCUS</h2>
        <div className="focus-list">
          <span>Art & Creative Direction</span>
          <span>Product thinking</span>
          <span>Strategy</span>
          <span>User Experience</span>
          <span>Usability Research</span>
          <span>Interaction Design</span>
          <span>Design Systems</span>
          <span>Visual Design</span>
          <span>Growth Design</span>
        </div>
      </section>
    </main>
  );
};