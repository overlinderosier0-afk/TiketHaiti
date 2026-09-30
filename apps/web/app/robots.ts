import type { MetadataRoute } from 'next';

// Crawlers des moteurs IA / génératifs : autorisés explicitement sur le
// contenu public (GEO). Les pages privées restent interdites à tous.
const AI_BOTS = [
  'GPTBot', // OpenAI (indexation)
  'ChatGPT-User', // OpenAI (navigation utilisateur)
  'ClaudeBot', // Anthropic
  'anthropic-ai', // Anthropic
  'PerplexityBot', // Perplexity
  'Google-Extended', // Google (Gemini / AI Overviews)
  'Applebot-Extended', // Apple
  'Bytespider', // ByteDance
  'Amazonbot', // Amazon
  'Meta-WebIndexer' // Meta
];

const PRIVATE_PATHS = ['/admin', '/tickets', '/checkout', '/profile'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Pages privées : pas d'indexation.
        disallow: PRIVATE_PATHS
      },
      // Règles explicites pour les crawlers IA : même portée que '*'.
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: PRIVATE_PATHS
      }))
    ],
    sitemap: 'https://tikeayiti.com/sitemap.xml'
  };
}
