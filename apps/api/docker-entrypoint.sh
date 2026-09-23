#!/bin/sh
# Point d'entrée du conteneur API.
# Applique les migrations Prisma AVANT de démarrer NestJS : sans ça,
# un déploiement sur une base vide (ou en retard d'une migration)
# démarre une API cassée. Échoue vite si la config est incomplète.
set -e

echo "[entrypoint] NODE_ENV=${NODE_ENV:-development}"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] ERREUR : DATABASE_URL n'est pas définie, arrêt."
  exit 1
fi

echo "[entrypoint] Application des migrations Prisma..."
prisma migrate deploy --schema ./prisma/schema.prisma

echo "[entrypoint] Démarrage de l'API..."
exec node dist/main.js
