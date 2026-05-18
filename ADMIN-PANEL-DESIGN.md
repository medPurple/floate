# floate — Console admin (Statistiques temps réel)

Spécification de la **vue admin** de floate : un tableau de bord d'observabilité temps réel destiné aux équipes produit/ops. À ajouter aux *Project knowledge* de Claude en complément du `DESIGN-SYSTEM.md` principal.

> Ce document hérite de toutes les conventions du design system (tokens, voix, motion). Il ne définit que ce qui est **spécifique** à la console admin.

---

## 1. Contexte produit

La console admin n'est pas exposée aux utilisateurs finaux. Elle est consultée par :
- L'équipe produit (suivi d'usage, validation d'hypothèses)
- Le support (état temps réel quand un user signale un bug)
- L'équipe ops (alertes de capacité, monitoring serveur de signaling)

**Posture éditoriale** — toujours en français, mais avec un ton plus factuel que le reste du produit. Pas de tutoiement (on parle de la donnée, pas à l'utilisateur). Pas d'emoji, jamais de jargon BI ("KPI", "funnel", "DAU") exposé en UI — on dit "Utilisateurs en ligne", "Visites aujourd'hui", "Temps moyen d'écoute".

---

## 2. Route et accès

- Route : `/admin/stats` (hash-route : `#/admin/stats`)
- Protection : header Basic Auth ou cookie de session admin (côté serveur). Le front affiche un 403 simple si non autorisé — pas de redirect bruyant.
- Pas de lien depuis le lobby ou la room — accès uniquement par URL connue.

---

## 3. Anatomie de la page

```
┌─────────────────────────────────────────────────────────────────┐
│ [floate] Statistiques [Console admin]    [24h|7j|30j] Retour    │  ← room-header réutilisé
├─────────────────────────────────────────────────────────────────┤
│ Vue d'ensemble                       · En direct · synchro 2s   │
│ Tout floate, maintenant. ...                                    │
│                                                                 │
│ ┌─KPI──────┐ ┌─KPI──────┐ ┌─KPI──────┐ ┌─KPI──────┐             │  ← 4 cards, grid 1fr×4
│ │ Users    │ │ Salons   │ │ Tps moy. │ │ Visites  │             │
│ │ 142 ●live│ │ 23       │ │ 18:42    │ │ 1 284    │             │
│ │ ↑12% vs..│ │ +3 dernr │ │ +1:14 vs │ │ −4% vs.. │             │
│ │ ~spark~~~│ │ ~spark~~~│ │          │ │ ~spark~~~│             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                 │
│ ┌─Visites 24h ──────────────────────┐ ┌─Sources d'écoute ─────┐ │  ← grid 1.4fr/1fr
│ │ [aire chart + point pulsant]      │ │ YouTube       ▰▰▰ 42%│ │
│ └───────────────────────────────────┘ │ Spotify Web   ▰▰   26%│ │
│                                        │ Bandcamp      ▰    12%│ │
│                                        └───────────────────────┘ │
│                                                                 │
│ ┌─Sources de trafic────────────────┐ ┌─Géographie──────────────┐│
│ │ Direct           ▰▰▰▰ 48%       │ │ [FR] ▰▰▰▰▰▰ 58%          ││
│ │ Lien d'invit.    ▰▰▰  34%       │ │ [BE] ▰      12%          ││
│ └───────────────────────────────────┘ └─────────────────────────┘│
│                                                                 │
│ ┌─Top salons (live)─────────────────┐ ┌─Activité en direct ────┐│
│ │ 1  Lo-fi du matin       8 audit. │ │ ● Margaux a rejoint... │ │
│ │ 2  Vinyles d'amis       6        │ │ ● Yanis a créé...      │ │
│ │ 3  Set du dimanche      5        │ │ ● Camille a démarré... │ │
│ └───────────────────────────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

- **Container** : `max-width: 1200px`, padding 28px, identique à la Room
- **Breakpoint** : sous 900px tout passe en 1 colonne
- **Header** : on réutilise `.room-header` du DS. Tag `[Console admin]` en vert (`--good`) pour signaler l'env spécial.

---

## 4. Blocs de données (contrat)

### 4.1 KPIs (rangée du haut)

4 cartes, fond `--bg-elev`, bordure `--border`, radius 12px, padding 18×20.

| Carte | Source backend | Format affichage | Sparkline |
|---|---|---|---|
| Utilisateurs en ligne | Compteur Redis des sessions WS actives | Entier formaté FR (`142`, `1 284`) | 30 derniers points, refresh 5s |
| Salons actifs | Compte des rooms avec ≥1 host streaming | Entier | 30 derniers points |
| Temps moyen d'écoute | Médiane des sessions terminées sur 24h | `MM:SS` mono | — |
| Visites aujourd'hui | Compteur cumulé depuis 00:00 UTC+2 | Entier formaté FR | Cumul horaire (24 pts) |

Chaque carte :
- Label en `label-upper` (12px, weight 600, uppercase, letterspace 0.1em, `--text-dim`)
- Valeur en 36px weight 700, `font-variant-numeric: tabular-nums` — indispensable pour les valeurs qui tickent (pas de jitter horizontal)
- Delta vs hier avec flèche `↑/↓`, couleur `--good` si positif souhaitable, `--live` si dégradation
- Sparkline optionnelle (24px de haut, `--accent`, stroke 1.6px, polyline `vectorEffect="non-scaling-stroke"`)
- **Point pulsant** vert (`--good`, animation pulse 1.6s) à droite du label sur la première carte uniquement, pour indiquer "ça vient d'être mesuré"

### 4.2 Courbe de visites 24h

Aire SVG, gradient `--accent-strong → transparent` à 0% opacity 35 → 100% opacity 0.
- Stroke supérieure `--accent` 2px
- Gridlines horizontales 3 ticks (0, max/2, max) en `--border` 0.5px
- Ticks X aux heures `00, 06, 12, 18, 23` en monospace 10px, `--text-faint`
- Dernier point : cercle plein 4px + halo qui pulse de r=4 à r=12 (`animate` SVG natif)
- `max` arrondi au multiple de 20 supérieur, pour des graduations lisibles

Le toggle range `24h / 7j / 30j` du header recharge cette série (granularité horaire / journalière / journalière). Les autres cartes ne sont pas affectées (elles restent live).

### 4.3 Sources d'écoute & sources de trafic

Mêmes composants `<BarsList>`. Grid 3 colonnes : `130px 1fr 56px`.
- Track 8px hauteur, `--bg`, radius 999px
- Fill : `linear-gradient(90deg, var(--accent), var(--accent-strong))`, radius 999px, transition `width 0.6s cubic-bezier(0.4, 0, 0.2, 1)` pour que les changements ne sautent pas
- Valeur à droite en `--text-dim`, tabular-nums, alignée right

**Sources d'écoute** = d'où vient l'audio diffusé (parsé depuis `document.title` de l'onglet capturé, fallback "Autres") :
YouTube, Spotify Web, Bandcamp, SoundCloud, Mixcloud, Autres.

**Sources de trafic** = referer d'arrivée sur le lobby :
Direct, Lien d'invitation (paramètre `?code=…`), Réseaux sociaux, Recherche, Autre.

### 4.4 Géographie

Liste simple, pas de carte du monde (overkill pour 5–10 pays). Grid `32px 1fr 50px` :
- "Drapeau" = pastille `--bg-elev-2` 22×16, bordure, code pays 2 lettres en weight 700 9px
- Bar style identique aux sources
- Pas plus de 6 lignes (5 pays + "Autres")

### 4.5 Top salons (live)

Liste des 6 salons avec le plus d'auditeurs actuellement. Chaque ligne :
- Pastille rang (1, 2, 3…) `--bg-elev-2` 22×22, weight 700 11px, `--text-dim`
- Nom du salon (14px `--text`) + "Animé par {host}" (12px `--text-dim`)
- Nombre d'auditeurs en `--accent` weight 600, format "8 auditeurs" / "1 auditeur"

Le classement se réordonne live (transition CSS optionnelle sur position via Flip, mais pas critique).

### 4.6 Activité en direct

Flux d'events les plus récents (8 max affichés). Chaque ligne :
- Dot 6px coloré par type
- Texte avec **nom en gras**, verbe en `--text-dim`, room en `--text` normal
- Timestamp relatif à droite en mono 11px `--text-faint`
- Animation d'entrée `feedIn 0.35s` (translateX −8 → 0, opacity 0 → 1)

| Event | Dot color | Format |
|---|---|---|
| `join` | `--good` | `{nom} a rejoint {salon}` |
| `create` | `--accent` | `{nom} a créé {salon}` |
| `leave` | `--text-faint` | `{nom} a quitté {salon}` |
| `live` | `--live` | `{nom} a démarré une diffusion` |

> ⚠️ C'est le **seul endroit** où `--live` peut apparaître hors de la room en diffusion — uniquement comme petit dot 6px, jamais comme texte ou fond. C'est cohérent avec la sémantique "ça diffuse".

---

## 5. Temps réel — implémentation

### 5.1 Côté front

Deux mécanismes selon la criticité :

**WebSocket d'observabilité** (préféré pour les events feed + KPIs critiques)
- Endpoint : `wss://api.floate.app/admin/stream` (auth via cookie de session)
- Messages typés :
  ```json
  { "type": "kpi", "users": 142, "rooms": 23, "avgDuration": 1122, "visits": 1284 }
  { "type": "event", "kind": "join", "who": "Margaux", "room": "Lo-fi du matin", "ts": 1715954400 }
  { "type": "rooms", "top": [{ "name": "...", "host": "...", "count": 8 }, ...] }
  ```
- Debounce de rendu : grouper les events arrivés < 200ms d'écart en un seul setState

**Polling REST** (fallback + données moins chaudes : visites 24h, sources, géo)
- `GET /admin/api/snapshot?range=24h` toutes les 30s
- Cache HTTP 10s côté serveur pour éviter le DDoS du dashboard

### 5.2 Cadence d'affichage

| Donnée | Refresh visuel | Source |
|---|---|---|
| KPIs (4 chiffres) | 2–5s | WS |
| Sparklines | 5s (rolling window 30 pts) | WS, dérivé KPIs |
| Courbe visites 24h | 30s | REST |
| Sources écoute/trafic | 60s | REST |
| Géographie | 5min | REST |
| Top salons | 3–5s | WS |
| Flux d'activité | temps réel (par event) | WS |

L'utilisateur ne doit jamais voir une animation de redraw "qui rame" → pour les chiffres KPI, animer le compteur sur 300ms avec `requestAnimationFrame` (pas indispensable, mais joli — si time presse, simple remplacement OK puisque tabular-nums évite le jitter).

### 5.3 Reconnexion WS

- Backoff exponentiel : 1s → 2s → 4s → 8s, plafond 30s
- Toast (variante `error`) "Reconnexion en cours" après 5s de coupure
- Toast (variante `success`) "Connecté" après reprise

---

## 6. Composants nouveaux (à ajouter au DS)

Ces composants sont **spécifiques à la console admin** et ne doivent pas être réutilisés dans le produit user-facing.

### 6.1 `KpiCard`

Props : `label, value, delta { value, dir }, spark, live, mono`
- `live` → affiche le dot pulsant `--good`
- `mono` → applique la font mono à la valeur (pour `MM:SS`)
- `delta.dir` ∈ `up | down | flat`

### 6.2 `AreaChart`

SVG, viewBox 600×200, `preserveAspectRatio="none"`. Props : `data: number[], hours: number[]`.
- Gradient ID unique `areaGrad` (à scoper si plusieurs charts sur une page — ce qui n'est pas le cas ici)

### 6.3 `BarsList`

Liste horizontale. Props : `items: { name, value }[], suffix: string` (par défaut `""`).

### 6.4 `Sparkline`

SVG polyline pour les cards. Props : `data, color`. Hauteur fixe 24px.

### 6.5 `RangeToggle`

Réutilise le pattern du Toggle binaire du DS mais accepte 3 options. Largeur intrinsèque, à placer dans le header.

---

## 7. Accessibilité

- Chaque chart doit avoir un `<title>` ou un résumé textuel adjacent (par ex. "Sessions par heure" avec total agrégé)
- `aria-live="polite"` sur la zone "Activité en direct" pour les lecteurs d'écran (les events sont rapportés au fil de l'eau, sans interrompre)
- Ne **pas** mettre `aria-live` sur les KPIs — ça spammerait les lecteurs d'écran (ils ticquent toutes les 2s). Plutôt : un bouton "Lire l'état actuel" qui annonce une fois.
- Respecter `prefers-reduced-motion`: désactiver le pulse du point sur la courbe et l'animation feedIn.

---

## 8. États vides / dégradés

- **Pas de données pour la période** → "Pas encore de visites sur cette plage." en `--text-dim` au centre du chart, 160px de haut min
- **WS déconnecté** → bandeau discret en haut de page (fond `--bg-elev-2`, bordure gauche `--live` 2px, padding 8px) : "Connexion temps réel interrompue · dernière mise à jour il y a 18s"
- **Auth échoue** → page entière à la place : titre "403", message "Cette page est réservée à l'équipe floate.", lien "Retour au lobby"

---

## 9. Sécurité & confidentialité

- **Aucun pseudo réel** ne doit fuiter dans le flux d'activité côté frontend si l'env n'est pas authentifié admin. Si la session admin n'est pas vérifiée → backend renvoie des pseudos hashés (`U-3f2a`).
- **Pas de PII** : pas d'IP, pas d'email, pas de pays sub-régional. Le pays vient du header CF / geo-IP au niveau Cloudflare, jamais stocké persisté.
- **Logs d'accès** : chaque vue de l'admin est loguée côté serveur avec user-agent + email admin.

---

## 10. Roadmap (post-MVP)

À ne pas traiter dans la première version, listés pour mémoire :
1. **Alertes** — seuil personnalisable (par ex. "salons actifs > 50" → notif Slack)
2. **Drill-down** — clic sur un salon dans "Top salons" → écran détail avec timeline d'événements de cette room
3. **Export CSV** — bouton "Exporter sur 30j" pour les visites
4. **Comparaison temporelle** — toggle "Superposer la semaine dernière" sur la courbe de visites
5. **Latence WebRTC** — médiane et p95 par région, indispensable quand on aura un TURN
6. **Heatmap horaire** — sessions par heure × jour de la semaine, vue 7×24

---

## 11. Prompt d'init Claude pour cette feature

À coller en démarrant la conversation où tu veux implémenter la console admin :

```
Tu connais le design system de floate. Implémente la console admin
spécifiée dans STATS-ADMIN.md (project knowledge).

Travail attendu :
1. Une route Vue `/admin/stats` protégée par Basic Auth (mock côté
   client pour l'instant, vraie auth côté serveur plus tard).
2. Tous les composants de la section 6 du spec, isolés dans
   src/components/admin/ pour ne pas polluer les composants user.
3. Un store léger (Pinia ou composable) qui simule un flux WS via
   setInterval — endpoint réel branché plus tard.
4. Respect strict du design system principal pour tokens, motion,
   voix. Le seul écart autorisé : la couleur --good pour le tag
   "Console admin" en header.

Commence par me montrer le squelette des fichiers avant de coder le
détail des composants. Si quelque chose dans le spec te paraît
ambigü, demande avant d'avancer.
```

---