# ---------- build ----------
FROM node:20-alpine AS build
RUN npm install -g pnpm@9.15.5
WORKDIR /app

# Le repo est un workspace pnpm : l'ancien Dockerfile faisait
# `npm install` à la racine de l'API, ce qui ignorait le lockfile
# et cassait la résolution des dépendances. On installe depuis
# la racine du workspace, de façon reproductible.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
RUN pnpm --filter @tike-ayiti/api exec prisma generate \
 && pnpm --filter @tike-ayiti/api run build \
 && pnpm --filter @tike-ayiti/api deploy /prod/api --prod

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# CLI Prisma : l'entrypoint l'utilise pour `prisma migrate deploy`
# avant de démarrer l'API (indispensable en production).
RUN npm install -g prisma@6.19.3

COPY --from=build /prod/api ./
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3001
# `sh` explicite : pas de dépendance au bit exécutable du script.
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
