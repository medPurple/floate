<!--
  FlPlayerDigital — placeholder en attendant l'illustration SVG dessinée.

  Représentation minimaliste d'un lecteur portable type iPod : corps
  arrondi, écran rectangulaire, roue de navigation circulaire. Quand
  l'asset arrivera (cf. la référence iPod dans la conversation), on
  remplace le bloc <svg> par l'export Figma.

  Différence d'animation vs vinyle/CD : pas de rotation continue, mais
  un fin scanline qui pulse sur l'écran quand state=playing — l'idée
  étant de coller à l'esprit "écran numérique vivant".
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
    class="player-digital"
    :class="[`is-${state}`]"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`Lecteur digital, état ${state}`"
  >
    <svg class="device" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="digital-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f5f4f9" />
          <stop offset="100%" stop-color="#dcdbe4" />
        </linearGradient>
        <linearGradient id="digital-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#16151c" />
          <stop offset="100%" stop-color="#22202a" />
        </linearGradient>
      </defs>

      <!-- Ombre douce sous l'appareil -->
      <rect x="48" y="22" width="104" height="160" rx="18" fill="rgba(0,0,0,0.22)" />

      <!-- Corps -->
      <rect class="body" x="46" y="20" width="108" height="160" rx="18" />

      <!-- Écran -->
      <rect class="screen" x="58" y="32" width="84" height="74" rx="3" />

      <!-- Scanline (animée en playing) -->
      <rect
        class="scanline"
        x="58" y="34" width="84" height="2"
        fill="rgba(255,255,255,0.08)"
      />

      <!-- Lignes texte simulées sur l'écran -->
      <g class="screen-text" fill="rgba(255,255,255,0.45)">
        <rect x="64" y="42" width="38" height="3" rx="1" />
        <rect x="64" y="50" width="56" height="3" rx="1" />
        <rect x="64" y="58" width="48" height="3" rx="1" />
        <rect x="64" y="68" width="64" height="3" rx="1" />
        <rect x="64" y="76" width="42" height="3" rx="1" />
      </g>

      <!-- Roue de navigation -->
      <circle class="wheel" cx="100" cy="142" r="28" />
      <!-- Bouton central -->
      <circle class="center-btn" cx="100" cy="142" r="9" />
    </svg>
  </div>
</template>

<style scoped>
.player-digital {
  position: relative;
  display: block;
  flex-shrink: 0;
  transition: opacity var(--duration-default) var(--easing-default),
              filter   var(--duration-default) var(--easing-default);
}

.player-digital .device {
  width: 100%;
  height: 100%;
  display: block;
}

/* Corps de l'appareil : blanc/gris léger pour évoquer un iPod classique */
.body   { fill: url(#digital-body); }
.screen { fill: url(#digital-screen); }
/* Bouton central coloré à la palette pour relier au reste de la room */
.wheel       { fill: color-mix(in srgb, var(--accent) 15%, #ecebf0); }
.center-btn  { fill: color-mix(in srgb, var(--accent) 60%, #ffffff); }

/* --- États --- */
.player-digital.is-off {
  opacity: 0.35;
  filter: saturate(0.4);
}
/* Écran éteint quand off : on cache le contenu */
.player-digital.is-off .screen { fill: #14131a; }
.player-digital.is-off .screen-text,
.player-digital.is-off .scanline { display: none; }

.player-digital.is-standby .scanline { display: none; }

/* En lecture : scanline qui descend et remonte doucement sur l'écran */
.player-digital.is-playing .scanline {
  animation: digital-scan 2.8s ease-in-out infinite;
}

.player-digital.is-offline {
  opacity: 0.45;
  filter: grayscale(0.7);
}
.player-digital.is-offline .scanline { display: none; }

@keyframes digital-scan {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50%      { transform: translateY(70px); opacity: 0.8; }
}

@media (prefers-reduced-motion: reduce) {
  .player-digital.is-playing .scanline { animation: none; }
}
</style>
