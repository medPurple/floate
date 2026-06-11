<!--
  FlPlayerVinyl — placeholder en attendant l'illustration SVG dessinée.

  Le rendu actuel reprend le proto procédural (cercles concentriques +
  étiquette accent) pour donner une lecture honnête de l'appareil. Quand
  l'asset d'illustrateur arrivera, on remplace le bloc <svg> par l'inline
  du fichier exporté de Figma — la mécanique de state (off / standby /
  playing / offline) reste identique.

  Props :
    - state : 'off' | 'standby' | 'playing' | 'offline'
    - size  : taille en px (carré)

  Compositionnel : ce composant ne sait rien du flux audio. Le parent
  passe l'état déjà calculé.
-->
<script setup>
import { computed } from 'vue'
import { PLAYER_STATES } from '../../lib/players.js'

defineProps({
  state: {
    type: String,
    default: 'off',
    validator: v => PLAYER_STATES.includes(v)
  },
  size: { type: Number, default: 200 }
})

// 24 sillons (un peu moins que le proto pour rester léger en mini).
const grooves = computed(() => {
  const out = []
  const count = 24
  for (let i = 0; i < count; i++) {
    const r = 38 + (i / (count - 1)) * 52
    const opacity = 0.18 + (i / count) * 0.42
    out.push({ r, opacity })
  }
  return out
})
</script>

<template>
  <div
    class="player-vinyl"
    :class="[`is-${state}`]"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`Lecteur vinyle, état ${state}`"
  >
    <svg class="device" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vinyl-sheen-2" cx="32%" cy="30%" r="55%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.08)" />
          <stop offset="55%" stop-color="rgba(255,255,255,0.02)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="vinyl-label-2" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.12)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="94" fill="rgba(0,0,0,0.35)" />
      <circle class="disc" cx="100" cy="100" r="92" />

      <g fill="none" stroke="#22202a" stroke-width="0.4">
        <circle
          v-for="(g, i) in grooves"
          :key="i"
          cx="100" cy="100"
          :r="g.r"
          :stroke-opacity="g.opacity"
        />
      </g>

      <circle cx="100" cy="100" r="92" fill="url(#vinyl-sheen-2)" />
      <circle class="label" cx="100" cy="100" r="34" />
      <circle cx="100" cy="100" r="34" fill="url(#vinyl-label-2)" />
      <circle
        cx="100" cy="100" r="34"
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        stroke-width="0.7"
      />

      <!-- Repère pour lire la rotation -->
      <rect x="99" y="68" width="2" height="10" rx="1" fill="rgba(0,0,0,0.35)" />

      <circle class="spindle" cx="100" cy="100" r="3" />
    </svg>
  </div>
</template>

<style scoped>
.player-vinyl {
  position: relative;
  display: block;
  flex-shrink: 0;
  transition: opacity var(--duration-default) var(--easing-default),
              filter   var(--duration-default) var(--easing-default);
}

.player-vinyl .device {
  width: 100%;
  height: 100%;
  display: block;
  transform-origin: center;
  will-change: transform;
}

.disc    { fill: #0c0b10; }
.label   { fill: var(--accent); }
.spindle { fill: var(--bg-elev); }

/* --- États --- */

/* éteint : opacité basse, désaturé */
.player-vinyl.is-off {
  opacity: 0.35;
  filter: saturate(0.4);
}

/* démarré sans son : visible mais immobile */
.player-vinyl.is-standby .device {
  animation: none;
}

/* en lecture : rotation continue */
.player-vinyl.is-playing .device {
  animation: vinyl-spin 3s linear infinite;
}

/* hors réseau : désaturé et opacité moyenne, suggestion d'inertie */
.player-vinyl.is-offline {
  opacity: 0.45;
  filter: grayscale(0.6);
}

@keyframes vinyl-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .player-vinyl.is-playing .device { animation: none; }
}
</style>
