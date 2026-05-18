# floate

Rooms d'écoute audio collective en peer-to-peer.

Tu diffuses l'audio d'un onglet de ton navigateur, tes invités l'écoutent
en direct. Max 8 personnes par room. Pas de chat, pas de timeline, juste
le son d'un onglet à plusieurs.

## Stack

- **Front** — Vue 3 + Vite, hash-routing via vue-router, CSS variables natives, pas de framework UI
- **Signaling** — Node 20 + ws (relais WebSocket minimal, ne touche pas au flux audio)
- **Audio** — `getDisplayMedia` (Chrome/Edge uniquement) côté host, mesh WebRTC peer-to-peer entre tous, `setSinkId` pour choisir la sortie côté listener
- **Design system** — DESIGN-SYSTEM.md et design-tokens.json à la racine

## Install

```bash
npm run install:all     # installe le front ET le serveur
cp .env.example .env.local
```

## Lancer en dev

Dans deux terminaux séparés, ou en une commande :

```bash
npm run dev:all
```

Ça lance :
- le front Vite sur **http://localhost:5173**
- le serveur de signaling sur **ws://localhost:8787**

Pour ne lancer que l'un ou l'autre : `npm run dev` (web) ou `npm run dev:server` (signaling).

## Tester à plusieurs en local

1. Ouvre **Chrome** ou **Edge** sur http://localhost:5173 (`getDisplayMedia` audio n'existe pas sur Safari/Firefox)
2. Saisis un pseudo, crée une room (donne-lui un nom, choisis la visibilité)
3. Copie le code d'invitation depuis la sidebar
4. Ouvre un **deuxième onglet** (ou fenêtre privée pour avoir un peerId différent), tape un autre pseudo, colle le code, rejoins
5. Le premier onglet est host. Clique "Démarrer la diffusion" → sélectionne un onglet qui joue de la musique (YouTube, SoundCloud…) et **coche bien « Partager l'audio de l'onglet »**
6. Sur le second onglet tu dois entendre le son

### Tester la sortie audio (setSinkId)

Sur le panneau "Sortie audio", clique "Détecter mes appareils" (autorise le micro une fois — c'est juste pour révéler les noms des devices, le stream est immédiatement coupé). Tu peux ensuite choisir AirPods, casque BT, sortie système, etc.

### Tester la demande de main

Depuis l'onglet listener, clique "Demander la main". L'onglet host voit la demande apparaître dans la sidebar. S'il accepte, la main lui est retirée et le listener devient host (devra recliquer "Démarrer la diffusion").

## Storybook

Tous les composants atomiques et les molécules sont navigables en isolation :

```bash
npm run storybook   # → http://localhost:6006
```

## Arbo

```
floate/
├── server/                  serveur de signaling (Node + ws)
│   └── index.js             protocole : join/leave/signal/host-change
├── src/
│   ├── components/
│   │   ├── atoms/           FlButton, FlInput, FlLiveBadge…
│   │   └── molecules/       FlStage, FlRoomHeader, panneaux sidebar
│   ├── composables/
│   │   ├── useSession.js    peerId + pseudo en sessionStorage
│   │   ├── useSignaling.js  couche WS bête
│   │   ├── useRoomConnection.js   mesh WebRTC + presence
│   │   ├── useDisplayCapture.js   getDisplayMedia
│   │   ├── useMediaDevices.js     liste/choix sortie audio
│   │   └── useToasts.js
│   ├── views/
│   │   ├── LobbyView.vue    §4.1 du DS
│   │   └── RoomView.vue     §4.2 + §4.3 + §4.5
│   ├── lib/
│   │   ├── colors.js        couleur avatar dérivée du pseudo
│   │   ├── code.js          génération/normalisation des codes
│   │   └── config.js        SIGNALING_URL, ICE_SERVERS
│   ├── router/
│   ├── styles.css           tous les tokens du DS
│   └── main.js
├── DESIGN-SYSTEM.md
└── design-tokens.json
```

## Caveats connus

- **Chrome / Edge uniquement** pour le host. Firefox n'expose pas l'audio dans `getDisplayMedia`, Safari ne supporte pas l'audio non plus.
- **STUN seul, pas de TURN** — marche derrière NAT classique en local. Pour un déploiement public il faudra ajouter un serveur TURN (coturn, ou un SaaS comme Twilio NTS).
- **setSinkId** non supporté sur Firefox ni Safari iOS — le choix de sortie sera ignoré sur ces navigateurs, l'audio sortira sur le device système.
- **Pas de reconnexion auto** si la WS tombe. À rafraîchir manuellement pour l'instant.
- **Limite 8 peers** par room (cf. design-tokens.json `layout.max-room-members`).

## Déploiement

Pour passer en production sur ton nom de domaine, voir **DEPLOY.md** —
guide complet : DNS, Caddy avec TLS auto, systemd pour le serveur Node,
TURN, et un exemple de bot Discord qui ping `/health` toutes les 6h.

## Conventions

Voir DESIGN-SYSTEM.md pour la philosophie (tutoiement, français vivant, pas d'emoji, `--live` exclusif au state "ça diffuse", une seule `.btn-primary` par viewport, etc.).
