<!--
  FlInvitePanel — DESIGN-SYSTEM.md §4.5 (panneau #1)
  Affiche le code d'invitation en mono uppercase + bouton "Copier".
  Toast 'success' à la copie (§5.3 — action utilisateur explicite).
-->
<script setup>
import FlButton from '../atoms/FlButton.vue'
import { useToasts } from '../../composables/useToasts.js'

const props = defineProps({
  code: { type: String, required: true }
})

const { push } = useToasts()

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    push({ kind: 'success', message: 'Code copié.' })
  } catch {
    push({ kind: 'error', message: 'Impossible de copier le code.' })
  }
}
</script>

<template>
  <section class="panel fl-invite">
    <h3 class="panel-title">Code d'invitation</h3>
    <div class="fl-invite-row">
      <span class="fl-invite-code">{{ code }}</span>
      <FlButton variant="secondary" @click="copy">Copier</FlButton>
    </div>
    <p class="fl-invite-hint">
      Partage ce code avec qui tu veux faire entrer dans la room.
    </p>
  </section>
</template>

<style scoped>
.fl-invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
}

.fl-invite-code {
  font-family: var(--font-mono);
  font-size: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text);
}

.fl-invite-hint {
  font-size: var(--fs-mini);
  color: var(--text-faint);
}
</style>
