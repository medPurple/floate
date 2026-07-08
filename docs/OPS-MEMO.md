# floate — Mémo ops

Note perso pour ne plus se perdre entre VPS, Cloudflare, systemd et logs.
Pas de doc publique : c'est ton aide-mémoire pour quand tu reviens dans
3 mois et que tu as oublié où vit quoi.

---

## 1. Architecture en 30 secondes

**Front statique** sur Cloudflare Pages
- Build à chaque `git push` sur la branche prod
- Sert `dist/` (Vite) → le Lobby, les Rooms, AdminStatsView, Infos, Contact
- Aucune logique métier : c'est juste du HTML/CSS/JS qui parle au back

**Back signaling** sur ton VPS
- Process Node `server/index.js` lancé par systemd
- Écoute sur `:8787` (HTTP + deux upgrade WebSocket : `/signaling` mesh
  + `/admin/stream` push admin)
- Stats/events/chat persistés en **PostgreSQL** (VPS dédié `51.91.122.50`,
  base `floate_db`) — voir `server/schema.sql` pour les tables et §3/§4
  ci-dessous pour la connexion. Plus aucun fichier local (`server/data/`
  a été supprimé).

**Trafic audio** : 0 transit par ton serveur. Les peers se parlent en
P2P (WebRTC mesh). Le serveur ne fait que le rendez-vous + relayer le
chat / les events.

---

## 2. Service systemd

Unit : `floate-signaling.service`

### Commandes les plus utiles

```bash
# État + extraits de logs
sudo systemctl status floate-signaling

# Redémarrer après un git pull
sudo systemctl restart floate-signaling

# Stop / start
sudo systemctl stop floate-signaling
sudo systemctl start floate-signaling

# Modifier l'override (env vars notamment)
sudo systemctl edit floate-signaling
# → recharger après édition :
sudo systemctl daemon-reload
sudo systemctl restart floate-signaling

# Voir TOUTES les variables d'env injectées (utile pour debugger un 401)
sudo systemctl show floate-signaling -p Environment -p EnvironmentFiles
```

### Logs (journalctl)

```bash
# Suivre en live
sudo journalctl -u floate-signaling -f

# Les 100 dernières lignes
sudo journalctl -u floate-signaling -n 100

# Depuis 10 minutes
sudo journalctl -u floate-signaling --since "10 min ago"

# Sur une plage
sudo journalctl -u floate-signaling --since "today 09:00" --until "today 12:00"
```

---

## 3. Variables d'env importantes

Définies dans l'override `/etc/systemd/system/floate-signaling.service.d/override.conf` :

| Variable | Défaut | À quoi ça sert |
|---|---|---|
| `ADMIN_TOKEN`     | `admin`             | Token pour ouvrir `/#/admin/stats`. À mettre en clair long aléatoire en prod. |
| `PORT`            | `8787`              | Port HTTP+WS local du signaling. |
| `CORS_ORIGIN`     | `*`                 | Origines autorisées pour CORS et WS upgrade. En prod : liste séparée par virgules. |
| `DATABASE_URL`    | *(aucun, requis)*   | Connexion Postgres, ex. `postgresql://floate:MOT_DE_PASSE@10.10.0.1:5432/floate_db`. **Le process refuse de démarrer sans (`ensureDbReady()` fail-fast).** Si le mot de passe contient `+`/`/`, l'encoder en URL ou passer par des variables séparées. |

Pour ajouter / changer une variable :

```bash
sudo systemctl edit floate-signaling
# Ajoute dans le bloc [Service] :
#   Environment=ADMIN_TOKEN=xxxxxxxxxxxxx
#   Environment=DATABASE_URL=postgresql://floate:xxx@10.10.0.1:5432/floate_db
# Sauve, puis :
sudo systemctl daemon-reload
sudo systemctl restart floate-signaling
```

**Accès réseau à la DB** : le VPS DB (`51.91.122.50`) n'expose Postgres que
sur `localhost` + l'interface Wireguard (`10.10.0.1`), jamais publiquement.
Si le serveur de signaling tourne sur une autre machine, il doit d'abord
être ajouté comme peer Wireguard (`/root/add-wg-peer.sh` sur le VPS DB)
avant que `DATABASE_URL` puisse pointer vers `10.10.0.1`.

---

## 4. Fichiers et chemins

### Code source

```
/var/www/floate/          ← cloné depuis git, c'est le repo entier
├── src/                  Front Vue (Lobby, Room, Admin, Infos, Contact)
├── server/               Back signaling Node
│   ├── index.js          Entrée : WS signaling + admin + endpoints HTTP
│   ├── stats.js          Tracking + lecture des KPIs (requêtes SQL live)
│   ├── db.js             Pool pg + ensureDbReady()
│   ├── schema.sql        DDL des tables (à rejouer si nouvelle DB)
│   └── test/             Tests Node natifs (health.test.js a besoin de
│                           DATABASE_URL joignable pour tourner)
└── dist/                 (produit par `npm run build`, sert localement
                           si tu testes sans Cloudflare)
```

### Données (PostgreSQL)

VPS dédié `51.91.122.50` (Debian 13), base `floate_db`, user `floate`.
Tables : `visits`, `closed_sessions`, `listen_sources`, `traffic_sources`,
`geo_stats`, `events`, `chat_messages` — voir `server/schema.sql`.

```bash
# Depuis ta machine, tunnel SSH pour DBeaver/psql en local :
ssh -L 5432:localhost:5432 debian@51.91.122.50

# Ou en direct depuis le VPS DB :
PGPASSWORD='...' psql -h localhost -U floate -d floate_db
```

### systemd

```
/etc/systemd/system/floate-signaling.service                 unit principale
/etc/systemd/system/floate-signaling.service.d/override.conf override (env, hooks)
```

---

## 5. Endpoints HTTP utiles

### Public

```bash
# Healthcheck (pas d'auth)
curl https://ton-domaine/health

# Liste des rooms publiques
curl https://ton-domaine/api/public-rooms
```

### Admin (token requis, en query string ou header)

```bash
# Snapshot complet (KPIs + top rooms + events récents)
curl 'https://ton-domaine/admin/api/snapshot?token=TON_TOKEN'

# Juste le flux events récents
curl 'https://ton-domaine/admin/api/events?token=TON_TOKEN'
```

### URLs front (à coller dans le navigateur)

```
https://floate.app/                          Lobby
https://floate.app/#/r/AAA-111               Room directe par code
https://floate.app/#/infos                   Page infos
https://floate.app/#/contact                 Page contact
https://floate.app/#/admin/stats             Console admin (token requis)
```

---

## 6. Procédure de déploiement

### Front (Cloudflare Pages)

```bash
# Sur ta machine :
git add . && git commit -m "..." && git push
# → CF Pages rebuild auto. Pas besoin de toucher au VPS.
```

### Back (VPS, après modification de server/ ou stats.js)

```bash
ssh ton-vps
cd /var/www/floate
git pull
cd server
npm install --omit=dev    # si dépendances ont bougé (pg ajouté en v0.6)
sudo systemctl restart floate-signaling
sudo journalctl -u floate-signaling -n 30   # vérifier le boot (DB OK ?)
```

Si `server/schema.sql` a changé (nouvelle table/colonne), le rejouer à la
main sur `floate_db` — pas de système de migration automatique pour
l'instant.

---

## 7. Pannes courantes — réflexes

| Symptôme | Réflexe |
|---|---|
| Page admin renvoie 401 | `systemctl show floate-signaling -p Environment` → comparer avec le token tapé. Si différent : `localStorage.removeItem('floate.admin-token')` côté nav puis recoller le bon. |
| WS ne se connecte pas (HTTPS prod) | Vérifier `CORS_ORIGIN` dans l'override, certificat valide (Let's Encrypt / CF), reverse proxy nginx upgrade headers. |
| Port 8787 déjà pris au start | L'override a déjà un `ExecStartPre=/bin/sh -c 'fuser -k 8787/tcp || true'` qui tue ce qui traîne. Si ça persiste : `sudo lsof -i :8787`. |
| Le service ne démarre pas / boucle en restart | `ensureDbReady()` échoue → `DATABASE_URL` absent, mauvais mot de passe, ou Wireguard down entre ce serveur et le VPS DB. Voir `sudo journalctl -u floate-signaling -n 30` pour le message d'erreur exact, et `sudo wg show` sur le VPS DB pour vérifier que le peer a un handshake récent. |
| Stats à zéro alors que du monde est connecté | Vérifier que les tables existent (`\dt` dans psql) et que `trackVisit`/`trackEvent` ne loguent pas d'erreur dans les logs (`[stats] trackVisit: ...`) — le tracking est fire-and-forget, une erreur DB ne casse pas la connexion WS mais est juste warnée en log. |
| Audio qui « accélère/ralentit » | Détecteur stream-health côté listener. Si trop sensible, ajuster les seuils dans `src/lib/streamHealth.js` (POOR_CONCEAL_RATE, GRACE_PERIOD_MS). |
| Deux services systemd `floate*` actifs | Vestige d'un ancien déploiement. Le bon est `floate-signaling.service`. Pour virer l'autre : `sudo systemctl stop floate.service && sudo systemctl disable floate.service && sudo rm /etc/systemd/system/floate.service && sudo systemctl daemon-reload && sudo systemctl reset-failed`. |

---

## 8. Surveiller la conso du serveur

```bash
# Live interactif (le mieux pour explorer)
htop

# Par service systemd (isolé du bruit système) — ⭐ idéal pour floate
systemd-cgtop

# Top 15 processus par RAM, snapshot
ps aux --sort=-%mem | head -15

# RAM/swap global
free -h

# État + conso précise du signaling
systemctl status floate-signaling
systemctl show floate-signaling -p MemoryCurrent -p CPUUsageNSec

# Suivi en continu, toutes les 2s
watch -n 2 'systemctl status floate-signaling | grep -E "Memory|CPU"'

# Disque (sur le VPS DB, 51.91.122.50)
df -h
sudo du -sh /var/lib/postgresql/*
```

---

## 9. Notes pour v0.6

- ~~Migrer `stats.json` + `events.log` + `chat/*.log` vers SQLite~~ → fait,
  migré vers PostgreSQL (voir §1/§4) plutôt que SQLite.
- Le sélecteur 24h/7j/30j de la console admin (`RangeToggle`) n'est
  **pas branché** — `range` change juste le label affiché, pas les
  données. Maintenant que `visits` garde un timestamp par ligne
  (au lieu d'un total reset chaque jour), c'est faisable : agréger
  par jour sur la période demandée côté `stats.js` + nouvel endpoint.
- Brancher la geo IP réelle (fini le proxy `Accept-Language`).
- Brancher Stripe / Ko-fi sur le bouton café du footer.
- Brancher le form Contact sur Formspree ou un mailer.
- Rotation/purge des vieilles lignes `visits`/`events` si la table
  grossit trop (pas de limite pour l'instant, seul `closed_sessions`
  est purgé au-delà de 24h via `startSessionPruning()`).
- Anti-spam form Contact (honeypot ou captcha invisible).
