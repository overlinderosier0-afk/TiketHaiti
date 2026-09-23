# Déploiement production — Tikè Ayiti

Guide pas-à-pas pour mettre Tikè Ayiti en ligne sur un VPS.
Durée estimée : 1 à 2 heures (DNS + premier démarrage inclus).

---

## 1. Prérequis

- [ ] Un VPS (2 vCPU / 4 Go RAM suffisent pour démarrer — ex. Hetzner, DigitalOcean)
- [ ] Un nom de domaine (ex. `tikeayiti.ht`)
- [ ] Docker + Docker Compose installés sur le VPS :
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER   # puis se reconnecter
  docker compose version
  ```
- [ ] Deux enregistrements DNS de type **A** vers l'IP du VPS :
  | Hôte | Type | Valeur |
  |------|------|--------|
  | `tikeayiti.ht` | A | `<IP du VPS>` |
  | `api.tikeayiti.ht` | A | `<IP du VPS>` |
- [ ] Ports **80** et **443** ouverts sur le firewall du VPS.

Vérifier la propagation DNS avant de continuer :
```bash
dig +short tikeayiti.ht
dig +short api.tikeayiti.ht
```

---

## 2. Récupérer le code et configurer l'environnement

```bash
git clone https://github.com/overlinderosier0-afk/TiketHaiti.git
cd TiketHaiti
cp .env.example .env
nano .env
```

### Checklist des variables à renseigner dans `.env`

**Obligatoires :**
- [ ] `DOMAIN` — ex. `tikeayiti.ht` (sans `https://`)
- [ ] `POSTGRES_PASSWORD` — mot de passe fort et unique (générer : `openssl rand -base64 24`)
- [ ] `JWT_SECRET` — 32 caractères aléatoires minimum (`openssl rand -base64 32`)
- [ ] `APP_SECRET` — idem, valeur différente
- [ ] `QR_SECRET` — idem, valeur différente
- [ ] `MERCHANT_MONCASH_NUMBER` — ton vrai numéro marchand MonCash (format `+509XXXXXXXX`)
- [ ] `MERCHANT_NATCASH_NUMBER` — ton vrai numéro marchand NatCash
- [ ] `SEED_ADMIN_PASSWORD` — mot de passe admin initial fort (changé juste après, voir §4)

**Recommandées :**
- [ ] `RESEND_API_KEY` + `ADMIN_EMAIL` — sans ça, tu ne reçois **aucune alerte**
  quand un paiement attend ta validation (les commandes expirent après 2h !)
- [ ] `FRONTEND_URL` / `CORS_ORIGIN` — `https://tikeayiti.ht`
- [ ] `PAYMENT_EXPIRY_HOURS` — `2` par défaut

**Ne jamais committer `.env`.** Il est déjà dans `.gitignore`.

---

## 3. Premier démarrage

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Ce qui se passe :
1. Postgres démarre (données persistées dans le volume `pgdata`).
2. L'API applique automatiquement les migrations Prisma (`prisma migrate deploy`
   dans l'entrypoint), puis démarre sur le port interne 3001.
3. Le frontend Next.js est buildé avec `NEXT_PUBLIC_API_URL=https://api.<DOMAIN>`.
4. Caddy obtient les certificats HTTPS automatiquement pour `<DOMAIN>` et `api.<DOMAIN>`.

Vérifier :
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api   # migrations OK ?
curl -s https://api.tikeayiti.ht/events | head -c 200    # adapter le domaine
```

---

## 4. Seed initial + sécurisation du compte admin

Le seed crée les villes, catégories, 2 événements de démo et le compte admin.
À exécuter **une seule fois** (idempotent), depuis le repo sur le VPS :

```bash
cd /chemin/vers/TiketHaiti
pnpm install
# Pointe vers la base du compose de prod le temps du seed :
DATABASE_URL="postgresql://tike:<POSTGRES_PASSWORD>@localhost:5432/tikeayiti" \
  pnpm --filter @tike-ayiti/api seed
```

> Le port 5432 de Postgres n'est pas publié en prod : exécute cette commande
> **sur le VPS** (ou via `ssh`), pas depuis ta machine locale.

**Immediately après :**
1. Connecte-toi sur `https://tikeayiti.ht/login` avec `SEED_ADMIN_EMAIL` /
   `SEED_ADMIN_PASSWORD`.
2. Change le mot de passe admin (page profil).
3. Supprime les événements de démo si besoin (admin → événements).

---

## 5. Backups

Sans backup, une panne du VPS = perte de toutes les commandes et billets.

**Backup manuel :**
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U tike tikeayiti | gzip > backup-$(date +%F).sql.gz
```

**Backup automatique quotidien** (cron sur le VPS, `crontab -e`) :
```cron
0 3 * * * cd /chemin/vers/TiketHaiti && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U tike tikeayiti | gzip > /var/backups/tikeayiti/backup-$(date +\%F).sql.gz && find /var/backups/tikeayiti -name 'backup-*.sql.gz' -mtime +14 -delete
```

**Restauration :**
```bash
gunzip -c backup-2026-09-23.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U tike tikeayiti
```

> Idéal : copier les backups hors du VPS (ex. `scp` vers ta machine, ou stockage objet).

---

## 6. Mises à jour

```bash
cd /chemin/vers/TiketHaiti
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Les migrations s'appliquent automatiquement au redémarrage de l'API.
En cas de problème : `docker compose -f docker-compose.prod.yml logs api`.

---

## 7. Commandes utiles

```bash
# État des services
docker compose -f docker-compose.prod.yml ps

# Logs en direct
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f caddy

# Purger manuellement les commandes expirées (le cron le fait déjà toutes les 10 min)
curl -X POST https://api.tikeayiti.ht/admin/orders/sweep-expired \
  -H "Authorization: Bearer <TOKEN_ADMIN>"

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart api
```

---

## 8. Checklist pré-lancement

- [ ] DNS `tikeayiti.ht` + `api.tikeayiti.ht` → IP du VPS, HTTPS valide (cadenas)
- [ ] Tous les secrets de `.env` renseignés (aucun `change-me` restant)
- [ ] Numéros marchands MonCash/NatCash réels configurés
- [ ] Compte admin seed sécurisé (mot de passe changé)
- [ ] `RESEND_API_KEY` + `ADMIN_EMAIL` configurés (alertes de paiement)
- [ ] Parcours complet testé : inscription → commande → paiement initié →
      validation admin → billets + QR + PDF → check-in
- [ ] Expiration testée (commande impayée annulée après le délai, places libérées)
- [ ] Backup automatique en place et restauration testée au moins une fois
- [ ] Page d'accueil : texte honnête (pas de promesse « instantané »), pas de faux avis

---

## 9. Limites connues du MVP

- **Paiement 100 % manuel** : chaque transfert MonCash/NatCash doit être vérifié
  à la main dans « Paiements en attente ». Prévoir une personne disponible,
  sinon les commandes expirent. À terme : intégration des API officielles
  MonCash/NatCash pour une confirmation automatique.
- **Pas d'envoi des billets** par email/WhatsApp pour l'instant : le client les
  récupère sur son profil.
- **Un seul rôle admin** : pas encore de comptes « organisateur » autonomes.
