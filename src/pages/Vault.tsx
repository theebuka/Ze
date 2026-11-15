import React from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAppReady } from '../context/AppReadyContext';

/**
 * Not linked from the menu or footer until it has content; the route still
 * resolves for anyone who has the URL. The categories are listed as plain
 * text, not links, because there is nothing behind them yet.
 */
const CATEGORIES = ['Articles', 'Explorations', 'Resources', 'Playlists', 'Gallery'];

export const Vault: React.FC = () => {
  const splashDone = useAppReady();
  const scope = useReveal<HTMLDivElement>({ deps: [], enabled: splashDone });

  return (
    <div className="page-wrapper page-vault page-doc" ref={scope}>
      <header className="d3-mast">
        <h1 className="d3-statement" data-reveal="text">
          Vault
        </h1>
        <div className="d3-row d3-mast-sub">
          <p className="d3-lede" data-reveal="text" data-reveal-delay="0.1">
            Experiments, explorations and in-progress ideas that don&rsquo;t make
            the main stage, plus a few extras: playlists and the resources I
            keep going back to.
          </p>
        </div>
      </header>

      <section className="d3-row d3-section">
        <h2 className="d3-label">Coming soon</h2>
        <ul className="d3-body d3-links d3-links--static">
          {CATEGORIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
