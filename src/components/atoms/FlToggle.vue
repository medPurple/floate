<!--
  FlToggle — DESIGN-SYSTEM.md §3.3
  Toggle binaire (Publique / Privée par exemple).
  v-model retourne la value de l'option sélectionnée.
-->
<script setup>
const props = defineProps({
  modelValue: { type: [String, Number, Boolean], required: true },
  options: {
    type: Array,
    required: true,
    validator: arr => arr.length === 2 && arr.every(o => 'label' in o && 'value' in o)
  },
  ariaLabel: { type: String, default: '' }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="fl-toggle" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt.value"
      :class="['fl-toggle-opt', { 'is-active': modelValue === opt.value }]"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.fl-toggle {
  display: inline-flex;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}

.fl-toggle-opt {
  padding: 6px 14px;
  font-size: var(--fs-body-sm);
  font-weight: 500;
  color: var(--text-dim);
  border-radius: 6px;
  transition: background var(--duration-fast) var(--easing-default),
              color var(--duration-fast) var(--easing-default);
}

.fl-toggle-opt:hover { color: var(--text); }

.fl-toggle-opt.is-active {
  background: var(--bg-elev-2);
  color: var(--text);
}
</style>
