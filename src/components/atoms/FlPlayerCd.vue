<!--
  FlPlayerCd — placeholder en attendant l'illustration SVG dessinée.

  Représentation minimaliste d'un CD : disque clair avec un dégradé
  conique très doux pour suggérer l'irisé argenté caractéristique, et
  un trou central plus large que le vinyle. Quand l'asset arrivera, on
  remplace le bloc <svg> ; l'API state (off/standby/playing/offline)
  ne bouge pas.
-->
<script setup>
import { PLAYER_STATES } from '../../lib/players.js'

defineProps({
  state: {
    type: String,
    default: 'off',
    validator: v => PLAYER_STATES.includes(v)
  },
  size: { type: Number, default: 200 }
})
</script>

<template>
  <div
    class="player-cd"
    :class="[`is-${state}`]"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`Lecteur CD, état ${state}`"
  >
    <svg class="device" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Irisé : un dégradé radial multi-stops pâles. C'est une
             approximation très sommaire de l'arc-en-ciel d'un CD. -->
        <radialGradient id="cd-iridescent" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#e0e6ee" />
          <stop offset="35%" stop-color="#d6dae3" />
          <stop offset="55%" stop-color="#c7ccd6" />
          <stop offset="80%" stop-color="#b6bcc8" />
          <stop offset="100%" stop-color="#9ca3b3" />
        </radialGradient>
        <radialGradient id="cd-sheen" cx="32%" cy="28%" r="60%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.55)" />
          <stop offset="60%" stop-color="rgba(255,255,255,0.05)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <!-- Ombre sous le disque -->
      <circle cx="100" cy="100" r="94" fill="rgba(0,0,0,0.25)" />
      <!-- Corps irrisé -->
      <circle cx="100" cy="100" r="92" fill="url(#cd-iridescent)" />
      <!-- Quelques cercles fins pour suggérer la lecture data -->
      <g fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.3">
        <circle cx="100" cy="100" r="70" />
        <circle cx="100" cy="100" r="56" />
        <circle cx="100" cy="100" r="44" />
      </g>
      <!-- Reflet brillant -->
      <circle cx="100" cy="100" r="92" fill="url(#cd-sheen)" />

      <!-- Zone centrale plus claire (vue du dessus, la partie miroir
           plastique au centre) -->
      <circle class="hub" cx="100" cy="100" r="26" />
      <circle
        cx="100" cy="100" r="26"
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        stroke-width="0.5"
      />
      <!-- Trou central (large sur un CD) -->
      <circle class="spindle" cx="100" cy="100" r="9" />
    </svg>
  </div>
</template>

<style scoped>
.player-cd {
  position: relative;
  display: block;
  flex-shrink: 0;
  transition: opacity var(--duration-default) var(--easing-default),
              filter   var(--duration-default) var(--easing-default);
}

.player-cd .device {
  width: 100%;
  height: 100%;
  display: block;
  transform-origin: center;
  will-change: transform;
}

/* Le hub plastique central capte une teinte accent très diluée pour
   relier le composant à la palette de la room. */
.hub     { fill: color-mix(in srgb, var(--accent) 20%, #d6dadf); }
.spindle { fill: var(--bg-elev); }

/* --- États --- */
.player-cd.is-off {
  opacity: 0.35;
  filter: saturate(0.4);
}

.player-cd.is-standby .device {
  animation: none;
}

.player-cd.is-playing .device {
  animation: cd-spin 4s linear infinite;
}

.player-cd.is-offline {
  opacity: 0.45;
  filter: grayscale(0.7);
}

@keyframes cd-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .player-cd.is-playing .device { animation: none; }
}
</style>
