<!--
  FlAdSlot — encart publicitaire neutre (FOOTER-MONETISATION.md §5).
  Espace RÉSERVÉ : fond hachuré doux, label PUBLICITÉ + dimensions
  affichées en monospace. Aucune animation, aucun son.

  IMPORTANT — classes préfixées fl- (jamais "ad-") : les ad-blockers
  masquent par défaut tout sélecteur contenant "ad". Si une vraie régie
  est branchée plus tard, garder le markup neutre côté HTML aussi.

  4 formats via le prop `kind` :
    - leaderboard : 728 × 90  (footer wide)
    - panel       : 300 × 168 — libellé "300 × 160" (variante editorial)
    - thin        : 100% × 60 (variante strip)
    - rect        : 300 × 250 (non utilisé par défaut)
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  kind: {
    type: String,
    default: 'panel',
    validator: v => ['leaderboard', 'panel', 'thin', 'rect'].includes(v)
  }
})

const dimsLabel = computed(() => {
  switch (props.kind) {
    case 'leaderboard': return '728 × 90'
    case 'panel':       return '300 × 160'
    case 'thin':        return '970 × 90'
    case 'rect':        return '300 × 250'
    default:            return ''
  }
})
</script>

<template>
  <div
    class="fl-slot"
    :class="`fl-slot-${kind}`"
    role="complementary"
    aria-label="Espace réservé"
  >
    <span class="fl-slot-label">Publicité</span>
    <span class="fl-slot-dims">{{ dimsLabel }}</span>
  </div>
</template>

<style scoped>
/* Fond hachuré doux — l'encart se voit comme une zone réservée
   sans simuler une vraie créa. */
.fl-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: var(--bg);
  background-image: repeating-linear-gradient(
    135deg,
    color-mix(in srgb, var(--text-faint) 22%, transparent) 0 1px,
    transparent 1px 9px
  );
  border-radius: var(--radius-md);
  color: var(--text-faint);
  user-select: none;
}

.fl-slot-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.fl-slot-dims {
  font-family: var(--font-mono);
  font-size: 11px;
  opacity: 0.65;
}

/* Formats */
.fl-slot-leaderboard {
  width: 100%;
  max-width: 728px;
  height: 90px;
}

.fl-slot-panel {
  width: 300px;
  height: 168px;
}

.fl-slot-thin {
  width: 100%;
  height: 60px;
}

.fl-slot-rect {
  width: 300px;
  height: 250px;
}

/* Mobile : le panel passe en pleine largeur. */
@media (max-width: 760px) {
  .fl-slot-panel {
    width: 100%;
    max-width: 360px;
  }
}
</style>
