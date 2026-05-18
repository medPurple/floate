<!--
  FlAvatar — DESIGN-SYSTEM.md §3.7 (participant) + §2.1 (colorOf)
  Cercle 28×28 par défaut. Host = fond --accent, texte --text-on-accent.
  Listener = hsl dérivé du pseudo, texte blanc.
-->
<script setup>
import { computed } from 'vue'
import { colorOf, initialOf } from '../../lib/colors.js'

const props = defineProps({
  pseudo: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  size: { type: Number, default: 28 }
})

const style = computed(() => {
  const base = {
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${Math.round(props.size * 0.43)}px`
  }
  if (props.isHost) {
    return { ...base, background: 'var(--accent)', color: 'var(--text-on-accent)' }
  }
  return { ...base, background: colorOf(props.pseudo), color: '#fff' }
})

const initial = computed(() => initialOf(props.pseudo))
</script>

<template>
  <div class="fl-avatar" :style="style" :aria-label="`Avatar de ${pseudo}`">
    {{ initial }}
  </div>
</template>

<style scoped>
.fl-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
  user-select: none;
}
</style>
