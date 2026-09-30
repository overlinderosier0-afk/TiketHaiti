import type { MetadataRoute } from 'next';

const SITE_URL = 'https://tikeayiti.com';

// Pages publiques statiques.
const STATIC_ROUTES = ['', '/events', '/login', '/register'];

type ApiEvent = { slug?: string; id: string; updatedAt?: string };

async function publishedEvents(): Promise<ApiEvent[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL || 'https://api.tikeayiti.com';
  try {
    const res = await fetch(`${base}/events?status=PUBLISHED`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.events || [];
  } catch {
    // L'API est injoignable au build : sitemap sans les événements.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route || '/'}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7
  }));

  const events = await publishedEvents();
  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE_URL}/events/${e.slug || e.id}`,
    lastModified: e.updatedAt ? new Date(e.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  return [...staticEntries, ...eventEntries];
}
