// Limites anti brute-force appliquées aux routes d'authentification
// (/auth/login, /auth/register). TTL en millisecondes, comme attendu
// par @nestjs/throttler. Surchargeable via l'environnement.
export const AUTH_THROTTLE = {
  ttl: parseInt(process.env.AUTH_RATE_LIMIT_TTL_SECONDS || '60', 10) * 1000,
  limit: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10)
};
