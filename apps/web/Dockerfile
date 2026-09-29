# ---------- build ----------
FROM node:20-alpine AS builder
RUN npm install -g pnpm@9.15.5
WORKDIR /app

# Le lockfile d'abord pour profiter du cache Docker.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* est figé dans le JS au moment du build :
# le passer en --build-arg (voir docker-compose.prod.yml).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @tike-ayiti/web build

# Le dossier public n'existe pas toujours (aucun asset statique
# pour l'instant) : le créer pour que le COPY du runtime ne plante pas.
RUN mkdir -p apps/web/public

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Exécution en non-root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# En workspace pnpm, le standalone Next.js préserve l'arborescence du
# workspace : server.js vit dans apps/web/server.js, pas à la racine.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
