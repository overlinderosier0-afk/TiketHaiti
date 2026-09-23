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

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Exécution en non-root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
