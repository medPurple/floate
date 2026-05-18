<!--
  FlInput — DESIGN-SYSTEM.md §3.2
  Variante "text" (par défaut) et "mono" pour les codes d'invitation.
  Le label est rendu si fourni, sinon il faut un aria-label via attrs.
-->
<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  variant: {
    type: String,
    default: 'text',
    validator: v => ['text', 'mono'].includes(v)
  },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const id = useId()
const inputClass = computed(() => ['fl-input', props.variant === 'mono' && 'is-mono'])
</script>

<template>
  <div class="fl-input-field">
    <label v-if="label" :for="id" class="fl-input-label">{{ label }}</label>
    <input
      :id="id"
      :class="inputClass"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :autofocus="autofocus"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="hint" class="fl-input-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.fl-input-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fl-input-label {
  font-size: var(--fs-mini);
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

.fl-input {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: var(--fs-body);
  color: var(--text);
  width: 100%;
  transition: border-color var(--duration-fast) var(--easing-default),
              box-shadow var(--duration-fast) var(--easing-default);
}

.fl-input::placeholder { color: var(--text-faint); }

.fl-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.fl-input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fl-input.is-mono {
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fl-input-hint {
  font-size: var(--fs-mini);
  color: var(--text-faint);
}
</style>
