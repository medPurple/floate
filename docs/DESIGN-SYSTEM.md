# floate — Design System

Document de référence pour reconstruire, étendre ou auditer l'identité visuelle et l'UX de **floate** (rooms d'écoute partagée, diffusion audio d'un onglet en peer-to-peer). À destination d'un autre designer (humain ou Claude) chargé de faire évoluer le produit.

---

## 1. Philosophie

floate sert une expérience d'**écoute collective intime**. Le design doit refléter une ambiance de salon plongé dans la pénombre, pas un dashboard de productivité. Trois axes :

- **Chaleur sur fond sombre** — palette nuit profonde avec accents abricot/terracotta. Évite le bleu corporate.
- **Honnêteté du signal** — le visualiseur d'audio n'est pas décoratif, il confirme « il y a du son ». Le badge ON AIR est le seul rouge de l'interface, réservé à l'état « ça diffuse ».
- **Symétrie des rôles** — l'écran d'un hôte et d'un auditeur partagent la même structure. Seuls le bouton central et un panneau latéral changent. Réduit la charge cognitive quand on bascule d'un rôle à l'autre.

**Tonalité** — tutoiement systématique, français vivant et précis, jamais de jargon, pas d'emoji. « Tu diffuses pour 3 personnes » plutôt que « Live · 3 listeners ».

---

## 2. Design tokens

### 2.1 Couleurs

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0E0D12` | Fond global (nuit) |
| `--bg-elev` | `#18171F` | Surface niveau 1 (cards, panels) |
| `--bg-elev-2` | `#221F2B` | Surface niveau 2 (toggle actif, accent subtil) |
| `--border` | `#2A2735` | Bordures et séparateurs |
| `--text` | `#ECE9F1` | Texte principal |
| `--text-dim` | `#9B96AA` | Texte secondaire, labels |
| `--text-faint` | `#5E5A6D` | Texte tertiaire, hints, sous-titres |
| `--accent` | `#F4A261` | Abricot — bordure host, badge "À LA MAIN", liens secondaires |
| `--accent-soft` | `#F4A26122` | Abricot 13% — fond du card host |
| `--accent-strong` | `#E76F51` | Terracotta — CTA principal uniquement |
| `--live` | `#EF476F` | Rouge ON AIR — exclusif à l'état "ça diffuse" |
| `--good` | `#80C79C` | Vert succès — toasts |

**Backgrounds de page** — superposition de trois layers :

```css
background:
  radial-gradient(1200px 800px at 80% -10%, #2a1f2e 0%, transparent 60%),
  radial-gradient(900px 700px at -10% 110%, #1a2330 0%, transparent 55%),
  var(--bg);
background-attachment: fixed;
```

**Règle stricte** — le rouge `--live` ne s'utilise que pour le badge ON AIR et la bordure gauche du bouton "Arrêter la diffusion". Aucun autre élément ne doit utiliser cette couleur.

**Avatars** — dérivés du pseudo par hash. Formule :

```js
function colorOf(pseudo) {
  let h = 0;
  for (let i = 0; i < pseudo.length; i++) h = (h * 31 + pseudo.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360}, 38%, 52%)`;
}
```

Saturation 38%, lightness 52% pour rester cohérent avec la palette (jamais de couleur trop vive). L'hôte garde toujours `--accent`.

### 2.2 Typographie

- **Font stack** — système : `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Font mono** — `ui-monospace, "SF Mono", Menlo, monospace`

| Token | Size | Weight | Usage |
|---|---|---|---|
| `display` | 32–44px | 700 | Hero du lobby, brand-mark |
| `h1-stage` | 22–28px | 700 | Nom du host sur le stage |
| `h2` | 18px | 600 | Nom de la room dans le header |
| `body` | 15px | 400 | Texte courant |
| `body-sm` | 14px | 400–500 | Texte secondaire, boutons |
| `meta` | 13px | 400 | Métadonnées (compteurs) |
| `mini` | 12px | 400–600 | Labels, captions |
| `micro` | 10–11px | 700 | Tags, badges, labels uppercase |

**Letter-spacing** — `-0.02em` sur les displays, `0.06–0.1em` sur les uppercase (labels, badges, tags).

**Lien gradient** — pour le brand "floate" et le titre du lobby :

```css
background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```

### 2.3 Espacements

Échelle 4-base :

| Token | Value | Usage typique |
|---|---|---|
| `xs` | 4px | Gap entre micro-éléments |
| `sm` | 8px | Gap entre tags, padding interne d'avatar |
| `md` | 12px | Gap dans une liste, padding bouton vertical |
| `lg` | 16px | Padding cards, gap entre panneaux |
| `xl` | 20–22px | Padding panneaux primaires |
| `2xl` | 28–32px | Padding hero, padding stage |
| `3xl` | 40–60px | Hero outer spacing, séparation sections |

### 2.4 Border radius

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | 4px | Tags, micro-badges |
| `--radius-sm` | 6–8px | Inputs, boutons, items de liste |
| `--radius-md` | 10px | Panneaux secondaires |
| `--radius` | 12–14px | Cards principaux, stage |
| `--radius-pill` | 999px | Live badge, avatars |

### 2.5 Ombres

```css
--shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
```

Réservée aux **cards principaux** (lobby card, modals). Les panneaux secondaires (sidebar) n'ont pas d'ombre — la profondeur vient de la bordure et du contraste de fond.

### 2.6 Motion

- **Hover** transitions : `0.15s` ease
- **Press** (transform Y) : `0.06s` ease
- **Fade enter/leave** (transitions de vue Vue) : `0.2s` ease
- **Pulse ON AIR** : 1.6s ease-in-out infinite
- **Skeleton shimmer** : 1.4s ease-in-out infinite
- **Visualizer attack** : RISE = 0.6 (lerp factor)
- **Visualizer release** : DECAY = 0.88 (multiplier per frame)

Pas d'animations longues (>0.3s) pour les interactions. L'attente serait perçue comme un bug.

---

## 3. Composants

### 3.1 Bouton

5 variantes, toutes en `border-radius: 8px`, padding `11px 18px`, font-weight 600, font-size 14px.

| Variante | Background | Color | Border | Usage |
|---|---|---|---|---|
| `btn-primary` | `--accent-strong` | `#1A0F0A` | — | UNE action principale par écran (créer, rejoindre, démarrer la diffusion) |
| `btn-secondary` | `--bg-elev-2` | `--text` | `--border` | Actions secondaires (rejoindre une room publique, demander la main) |
| `btn-ghost` | transparent | `--text-dim` | — | Actions tertiaires (quitter, copier) |
| `btn-danger` | transparent | `--live` | `#3A1A25` | Arrêter la diffusion uniquement |
| `btn-pending` | `--bg-elev-2` | `--text-dim` | `--border` | État désactivé d'un bouton après clic (avec compte à rebours) |

**États** :
- `:hover` — variation subtile du fond ou de la bordure
- `:active` — `transform: translateY(1px)`
- `:focus-visible` — `outline: 2px solid var(--accent); outline-offset: 2px;`
- `:disabled` — `opacity: 0.45; cursor: not-allowed;`

**Règle d'or** — une seule `btn-primary` par viewport. Si tu en as deux, l'une des deux est probablement une `btn-secondary`.

### 3.2 Input texte

```css
background: var(--bg-elev);
border: 1px solid var(--border);
border-radius: 8px;
padding: 10px 12px;
font-size: 15px;
```

`:focus` — `border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft);`

**Variante mono** (pour les codes) — `font-family: ui-monospace; letter-spacing: 0.08em; text-transform: uppercase;`

### 3.3 Toggle (binaire)

Conteneur `display: flex; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 3px;` contenant deux boutons. Le bouton actif a `background: var(--bg-elev-2)` et `color: var(--text)`. L'inactif est `color: var(--text-dim)`.

Cas d'usage : Publique / Privée pour la visibilité d'une room.

### 3.4 Card / Panel

- **Card principale** (lobby) — `background: var(--bg-elev); border: 1px solid var(--border); border-radius: 12px; padding: 22px; box-shadow: var(--shadow);`
- **Panel sidebar** — même style sans l'ombre, padding 18px.

Chaque panel a un `<h3>` titre en uppercase, font-size 12px, color `--text-dim`, letter-spacing 0.08em, margin-bottom 14px.

### 3.5 Toast

Position fixe top-right, max-width 360px, gap 8px entre toasts.

```css
background: var(--bg-elev-2);
border: 1px solid var(--border);
border-left: 3px solid <semantic>;
padding: 12px 16px;
border-radius: 8px;
font-size: 14px;
```

Bordure gauche selon le type :
- `info` (défaut) — `--accent`
- `success` — `--good`
- `error` — `--live`

Animation d'entrée : `slideIn 0.2s ease-out` (translateX 20→0, opacity 0→1).
Durée par défaut : 4s. Toast critique : 6s.

### 3.6 Live badge (ON AIR)

```html
<div class="live-badge">
  <span class="dot"></span> ON AIR
</div>
```

- Fond `rgba(239, 71, 111, 0.12)`, color `--live`, bordure `0.5px solid rgba(239, 71, 111, 0.3)`
- Pill `border-radius: 999px`, padding `4px 10px`
- Font 11px, weight 700, letter-spacing 0.1em, uppercase
- Le dot fait 7px, rond, pulse `opacity 1 → 0.3 → 1` en 1.6s

**Affiché si et seulement si** `isStreaming === true || remoteStream !== null`.

### 3.7 Participant row

```html
<div class="participant [is-host] [is-me]">
  <div class="participant-left">
    <div class="avatar">L</div>
    <span class="participant-name">Léa <span>(toi)</span></span>
  </div>
  <span class="role-tag">À la main</span>
</div>
```

- Default — fond `--bg`, bordure transparente
- `is-host` — fond `--accent-soft`, bordure `--accent`, avatar avec fond `--accent` et texte `#1A0F0A`, role-tag visible
- `is-me` — nom en font-weight 600

**Avatar** — cercle 28×28, font-size 12px, font-weight 700. Pour le host : fond `--accent`. Pour les autres : `hsl(hash, 38%, 52%)` avec texte blanc.

### 3.8 Skeleton

```css
background: linear-gradient(90deg, var(--bg-elev), var(--bg-elev-2), var(--bg-elev));
background-size: 200% 100%;
animation: shimmer 1.4s ease-in-out infinite;
border-radius: 4px;
```

Utilisé pour les éléments de la room pendant la connexion (nom de room, badge visibilité, liste de participants).

### 3.9 Visualizer

Canvas 420×80 px max, 48 barres verticales avec gradient `--accent → --accent-strong`. Lissage temporel :

```js
const RISE = 0.6;   // attack
const DECAY = 0.88; // release
smoothed[i] = raw > prev ? prev + (raw - prev) * RISE : prev * DECAY;
```

**État ambient** (quand pas de stream) — sinusoïde très subtile à 0.5 Hz, opacity 0.18, stroke `--accent`. Indique que le canvas est vivant.

### 3.10 Stepper onboarding

```html
<div class="step [highlight]">
  <div class="step-num">1</div>
  <div class="step-body">Choisis l'onglet où ta musique joue.</div>
</div>
```

- `step-num` — cercle 22×22, fond `--bg-elev-2`, bordure `--border`, font 11px weight 700, color `--text-dim`
- `highlight` — fond `--accent-soft`, bordure `--accent`, color `--accent`. Texte du body en `--accent` weight 600. Sous-titre optionnel en `--text-dim`.

Utilisé pour l'onboarding du host avant diffusion. **La règle** : highlight l'étape critique (« coche bien la case ») pour qu'elle attire l'œil avant que l'utilisateur clique.

---

## 4. Anatomie des pages

### 4.1 Lobby

```
┌─────────────────────────────────────────────┐
│ [floate]                            [v0.2]  │  ← topbar
├─────────────────────────────────────────────┤
│                  [illustration]              │
│         Le son d'un onglet,                  │  ← hero
│         à plusieurs, en direct.              │
│   Diffuse depuis ton navigateur. ...         │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ Ton pseudo                          │    │
│  │ [Léa                              ] │    │
│  │ Code d'invitation                   │    │
│  │ [AKZ-394                          ] │    │
│  │ [    Rejoindre la room    ]         │    │
│  │ ─────────────────────────────────── │    │
│  │      Pas de code ? Crée ta room →   │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│ ROOMS PUBLIQUES EN CE MOMENT (2)            │
│ ┌─ Lo-fi du matin · 3 part. ───── → ─┐     │
│ ┌─ Vinyles d'amis · 2 part. ────── → ─┐    │
└─────────────────────────────────────────────┘
```

- Max-width 720px, centrée
- Brand en haut-gauche, version en haut-droite (en `--text-faint`)
- Hero : illustration SVG 180×80, titre 32px, sous-titre 14px
- Card primaire : max-width 460px, padding 18px, parcours unique (pseudo + code + bouton primaire)
- Création repliable via un lien orange. Quand déplié : nom + visibilité + boutons Annuler/Créer
- Rooms publiques sous forme de cartes-boutons, hover bordure `--accent`

### 4.2 Room — header

```
┌─────────────────────────────────────────────┐
│ [floate]  Set du dimanche  [PRIVÉE]  Quitter│
└─────────────────────────────────────────────┘
```

- Padding `18px 28px`
- Bordure basse `1px solid var(--border)`
- Fond `rgba(14, 13, 18, 0.6) + backdrop-filter: blur(10px)` (effet glass subtil)
- Tag visibilité : `PUBLIQUE` (bordure neutre, text-dim) ou `PRIVÉE` (bordure accent, color accent)
- Bouton Quitter en `btn-ghost`

### 4.3 Room body

Grid 2 colonnes : `1fr 320px`, gap 24px, padding 28px. Sous 900px de largeur : passe en une seule colonne, sidebar sous le stage.

### 4.4 Stage — 3 états

**État A — Connexion (skeleton)**
- Label "Connexion" en uppercase
- Deux barres skeleton (180×32 et 240×16)

**État B — Host avant diffusion (onboarding)**
- Label "Prêt à diffuser"
- Titre "Bienvenue, {pseudo}"
- Stepper 2 étapes (étape 2 en highlight pour la case audio)
- CTA primaire "Démarrer la diffusion"
- Foot "X personnes attendent" (si > 0)

**État C — En diffusion ou en écoute**
- Live badge ON AIR
- Label "Diffusion"
- Nom du host en 28px
- Status dynamique : "Tu diffuses pour 3 personnes" / "Diffusion en cours" / "Sam n'a pas encore démarré"
- Visualizer (lissé)
- Bouton selon le rôle :
  - Host streaming → `btn-danger` "Arrêter la diffusion"
  - Listener → `btn-secondary` "Demander la main" (ou `btn-pending` avec countdown)

### 4.5 Sidebar — panneaux

Ordre vertical :
1. Code d'invitation (si room privée et utilisateur dans la room)
2. Sortie audio (toujours)
3. Demandes de main (host uniquement, si pending > 0)
4. Participants (toujours)

Chaque panneau : `--bg-elev` + bordure + radius 10–14px.

---

## 5. Patterns d'interaction

### 5.1 Demande de main (state machine)

```
État        Trigger              UI                                Reset
─────────────────────────────────────────────────────────────────────────
idle        clic "Demander…"  →  envoie request_floor              
pending     —                    btn-pending + countdown 60s       (cooldown)
denied      msg floor_denied  →  toast "Refusé" + retour idle      
granted     msg host_changed  →  toast "Tu as la main"             auto
```

Cooldown de 60s pour éviter le spam. Affiché en temps réel : "Demande envoyée · 47s".

### 5.2 Onboarding hôte

Le problème : l'utilisateur doit cocher "Partager l'audio de l'onglet" dans la modale système de Chrome, sinon la diffusion part en silence. Sans onboarding, on attrape l'erreur a posteriori via un toast.

**Solution** : stepper inline AVANT le clic, avec l'étape critique surlignée. Pédagogie préventive vs feedback correctif.

### 5.3 Toast policy

- Action utilisateur explicite (créé, copié, demandé) → `success`, 2-3s
- Erreur récupérable (échec de copie, code invalide) → `error`, 4s
- Erreur critique avec instruction (case audio non cochée) → `error`, 6s
- Notification d'événement social (X a rejoint, X demande la main) → `info`, 2-3s

Jamais de toast pour confirmer une action déjà visible (le bouton change déjà d'état, pas besoin de toast en plus).

### 5.4 Identification du rôle (redondance)

Le diffuseur (host) est signalé par **trois** indices visuels redondants :
1. Sa carte participant a une bordure `--accent`
2. L'avatar est en `--accent`
3. Le tag "À LA MAIN" en uppercase est affiché à droite

C'est délibéré : un utilisateur qui scroll vite ne peut pas se tromper sur qui a la main.

---

## 6. Accessibilité

### 6.1 Focus visibles

Tous les éléments interactifs ont :
```css
outline: 2px solid var(--accent);
outline-offset: 2px;
```
sur `:focus-visible`. Couvre les boutons, les inputs, le toggle, les room-items.

### 6.2 Contrastes

| Combinaison | Ratio | Conforme |
|---|---|---|
| `--text` sur `--bg` | 13.6:1 | AAA |
| `--text-dim` sur `--bg-elev` | 5.4:1 | AA |
| `--text-faint` sur `--bg-elev` | 3.2:1 | AA pour large text uniquement |
| `--accent` sur `--bg-elev` | 6.8:1 | AA |
| `#1A0F0A` (texte CTA) sur `--accent-strong` | 8.1:1 | AAA |

À surveiller : `--text-faint` ne doit jamais porter d'information critique, uniquement des hints/captions.

### 6.3 Sémantique

- `<main>`, `<header>`, `<section>`, `<aside>` utilisés selon leur rôle
- Inputs avec `<label for>` explicite
- Toasts devraient avoir `role="status"` / `aria-live="polite"` (à ajouter en v3)
- Visualizer en `<canvas>` n'a pas de fallback texte (à ajouter : `aria-label="niveau audio"`)

### 6.4 Réduction de mouvement

Pas encore implémenté — à ajouter :
```css
@media (prefers-reduced-motion: reduce) {
  .live-badge .dot { animation: none; }
  .skeleton { animation: none; background: var(--bg-elev-2); }
}
```

---

## 7. Voix & rédactionnel

### 7.1 Règles

- **Tutoiement** systématique
- **Présent de l'indicatif** privilégié au futur proche ("Choisis l'onglet" plutôt que "Vous allez choisir l'onglet")
- **Concision** — éviter "Vous pouvez maintenant" au profit de "Tu peux"
- **Verbes d'action** dans les CTA (Créer, Rejoindre, Démarrer, Arrêter, Demander)
- Pas de jargon technique exposé (WebRTC, peer-to-peer, signaling) — c'est l'affaire des dev, pas de l'UI

### 7.2 Échantillon

| Contexte | OK | Pas OK |
|---|---|---|
| Hero | "Le son d'un onglet, à plusieurs, en direct." | "Service de streaming audio collaboratif" |
| CTA | "Démarrer la diffusion" | "Lancer le live" |
| Erreur | "Tu n'as pas coché « Partager l'audio de l'onglet »." | "Audio track not detected" |
| Status | "Tu diffuses pour 3 personnes." | "Streaming · 3 connected peers" |
| Confirmation | "Code copié." | "Action réussie" |

---

## 8. Pour Figma (mapping)

### 8.1 Styles à créer

**Colors** (Local styles) — nommer en `floate/<categorie>/<token>`. Ex : `floate/surface/bg`, `floate/accent/strong`, `floate/text/dim`.

**Text styles** — nommer en `floate/<role>/<size>`. Ex : `floate/display/44`, `floate/body/15`, `floate/label/12-upper`.

**Effects** — un seul effet à créer : `floate/shadow` = Drop shadow `Y 10, blur 40, color #000 40%`.

### 8.2 Components à créer

Avec variants (Properties Figma) :

- `Button` — variant `style` (primary/secondary/ghost/danger/pending), `state` (default/hover/active/disabled)
- `Input` — variant `type` (text/mono), `state` (default/focus)
- `Participant` — variant `role` (host/listener), `isMe` (true/false)
- `Toast` — variant `kind` (info/success/error)
- `Panel` — variant `withTitle` (true/false)

### 8.3 Auto-layout par défaut

- Cards & panels — direction vertical, gap 14px, padding 18–22px
- Buttons — direction horizontal, gap 8px, padding 11px H, 18px V
- Participant rows — horizontal, gap 10px, justify space-between

### 8.4 Frame sizes recommandées pour les maquettes

- Lobby — 720 × 1200
- Room (host streaming) — 1200 × 800
- Room (listener mobile) — 380 × 760

---

## 9. Stack technique de référence

Pour comprendre ce qui contraint le design :

- **Vue 3 + Vite** — SPA avec hash-routing simple, pas de framework UI (tout est custom).
- **CSS variables natives** — pas de SCSS, pas de tokens compilés. Les tokens du design system sont les variables CSS dans `src/styles.css`.
- **WebRTC mesh peer-to-peer** — max 8 participants par room.
- **Capture d'onglet** via `getDisplayMedia` (Chrome/Edge uniquement).
- **Sortie audio** via `HTMLAudioElement.setSinkId`.

Conséquences design :

- Pas de skeuomorphisme audio (pas d'icônes de bouton de mixeur, pas de potards) — l'utilisateur n'agit pas sur le son.
- Pas de chat texte (volontairement absent — c'est une app d'écoute, pas de discussion).
- Pas de timeline / scrub — c'est du live continu, on ne rejoue pas.

---

## 10. Roadmap design (priorisée)

Items identifiés mais non implémentés, à attaquer dans cet ordre :

1. **Mobile** — passer de "responsive correct" à "designed mobile-first". Stage en haut, drawer sidebar en bas.
2. **Onboarding premier visiteur** — un état zéro pour les gens qui arrivent sans contexte. Vidéo ou animation explicative.
3. **Profil persistant** — avatar personnalisable (au-delà du hash), pseudo + couleur sauvegardés.
4. **Reactions** — émojis flottants pendant l'écoute (cœur, danse, applaudissement) pour pallier l'absence de chat.
5. **Historique** — liste des rooms récentes pour un retour facile.
6. **Dark/light** — pour l'instant 100% sombre. Pas prioritaire (l'identité repose sur la pénombre) mais à considérer si déploiement public.
7. **Modes d'attention** — afficher discrètement combien d'auditeurs sont vraiment actifs (volume non nul côté client) vs en pause silencieuse.

---

## 11. Fichiers associés

- `design-tokens.json` — tokens au format DTCG (W3C Community Group), importable via Tokens Studio Figma
- `floate-canvas.svg` — vue d'ensemble des composants et écrans clés, glissable dans Figma
