<!--
  FlSkeleton — DESIGN-SYSTEM.md §3.8
  Bloc en chargement, shimmer 1.4s.
  Largeur/hauteur configurables, par défaut 100% × 16px.
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: { type: [String, Number], default: '100%' },
  height: { type: [String, Number], default: 16 },
  radius: { type: [String, Number], default: 4 }
})

function toUnit(v) {
  return typeof v === 'number' ? `${v}px` : v
}

const style = computed(() => ({
  width: toUnit(props.width),
  height: toUnit(props.height),
  borderRadius: toUnit(props.radius)
}))
</script>

<template>
  <div class="fl-skeleton" :style="style" aria-hidden="true" />
</template>

<style scoped>
.fl-skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elev) 0%,
    var(--bg-elev-2) 50%,
    var(--bg-elev) 100%
  );
  background-size: 200% 100%;
  animation: fl-shimmer var(--duration-shimmer) var(--easing-in-out) infinite;
}
</style>
