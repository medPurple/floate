<!--
  FlButton — DESIGN-SYSTEM.md §3.1
  5 variantes : primary, secondary, ghost, danger, pending.
  Règle d'or : une seule .btn-primary par viewport.
  La variante "danger" est réservée à "Arrêter la diffusion".
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'secondary',
    validator: v => ['primary', 'secondary', 'ghost', 'danger', 'pending'].includes(v)
  },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  /** Pour les liens stylés comme des boutons. */
  as: { type: String, default: 'button' },
  href: { type: String, default: null }
})

defineEmits(['click'])

const classes = computed(() => ['btn', `btn-${props.variant}`])
</script>

<template>
  <component
    :is="as === 'a' ? 'a' : 'button'"
    :class="classes"
    :type="as === 'a' ? null : type"
    :href="as === 'a' ? href : null"
    :disabled="as === 'a' ? null : disabled || variant === 'pending'"
    :aria-disabled="(disabled || variant === 'pending') || null"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>
</template>
