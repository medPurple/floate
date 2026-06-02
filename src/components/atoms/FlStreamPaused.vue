<!--
  FlStreamPaused — DESIGN-SYSTEM.md §3.9 (substitut visualizer).
  Affiché à la place de FlVisualizer quand le listener perd le signal :
  icône "signal coupé" + label discret. Hauteur = 80px (= FlVisualizer)
  pour ne pas faire sauter le layout pendant les transitions.

  Métaphore radio : on n'entend plus parce que la réception flanche,
  pas parce que le host a arrêté. Le badge ON AIR reste rouge en haut.
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 'poor' (audio dégradé) | 'lost' (plus aucun paquet) */
  state: {
    type: String,
    default: 'poor',
    validator: v => ['poor', 'lost'].includes(v)
  }
})

const label = computed(() => {
  return props.state === 'lost' ? 'Signal coupé' : 'Connexion instable'
})

const hint = computed(() => 'Le son reprend dès que ça redevient stable.')
</script>

<template>
  <div
    class="fl-stream-paused"
    role="status"
    aria-live="polite"
    :data-state="state"
  >
    <!-- WiFi-off : trois arcs concentriques + slash diagonal -->
    <svg
      class="fsp-icon"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      aria-hidden="true"
    >
      <!-- Arcs -->
      <path
        d="M6 18 a12 12 0 0 1 24 0"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.35"
      />
      <path
        d="M10 21 a8 8 0 0 1 16 0"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.55"
      />
      <path
        d="M14 24 a4 4 0 0 1 8 0"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.8"
      />
      <circle cx="18" cy="28" r="1.5" fill="currentColor" />

      <!-- Slash diagonal -->
      <line
        x1="6" y1="6" x2="30" y2="30"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
      />
    </svg>

    <div class="fsp-text">
      <span class="fsp-label">{{ label }}</span>
      <span class="fsp-hint">{{ hint }}</span>
    </div>
  </div>
</template>

<style scoped>
.fl-stream-paused {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 80px;
  max-width: 420px;
  width: 100%;
  color: var(--text-dim);
}

.fsp-icon {
  flex-shrink: 0;
  color: var(--text-faint);
}

.fl-stream-paused[data-state="lost"] .fsp-icon {
  color: var(--text-dim);
}

.fsp-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.fsp-label {
  font-size: var(--fs-body-sm);
  font-weight: 600;
  color: var(--text-dim);
}

.fsp-hint {
  font-size: var(--fs-mini);
  color: var(--text-faint);
}

/* Mobile : on resserre et on garde tout en ligne. */
@media (max-width: 600px) {
  .fl-stream-paused { gap: 10px; }
  .fsp-icon { width: 28px; height: 28px; }
}
</style>
