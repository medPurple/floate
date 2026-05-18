<!--
  Sparkline — ADMIN-PANEL-DESIGN.md §6.4
  SVG polyline, hauteur fixe 24px, stroke --accent.
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  color: { type: String, default: 'var(--accent)' }
})

const W = 120
const H = 24

const points = computed(() => {
  if (!props.data.length) return ''
  const max = Math.max(...props.data, 1)
  const min = Math.min(...props.data, 0)
  const range = max - min || 1
  const step = W / Math.max(1, props.data.length - 1)
  return props.data.map((v, i) => {
    const x = i * step
    const y = H - ((v - min) / range) * (H - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
})
</script>

<template>
  <svg
    class="spark"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <polyline
      :points="points"
      :stroke="color"
      fill="none"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped>
.spark {
  width: 100%;
  height: 24px;
  display: block;
}
</style>
