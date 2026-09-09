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
  projectType?: string;
  role?: string;
  timeline?: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
}

const PROJECTION = `
  _id, brand,
  "slug": slug.current,
  category, projectType, role, timeline,
  "thumbnailUrl": thumbnail.asset->url,
  "previewVideoUrl": previewVideo.asset->url
`;

/**
 * The year a project actually ran.
 *
 * NOT publishedAt — every document in the dataset carries a 2026 publish
 * date, because that field records when the case study was entered, not when
 * the work happened. `timeline` is the field with the real dates in it
 * ("Oct - Dec 2021"), so take the last four-digit year it contains.
 */
export const yearOf = (p: Project): string | null => {
  const years = p.timeline?.match(/\b(19|20)\d{2}\b/g);
  return years?.[years.length - 1] ?? null;
};

/** "Product Designer, Developer" is too long for a card. Compress it. */
export const roleOf = (p: Project): string | null => {
  if (!p.role) return null;
  const parts = p.role.split(',').map((r) => r.trim()).filter(Boolean);
  return parts.length > 1 ? 'Design + Build' : parts[0] ?? null;
};

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
