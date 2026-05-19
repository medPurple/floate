# Déploiement floate sur un nom de domaine

Guide pour passer de `localhost:5173` à `https://floate.tondomaine.com`. On
suppose que tu as un VPS (ou n'importe quel hôte qui peut faire tourner
un process Node et écouter sur le port 443) et un domaine pointé dessus.

## Vue d'ensemble

```
                    Caddy (TLS auto Let's Encrypt)
                       ↓
        ┌──────────────┴──────────────┐
        │                             │
   floate.tondomaine.com         sig.tondomaine.com
   (front statique)              (serveur signaling Node)
   /var/www/floate/dist          PM2 / systemd, port 8787 en interne
```

Deux sous-domaines, deux choses différentes. Tu peux aussi tout mettre
sous un seul host avec un path-routing — la section §5 montre comment.

---

## 1. DNS

Crée deux enregistrements `A` (ou `AAAA` pour IPv6) qui pointent sur l'IP
de ton serveur :

```
floate.tondomaine.com   A    203.0.113.42
sig.tondomaine.com      A    203.0.113.42
```

Attends la propagation (5 min à quelques heures) avant de passer aux
certificats.

---

## 2. Build du front

Le front est un bundle statique. À ton serveur, ou en CI :

```bash
git clone <ton-repo> /var/www/floate
cd /var/www/floate
npm run install:all
echo "VITE_SIGNALING_URL=wss://sig.tondomaine.com" > .env.production
npm run build       # produit dist/
```

Le `dist/` qui en sort est ce que Caddy va servir.

---

## 3. Serveur de signaling avec systemd

Crée `/etc/systemd/system/floate-signaling.service` :

```ini
[Unit]
Description=floate signaling server
After=network.target

[Service]
Type=simple
User=floate
WorkingDirectory=/var/www/floate/server
Environment=PORT=8787
Environment=ADMIN_TOKEN=change-moi-en-quelque-chose-de-long
Environment=CORS_ORIGIN=https://floate.tondomaine.com
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=5

# Hardening léger
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Puis :

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin floate
sudo chown -R floate:floate /var/www/floate
sudo systemctl daemon-reload
sudo systemctl enable --now floate-signaling
sudo systemctl status floate-signaling
sudo journalctl -u floate-signaling -f    # suivre les logs
```

Le serveur écoute maintenant sur `127.0.0.1:8787` (par défaut, le bind
est sur toutes les interfaces — c'est Caddy qui s'occupe d'exposer
publiquement avec TLS).

---

## 4. Caddy — TLS auto + reverse proxy WSS

Caddy gère Let's Encrypt automatiquement. Installation :

```bash
sudo apt install -y caddy        # Debian/Ubuntu via le repo officiel Caddy
```

`/etc/caddy/Caddyfile` :

```caddy
# ─── Front statique ────────────────────────────────────────────────
floate.tondomaine.com {
    root * /var/www/floate/dist
    encode gzip zstd
    file_server

    # SPA fallback (hash-routing : vue-router le gère côté client mais
    # un reload doit toujours servir index.html)
    try_files {path} /index.html

    header {
        # Sécurité de base
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
        Permissions-Policy "display-capture=(self)"
    }

    # Cache long pour les hash-assets, court pour index.html
    @hashed path_regexp \.[0-9a-f]{8,}\.(js|css|woff2?|ico|svg|png|webp)$
    header @hashed Cache-Control "public, max-age=31536000, immutable"
    header /index.html Cache-Control "no-cache"
}

# ─── Serveur de signaling (WSS + HTTP admin) ───────────────────────
sig.tondomaine.com {
    encode gzip zstd

    # Reverse proxy : Caddy détecte automatiquement l'upgrade WebSocket.
    reverse_proxy 127.0.0.1:8787 {
        # Headers utiles pour la géo IP (Caddy met X-Forwarded-For par défaut)
        header_up X-Real-IP {remote_host}
    }

    # CORS pour le front si tu sers depuis un host différent.
    @options method OPTIONS
    handle @options {
        header Access-Control-Allow-Origin "https://floate.tondomaine.com"
        header Access-Control-Allow-Methods "GET, OPTIONS"
        header Access-Control-Allow-Headers "Content-Type, Authorization"
        respond 204
    }
    header Access-Control-Allow-Origin "https://floate.tondomaine.com"
}
```

Recharge :

```bash
sudo systemctl reload caddy
sudo journalctl -u caddy -n 100
```

Caddy obtient le cert Let's Encrypt automatiquement. En une minute ton
`https://floate.tondomaine.com` répond et `wss://sig.tondomaine.com` aussi.

---

## 5. Variante : un seul host avec path-routing

Si tu veux tout sous `floate.tondomaine.com` :

```caddy
floate.tondomaine.com {
    encode gzip zstd

    # WS et REST admin → serveur Node
    @sig path /signaling /admin/* /health
    handle @sig {
        reverse_proxy 127.0.0.1:8787
    }

    # Tout le reste → front statique
    handle {
        root * /var/www/floate/dist
        try_files {path} /index.html
        file_server
    }
}
```

Et côté front, `.env.production` :

```
VITE_SIGNALING_URL=wss://floate.tondomaine.com/signaling
```

Mais attention : le serveur actuel accepte le WS à la racine **et** sur
`/admin/stream` mais pas sur `/signaling`. Il faut ajouter cette route
côté serveur (1 ligne dans `httpServer.on('upgrade')`). Le mode deux
sous-domaines est plus simple.

---

## 6. Console admin

Le ADMIN_TOKEN est dans le systemd unit (cf §3). Au premier accès à
`https://floate.tondomaine.com/#/admin/stats`, on te demande le token —
le navigateur le persiste en `localStorage`.

**Ne le donne à personne** et change-le si tu suspectes une fuite (il
suffit d'éditer le unit + `systemctl restart floate-signaling`).

---

## 7. Bot Discord — surveiller /health

Ton bot ping `https://sig.tondomaine.com/health` toutes les 6h. La
réponse est un JSON :

```json
{
  "ok": true,
  "version": "0.2.0",
  "uptimeSeconds": 81342,
  "rooms": 3,
  "users": 12,
  "timestamp": "2026-05-18T14:32:11.842Z"
}
```

Le contrat de cette réponse est protégé par les tests automatiques
(`npm run test:server`) — si une PR le casse, le test rouge. Si tu veux
ajouter un champ pour le bot, ajoute-le aux assertions de
`server/test/health.test.js` en même temps que dans `buildHealth()`.

Exemple de check côté bot (Node, sans dépendance) :

```js
async function checkFloate() {
  const res = await fetch('https://sig.tondomaine.com/health', {
    signal: AbortSignal.timeout(5000)
  })
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
  const h = await res.json()
  if (!h.ok) return { ok: false, reason: 'health.ok=false' }
  return { ok: true, uptimeHours: Math.floor(h.uptimeSeconds / 3600), users: h.users }
}
```

À programmer en cron Discord (`setInterval(checkFloate, 6*60*60*1000)`)
ou en `node-cron`.

---

## 8. STUN / TURN

En local sur le même réseau, STUN public Google suffit. **Dès qu'un user
est derrière un NAT symétrique** (4G mobile, certains wifi entreprise),
il faut un serveur TURN.

Option simple : [coturn](https://github.com/coturn/coturn) sur le même
VPS, ports `3478/udp 5349/tcp`. Configure dans `src/lib/config.js` :

```js
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:turn.tondomaine.com:3478',
    username: 'floate',
    credential: 'mot-de-passe-long'
  }
]
```

Pas critique tant que tu testes entre potes sur du wifi maison. À ajouter
dès que tu déploies pour de vrai.

---

## 9. Variante : front sur Cloudflare Pages, back sur ton VPS

C'est probablement la combinaison la plus simple : Cloudflare héberge
le bundle statique avec CDN mondial + TLS auto + builds Git, et ton VPS
ne fait tourner que le serveur de signaling (Node + Caddy + Let's Encrypt).

```
            Cloudflare Pages (front statique, CDN)
            floate.tondomaine.com
                          │
                          │  WSS + HTTPS
                          ▼
            Ton VPS (Caddy → Node)
            sig.tondomaine.com
```

### 9.1 Front sur Cloudflare Pages

**Via le dashboard** :

1. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. Choisis ton repo. Build settings :
   - Framework preset : **Vite**
   - Build command : `npm run build`
   - Build output directory : `dist`
   - Root directory : (vide ou `.`)
   - Node version : `20`
3. **Environment variables** (onglet Settings) — section *Production* :
   ```
   VITE_SIGNALING_URL = wss://sig.tondomaine.com
   ```
   À répéter en *Preview* si tu veux que les PR builds pointent ailleurs.
4. Déploiement → CF te donne `floate.pages.dev`. Custom domain : ajoute
   `floate.tondomaine.com`, CF te crée le CNAME et le cert.

**Via CLI Wrangler** (si tu préfères) :

```bash
npm i -g wrangler
wrangler pages project create floate
echo "VITE_SIGNALING_URL=wss://sig.tondomaine.com" > .env.production
npm run build
wrangler pages deploy dist --project-name=floate
```

### 9.2 Côté back (VPS) — CORS strict

Le serveur a une whitelist d'origines via `CORS_ORIGIN`. Mets-la dans
ton unit systemd (et **pas `*`** en prod, surtout avec la console admin
accessible publiquement) :

```ini
Environment=ADMIN_TOKEN=change-moi-en-quelque-chose-de-long
Environment=CORS_ORIGIN=https://floate.tondomaine.com,https://floate.pages.dev
```

Sépare par virgules si tu as plusieurs origines légitimes (la prod et
les preview builds CF, par exemple). Le serveur retournera le bon
`Access-Control-Allow-Origin` selon l'origine de la requête, et refusera
le WS upgrade pour tout autre site.

### 9.3 DNS — proxy orange ou DNS only ?

Tu as deux options pour `sig.tondomaine.com` :

**A. DNS only (gris) — recommandé pour démarrer**
Le record `A sig.tondomaine.com → IP du VPS` en mode "DNS only". Caddy
gère le TLS sur ton VPS, le trafic est direct entre le client et toi.
Pas de timeout WS, pas de surprise. C'est le plus simple.

**B. Proxy Cloudflare (orange)**
Tu actives le proxy pour profiter du DDoS protection et du caching. CF
supporte les WebSockets sur le plan gratuit, **mais** :
- timeout par défaut **100 secondes** sur le plan Free (la connexion WS
  se ferme silencieusement après 100s d'inactivité). À toi de gérer
  le heartbeat côté serveur ou de payer pour augmenter ce timeout.
- ports HTTPS supportés : 443 uniquement sur Free. Caddy écoute déjà
  là — pas de souci.
- TLS terminé chez CF → ton Caddy peut rester en HTTPS aussi (full
  strict, recommandé) ou en HTTP si tu fais confiance au lien CF→VPS.

Si tu actives le proxy, ajoute aussi `Origin` aux headers que ton serveur
voit (Cloudflare le passe tel quel, donc ça marche déjà). Pour le
heartbeat, ajoute dans `useSignaling.js` un ping toutes les 30s :

```js
setInterval(() => send({ type: 'ping' }), 30_000)
```

et côté `server/index.js` un handler `if (msg.type === 'ping') return`
qui consomme le message sans rien faire — ça suffit à garder la
connexion vivante.

### 9.4 Mixed content : le piège classique

Si ton front est en `https://` (CF l'impose) et que tu pointes
`VITE_SIGNALING_URL` sur `ws://` (sans S), le navigateur **bloque
silencieusement** la connexion WS — pas de message d'erreur clair, juste
une console qui dit "An insecure WebSocket connection may not be
initiated from a page loaded over HTTPS".

→ Toujours `wss://` quand le front est sur Cloudflare. Et pour
`ADMIN_HTTP_URL` (dérivé automatiquement par `src/lib/config.js`),
ça se traduit en `https://` côté admin REST. Vérifie que ton Caddy a
bien le cert avant de pousser le front en prod.

### 9.5 Pages preview, branches de feature

Les builds de preview CF Pages ont des URLs en
`floate-abcdef.<projet>.pages.dev`. Pour qu'elles puissent parler au
même serveur de signaling, tu as deux options :

- Wildcard dans la whitelist : `CORS_ORIGIN=https://floate.tondomaine.com,https://*.floate.pages.dev`
  → ⚠️ le serveur actuel ne supporte pas les wildcards. Si tu en as
  besoin, modifie `originAllowed()` dans `server/index.js` pour
  matcher les patterns. Pas hyper compliqué : 4 lignes.
- Ou tu pointes les previews sur un autre signaling (staging) avec
  son propre token. Plus propre mais demande un second VPS / process.

Le plus pragmatique au début : tu ne whiteliste que la prod et tu
testes les previews en local avec `dev:all`.

---

## 10. Checklist avant ouverture publique

- [ ] `ADMIN_TOKEN` changé pour quelque chose qui n'est pas dans git
- [ ] `CORS_ORIGIN` restreint aux origines réelles, **pas `*`**
- [ ] `.env.production` / `.env.local` n'est **pas** committé (.gitignore)
- [ ] Caddy renvoie bien `https://` (vérifie le redirect http→https)
- [ ] `wss://sig.tondomaine.com` répond (test : DevTools → Network → WS)
- [ ] `https://sig.tondomaine.com/health` retourne `{ ok: true }`
- [ ] Côté front, `VITE_SIGNALING_URL` est en `wss://` (pas `ws://`) si servi en HTTPS
- [ ] `/admin/stats` sans token affiche bien la page 403, pas un crash
- [ ] Si front sur CF Pages : custom domain + cert OK, preview deploys whitelistés ou non selon ton process
- [ ] Un test à 3 onglets dans 3 wifi différents montre que TURN est nécessaire (ou pas, selon ton public cible)
