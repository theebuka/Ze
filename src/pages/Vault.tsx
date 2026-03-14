import React from 'react';
import { RollingText } from '../components/common/RollingText';

/*
  VAULT PAGE

  .vault-link-item: block-level container — intentionally not collapsed
  into the <a> so a future hover image preview can be appended as a sibling
  of .vault-link without any structural refactoring:
    <div class="vault-link-item">
      <a class="vault-link">...</a>
      <div class="vault-link-preview" />   ← future addition
    </div>

  .line-reveal: animated border element, sits below the <a> inside
  .vault-link-item. GSAP + ScrollTrigger in useGlobalTextReveal handles
  scaleX(0) → scaleX(1) left-to-right on scroll.

  Arrow rotation: CSS .vault-link:hover .vault-link-arrow { transform: rotate(-45deg) }
  rotates ↗ counter-clockwise 45° to point →.

  RollingText: the rollover character animation. It manages its own
  onMouseEnter/Leave internally.
*/

const VAULT_CATEGORIES = [
  { id: 'articles',     label: 'Articles'     },
  { id: 'explorations', label: 'Explorations' },
  { id: 'resources',    label: 'Resources'    },
  { id: 'playlists',    label: 'Playlists'    },
  { id: 'gallery',      label: 'Gallery'      },
] as const;

export const Vault: React.FC = () => {
  return (
    <main className="page-wrapper page-vault">
      <div className="vault-top">

        {/* Left col: heading (sticky on desktop) */}
        <div>
          <h1 className="vault-heading">Vault</h1>
        </div>

        {/* Right col: intro + category links */}
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
              <div
                className="vault-link-item"
                key={cat.id}
                data-category={cat.id}
              >
                <a
                  href="#"
                  className="vault-link"
                  aria-label={cat.label}
                >
                  <span className="vault-link-arrow" aria-hidden="true">↗</span>
                  {/*
                    RollingText wraps the label. It handles mouse events itself.
                    The .vault-link:hover rule also brightens arrow + label via CSS.
                  */}
                  <RollingText text={cat.label} className="vault-link-label" />
                </a>
                {/*
                  .line-reveal replaces the CSS border-bottom.
                  GSAP animates it left-to-right on scroll reveal.
                  Future preview image: add <div className="vault-link-preview" /> here.
                */}
                <span className="line-reveal" aria-hidden="true" />
              </div>
            ))}
          </nav>
        </div>

      </div>
    </main>
  );
};