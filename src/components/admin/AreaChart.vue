<!--
  AreaChart — ADMIN-PANEL-DESIGN.md §4.2 + §6.2
  Aire SVG avec gradient + dernier point en halo pulsant.
  viewBox 600×200, preserveAspectRatio none (responsive horizontal).
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },     // points [0..n]
  hours: { type: Array, default: () => [0, 6, 12, 18, 23] }
})

const W = 600
const H = 200
const PAD_B = 24
const PAD_T = 10

const max = computed(() => {
  const m = Math.max(...props.data, 1)
  // Arrondi au multiple de 20 supérieur pour des graduations lisibles
  return Math.ceil(m / 20) * 20
})

function xForIndex(i) {
  if (props.data.length < 2) return W / 2
  return (i / (props.data.length - 1)) * W
}

function yForValue(v) {
  const h = H - PAD_B - PAD_T
  return PAD_T + h - (v / max.value) * h
}

const linePoints = computed(() =>
  props.data.map((v, i) => `${xForIndex(i).toFixed(1)},${yForValue(v).toFixed(1)}`).join(' ')
)

const areaPath = computed(() => {
  if (!props.data.length) return ''
  const pts = props.data.map((v, i) => `${xForIndex(i).toFixed(1)} ${yForValue(v).toFixed(1)}`)
  return `M 0 ${H - PAD_B} L ${pts.join(' L ')} L ${W} ${H - PAD_B} Z`
})

const last = computed(() => {
  const i = props.data.length - 1
  if (i < 0) return null
  return { x: xForIndex(i), y: yForValue(props.data[i]) }
})

const gridY = computed(() => [0, max.value / 2, max.value])
</script>

<template>
  <div class="area-chart">
    <svg
      class="area-svg"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="none"
      role="img"
      aria-label="Visites sur les dernières heures"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-strong)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="var(--accent-strong)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Gridlines -->
      <line
        v-for="(g, i) in gridY"
        :key="i"
        x1="0"
        :y1="yForValue(g)"
        :x2="W"
        :y2="yForValue(g)"
        stroke="var(--border)"
        stroke-width="0.5"
        vector-effect="non-scaling-stroke"
      />

      <!-- Aire -->
      <path :d="areaPath" fill="url(#areaGrad)" />

      <!-- Ligne -->
      <polyline
        :points="linePoints"
        fill="none"
        stroke="var(--accent)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />

      <!-- Dernier point + halo pulsant -->
      <g v-if="last">
        <circle :cx="last.x" :cy="last.y" r="4" fill="var(--accent)" />
        <circle :cx="last.x" :cy="last.y" r="4" fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.4">
          <animate attributeName="r" from="4" to="12" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>

    <div class="area-ticks">
      <span v-for="h in hours" :key="h">{{ String(h).padStart(2, '0') }}h</span>
    </div>
  </div>
</template>

<style scoped>
.area-chart {
  width: 100%;
}
.area-svg {
  width: 100%;
  height: 200px;
  display: block;
}
.area-ticks {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  margin-top: 6px;
}
</style>
