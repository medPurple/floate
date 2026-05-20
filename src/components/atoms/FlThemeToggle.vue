<!--
  FlThemeToggle — bouton qui cycle auto → dark → light → auto.
  L'icône reflète le mode courant. Pas d'emoji (DS §0), juste un SVG
  inline avec stroke en --text-dim.
-->
<script setup>
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme.js'

const { mode, cycle } = useTheme()

const label = computed(() => {
  if (mode.value === 'auto')  return 'Thème : automatique'
  if (mode.value === 'dark')  return 'Thème : sombre'
  return 'Thème : clair'
})
</script>

<template>
  <button
    type="button"
    class="fl-theme-toggle"
    :title="label"
    :aria-label="label"
    @click="cycle"
  >
    <!-- Auto : cercle moitié-moitié -->
    <svg v-if="mode === 'auto'" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="M 10 3 A 7 7 0 0 1 10 17 Z" fill="currentColor" />
    </svg>

    <!-- Dark : croissant -->
    <svg v-else-if="mode === 'dark'" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M 14 4 a 7 7 0 1 0 4 8 a 5 5 0 0 1 -4 -8 z"
        fill="currentColor"
      />
    </svg>

    <!-- Light : soleil stylisé -->
    <svg v-else viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" fill="currentColor" />
      <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="10" y1="16" x2="10" y2="18" />
        <line x1="2" y1="10" x2="4" y2="10" />
        <line x1="16" y1="10" x2="18" y2="10" />
        <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
        <line x1="14.4" y1="14.4" x2="15.8" y2="15.8" />
        <line x1="15.8" y1="4.2" x2="14.4" y2="5.6" />
        <line x1="5.6" y1="14.4" x2="4.2" y2="15.8" />
      </g>
    </svg>
  </button>
</template>

<style scoped>
.fl-theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--text-dim);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) var(--easing-default),
              background var(--duration-fast) var(--easing-default);
}

.fl-theme-toggle:hover {
  color: var(--text);
  background: var(--bg-elev-2);
}

.fl-theme-toggle svg {
  width: 16px;
  height: 16px;
}
</style>
