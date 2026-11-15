import React from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAppReady } from '../context/AppReadyContext';

const GROUPS = [
  {
    label: 'Email',
    links: [{ href: 'mailto:me@theebuka.com', label: 'me@theebuka.com' }],
  },
  {
    label: 'Socials',
    links: [
      { href: 'https://instagram.com/rin.ze', label: 'Instagram' },
      { href: 'https://x.com/ebxkaa', label: 'X' },
      { href: 'https://linkedin.com/in/chukwuebuka-nwaju', label: 'LinkedIn' },
    ],
  },
  {
    label: 'Elsewhere',
    links: [
      { href: 'https://theebuka.substack.com', label: 'Substack' },
      { href: 'https://medium.com/@ebxka', label: 'Medium' },
      { href: 'https://behance.net/theebuka', label: 'Behance' },
      { href: 'https://dribbble.com/ebukaa', label: 'Dribbble' },
      { href: 'https://are.na/chukwuebuka-nwaju', label: 'Are.na' },
    ],
  },
];

/** Same layout as every other page: a statement, then label/content rows. */
export const Contact: React.FC = () => {
  const splashDone = useAppReady();
  const scope = useReveal<HTMLDivElement>({ deps: [], enabled: splashDone });

  return (
    <div className="page-wrapper page-contact page-doc" ref={scope}>
      <header className="d3-mast">
        <h1 className="d3-statement" data-reveal="text">
          Let&rsquo;s <span className="text-muted">talk.</span>
        </h1>
        <div className="d3-row d3-mast-sub">
          <p className="d3-lede" data-reveal="text" data-reveal-delay="0.1">
            Have a project in mind, a role to fill, or a question? Email is the
            fastest way to reach me. I usually reply within a day or two.
          </p>
        </div>
      </header>

      {GROUPS.map((group, i) => (
        <section
          className={`d3-row d3-section${i === 0 ? '' : ' d3-section--tight'}`}
          key={group.label}
        >
          <h2 className="d3-label">{group.label}</h2>
          <ul className="d3-body d3-links">
            {group.links.map(({ href, label }) => {
              const external = !href.startsWith('mailto:');
              return (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
