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
- Pas de DB en v0.5 — stockage texte dans `FLOATE_DATA_DIR`

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
| `FLOATE_DATA_DIR` | `./data` (cwd)      | Où le serveur écrit stats/logs. **Doit être inscriptible par l'user du service.** |

Pour ajouter / changer une variable :

```bash
sudo systemctl edit floate-signaling
# Ajoute dans le bloc [Service] :
#   Environment=ADMIN_TOKEN=xxxxxxxxxxxxx
#   Environment=FLOATE_DATA_DIR=/var/lib/floate
# Sauve, puis :
sudo systemctl daemon-reload
sudo systemctl restart floate-signaling
```

---

## 4. Fichiers et chemins

### Code source

```
/var/www/floate/          ← cloné depuis git, c'est le repo entier
├── src/                  Front Vue (Lobby, Room, Admin, Infos, Contact)
├── server/               Back signaling Node
│   ├── index.js          Entrée : WS signaling + admin + endpoints HTTP
│   ├── stats.js          Tracking + persistance KPIs/logs
│   └── test/             Tests Node natifs
└── dist/                 (produit par `npm run build`, sert localement
                           si tu testes sans Cloudflare)
```

### Données (FLOATE_DATA_DIR)

```
/var/lib/floate/          ← chemin recommandé en prod (à créer + chown)
├── stats.json            KPIs cumulés (visites, sessions, sources,
                            trafic, géo). Flushé toutes les 30s.
├── events.log            NDJSON append-only (1 event par ligne).
└── chat/
    ├── ABC-123.log       NDJSON par room (peerId, pseudo, text, ts).
    ├── XYZ-789.log
    └── ...
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
npm install --omit=dev    # si dépendances ont bougé
sudo systemctl restart floate-signaling
sudo journalctl -u floate-signaling -n 30   # vérifier le boot
```

---

## 7. Pannes courantes — réflexes

| Symptôme | Réflexe |
|---|---|
| Page admin renvoie 401 | `systemctl show floate-signaling -p Environment` → comparer avec le token tapé. Si différent : `localStorage.removeItem('floate.admin-token')` côté nav puis recoller le bon. |
| WS ne se connecte pas (HTTPS prod) | Vérifier `CORS_ORIGIN` dans l'override, certificat valide (Let's Encrypt / CF), reverse proxy nginx upgrade headers. |
| Logs spam `EACCES` / `EROFS` sur `data/` | Permissions : `sudo mkdir -p /var/lib/floate && sudo chown -R USER:USER /var/lib/floate` puis exporter `FLOATE_DATA_DIR=/var/lib/floate`. Si systemd hardening : ajouter `ReadWritePaths=/var/lib/floate`. |
| Port 8787 déjà pris au start | L'override a déjà un `ExecStartPre=/bin/sh -c 'fuser -k 8787/tcp || true'` qui tue ce qui traîne. Si ça persiste : `sudo lsof -i :8787`. |
| Stats restent à zéro après restart | Soit `persistenceEnabled = false` (cf. message au boot dans les logs), soit le chemin `FLOATE_DATA_DIR` change entre runs. |
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

# Disque (logs persistés)
df -h
du -sh /var/lib/floate/*
```

---

## 9. Notes pour v0.6

- Migrer `stats.json` + `events.log` + `chat/*.log` vers SQLite.
- Brancher la geo IP réelle (fini le proxy `Accept-Language`).
- Brancher Stripe / Ko-fi sur le bouton café du footer.
- Brancher le form Contact sur Formspree ou un mailer.
- Rotation des logs (logrotate ou côté code).
- Anti-spam form Contact (honeypot ou captcha invisible).
