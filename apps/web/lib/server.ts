/**
 * Helpers pour les Server Components : appels API côté serveur et URLs
 * publiques absolues (meta Open Graph / Twitter).
 *
 * API_INTERNAL_URL (ex. http://api:3001 en prod Docker) évite l'aller-retour
 * par le réseau public lors du rendu serveur. À défaut, on retombe sur
 * l'URL publique de l'API.
 */
export function serverApiBase(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001'
  );
}

/**
 * URL publique absolue d'une affiche d'événement (og:image, twitter:image).
 * Les chemins /uploads/... sont servis par l'API, donc préfixés avec son
 * URL publique ; les URLs absolues passent telles quelles.
 */
export function publicUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
