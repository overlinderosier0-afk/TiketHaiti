#!/usr/bin/env bash
#
# backup-db.sh — Sauvegarde quotidienne de la production TiketHaiti.
#
# Ce que ça sauvegarde :
#   1. La base PostgreSQL (dump pg_dump compressé)
#   2. Les affiches uploadées (volume api_uploads)
#
# Installation sur le VPS :
#   cd /opt/tikeayiti && git pull
#   chmod +x ops/backup-db.sh
#   ./ops/backup-db.sh                      # test manuel
#   crontab -e                              # puis ajouter :
#   0 3 * * * /opt/tikeayiti/ops/backup-db.sh >> /opt/tikeayiti/backups/backup.log 2>&1
#
# Restauration (base) :
#   gunzip -c /opt/tikeayiti/backups/tikeayiti-AAAA-MM-JJ.sql.gz | \
#     docker compose -f /opt/tikeayiti/docker-compose.prod.yml exec -T postgres \
#       env PGPASSWORD="$POSTGRES_PASSWORD" psql -U tike -d tikeayiti
#
set -euo pipefail

APP_DIR="/opt/tikeayiti"
BACKUP_DIR="$APP_DIR/backups"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
KEEP_DAYS=14
DATE="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
cd "$APP_DIR"

# Charge le .env si le mot de passe n'est pas déjà dans l'environnement.
if [ -z "${POSTGRES_PASSWORD:-}" ] && [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$APP_DIR/.env"
  set +a
fi

PGUSER="${POSTGRES_USER:-tike}"
PGDB="${POSTGRES_DB:-tikeayiti}"

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "[$DATE] ERREUR : POSTGRES_PASSWORD introuvable (.env ou environnement)" >&2
  exit 1
fi

echo "[$DATE] Début sauvegarde $PGDB ..."

# 1) Dump PostgreSQL compressé (--clean : restaurable sur une base existante)
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  env PGPASSWORD="$POSTGRES_PASSWORD" \
  pg_dump -U "$PGUSER" -d "$PGDB" --clean --if-exists --no-owner --no-acl \
  | gzip > "$BACKUP_DIR/tikeayiti-$DATE.sql.gz"

# 2) Affiches uploadées
UPLOADS_VOL="$(docker volume ls -q | grep -E 'api_uploads$' | head -1 || true)"
if [ -n "$UPLOADS_VOL" ]; then
  if ! docker run --rm -v "$UPLOADS_VOL:/data:ro" -v "$BACKUP_DIR:/backup" \
      alpine tar czf "/backup/uploads-$DATE.tar.gz" -C /data . 2>/dev/null; then
    echo "[$DATE] AVERTISSEMENT : sauvegarde des affiches échouée" >&2
  fi
else
  echo "[$DATE] AVERTISSEMENT : volume api_uploads introuvable" >&2
fi

# 3) Rotation : garde les N derniers jours
find "$BACKUP_DIR" -name 'tikeayiti-*.sql.gz' -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +$KEEP_DAYS -delete

SIZE="$(du -h "$BACKUP_DIR/tikeayiti-$DATE.sql.gz" | cut -f1)"
echo "[$DATE] OK — tikeayiti-$DATE.sql.gz ($SIZE), rotation ${KEEP_DAYS}j"
