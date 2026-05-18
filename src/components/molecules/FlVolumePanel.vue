<!--
  FlVolumePanel — panneau sidebar pour le volume de réception.
  Le volume est persisté en localStorage et appliqué à l'élément audio
  de la Room. Visible pour tout le monde (le host n'entend rien, donc
  c'est cosmétique pour lui — on garde le panel pour que le réglage
  survive aux bascules host ↔ listener).
-->
<script setup>
import { ref, watch, onMounted } from 'vue'
import FlVolumeSlider from '../atoms/FlVolumeSlider.vue'

const STORAGE_KEY = 'floate.volume'

const props = defineProps({
  // État dégradé optionnel : on grise + message si non actif.
  disabled: { type: Boolean, default: false },
  disabledHint: { type: String, default: '' }
})

const emit = defineEmits(['change'])

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return 80
    const n = Number(raw)
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 80
  } catch {
    return 80
  }
}

const value = ref(readStored())

watch(value, (v) => {
  try { localStorage.setItem(STORAGE_KEY, String(v)) } catch { /* */ }
  emit('change', v / 100)
})

// Émet la valeur initiale au mount pour que l'audio prenne le volume
// mémorisé sans attendre une interaction.
onMounted(() => emit('change', value.value / 100))

function mute() { value.value = 0 }
function full() { value.value = 100 }
</script>

<template>
  <section class="panel" :aria-disabled="disabled || null">
    <h3 class="panel-title">Volume</h3>

    <div :class="['vol-row', { 'is-disabled': disabled }]">
      <button
        type="button"
        class="vol-edge"
        aria-label="Couper le son"
        :disabled="disabled"
        @click="mute"
      >0</button>

      <FlVolumeSlider v-model="value" :disabled="disabled" />

      <button
        type="button"
        class="vol-edge"
        aria-label="Volume max"
        :disabled="disabled"
        @click="full"
      >100</button>
    </div>

    <p class="vol-readout">
      <span class="vol-value">{{ value }}<span class="pct">%</span></span>
      <span v-if="disabled && disabledHint" class="vol-hint">{{ disabledHint }}</span>
    </p>
  </section>
</template>

<style scoped>
.vol-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 6px;
}

.vol-row.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.vol-edge {
  background: none;
  border: 0;
  padding: 4px 6px;
  font-size: var(--fs-micro);
  font-family: var(--font-mono);
  color: var(--text-faint);
  cursor: pointer;
  transition: color var(--duration-fast) var(--easing-default);
  border-radius: var(--radius-xs);
}
.vol-edge:hover:not(:disabled) { color: var(--text); }
.vol-edge:disabled { cursor: not-allowed; }

.vol-readout {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
}

.vol-value {
  font-size: var(--fs-body-sm);
  color: var(--text);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.pct {
  color: var(--text-dim);
  font-weight: 400;
  margin-left: 2px;
}

.vol-hint {
  font-size: var(--fs-mini);
  color: var(--text-faint);
}
</style>
