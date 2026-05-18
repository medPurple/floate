<!--
  RangeToggle — ADMIN-PANEL-DESIGN.md §6.5
  Comme FlToggle mais accepte 3 options. Largeur intrinsèque.
-->
<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, default: () => [
    { label: '24h', value: '24h' },
    { label: '7j',  value: '7j' },
    { label: '30j', value: '30j' }
  ]}
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="range" role="radiogroup" aria-label="Plage temporelle">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt.value"
      :class="['range-opt', { 'is-active': modelValue === opt.value }]"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.range {
  display: inline-flex;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}
.range-opt {
  padding: 6px 12px;
  font-size: var(--fs-mini);
  font-weight: 500;
  color: var(--text-dim);
  border-radius: 6px;
  transition: background var(--duration-fast) var(--easing-default),
              color var(--duration-fast) var(--easing-default);
}
.range-opt:hover { color: var(--text); }
.range-opt.is-active {
  background: var(--bg-elev-2);
  color: var(--text);
}
</style>
