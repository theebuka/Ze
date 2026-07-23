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
