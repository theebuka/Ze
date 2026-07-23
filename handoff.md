# handoff.md — theebuka.com refactor

**Target:** Claude Code, executing against the local repo in one pass.
**Branch:** `perf/animation-overhaul`
**Repo root:** the directory containing `package.json` with `"name": "ze-portfolio"`.

---

## 0. Read this before executing

This document is a complete, self-contained implementation spec. Every file
under [§5](#5-file-contents) is given in full — overwrite the target path
verbatim rather than diffing.

Three things are **not** in this document and must be handled manually
(see [§6](#6-manual-edits)):

1. The `@font-face` block in `src/styles/index.css` — I do not have the full
   file, only fragments, so a blind overwrite would destroy your type scale.
2. `data-reveal` attributes on `About.tsx`, `Contact.tsx`, `Vault.tsx`,
   `Header.tsx`, `Footer.tsx`, `MenuOverlay.tsx` — I do not have those sources.
3. Font conversion from `.otf` to `.woff2` — a binary operation.

**Two claims in here are unverified.** Both are flagged inline as
`> UNVERIFIED`. Check them before acting; do not let an agent silently
"fix" them.

---

## 1. What was wrong

### 1.1 Blank case studies (`/work/monibac`)

`BlockRenderer.tsx` called a React component as a plain function:

```ts
{(ReactPlayer as any)({ url: data.videoUrl, playing: true, ... })}
```

This bypasses React entirely — no hooks, no reconciliation, no error boundary
path. Under `react-player@3`'s export shape the imported value is not
callable, producing:

```
Uncaught TypeError: ReactPlayer is not a function
    at MediaItem (BlockRenderer.tsx:208:11)
```

With no error boundary in the tree, React 19 unmounts the entire root. Result:
white screen. Case studies containing a `mediaType: 'video'` block die;
image-only ones survive — which is why only *some* were affected.

### 1.2 Animations firing wrongly when deployed

Three independent systems raced on the same DOM, each on its own arbitrary
timer:

| System | Timing gate |
|---|---|
| `useGlobalTextReveal` | `fonts.ready` raced with 2000ms, then `setTimeout(200)` |
| `useImageParallax` | `setTimeout(150)` |
| `CaseStudy.tsx` | a single `requestAnimationFrame` |

Four failures follow:

1. **`isAboveFold` measured once at setup.** Locally, layout is settled by
   then. Deployed, images have not arrived (`.cs-img` is `height: auto`, so an
   unloaded image occupies 0px) and the font has not swapped. Every element is
   measured at the wrong Y, gets the wrong `delay`, and every
   `start: 'top 95%'` is computed against a layout that no longer exists a
   second later.
2. **`toggleActions: 'play none none none'` + `fromTo`.** A trigger that never
   fires — because the element drifted past its start point during load —
   leaves that element at `opacity: 0` permanently. That is the missing text.
3. **Route detection raced the fetch.** `useGlobalTextReveal` decided
   `isCaseStudy` via `document.querySelector('.case-study-page')`. But while
   loading, `CaseStudy` rendered `<div className="page-wrapper" style={{opacity:0}} />`
   with **no** `case-study-page` class. So it took the wrong branch, queried
   `main h1, main p…`, found nothing, and logged
   `GSAP target [object NodeList] not found` — twice, matching the console
   output. It never re-ran, because its deps were `[pathname, isLoaded]`.
4. **`useImageParallax` was unscoped.** It queried `.parallax-wrapper` across
   the whole document and was called from `Home`, `Work` **and**
   `BlockRenderer`. On a case study that meant two or three mounted instances
   attaching competing scrubs to identical images.

### 1.3 Fast locally, slow on the CDN

| Cause | Detail |
|---|---|
| `useCdn: false` | Every GROQ query bypassed Sanity's edge cache for the origin — ~300–600ms each from Lagos, and `Home` fires two before it can render |
| No image transforms | `urlFor(img).url()` and `thumbnail.asset->url` both serve the original upload. A 12-block case study of 4MB source PNGs is ~48MB |
| `react-player@3` | Pulls `@mux/mux-player-react`, `hls.js`, `media-chrome` + ten `*-video-element` packages — ~300–500KB gzipped, on every route |
| `framer-motion` | ~100KB for two components, on top of a GSAP bundle that already does both |
| No code splitting | One chunk: GSAP + ScrollTrigger + framer-motion + Lenis + SplitType + Sanity client + react-player |
| No preconnect | Full DNS + TLS handshake before the first image or query |
| Splash loader | ~7s of enforced waiting on a fixed schedule. Locally that hid the load; deployed, real load time stacks on top of it |

### 1.4 Mobile

| Cause | Detail |
|---|---|
| `CustomCursor` mounts on touch | `* { cursor: none !important }` hid a cursor that does not exist while the component ran two framer-motion springs per frame, mounted a `<video>`, and listened to `mousemove` |
| `backdrop-filter: blur(12px)` | Over 50% of the hero. Forces a compositing layer that re-rasterises every frame while parallax runs underneath |
| `will-change: transform` sprayed | On `.parallax-img`, `.magnetic`, `.rolling-text span`, every `.line-reveal`. Dozens of promoted layers; mobile Safari evicts under pressure and stutters |
| Scrub + Lenis + address bar | Scrubbed transforms on a phone whose viewport resizes constantly |
| `100vh` | Measured against the collapsed-address-bar viewport; page jumps on load |
| `width: 100vw` on `html.lenis` | Includes the scrollbar gutter → horizontal overflow, masked by `overflow-x: hidden` on body, which in turn breaks `position: sticky` sitewide |
| No `prefers-reduced-motion` | Nowhere in the codebase |

### 1.5 The font is probably not loading at all

```css
src: url('../assets/fonts/Nacelle-Regular.otf') format('otf');
```

`otf` is not a valid format token — the correct value is `opentype`. Browsers
discard a `src` with an unrecognised format hint. **Nacelle likely never
loads and the entire site renders in the fallback sans.**

This compounds §1.2: `document.fonts.ready` resolves immediately when nothing
is pending, so `SplitType` measured line breaks against fallback metrics.
Fixing the font naively makes it *worse* — the real font swaps in after
splitting and reflows lines out of their overflow masks. That is why the font
fix and the `SplitText` migration must ship together.

---

## 2. Architecture after the change

### 2.1 Animation: one system, declarative targets

Three racing systems → **one** `useReveal` hook built on `useGSAP`, scoped to
a ref, with `gsap.matchMedia()` for breakpoints and reduced motion.

Targets are **opt-in per element** via data attributes, replacing
document-wide tag selectors:

```
data-reveal="text"      line-by-line masked reveal via SplitText
data-reveal="image"     clip-path (desktop) / opacity+y (mobile)
data-reveal="line"      scaleX hairline divider
data-reveal-delay="0.2" optional choreography offset
data-parallax           parallax container (desktop only)
data-parallax-img       the element inside it that moves
```

Text uses GSAP's `SplitText` — free since GSAP 3.13, and you are on 3.14 — with
`autoSplit: true`, `mask: 'lines'`, and the tween created inside `onSplit`.
That combination re-splits and re-binds the animation whenever the font loads
or the container resizes, which is the exact bug class from §1.2. It also
replaces ~15 lines of hand-rolled mask-wrapper DOM per element.

No timers anywhere. No `isAboveFold` measurement. `once: true` +
`invalidateOnRefresh: true` instead of `toggleActions`.

### 2.2 Layout stability as a second, independent fix

`SanityImage` emits `width`/`height` attributes parsed from the Sanity asset
`_ref`, which encodes dimensions (`image-abc123-2400x1600-jpg`). No GROQ
change needed. Zero layout shift means ScrollTrigger is never measuring a
layout that is about to move — so §1.2's root cause is addressed twice over.

### 2.3 Pre-JS hiding is now fail-safe

The old CSS put `opacity: 0` / `transform: scaleX(0)` directly in the
stylesheet — content invisible forever if JS failed. Now gated on `html.js`,
set by a one-line inline script in `index.html`. No JS → no class → all
content visible.

### 2.4 Scroll ownership

Lenis owns scroll position. `window.scrollTo(0,0)` was being overwritten on
the next rAF tick — likely why route changes sometimes landed mid-page, and on
a short case study, landing past the end of content looks exactly like a blank
screen. `document.body.style.overflow = 'hidden'` does not lock scroll on iOS
Safari. Both replaced with `scrollToTop()` / `setScrollLocked()` helpers that
delegate to Lenis.

### 2.5 Dependencies removed

| Package | ~gzipped | Replaced by |
|---|---|---|
| `react-player` | 300–500KB | native `<video>` + background iframe |
| `framer-motion` | ~100KB | GSAP (already loaded) |
| `split-type` | ~5KB | GSAP `SplitText` |
| `@portabletext/react` | ~15KB | nothing — unused, lockfile only |

### 2.6 New file map

```
src/
├── lib/
│   ├── gsap.ts                          NEW  single plugin registration
│   └── sanity.ts                        MOD  useCdn + image helpers
├── hooks/
│   ├── useReveal.ts                     NEW  the one reveal system
│   ├── useParallax.ts                   NEW  scoped, desktop-only
│   ├── useProjects.ts                   NEW  shared fetch
│   ├── useSmoothScroll.ts               MOD  + scroll lock/top helpers
│   ├── useGlobalTextReveal.ts           DELETE
│   └── useImageParallax.ts              DELETE
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.tsx            NEW
│   │   ├── SanityImage.tsx              NEW
│   │   └── CustomCursor.tsx             MOD  GSAP, touch-inert
│   ├── case-study/
│   │   ├── MediaItem.tsx                NEW  extracted, no react-player
│   │   └── BlockRenderer.tsx            MOD
│   ├── work/
│   │   └── WorkGrid.tsx                 NEW  shared grid
│   └── layout/
│       └── SplashLoader.tsx             MOD  real signals, no framer-motion
├── pages/
│   ├── Home.tsx                         MOD
│   ├── Work.tsx                         MOD
│   └── CaseStudy.tsx                    MOD  status machine
├── styles/
│   └── animation.css                    NEW  import LAST
├── App.tsx                              MOD  lazy routes + boundary
└── main.tsx                             MOD  drop the CSS import

index.html                               MOD
vite.config.ts                           MOD
vercel.json                              MOD
```

---

## 3. Dependency commands

Run these first — later steps will not typecheck otherwise.

```bash
git checkout -b perf/animation-overhaul

npm remove react-player framer-motion split-type @portabletext/react
npm i @gsap/react
```

> `@gsap/react` is already listed in `package.json` but I saw no usage
> anywhere in the source, so it may never have been installed. Confirm:
>
> ```bash
> ls node_modules/@gsap/react/package.json && echo PRESENT || echo MISSING
> ```

Confirm SplitText is available in your GSAP build (it ships free from 3.13;
`package.json` pins `^3.14.2`):

```bash
ls node_modules/gsap/SplitText.js && echo PRESENT || echo MISSING
```

If missing, your `gsap` install predates 3.13 despite the range — run
`npm i gsap@latest`.

---

## 4. Files to delete

```bash
rm src/hooks/useGlobalTextReveal.ts
rm src/hooks/useImageParallax.ts
```

Then confirm nothing still imports them:

```bash
grep -rn "useGlobalTextReveal\|useImageParallax\|split-type\|react-player\|framer-motion" src/
```

Expected output: nothing. Anything that appears is a file I did not have —
most likely `About.tsx`, `Contact.tsx`, `Vault.tsx` or `MenuOverlay.tsx` — and
needs the §6.2 migration.

---

## 5. File contents


### `index.html`

Entry document. The inline `classList.add('js')` script is load-bearing — the reveal system hides elements only under that class, so removing it makes content permanently invisible if the bundle fails.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <!-- Sets html.js synchronously, before first paint. The reveal system
         hides [data-reveal] elements ONLY under this class, so if JS is
         disabled or the bundle fails to load, all content stays visible
         instead of sitting at opacity 0 forever. -->
    <script>document.documentElement.classList.add('js');</script>

    <!-- Saves a full DNS + TLS handshake before the first image or query.
         From Lagos that is worth 200-400ms on the critical path. -->
    <link rel="preconnect" href="https://cdn.sanity.io" crossorigin />
    <link rel="preconnect" href="https://apicdn.sanity.io" crossorigin />
    <link rel="dns-prefetch" href="https://cdn.sanity.io" />

    <!-- Update the filename to match your converted woff2. Preloading the one
         face used above the fold prevents the reveal system from measuring
         line breaks against a fallback font. -->
    <link
      rel="preload"
      as="font"
      type="font/woff2"
      href="/fonts/Nacelle-Regular.woff2"
      crossorigin
    />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <title>Chukwuebuka Arinze Nwaju — Multidisciplinary Creative & Design Engineer</title>
    <meta
      name="description"
      content="Portfolio of Chukwuebuka Arinze Nwaju — product design, art direction and design engineering for FinTech, EdTech and marketplace startups."
    />
    <meta name="theme-color" content="#0a0a0a" />
    <link rel="canonical" href="https://theebuka.com/" />

    <!-- Shared links currently render as a bare URL on LinkedIn, X and
         iMessage. These fix that. og-image.jpg should be 1200x630. -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://theebuka.com/" />
    <meta property="og:title" content="Chukwuebuka Arinze Nwaju — Multidisciplinary Creative" />
    <meta
      property="og:description"
      content="Product design, art direction and design engineering. Selected work and case studies."
    />
    <meta property="og:image" content="https://theebuka.com/og-image.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### `vite.config.ts`

Vendor chunking so a content change does not invalidate the GSAP chunk in every visitor's cache.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Default is 4096 (4KB). Anything under this gets base64-inlined into the
    // CSS/JS bundle, which blocks render. Only inline genuinely tiny assets.
    assetsInlineLimit: 1024,

    // Vite defaults to esbuild for minify, which is fine, but bumping the
    // target avoids shipping transpiled async/generator helpers to browsers
    // that have supported them natively for years.
    target: 'es2020',

    cssCodeSplit: true,
    sourcemap: false,

    rollupOptions: {
      output: {
        // Split vendor code so a content-only change does not invalidate the
        // GSAP chunk in every visitor's cache.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          gsap: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', '@gsap/react'],
          scroll: ['lenis'],
          sanity: ['@sanity/client', '@sanity/image-url'],
        },
      },
    },

    // Fail loudly if a chunk balloons again.
    chunkSizeWarningLimit: 300,
  },
});
```

---

### `src/lib/gsap.ts`

The only place plugins are registered. Everything imports GSAP from here, never from `gsap` directly.

```ts
/**
 * Single GSAP registration point.
 *
 * Every module imports gsap/ScrollTrigger/SplitText from HERE, never from
 * 'gsap' directly. Registering a plugin more than once is harmless but
 * scattering registration across five files means you can never be sure
 * which plugins are live at any given moment.
 *
 * SplitText is bundled free with GSAP 3.13+. `split-type` is no longer used.
 */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Mobile browsers fire a resize event every time the address bar collapses or
// expands. Without this, ScrollTrigger recalculates every start/end position
// mid-scroll, which is the single largest cause of mobile scroll jank.
ScrollTrigger.config({ ignoreMobileResize: true });

// Never skip frames. Lenis drives off this ticker (see useSmoothScroll).
gsap.ticker.lagSmoothing(0);

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** True when the device has no fine pointer (phones, tablets). */
export const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches;

/** True when the OS asks for reduced motion. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

---

### `src/lib/sanity.ts`

`useCdn: true` plus srcset/dimension helpers. Dimensions are parsed from the asset `_ref`, so no GROQ query changes are needed anywhere.

```ts
import { createClient } from '@sanity/client';
import createImageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: 'rf2m4ovv',
  dataset: 'production',
  // WAS false. That routes every GROQ query to the Sanity origin instead of
  // the edge cache — roughly 300-600ms per query from Lagos, and Home fires
  // two of them before it can render anything. Nothing here reads drafts or
  // uses a token, so the CDN is safe.
  useCdn: true,
  apiVersion: '2024-02-21',
  perspective: 'published',
});

const builder = createImageUrlBuilder(client);

export const urlFor = (source: unknown) => builder.image(source as never);

// ── Intrinsic dimensions ──────────────────────────────────────────────────
// A Sanity asset _ref encodes its dimensions:
//   image-abc123def456-2400x1600-jpg
// Parsing it means we get width/height without expanding asset-> in every
// GROQ query. Explicit width/height on an <img> is what stops layout shift,
// which is what stops ScrollTrigger measuring against a layout that is about
// to change.

const REF_RE = /-(\d+)x(\d+)-[a-z]+$/i;

interface SanityRef {
  asset?: { _ref?: string; url?: string };
  _ref?: string;
}

export function imageDimensions(source: unknown): { width: number; height: number } | null {
  const s = source as SanityRef | undefined;
  const ref = s?.asset?._ref ?? s?._ref;
  if (typeof ref !== 'string') return null;
  const m = ref.match(REF_RE);
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]) };
}

/** Also works on a bare CDN url (`thumbnail.asset->url` style GROQ). */
export function urlDimensions(url: string): { width: number; height: number } | null {
  const m = url.match(/-(\d+)x(\d+)\.[a-z]+/i);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

// ── Responsive sources ────────────────────────────────────────────────────

const WIDTHS = [480, 768, 1024, 1440, 1920, 2560];

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  width?: number;
  height?: number;
}

/**
 * Build a modern, correctly-sized srcSet from a Sanity image object.
 *
 * The old code called `urlFor(data.image).url()` with no transform at all,
 * which serves the designer's original upload. A 12-block case study of 4MB
 * source PNGs is ~48MB over mobile data. This caps at 2560px, converts to
 * AVIF/WebP where supported (`auto('format')`), and lets the browser pick.
 */
export function responsiveImage(source: unknown, maxWidth = 2560): ResponsiveImage {
  const dims = imageDimensions(source);
  const widths = WIDTHS.filter((w) => w <= maxWidth && (!dims || w <= dims.width));
  if (widths.length === 0) widths.push(dims?.width ?? maxWidth);

  const url = (w: number) => urlFor(source).width(w).auto('format').quality(78).url();

  return {
    src: url(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    width: dims?.width,
    height: dims?.height,
  };
}

/** Same, for a raw CDN url returned by GROQ as a string. */
export function responsiveUrl(url: string, maxWidth = 2560): ResponsiveImage {
  const dims = urlDimensions(url);
  const widths = WIDTHS.filter((w) => w <= maxWidth && (!dims || w <= dims.width));
  if (widths.length === 0) widths.push(dims?.width ?? maxWidth);

  const at = (w: number) => `${url}?w=${w}&auto=format&q=78&fit=max`;

  return {
    src: at(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${at(w)} ${w}w`).join(', '),
    width: dims?.width,
    height: dims?.height,
  };
}
```

---

### `src/hooks/useReveal.ts`

Replaces `useGlobalTextReveal` and the inline reveal effect in `CaseStudy`. Also exports `useScrollTriggerRefresh`, mounted once at app root.

```ts
import { useRef } from 'react';
import type { RefObject } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap';

/**
 * useReveal — the ONE reveal system.
 *
 * Replaces useGlobalTextReveal + CaseStudy's inline reveal effect. The three
 * problems with the old approach were:
 *
 *   1. Targets were selected by tag name across the whole document
 *      (`main h1, main h2, main p`). Any page could steal another page's
 *      elements, and route detection depended on DOM state at effect time.
 *   2. Setup was gated on arbitrary timers (setTimeout 150 / 200, one rAF).
 *      Those timers are tuned to localhost. On a CDN, images and fonts land
 *      later, layout is still moving, and every measurement is wrong.
 *   3. `isAboveFold` was measured once at setup, so a late-loading image
 *      shifted everything below it past its own trigger point — and with
 *      `toggleActions: 'play none none none'` a trigger that never fires
 *      leaves the element at opacity 0 forever. That is the blank text.
 *
 * The fix:
 *   - Opt in per element with `data-reveal="text|image|line"`. Declarative,
 *     scoped to a ref, impossible for one page to grab another's nodes.
 *   - No timers. SplitText's `autoSplit` re-splits and re-creates the
 *     animation whenever the font loads or the container resizes.
 *   - No manual above-fold delay. Anything already in view fires on the
 *     first ScrollTrigger refresh. Use `data-reveal-delay="0.2"` to
 *     choreograph a hero.
 *   - `gsap.matchMedia()` gives free teardown across breakpoints and a real
 *     prefers-reduced-motion branch.
 *
 * Usage:
 *   const scope = useReveal({ deps: [works] });
 *   return <main ref={scope}>…</main>;
 */

interface RevealOptions {
  /** Re-run when async content arrives. Same semantics as a dep array. */
  deps?: unknown[];
  /** Hold setup until the splash screen is gone. */
  enabled?: boolean;
}

const delayOf = (el: HTMLElement) => parseFloat(el.dataset.revealDelay ?? '0') || 0;

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {}
): RefObject<T | null> {
  const scope = useRef<T>(null);
  const { deps = [], enabled = true } = options;

  useGSAP(
    () => {
      const root = scope.current;
      if (!enabled || !root) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: '(prefers-reduced-motion: reduce)',
          motion: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 769px)',
        },
        (ctx) => {
          const { reduced, desktop } = ctx.conditions as Record<string, boolean>;

          const textEls = gsap.utils.toArray<HTMLElement>('[data-reveal="text"]', root);
          const imageEls = gsap.utils.toArray<HTMLElement>('[data-reveal="image"]', root);
          const lineEls = gsap.utils.toArray<HTMLElement>('[data-reveal="line"]', root);

          // ── Reduced motion: show everything, animate nothing ───────────
          if (reduced) {
            gsap.set([...textEls, ...imageEls], { autoAlpha: 1, clearProps: 'clipPath,transform' });
            gsap.set(lineEls, { scaleX: 1 });
            return;
          }

          // ── TEXT ────────────────────────────────────────────────────────
          // `mask: 'lines'` builds the overflow:hidden wrapper that the old
          // code assembled by hand with eight inline styles per line.
          // `autoSplit: true` re-splits on font load and resize; creating the
          // tween inside onSplit means it re-binds to the NEW line elements
          // rather than orphaned ones from the previous split.
          textEls.forEach((el) => {
            SplitText.create(el, {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              linesClass: 'reveal-line',
              onSplit(self) {
                gsap.set(el, { autoAlpha: 1 });
                return gsap.from(self.lines, {
                  yPercent: 110,
                  duration: 1,
                  ease: 'power4.out',
                  stagger: 0.08,
                  delay: delayOf(el),
                  scrollTrigger: {
                    trigger: el,
                    start: 'top 92%',
                    once: true,
                    // invalidateOnRefresh re-reads start/end after images
                    // settle, so a late-loading image can no longer push an
                    // element past its own trigger.
                    invalidateOnRefresh: true,
                  },
                });
              },
            });
          });

          // ── IMAGES ──────────────────────────────────────────────────────
          // clip-path is a compositor-friendly reveal on desktop but forces
          // repaints on mobile GPUs. Phones get opacity + translate instead.
          imageEls.forEach((el) => {
            const from = desktop
              ? { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 0 }
              : { y: 24, autoAlpha: 0 };

            gsap.from(el, {
              ...from,
              duration: desktop ? 1.4 : 0.8,
              ease: 'power4.out',
              delay: delayOf(el),
              scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                once: true,
                invalidateOnRefresh: true,
              },
            });
          });

          // ── LINES (animated hairline dividers) ──────────────────────────
          lineEls.forEach((el) => {
            gsap.from(el, {
              scaleX: 0,
              duration: 0.9,
              ease: 'power3.out',
              delay: delayOf(el),
              scrollTrigger: {
                trigger: el,
                start: 'top 98%',
                once: true,
                invalidateOnRefresh: true,
              },
            });
          });
        }
      );

      // gsap.context (which useGSAP wraps) invokes a returned function on
      // revert, so matchMedia is torn down on unmount and on dep change.
      return () => mm.revert();
    },
    { scope, dependencies: [enabled, ...deps], revertOnUpdate: true }
  );

  return scope;
}

/**
 * Refresh ScrollTrigger once every image has settled.
 *
 * Mount ONCE at app root. Belt-and-braces: every image should also carry
 * explicit width/height (see SanityImage) so layout never moves in the first
 * place. This covers anything that slips through.
 */
export function useScrollTriggerRefresh() {
  useGSAP(() => {
    const refresh = gsap.utils.debounce(() => ScrollTrigger.refresh(), 200);

    const pending = Array.from(document.images).filter((img) => !img.complete);
    pending.forEach((img) => {
      img.addEventListener('load', refresh, { once: true });
      img.addEventListener('error', refresh, { once: true });
    });

    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener('load', refresh);
      pending.forEach((img) => {
        img.removeEventListener('load', refresh);
        img.removeEventListener('error', refresh);
      });
    };
  }, []);
}
```

---

### `src/hooks/useParallax.ts`

Replaces `useImageParallax`. Scoped to a ref; disabled below 769px and under reduced motion.

```ts
import type { RefObject } from 'react';
import { gsap, useGSAP } from '../lib/gsap';

/**
 * useParallax — scoped replacement for useImageParallax.
 *
 * The old hook queried `.parallax-wrapper` across the entire document and was
 * called from Home, Work AND BlockRenderer. On a case study that meant two
 * mounted instances attaching competing scrubs to the same images, and on any
 * page it meant grabbing wrappers that belonged to other components.
 *
 * This version is scoped to a ref and disabled below 769px. Scrubbed
 * transforms plus Lenis plus a collapsing mobile address bar is a bad trade:
 * you pay real frame budget for an effect nobody notices on a phone.
 */
export function useParallax(
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useGSAP(
    () => {
      if (!scope.current) return;
      const mm = gsap.matchMedia();

      mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        const wrappers = gsap.utils.toArray<HTMLElement>('[data-parallax]', scope.current);

        wrappers.forEach((wrapper) => {
          const img = wrapper.querySelector<HTMLElement>('[data-parallax-img]');
          if (!img) return;

          gsap.fromTo(
            img,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top bottom',
                end: 'bottom top',
                // 1.5 was heavy enough to visibly trail the scroll on a slow
                // connection. 0.6 keeps the weight without the lag.
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  );
}
```

---

### `src/hooks/useSmoothScroll.ts`

Lenis bridge plus the `setScrollLocked` / `scrollToTop` helpers that stop native scroll calls fighting Lenis.

```ts
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';

declare global {
  interface Window {
    lenis: Lenis | null;
  }
}

/**
 * Lenis + ScrollTrigger bridge.
 *
 * Changes from the previous version:
 *   - Bails out entirely under prefers-reduced-motion. Smooth-scroll
 *     hijacking is one of the things that setting exists for.
 *   - `autoRaf: false` is explicit. Lenis is driven by the GSAP ticker; the
 *     old code did this too but relied on the default, which changed between
 *     Lenis majors and would silently give you two rAF loops.
 *   - `syncTouch: false` (Lenis default, now explicit): touch scrolling stays
 *     native. Synthesising momentum on a phone is the classic Lenis mobile
 *     jank, and it is the reason iOS feels worse than desktop here.
 *   - lagSmoothing moved to lib/gsap.ts so it is set once.
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    if (prefersReducedMotion()) {
      window.lenis = null;
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });

    window.lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      window.lenis = null;
    };
  }, []);
};

/**
 * Lock and unlock scroll.
 *
 * `document.body.style.overflow = 'hidden'` does NOT lock scrolling on iOS
 * Safari, and it fights Lenis on every platform. Use Lenis' own stop/start,
 * with the body rule kept only as the no-Lenis fallback.
 */
export const setScrollLocked = (locked: boolean) => {
  if (window.lenis) {
    locked ? window.lenis.stop() : window.lenis.start();
    return;
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
};

/** Jump to top on route change without fighting Lenis' interpolated position. */
export const scrollToTop = () => {
  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo(0, 0);
  }
};
```

---

### `src/hooks/useProjects.ts`

Shared fetch. `Home` and `Work` previously duplicated this interface, projection and handlers verbatim.

```ts
import { useEffect, useState } from 'react';
import { client } from '../lib/sanity';

/**
 * Home.tsx and Work.tsx had the same Project interface, the same GROQ
 * projection and the same two mouse handlers, copied verbatim. One source
 * of truth instead.
 */

export interface Project {
  _id: string;
  brand: string;
  slug: string;
  category?: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
}

const PROJECTION = `
  _id, brand,
  "slug": slug.current,
  category,
  "thumbnailUrl": thumbnail.asset->url,
  "previewVideoUrl": previewVideo.asset->url
`;

type Mode = 'all' | 'featured';

export function useProjects(mode: Mode = 'all') {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query =
      mode === 'featured'
        ? `*[_type == "caseStudy" && isFeatured == true] | order(publishedAt desc)[0...2]{${PROJECTION}}`
        : `*[_type == "caseStudy"] | order(publishedAt desc){${PROJECTION}}`;

    client
      .fetch<Project[]>(query)
      .then((data) => {
        if (!cancelled) setProjects(data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[useProjects]', err);
          setError(err as Error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  return { projects, loading, error };
}
```

---

### `src/components/common/ErrorBoundary.tsx`

Without this, any throw unmounts the React root and you get a white screen with no clue why — exactly what happened on `/work/monibac`.

```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Without one of these, a throw anywhere in the tree unmounts the entire
 * React root and you get a white screen with no clue why. That is exactly
 * what `ReactPlayer is not a function` did to /work/monibac.
 *
 * Class component because React still has no hook equivalent.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="page-wrapper error-state" role="alert">
          <h1>Something broke here.</h1>
          <p>
            This page failed to render. Try reloading, or head back to{' '}
            <a href="/">the homepage</a>.
          </p>
          {import.meta.env.DEV && (
            <pre className="error-detail">{this.state.error.message}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

### `src/components/common/SanityImage.tsx`

One image component sitewide. srcset, `auto('format')`, lazy, and intrinsic width/height.

```tsx
import React from 'react';
import { responsiveImage, responsiveUrl } from '../../lib/sanity';

interface Props {
  /** Either a Sanity image object, or a raw CDN url string from GROQ. */
  source: unknown;
  alt: string;
  className?: string;
  /** The `sizes` attribute. Get this right or srcSet does nothing useful. */
  sizes?: string;
  /** Above the fold? Then eager + high priority, no lazy. */
  priority?: boolean;
  maxWidth?: number;
}

/**
 * One image component for the whole site.
 *
 * What this gives you that a bare <img src={urlFor(x).url()}> did not:
 *   - srcSet/sizes, so a phone downloads ~60KB instead of ~4MB
 *   - auto('format') → AVIF/WebP where supported
 *   - width/height attributes → zero layout shift → ScrollTrigger measures a
 *     layout that will not move underneath it
 *   - loading="lazy" + decoding="async" on everything below the fold
 *   - fetchPriority="high" on the hero so it is not queued behind thumbnails
 */
export const SanityImage: React.FC<Props> = ({
  source,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  maxWidth = 2560,
}) => {
  if (!source) return null;

  let img;
  try {
    img =
      typeof source === 'string'
        ? responsiveUrl(source, maxWidth)
        : responsiveImage(source, maxWidth);
  } catch (err) {
    // A published document can reference an unpublished or deleted asset.
    // @sanity/image-url throws on those. Render nothing rather than take the
    // page down.
    console.warn('[SanityImage] could not resolve source', err);
    return null;
  }

  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
    />
  );
};
```

---

### `src/components/common/CustomCursor.tsx`

GSAP `quickTo` instead of framer-motion springs, and returns `null` on coarse pointers.

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { useCursor } from '../../context/CursorContext';
import { gsap } from '../../lib/gsap';

/**
 * CustomCursor — GSAP instead of framer-motion, and inert on touch devices.
 *
 * Two problems with the old version:
 *   1. It mounted on phones. `* { cursor: none }` hid a cursor that does not
 *      exist, while this component still ran two framer-motion springs on
 *      every frame, mounted a <video> element, and listened to mousemove.
 *   2. framer-motion was pulled in (~100KB) for this and the splash screen
 *      only, on top of a GSAP bundle that already does both.
 *
 * gsap.quickTo is the idiomatic way to drive a cursor: it reuses one tween
 * instance rather than creating a new one per mousemove event.
 */

const SIZES: Record<string, number> = {
  default: 24,
  'view-project': 80,
  media: 120,
};

export const CustomCursor: React.FC = () => {
  const { cursorType, cursorMedia } = useCursor();
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Evaluate once on mount, not on every render, and never render at all on
  // a coarse pointer. `useState(fn)` so matchMedia runs a single time.
  const [enabled] = useState(
    () => !window.matchMedia('(hover: none), (pointer: coarse)').matches
  );

  // Position
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });

    const move = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [enabled]);

  // Size + blend mode
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const size = SIZES[cursorType] ?? SIZES.default;
    gsap.to(ref.current, {
      width: size,
      height: size,
      xPercent: -50,
      yPercent: -50,
      duration: 0.4,
      ease: 'power3.out',
      backgroundColor: cursorType === 'media' ? 'transparent' : 'var(--text-color)',
      mixBlendMode: cursorType === 'media' ? 'normal' : 'difference',
    });
  }, [cursorType, enabled]);

  // Media source
  useEffect(() => {
    const v = videoRef.current;
    if (!enabled || !v) return;
    if (cursorType === 'media' && cursorMedia) {
      v.src = cursorMedia;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
  }, [cursorType, cursorMedia, enabled]);

  if (!enabled) return null;

  return (
    <div ref={ref} className={`custom-cursor cursor-${cursorType}`} aria-hidden="true">
      <span className="cursor-fallback-label">VIEW</span>
      <div className="cursor-media-wrapper">
        <video ref={videoRef} muted loop playsInline preload="none" />
        <span className="cursor-media-label">PLAY</span>
      </div>
    </div>
  );
};
```

---

### `src/components/case-study/MediaItem.tsx`

Extracted from `BlockRenderer`. Native `<video>` gated by IntersectionObserver, plus background iframes for Vimeo/YouTube. This is the file that fixes the blank screen.

```tsx
import React, { useEffect, useRef } from 'react';
import { SanityImage } from '../common/SanityImage';

/**
 * MediaItem — replaces the react-player call that was crashing case studies.
 *
 * The old code did `(ReactPlayer as any)({ ...props })`, calling a component
 * as a plain function. That bypasses React entirely (no hooks, no
 * reconciliation, no error boundary) and blew up as
 * `ReactPlayer is not a function` under react-player v3's export shape.
 *
 * react-player is removed rather than repaired. The schema offers exactly two
 * options — "Video (URL)" meaning Vimeo or a raw MP4 — and the playback mode
 * is background: muted, looping, no controls, no UI. Native <video> and a
 * background iframe do that in zero kilobytes, against react-player's
 * ~300-500KB gzipped (@mux/mux-player-react, hls.js, media-chrome and ten
 * *-video-element packages, loaded on every route).
 */

interface MediaData {
  mediaType?: 'image' | 'video';
  image?: unknown;
  videoUrl?: string;
  caption?: string;
}

interface Props {
  data?: MediaData | null;
  /** `sizes` for the underlying image. Match the grid column it sits in. */
  sizes?: string;
  priority?: boolean;
}

// ── URL parsing ────────────────────────────────────────────────────────────

type Parsed =
  | { kind: 'file'; url: string }
  | { kind: 'vimeo'; id: string }
  | { kind: 'youtube'; id: string }
  | { kind: 'unknown'; url: string };

function parseVideoUrl(raw: string): Parsed {
  const url = raw.trim();

  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return { kind: 'file', url };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return { kind: 'vimeo', id: vimeo[1] };

  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i
  );
  if (yt) return { kind: 'youtube', id: yt[1] };

  return { kind: 'unknown', url };
}

// ── Native file video ──────────────────────────────────────────────────────

const FileVideo: React.FC<{ url: string }> = ({ url }) => {
  const ref = useRef<HTMLVideoElement>(null);

  // Only play while on screen. A case study with eight autoplaying videos
  // decoding simultaneously will pin a phone's CPU and drain battery even
  // when every one of them is off screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {
            /* autoplay policy rejected it — fine, it stays paused */
          });
        } else {
          el.pause();
        }
      },
      { rootMargin: '200px 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="cs-video"
      src={url}
      muted
      loop
      playsInline
      // No autoPlay attribute — IntersectionObserver starts it. Setting both
      // means the browser begins buffering every video on page load.
      preload="metadata"
      disablePictureInPicture
      controls={false}
      aria-hidden="true"
    />
  );
};

// ── Embeds ─────────────────────────────────────────────────────────────────

const EmbedFrame: React.FC<{ src: string; title: string }> = ({ src, title }) => (
  <iframe
    className="cs-embed"
    src={src}
    title={title}
    // loading="lazy" is the whole point: an off-screen embed costs nothing
    // until the user scrolls near it.
    loading="lazy"
    frameBorder={0}
    allow="autoplay; fullscreen; picture-in-picture"
    allowFullScreen
  />
);

// ── Public component ───────────────────────────────────────────────────────

export const MediaItem: React.FC<Props> = ({ data, sizes = '100vw', priority = false }) => {
  if (!data) return null;

  if (data.mediaType === 'video' && data.videoUrl) {
    const parsed = parseVideoUrl(data.videoUrl);

    let inner: React.ReactNode = null;
    if (parsed.kind === 'file') {
      inner = <FileVideo url={parsed.url} />;
    } else if (parsed.kind === 'vimeo') {
      inner = (
        <EmbedFrame
          title={data.caption || 'Vimeo video'}
          src={`https://player.vimeo.com/video/${parsed.id}?background=1&autoplay=1&loop=1&muted=1&dnt=1`}
        />
      );
    } else if (parsed.kind === 'youtube') {
      inner = (
        <EmbedFrame
          title={data.caption || 'YouTube video'}
          src={`https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&mute=1&loop=1&playlist=${parsed.id}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3`}
        />
      );
    } else {
      // Unrecognised host. Say so in dev, render nothing in prod, but never
      // throw — a bad CMS entry must not take the page down.
      if (import.meta.env.DEV) {
        console.warn('[MediaItem] unsupported video url:', data.videoUrl);
      }
      return null;
    }

    return (
      <figure className="cs-media-wrapper cs-media-video" data-reveal="image">
        <div className="cs-media-frame">{inner}</div>
        {data.caption && <figcaption className="cs-caption">{data.caption}</figcaption>}
      </figure>
    );
  }

  if (data.image) {
    return (
      <figure className="cs-media-wrapper" data-reveal="image" data-parallax>
        <SanityImage
          source={data.image}
          alt={data.caption || 'Case study visual'}
          className="cs-img"
          sizes={sizes}
          priority={priority}
        />
        {data.caption && <figcaption className="cs-caption">{data.caption}</figcaption>}
      </figure>
    );
  }

  return null;
};
```

---

### `src/components/case-study/BlockRenderer.tsx`

Layout only now. Uses `block._key` for React keys — index keys meant reordering blocks in Sanity remounted the wrong nodes, which with reveals attached leaves elements hidden.

```tsx
import React from 'react';
import { MediaItem } from './MediaItem';

/**
 * BlockRenderer
 *
 * Changes:
 *   - MediaItem extracted to its own file (it was 60 lines of video logic
 *     living at the bottom of a layout file).
 *   - No useImageParallax call here. The old version invoked a hook that
 *     queried the whole document, while Home and Work did the same, so a
 *     case study got two or three competing scrubs on identical elements.
 *     Parallax is now driven once from CaseStudy's scope ref.
 *   - Every media slot passes a real `sizes` value matching its column, so
 *     a 4-column image does not download a full-width source.
 *   - Section titles and body copy carry data-reveal="text" instead of being
 *     picked up by a global `main h1, main h2, main p` selector.
 *   - Keys are the block `_key` from Sanity, not the array index. Index keys
 *     mean reordering blocks in the CMS remounts the wrong DOM nodes.
 */

interface Block {
  _key?: string;
  _type: string;
  sectionTitle?: string;
  align?: 'left' | 'right';
  media?: unknown;
  leftMedia?: unknown;
  rightMedia?: unknown;
  media1?: unknown;
  media2?: unknown;
  media3?: unknown;
  text?: string;
  text1?: string;
  text2?: string;
  text3?: string;
  [key: string]: unknown;
}

interface Props {
  blocks: Block[];
}

const HALF = '(max-width: 768px) 100vw, 50vw';
const THIRD = '(max-width: 768px) 100vw, 33vw';
const FULL = '100vw';

const SectionTitle: React.FC<{ title?: string }> = ({ title }) =>
  title ? (
    <div className="col-12">
      <h3 className="cs-section-title" data-reveal="text">
        {title}
      </h3>
    </div>
  ) : null;

export const BlockRenderer: React.FC<Props> = ({ blocks }) => {
  if (!blocks?.length) return null;

  return (
    <div className="case-study-builder">
      {blocks.map((block, i) => {
        const key = block._key ?? `${block._type}-${i}`;

        switch (block._type) {
          case 'fullWidthMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-12">
                  <MediaItem
                    data={block.media as never}
                    sizes={FULL}
                    // First block on the page is above the fold on most
                    // screens: load it eagerly so LCP is not gated on a
                    // lazy-loading decision.
                    priority={i === 0}
                  />
                </div>
              </section>
            );

          case 'halfWidthMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className={block.align === 'right' ? 'push-right-6' : 'col-6'}>
                  <MediaItem data={block.media as never} sizes={HALF} />
                </div>
              </section>
            );

          case 'sideBySideMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-6">
                  <MediaItem data={block.leftMedia as never} sizes={HALF} />
                </div>
                <div className="col-6">
                  <MediaItem data={block.rightMedia as never} sizes={HALF} />
                </div>
              </section>
            );

          case 'threeColMedia':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-4">
                  <MediaItem data={block.media1 as never} sizes={THIRD} />
                </div>
                <div className="col-4">
                  <MediaItem data={block.media2 as never} sizes={THIRD} />
                </div>
                <div className="col-4">
                  <MediaItem data={block.media3 as never} sizes={THIRD} />
                </div>
              </section>
            );

          case 'halfWidthText':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className={block.align === 'right' ? 'push-right-6' : 'col-6'}>
                  <p className="cs-text-body" data-reveal="text">
                    {block.text}
                  </p>
                </div>
              </section>
            );

          case 'threeColText':
            return (
              <section key={key} className="grid-12-col section-padding">
                <SectionTitle title={block.sectionTitle} />
                <div className="col-12 flex-space-between">
                  {[block.text1, block.text2, block.text3]
                    .filter(Boolean)
                    .map((t, n) => (
                      <div className="flex-col-3" key={n}>
                        <p className="cs-text-body" data-reveal="text">
                          {t}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            );

          default:
            if (import.meta.env.DEV) {
              console.warn('[BlockRenderer] unhandled block type:', block._type);
            }
            return null;
        }
      })}
    </div>
  );
};
```

---

### `src/components/work/WorkGrid.tsx`

Shared grid with skeleton cards, so grid height is stable before data lands.

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCursor } from '../../context/CursorContext';
import { SanityImage } from '../common/SanityImage';
import { isCoarsePointer } from '../../lib/gsap';
import type { Project } from '../../hooks/useProjects';

interface Props {
  projects: Project[];
  loading?: boolean;
}

const GRID_SIZES = '(max-width: 768px) 100vw, 50vw';

/** Skeleton cards keep grid height stable so nothing jumps when data lands. */
const Skeleton: React.FC = () => (
  <>
    {[0, 1].map((i) => (
      <div className="work-item work-item--skeleton" key={i} aria-hidden="true">
        <div className="work-img-wrapper" />
        <div className="work-meta" />
      </div>
    ))}
  </>
);

export const WorkGrid: React.FC<Props> = ({ projects, loading }) => {
  const { setCursorType, setCursorMedia } = useCursor();

  // Hover-driven cursor state is meaningless on touch, and setting it fires
  // React state updates from synthetic mouse events that phones emit on tap.
  const touch = isCoarsePointer();

  const onEnter = (project: Project) => {
    if (touch) return;
    if (project.previewVideoUrl) {
      setCursorType('media');
      setCursorMedia(project.previewVideoUrl);
    } else {
      setCursorType('view-project');
    }
  };

  const onLeave = () => {
    if (touch) return;
    setCursorType('default');
    setCursorMedia(null);
  };

  return (
    <div className="work-grid">
      {loading && <Skeleton />}

      {!loading &&
        projects.map((project, i) => (
          <Link
            to={`/work/${project.slug}`}
            key={project._id}
            className="work-item"
            onMouseEnter={() => onEnter(project)}
            onMouseLeave={onLeave}
          >
            <div className="work-img-wrapper" data-reveal="image" data-parallax>
              {project.thumbnailUrl && (
                <SanityImage
                  source={project.thumbnailUrl}
                  alt={project.brand}
                  className="parallax-img"
                  sizes={GRID_SIZES}
                  priority={i < 2}
                  maxWidth={1440}
                />
              )}
            </div>

            <div className="work-meta">
              <div className="work-meta-row">
                <span className="work-meta-category">
                  {project.category || 'Case Study'}
                </span>
                <span className="work-meta-arrow" aria-hidden="true">↗</span>
              </div>
              <div className="work-meta-brand" data-reveal="text">
                {project.brand}
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
};
```

---

### `src/components/layout/SplashLoader.tsx`

Driven by `document.fonts.ready` + `window.load` with a 3s ceiling, instead of a ~7s fixed schedule.

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

interface Props {
  onComplete: () => void;
}

/**
 * SplashLoader — same look, real timing, no framer-motion.
 *
 * The old version was a fake progress bar on a fixed schedule:
 *   ~42 ticks x 80ms to reach 85, + 600ms hold, + ~10 ticks x 120ms,
 *   + 400ms, + 1400ms exit  ≈  7 seconds, every single visit.
 *
 * Locally that hid the load. On a CDN the real load time stacks on top of it
 * instead of behind it, so deployment felt dramatically slower than dev.
 *
 * Now the counter is driven by actual readiness (fonts + window load, with a
 * 3s ceiling) and the whole thing caps out around 1.6s.
 */

const MAX_WAIT = 3000;
const MIN_SHOW = 700;

export const SplashLoader: React.FC<Props> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onComplete();
      return;
    }

    const started = performance.now();
    let done = false;

    // Creep toward 90 while we wait. Never claims 100 until it is true.
    const creep = gsap.to(
      { v: 0 },
      {
        v: 90,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate() {
          setCount(Math.round((this.targets()[0] as { v: number }).v));
        },
      }
    );

    const ready = Promise.race([
      Promise.all([
        document.fonts?.ready ?? Promise.resolve(),
        document.readyState === 'complete'
          ? Promise.resolve()
          : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true })),
      ]),
      new Promise<void>((r) => setTimeout(r, MAX_WAIT)),
    ]);

    ready.then(() => {
      if (done) return;
      done = true;
      creep.kill();

      const elapsed = performance.now() - started;
      const hold = Math.max(0, MIN_SHOW - elapsed);

      gsap
        .timeline({ delay: hold / 1000 })
        .to(
          { v: count },
          {
            v: 100,
            duration: 0.35,
            ease: 'power2.out',
            onUpdate() {
              setCount(Math.round((this.targets()[0] as { v: number }).v));
            },
          }
        )
        .to(rootRef.current, {
          yPercent: -100,
          duration: 0.9,
          ease: 'expo.inOut',
          onComplete,
        });
    });

    return () => {
      done = true;
      creep.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="splash-screen" ref={rootRef}>
      <div className="splash-counter">{count}</div>
    </div>
  );
};
```

---

### `src/pages/Home.tsx`

Migrated to `data-reveal`.

```tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/sanity';
import { SanityImage } from '../components/common/SanityImage';
import { WorkGrid } from '../components/work/WorkGrid';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';

interface SiteSettings {
  heroImage: unknown;
}

const FOCUS_ROWS: [string, string][] = [
  ['Art Direction', 'Product Thinking'],
  ['Creative Strategy', 'User Experience'],
  ['Usability Research', 'Interaction Design'],
  ['Design Systems', 'Visual Design'],
];

export const Home: React.FC = () => {
  const { projects, loading } = useProjects('featured');
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const scope = useReveal<HTMLElement>({ deps: [projects, settings] });
  useParallax(scope, [projects, settings]);

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<SiteSettings>(`*[_type == "siteSettings"][0]{ heroImage }`)
      .then((data) => !cancelled && setSettings(data))
      .catch((err) => console.error('[Home] siteSettings fetch failed:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page-wrapper page-home" ref={scope}>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-row">
          <h1 className="hero-title" data-reveal="text">
            <span className="text-muted">CHUKWUEBUKA</span>
            <br />
            <span className="text-muted">ARIN</span>ZE{' '}
            <span className="text-muted">NWAJU</span>
          </h1>
          <p className="hero-subtitle" data-reveal="text" data-reveal-delay="0.15">
            Multidisciplinary Creative,
            <br />
            Design Engineer, Art Director
            <br />
            and Audiophile.
          </p>
        </div>

        <div className="hero-image-wrapper" data-reveal="image" data-parallax data-reveal-delay="0.25">
          <div className="hero-blur-overlay" aria-hidden="true" />
          {settings?.heroImage && (
            <SanityImage
              source={settings.heroImage}
              alt="Chukwuebuka Arinze Nwaju"
              className="parallax-img"
              sizes="100vw"
              priority
              maxWidth={1920}
            />
          )}
        </div>
      </section>

      {/* ── Focus ───────────────────────────────────────────────────── */}
      <section className="focus-section grid-12-col margin-top-huge">
        <div className="col-4">
          <h2 className="focus-heading" data-reveal="text">FOCUS</h2>
        </div>

        <div className="col-6">
          <p className="focus-body" data-reveal="text">
            Alongside that, I've worked across agencies and freelance roles,
            designing products for FinTech, EdTech, and marketplace startups —
            sometimes designing interfaces, sometimes shaping brands, sometimes
            building scrappy internal tools. I enjoy getting my hands dirty,
            asking uncomfortable questions early, and turning abstract ideas
            into systems people can actually use. I code just enough (React,
            TypeScript) to collaborate directly with engineers and close the
            gap between intention and implementation.
          </p>

          <div className="focus-skills">
            {FOCUS_ROWS.map(([left, right]) => (
              <div className="focus-row" key={left}>
                <span className="focus-skill">{left}</span>
                <span className="focus-star" aria-hidden="true">✦</span>
                <span className="focus-skill">{right}</span>
                <span className="line-reveal" data-reveal="line" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Selected Works ──────────────────────────────────────────── */}
      <section className="selected-works margin-top-huge">
        <header className="works-header">
          <h2 data-reveal="text">SELECTED WORKS</h2>
          <Link to="/work" className="font-sec-muted">SEE ALL</Link>
          <span className="line-reveal" data-reveal="line" aria-hidden="true" />
        </header>

        <WorkGrid projects={projects} loading={loading} />
      </section>
    </main>
  );
};
```

---

### `src/pages/Work.tsx`

Migrated to `data-reveal`.

```tsx
import React from 'react';
import { WorkGrid } from '../components/work/WorkGrid';
import { useProjects } from '../hooks/useProjects';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';

export const Work: React.FC = () => {
  const { projects, loading, error } = useProjects('all');

  const scope = useReveal<HTMLElement>({ deps: [projects] });
  useParallax(scope, [projects]);

  return (
    <main className="page-wrapper page-work" ref={scope}>
      <header className="work-page-header">
        <h1 className="work-title" data-reveal="text">
          Take a look at a few projects that I've
          <br />
          hashed out in recent years
        </h1>
      </header>

      <header className="works-header">
        <span />
        <span className="line-reveal" data-reveal="line" aria-hidden="true" />
      </header>

      {error ? (
        <p className="cs-status-text" role="alert">
          Couldn't load the work list right now. Please refresh.
        </p>
      ) : (
        <WorkGrid projects={projects} loading={loading} />
      )}
    </main>
  );
};
```

---

### `src/pages/CaseStudy.tsx`

Explicit `loading | ready | notfound | error` status machine. The container is never opacity-gated, and stale fetches are cancelled.

```tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { client } from '../lib/sanity';
import { BlockRenderer } from '../components/case-study/BlockRenderer';
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';

/**
 * CaseStudy
 *
 * The old version had three failure modes that all looked identical to the
 * user (a blank page):
 *
 *   1. `catch { console.error }` left `project` null forever and rendered
 *      `<div style={{opacity: 0}} />`. A fetch failure was indistinguishable
 *      from a page that simply had not arrived.
 *   2. Page visibility depended on a requestAnimationFrame callback calling
 *      `gsap.set(container, {opacity: 1})`. If that rAF was throttled — a
 *      backgrounded tab, iOS low power mode — the page never appeared.
 *   3. Any throw below (MediaItem) unmounted the root, since there was no
 *      error boundary.
 *
 * Now: explicit status machine, container is never opacity-gated, reveals are
 * handled by the shared useReveal hook via data-reveal attributes.
 */

interface ProjectData {
  brand: string;
  projectType: string;
  timeline: string;
  role: string;
  stack: string[];
  summary: string;
  contentBlocks: never[];
}

type Status = 'loading' | 'ready' | 'notfound' | 'error';

const QUERY = `*[_type == "caseStudy" && slug.current == $slug][0]{
  brand, projectType, timeline, role, stack, summary, contentBlocks
}`;

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  // Reveals wait for data; the dep array re-runs setup once blocks are in the
  // DOM. `enabled` prevents a pass over an empty container.
  const scope = useReveal<HTMLDivElement>({
    deps: [project],
    enabled: status === 'ready',
  });
  useParallax(scope, [project]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setProject(null);

    client
      .fetch<ProjectData | null>(QUERY, { slug })
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setStatus('notfound');
          return;
        }
        setProject(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[CaseStudy] Sanity fetch failed:', err);
        setStatus('error');
      });

    // Abandon the result of a stale slug rather than letting it land after a
    // newer one. The old code had no guard, so fast back-and-forth navigation
    // could render the previous project's data.
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="page-wrapper cs-status" aria-busy="true">
        <span className="cs-status-text">Loading</span>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="page-wrapper cs-status">
        <h1>That project isn't here.</h1>
        <p>
          It may have been renamed or unpublished. <Link to="/work">See all work</Link>.
        </p>
      </div>
    );
  }

  if (status === 'error' || !project) {
    return (
      <div className="page-wrapper cs-status" role="alert">
        <h1>Couldn't load this project.</h1>
        <p>
          Something went wrong fetching it. <Link to="/work">See all work</Link>, or
          try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="page-wrapper case-study-page" ref={scope}>
      <header className="cs-hero section-padding">
        <h1 className="cs-title">
          <span data-reveal="text">{project.brand}</span>
          <span className="font-sec-muted" data-reveal="text" data-reveal-delay="0.1">
            {project.projectType}
          </span>
        </h1>

        <div className="cs-metadata grid-12-col">
          <span className="line-reveal" data-reveal="line" aria-hidden="true" />

          <div className="col-2">
            <span className="meta-label" data-reveal="text">TIMELINE</span>
            <span className="meta-value" data-reveal="text">{project.timeline}</span>
          </div>
          <div className="col-3">
            <span className="meta-label" data-reveal="text">ROLE</span>
            <span className="meta-value" data-reveal="text">{project.role}</span>
          </div>
          <div className="col-2">
            <span className="meta-label" data-reveal="text">STACK</span>
            <ul className="meta-stack-list">
              {project.stack?.map((item) => (
                <li key={item} className="meta-value" data-reveal="text">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="col-5">
            <span className="meta-label" data-reveal="text">SUMMARY</span>
            <p className="meta-value" data-reveal="text">{project.summary}</p>
          </div>
        </div>
      </header>

      <BlockRenderer blocks={project.contentBlocks || []} />
    </div>
  );
};
```

---

### `src/App.tsx`

Lazy routes behind Suspense, error boundary around Routes, Lenis-aware scroll handling, and the CSS cascade order.

```tsx
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CursorProvider } from './context/CursorContext';
import { CustomCursor } from './components/common/CustomCursor';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useSmoothScroll, setScrollLocked, scrollToTop } from './hooks/useSmoothScroll';
import { useScrollTriggerRefresh } from './hooks/useReveal';
import { SplashLoader } from './components/layout/SplashLoader';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MenuOverlay } from './components/layout/MenuOverlay';

// Home stays in the main bundle — it is the entry point for most visits.
import { Home } from './pages/Home';

// Everything else is split. Without this, a first-time visitor downloads the
// case-study renderer, the vault and the contact page before the homepage can
// paint. Each becomes its own chunk fetched on navigation.
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Work = lazy(() => import('./pages/Work').then((m) => ({ default: m.Work })));
const CaseStudy = lazy(() =>
  import('./pages/CaseStudy').then((m) => ({ default: m.CaseStudy }))
);
const Contact = lazy(() =>
  import('./pages/Contact').then((m) => ({ default: m.Contact }))
);
const Vault = lazy(() => import('./pages/Vault').then((m) => ({ default: m.Vault })));

// Cascade order matters: animation.css deliberately overrides rules in the
// two files above it. Remove the index.css import from main.tsx so there is
// exactly one place that decides this order.
import './styles/index.css';
import './styles/interactions.css';
import './styles/animation.css';

/**
 * Theme + scroll reset on route change.
 *
 * Two fixes:
 *   - `window.scrollTo(0, 0)` fought Lenis, which owns scroll position and
 *     overwrote it on the next rAF tick. That is why you sometimes landed
 *     mid-page after navigating — and on a short case study, landing past the
 *     end of the content looks exactly like a blank screen.
 *   - Theme is now a class only. The old code ALSO wrote inline styles, which
 *     forced a CSS selector matching a substring of the style attribute
 *     (`body[style*="background-color: var(--light-bg)"]`). That is fragile
 *     enough to break on a whitespace change.
 */
const RouteEffects: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop();
    const isCaseStudy = pathname.startsWith('/work/') && pathname !== '/work';
    document.body.classList.toggle('theme-light', isCaseStudy);
  }, [pathname]);

  return null;
};

const RouteFallback: React.FC = () => (
  <div className="page-wrapper cs-status" aria-busy="true">
    <span className="cs-status-text">Loading</span>
  </div>
);

const AppContent: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  useSmoothScroll();
  useScrollTriggerRefresh();

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>('.site-footer');
    if (!footer) return;
    const measure = () => setFooterHeight(footer.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  // Lenis stop/start, not body overflow. overflow:hidden on body does not
  // lock scroll on iOS Safari and breaks position:sticky everywhere else.
  useEffect(() => {
    setScrollLocked(isMenuOpen || !isLoaded);
  }, [isMenuOpen, isLoaded]);

  return (
    <>
      <CustomCursor />
      <RouteEffects />

      {!isLoaded && <SplashLoader onComplete={() => setIsLoaded(true)} />}

      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <MenuOverlay isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />

      <main
        className="app-main"
        style={{ marginBottom: footerHeight > 0 ? footerHeight : undefined }}
      >
        {/* Keyed on nothing — the boundary should NOT reset per route here,
            or a persistent error would loop. RouteEffects handles navigation. */}
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<CaseStudy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/vault" element={<Vault />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </>
  );
};

const App: React.FC = () => (
  <CursorProvider>
    <Router>
      <AppContent />
    </Router>
  </CursorProvider>
);

export default App;
```

---

### `src/styles/animation.css`

Import LAST — it deliberately overrides rules in `index.css` and `interactions.css` so the migration does not require gutting those files in one go.

```css
/* ============================================================
   ANIMATION.CSS
   Import LAST, after index.css and interactions.css.

   Everything the reveal system needs, plus the mobile performance
   corrections. Rules here intentionally override the older files so the
   migration can be done without gutting index.css in one go.
   ============================================================ */

/* ── 1. PRE-JS HIDING ─────────────────────────────────────────
   The old approach put `opacity: 0` (and `transform: scaleX(0)`) directly in
   the stylesheet, which means the content is permanently invisible if JS
   never runs — the exact failure the code comments worried about.

   Gate it on `html.js`, which is set by a one-line inline script in
   index.html. No JS, no class, content visible.
   ─────────────────────────────────────────────────────────── */
html.js [data-reveal='text'],
html.js [data-reveal='image'] {
  visibility: hidden;
}

html.js [data-reveal='line'] {
  transform: scaleX(0);
  transform-origin: left center;
}

/* Reduced motion: never hide anything, even before JS boots. */
@media (prefers-reduced-motion: reduce) {
  html.js [data-reveal='text'],
  html.js [data-reveal='image'] {
    visibility: visible !important;
  }
  html.js [data-reveal='line'] {
    transform: none !important;
  }
}

/* SplitText's mask wrapper. `overflow: clip` beats `hidden` here: it does not
   create a scroll container, so it cannot trap Lenis or break sticky. */
.reveal-line {
  will-change: transform;
}

/* ── 2. LINE REVEAL ──────────────────────────────────────────
   `will-change: transform` removed from the base rule. There is one of these
   per focus row plus several per page; each one was a separately promoted
   compositor layer. Mobile Safari evicts layers under pressure and the
   result is stutter. GSAP promotes elements itself via force3D while a tween
   is running, which is the only time it is needed.
   ─────────────────────────────────────────────────────────── */
.line-reveal {
  display: block;
  width: 100%;
  height: 1px;
  background: currentColor;
  opacity: 0.1;
  transform-origin: left center;
  will-change: auto;
}

/* ── 3. PARALLAX ─────────────────────────────────────────────
   Desktop only. The 115% height exists solely to give the scrub travel room;
   on mobile there is no scrub, so the extra 15% just crops the image for no
   reason. `!important` removed — nothing was overriding it.
   ─────────────────────────────────────────────────────────── */
[data-parallax] {
  position: relative;
  overflow: hidden;
}

.parallax-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  will-change: auto;
}

@media (min-width: 769px) and (prefers-reduced-motion: no-preference) {
  .parallax-img {
    height: 115%;
  }
}

/* ── 4. CUSTOM CURSOR ────────────────────────────────────────
   `* { cursor: none !important }` applied to touch devices too, and the
   !important made it impossible to restore a pointer anywhere. Scope it to
   devices that actually have a cursor.
   ─────────────────────────────────────────────────────────── */
@media (hover: hover) and (pointer: fine) {
  html.js * {
    cursor: none;
  }
}

@media (hover: none), (pointer: coarse) {
  * {
    cursor: auto;
  }
  a,
  button {
    cursor: pointer;
  }
}

.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--text-color);
  mix-blend-mode: difference;
  overflow: hidden;
}

.custom-cursor .cursor-fallback-label,
.custom-cursor .cursor-media-wrapper {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.custom-cursor.cursor-view-project .cursor-fallback-label {
  opacity: 1;
}

.custom-cursor.cursor-media .cursor-media-wrapper {
  opacity: 1;
}

/* ── 5. MOBILE PERFORMANCE ───────────────────────────────────*/
@media (max-width: 768px) {
  /* backdrop-filter over half the hero forces a compositing layer that
     re-rasterises every frame while anything animates underneath it. This is
     the single most expensive rule on the mobile homepage. A gradient reads
     nearly identically at phone scale. */
  .hero-blur-overlay {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.45),
      rgba(0, 0, 0, 0) 100%
    );
    border-right: none;
  }

  /* Strip layer-promotion hints that are not paying for themselves. */
  .magnetic,
  .rolling-text .rt-top > span,
  .rolling-text .rt-bot > span {
    will-change: auto;
  }
}

/* ── 6. VIEWPORT UNITS ───────────────────────────────────────
   100vh on mobile is measured against the viewport WITH the address bar
   collapsed, so a 100vh element is taller than the visible area on load and
   the page jumps as the bar hides. dvh tracks the real value.
   ─────────────────────────────────────────────────────────── */
.page-wrapper {
  min-height: 100svh;
}

@supports not (min-height: 100svh) {
  .page-wrapper {
    min-height: 100vh;
  }
}

/* 100vw includes the scrollbar gutter, which pushes content wider than the
   viewport. That horizontal overflow is currently masked by
   `overflow-x: hidden` on body, which in turn breaks position: sticky. */
html.lenis,
html.lenis body {
  width: 100%;
}

/* ── 7. CASE STUDY MEDIA ─────────────────────────────────────*/
.cs-media-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;
  margin: 0;
}

.cs-media-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #111;
  overflow: hidden;
}

.cs-media-frame .cs-video,
.cs-media-frame .cs-embed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: cover;
  pointer-events: none;
}

.cs-img {
  width: 100%;
  height: auto;
  display: block;
}

/* ── 8. STATUS + SKELETON STATES ─────────────────────────────*/
.cs-status {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.cs-status-text {
  font-size: var(--font-home-sec);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.work-item--skeleton .work-img-wrapper {
  background: currentColor;
  opacity: 0.04;
}

.work-item--skeleton .work-meta {
  min-height: 3em;
}

.error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.error-state a {
  text-decoration: underline;
}

.error-detail {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  opacity: 0.6;
  white-space: pre-wrap;
}

/* ── 9. GLOBAL REDUCED MOTION ────────────────────────────────*/
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

---

### `src/main.tsx`

Only one change: remove the CSS import. `App.tsx` now owns cascade order, and
having it in two places means the order depends on module resolution.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

> `StrictMode` stays. It double-invokes effects in dev, which is exactly the
> condition that produced duplicate ScrollTriggers before. `useGSAP` handles
> this correctly — it is one of the reasons to use it over raw `useEffect`.

---

### `vercel.json`

Vercel fingerprints `dist/assets/*` but not files served from `public/`.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 6. Manual edits

These touch files I do not have in full. **Do not overwrite them blindly.**

### 6.1 `src/styles/index.css` — font faces

Locate the three `@font-face` blocks at the top of the file and replace them
with the following. Everything else in `index.css` stays as-is.

```css
@font-face {
  font-family: 'Nacelle';
  src: url('/fonts/Nacelle-Light.woff2') format('woff2');
  font-weight: 300;          /* was unset — collided with Regular at 400 */
  font-style: normal;
  font-display: swap;        /* was unset — invisible text during load */
}
@font-face {
  font-family: 'Nacelle';
  src: url('/fonts/Nacelle-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Nacelle';
  src: url('/fonts/Nacelle-Heavy.woff2') format('woff2');
  font-weight: 700;          /* `font-style: bold` was invalid — bold is a weight */
  font-style: normal;
  font-display: swap;
}
```

Body copy uses Light per the existing comment, so also set:

```css
body { font-weight: 300; }
```

Also in `index.css`, three smaller items:

| Find | Replace |
|---|---|
| `backgrokund: #111` in `.hero-image-wrapper` | `background: #111` |
| `body[style*="background-color: var(--light-bg)"] .cs-metadata` | `body.theme-light .cs-metadata` |
| The unterminated `/*` near `MOBILE OVERRIDES — NEW COMPONENTS` | close it with `*/` |

That last one is a real bug: a `/*` is opened and never closed before the next
`/*`. CSS comments do not nest, so every rule between them is silently
discarded. Verify with:

```bash
npx stylelint "src/styles/*.css" --formatter verbose
```

### 6.2 `data-reveal` migration for remaining pages

Files needing this: `About.tsx`, `Contact.tsx`, `Vault.tsx`, `Header.tsx`,
`Footer.tsx`, `MenuOverlay.tsx`.

The mapping is mechanical — it is exactly the old global selector lists, moved
onto the elements themselves.

**Old text selector list** → add `data-reveal="text"`:

```
main h1, main h2, main h3, main p,
.contact-link, .vault-link-label, .work-meta-brand,
.header-logo a, .header-time, .header-menu-toggle
```

**Old image selector list** → add `data-reveal="image"`:

```
.work-img-wrapper, .about-img-placeholder, .hero-image-wrapper, main img
```

**Every `<span className="line-reveal" />`** → add `data-reveal="line"`.

**Every `.parallax-wrapper`** → replace the class with `data-parallax`, and add
`data-parallax-img` to the `.parallax-img` inside it.

Then wire each page's root:

```tsx
import { useReveal } from '../hooks/useReveal';
import { useParallax } from '../hooks/useParallax';

export const About: React.FC = () => {
  const scope = useReveal<HTMLElement>({ deps: [] });
  useParallax(scope, []);

  return <main className="page-wrapper page-about" ref={scope}>…</main>;
};
```

If the page fetches from Sanity, pass the data into `deps` so setup re-runs
once the DOM exists — e.g. `useReveal({ deps: [items] })`.

`Header` and `Footer` sit outside the page scope. Give each its own
`useReveal` scope on its root element.

**Do not add `data-reveal="text"` to `.focus-skill`.** The original code
excluded it deliberately: those are CSS hover units, and splitting the short
uppercase labels produces wrong overflow masks.

### 6.3 Font conversion

```bash
pip install fonttools brotli

fonttools ttLib.woff2 compress src/assets/fonts/Nacelle-Light.otf
fonttools ttLib.woff2 compress src/assets/fonts/Nacelle-Regular.otf
fonttools ttLib.woff2 compress src/assets/fonts/Nacelle-Heavy.otf

mkdir -p public/fonts
mv src/assets/fonts/*.woff2 public/fonts/
```

Raw OTF is 3–5× the size of woff2. Serving from `public/fonts/` (rather than
importing through Vite) is what makes the `<link rel="preload">` in
`index.html` resolve to a stable, non-hashed URL.

### 6.4 `Header.tsx` — possible zero-width characters

> **UNVERIFIED.** In the source I was given, the header time markup reads as
> `<​span>LOCAL / <​/span>` with what appear to be U+200B zero-width spaces
> between `<` and `span`. If real, that renders the literal text
> `<span>LOCAL / </span>` in your header. This could equally be an artifact of
> how the file reached me.

Check first:

```bash
grep -rnP '\x{200b}|\x{200c}|\x{feff}' src/ || echo "clean"
```

If it reports hits, strip them:

```bash
grep -rlP '\x{200b}|\x{200c}|\x{feff}' src/ | xargs perl -i -pe 's/\x{200b}|\x{200c}|\x{feff}//g'
```

---

## 7. Commands, in order

```bash
# 1 — branch and baseline
git checkout -b perf/animation-overhaul
npm run build && ls -la dist/assets/*.js   # record sizes to compare later

# 2 — dependencies
npm remove react-player framer-motion split-type @portabletext/react
npm i @gsap/react
ls node_modules/gsap/SplitText.js && echo "SplitText OK" || npm i gsap@latest

# 3 — delete the superseded hooks
rm src/hooks/useGlobalTextReveal.ts src/hooks/useImageParallax.ts

# 4 — write every file from §5, then §6's manual edits

# 5 — fonts
pip install fonttools brotli
fonttools ttLib.woff2 compress src/assets/fonts/Nacelle-Light.otf
fonttools ttLib.woff2 compress src/assets/fonts/Nacelle-Regular.otf
fonttools ttLib.woff2 compress src/assets/fonts/Nacelle-Heavy.otf
mkdir -p public/fonts && mv src/assets/fonts/*.woff2 public/fonts/

# 6 — confirm nothing references the removed modules
grep -rn "useGlobalTextReveal\|useImageParallax\|split-type\|react-player\|framer-motion\|parallax-wrapper" src/

# 7 — typecheck, lint, build
npx tsc -b --noEmit
npm run lint
npm run build

# 8 — chunk sizes: expect several chunks, none over ~300KB
ls -la dist/assets/*.js

# 9 — preview the production build, not the dev server
npx vite preview

# 10 — deploy to a preview URL
npx vercel
```

---

## 8. Verification

Run against a **deployed preview URL on a real phone over cellular.** Not
localhost — it has zero latency, no compression cost and a warm cache, and it
will tell you the site is fine. Not the DevTools device emulator either — it
renders on your desktop GPU and hides every issue in §1.4.

**Bugs reported**

- [ ] `/work/monibac` renders
- [ ] Every case study reachable from `/work` renders
- [ ] Console is clean apart from browser-extension noise (`content.js`)
- [ ] No `GSAP target [object NodeList] not found`
- [ ] Nothing stays invisible after scrolling past it
- [ ] Text reveals fire once, in order, with no flash of unstyled text
- [ ] Rotating the phone does not leave text broken out of its mask
- [ ] Route changes land at the top of the page

**Performance**

- [ ] Network → Img: no single image over ~400KB
- [ ] Network → Font: Nacelle actually loads (this may be the first time)
- [ ] Network → JS: multiple chunks; case-study code absent until you navigate
- [ ] Splash screen completes in ~1.6s, not ~7s
- [ ] PageSpeed Insights on the preview URL, mobile preset — compare to before

**Mobile**

- [ ] No custom-cursor artifacts on touch
- [ ] Menu open blocks background scroll on iOS Safari specifically
- [ ] No horizontal overflow at 320px width
- [ ] No page jump when the address bar collapses

**Resilience**

- [ ] DevTools → Rendering → `prefers-reduced-motion: reduce` → everything
      visible, nothing animates, Lenis disabled
- [ ] Disable JS entirely → content is still visible (proves the `html.js` gate)
- [ ] Throttle to Slow 3G → reveals still fire correctly
- [ ] Point a case study at a deliberately broken video URL → page renders,
      warning logged, no white screen

---

## 9. Known unknowns

Things an agent should **not** silently resolve.

1. **`react-player` removal is a judgement call, not a repair.** I did not
   diagnose v3's actual export shape. Removal is correct on bundle-size
   grounds regardless — the schema offers only "Vimeo / Raw MP4" and playback
   is background mode — but if you specifically need Twitch, SoundCloud or
   Wistia later, this is the decision to revisit.

2. **The `Header.tsx` zero-width-space finding is UNVERIFIED.** See §6.4.

3. **`@gsap/react` may not be installed** despite being in `package.json`.
   §3 checks this. If it is genuinely absent, `useReveal` and `useParallax`
   will not resolve.

4. **`prefers-reduced-motion` now disables Lenis entirely.** That is correct
   behaviour, but it means the site scrolls natively for those users and the
   footer-uncover effect (which depends on `position: fixed` + `margin-bottom`)
   should be spot-checked in that mode.

5. **Vimeo/YouTube branches in `MediaItem` may be dead code.** If every case
   study uses a raw MP4, delete `EmbedFrame` and the two embed branches.

6. **`previewVideo` assets** (the media cursor) are still loaded at full size
   from `previewVideo.asset->url`. If those are large, they deserve the same
   treatment as images — I left them alone because I could not see their sizes.

7. **`studio/` lives in the same repo.** Confirm Vercel is not building or
   serving the Sanity Studio alongside the site.

8. **The SPA architecture is unchanged, by request.** For the record: the
   reveal bugs in §1.2 exist *because* layout is unstable at animation-setup
   time. §2.1 and §2.2 address that well enough for a portfolio, but
   prerendered HTML would remove the class of bug at the root, and would also
   fix the fact that no crawler or link-preview bot currently sees any content
   until JS boots and two Sanity round-trips complete. Not a blocker; noted so
   the decision stays deliberate.
