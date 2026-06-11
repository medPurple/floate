<!--
  FlVinylVisualizer — proto SVG procédural d'un vinyle stylisé.
  Pas encore wiré dans FlStage : à comparer avec FlVisualizer (bars
  classiques) via Storybook avant décision.

  Design choices :
    - Disque qui reste sombre (#0c0b10) en clair comme en sombre : un
      vinyle est forcément noir, ça ferait bizarre crème.
    - 28 sillons concentriques générés en boucle (radii de 38 à 90)
      avec opacité dégradée pour donner de la profondeur sans noise SVG.
    - Reflet brillant en haut-gauche via radialGradient.
    - Étiquette centrale teintée à la palette de la room (var(--accent)).
    - Un petit repère noir sur l'étiquette pour rendre la rotation
      visuellement lisible (sinon une étiquette uniforme qui tourne =
      on ne voit rien).
    - Rotation CSS 3s linéaire infinie quand isStreaming, paused sinon.
    - prefers-reduced-motion : on garde le vinyle immobile.
-->
<script setup>
import { computed } from 'vue'

defineProps({
  /** Le son tourne ? Si oui le vinyle tourne. Sinon il reste posé. */
  isStreaming: { type: Boolean, default: false },
  /** Taille du SVG en pixels (carré). 200 par défaut. */
  size: { type: Number, default: 200 }
})

// 28 sillons entre r=38 (juste autour de l'étiquette) et r=90 (bord).
// On varie l'opacité pour suggérer de la matière.
const grooves = computed(() => {
  const out = []
  const count = 28
  for (let i = 0; i < count; i++) {
    const r = 38 + (i / (count - 1)) * 52
    // Plus on s'éloigne du centre, plus le sillon est marqué.
    const opacity = 0.18 + (i / count) * 0.42
    out.push({ r, opacity })
  }
  return out
})
</script>

<template>
  <div
    class="vinyl-wrap"
    :class="{ 'is-spinning': isStreaming }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="isStreaming ? 'Diffusion en cours' : 'Vinyle posé'"
  >
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Reflet en haut-gauche, très subtil. -->
        <radialGradient id="vinyl-sheen" cx="32%" cy="30%" r="55%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.08)" />
          <stop offset="55%" stop-color="rgba(255,255,255,0.02)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>

        <!-- Léger dégradé sur l'étiquette pour casser le flat. -->
        <radialGradient id="vinyl-label" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.12)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <!-- Disque noir + ombre douce sous le vinyle. -->
      <circle cx="100" cy="100" r="94" fill="rgba(0,0,0,0.35)" />
      <circle class="disc" cx="100" cy="100" r="92" />

      <!-- Sillons. -->
      <g fill="none" stroke="#22202a" stroke-width="0.4">
        <circle
          v-for="(g, i) in grooves"
          :key="i"
          cx="100"
          cy="100"
          :r="g.r"
          :stroke-opacity="g.opacity"
        />
      </g>

      <!-- Reflet brillant : posé après les sillons pour les adoucir. -->
      <circle cx="100" cy="100" r="92" fill="url(#vinyl-sheen)" />

      <!-- Étiquette centrale colorée à la palette. -->
      <circle class="label" cx="100" cy="100" r="34" />
      <!-- Dégradé brillant par-dessus l'étiquette. -->
      <circle cx="100" cy="100" r="34" fill="url(#vinyl-label)" />
      <!-- Liseré fin pour séparer label / sillons. -->
      <circle
        cx="100" cy="100" r="34"
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        stroke-width="0.7"
      />

      <!-- Repère noir sur l'étiquette : permet de voir la rotation.
           Petite barre subtile orientée vers le haut. -->
      <rect
        x="99"
        y="68"
        width="2"
        height="10"
        rx="1"
        fill="rgba(0,0,0,0.35)"
      />

      <!-- Trou central (couleur du fond pour fondre dans le stage). -->
      <circle class="spindle" cx="100" cy="100" r="3" />
    </svg>
  </div>
</template>

<style scoped>
.vinyl-wrap {
  display: block;
  flex-shrink: 0;
  transform-origin: center;
  will-change: transform;
}

.vinyl-wrap svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* Disque toujours sombre, même en mode clair. Un vinyle reste noir. */
.disc { fill: #0c0b10; }

/* Étiquette pilotée par la palette de la room. */
.label { fill: var(--accent); }

/* Trou central : couleur du fond du stage pour fondre l'axe. */
.spindle { fill: var(--bg-elev); }

/* Rotation : 3s linear, 33 1/3 tours/minute c'est ~1.8s mais 3s rend
   plus contemplatif visuellement. */
.vinyl-wrap.is-spinning {
  animation: vinyl-spin 3s linear infinite;
}

@keyframes vinyl-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .vinyl-wrap.is-spinning {
    animation: none;
  }
}
</style>
