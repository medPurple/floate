<!--
  KpiCard — ADMIN-PANEL-DESIGN.md §4.1 + §6.1
  Une "tuile" KPI : label, valeur, delta optionnel, sparkline optionnelle.
  Point pulsant `live` (vert --good) à droite du label uniquement pour la 1ère.
-->
<script setup>
import { computed } from 'vue'
import Sparkline from './Sparkline.vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  delta: { type: Object, default: null }, // { value: '+12%', dir: 'up'|'down'|'flat' }
  spark: { type: Array, default: null },
  live: { type: Boolean, default: false },
  mono: { type: Boolean, default: false }   // pour MM:SS
})

const deltaClass = computed(() => {
  if (!props.delta) return ''
  return `is-${props.delta.dir || 'flat'}`
})

const deltaArrow = computed(() => {
  if (!props.delta) return ''
  return props.delta.dir === 'up' ? '↑' : props.delta.dir === 'down' ? '↓' : '→'
})
</script>

<template>
  <article class="kpi-card">
    <header class="kpi-head">
      <span class="kpi-label">{{ label }}</span>
      <span v-if="live" class="kpi-live" aria-label="Mesure en temps réel"></span>
    </header>

    <p :class="['kpi-value', { 'is-mono': mono }]">{{ value }}</p>

    <p v-if="delta" :class="['kpi-delta', deltaClass]">
      <span aria-hidden="true">{{ deltaArrow }}</span> {{ delta.value }}
    </p>

    <Sparkline v-if="spark && spark.length" :data="spark" class="kpi-spark" />
  </article>
</template>

<style scoped>
.kpi-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.kpi-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kpi-label {
  font-size: var(--fs-mini);
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: var(--tracking-badge);
}

.kpi-live {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--good);
  animation: fl-pulse var(--duration-pulse) var(--easing-in-out) infinite;
}

.kpi-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.kpi-value.is-mono {
  font-family: var(--font-mono);
  font-size: 30px;
}

.kpi-delta {
  font-size: var(--fs-mini);
  color: var(--text-dim);
}

.kpi-delta.is-up   { color: var(--good); }
.kpi-delta.is-down { color: var(--text-dim); }

.kpi-spark { margin-top: 4px; }
</style>
