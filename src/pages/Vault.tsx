import React from 'react';

/*
  VAULT PAGE
  
  Each .vault-link-item is the future host for a hover image preview.
  When you're ready to add previews: append a <div className="vault-link-preview"> 
  inside .vault-link-item alongside the existing <a> — no structural refactoring needed.
  
  The ↗ arrow rotates -45deg on hover to point → (CSS only, no JS).
  Both arrow and label text brighten to full text-color on hover.
*/

const VAULT_CATEGORIES = [
  { id: 'articles',     label: 'Articles',     href: '#' },
  { id: 'explorations', label: 'Explorations', href: '#' },
  { id: 'resources',    label: 'Resources',    href: '#' },
  { id: 'playlists',    label: 'Playlists',    href: '#' },
  { id: 'gallery',      label: 'Gallery',      href: '#' },
] as const;

export const Vault: React.FC = () => {
  return (
    <main className="page-wrapper page-vault">
      <div className="vault-top">

        {/* Left: heading */}
        <div>
          <h1 className="vault-heading">Vault</h1>
        </div>

        {/* Right: intro + category links */}
        <div>
          <p className="vault-intro">
            A curated collection of experiments, explorations, and in-progress
            ideas. The Vault is where I test concepts, refine craft, and document
            iterations that don't always make the main stage — but shape the work
            behind it. It's also home to a few cool extras, from playlists to
            recommended resources that inspire and inform my process.
          </p>

          <nav className="vault-links" aria-label="Vault categories">
            {VAULT_CATEGORIES.map((cat) => (
              /*
                .vault-link-item is intentionally a block-level container —
                not collapsed into the <a> — so a future hover preview image
                can be appended as a sibling of .vault-link without disruption.
                Add: data-category={cat.id} for JS targeting if needed.
              */
              <div
                className="vault-link-item"
                key={cat.id}
                data-category={cat.id}
              >
                <a
                  href={cat.href}
                  className="vault-link"
                  aria-label={cat.label}
                >
                  <span className="vault-link-arrow" aria-hidden="true">↗</span>
                  <span className="vault-link-label">{cat.label}</span>
                </a>
                {/* Future: <div className="vault-link-preview" /> */}
              </div>
            ))}
          </nav>
        </div>

      </div>
    </main>
  );
};