import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Pages privées : pas d'indexation.
        disallow: ['/admin', '/tickets', '/checkout', '/profile']
      }
    ],
    sitemap: 'https://tikeayiti.com/sitemap.xml'
  };
}
