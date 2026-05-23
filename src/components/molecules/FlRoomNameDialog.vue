<!--
  FlRoomNameDialog — DESIGN-SYSTEM.md §3.4 (Card) + §7 (voix)
  Petite modale pour renommer la room. Overlay sombre, card centré,
  FlInput + Annuler/Valider. Esc ferme, Enter soumet, autofocus sur
  l'input avec sélection du texte initial.

  Volontairement minimal : un seul champ, pas de validation lourde.
  La règle 1–64 caractères vit côté serveur.
-->
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import FlButton from '../atoms/FlButton.vue'
import FlInput from '../atoms/FlInput.vue'

const props = defineProps({
  initialName: { type: String, default: '' }
})

const emit = defineEmits(['save', 'cancel'])

const draft = ref(props.initialName || '')
const inputRef = ref(null)

function trySave() {
  const next = String(draft.value || '').trim().slice(0, 64)
  if (!next) return
  emit('save', next)
}

function onKey(e) {
  if (e.key === 'Escape') emit('cancel')
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  // Focus + sélection du texte existant pour pouvoir taper par-dessus.
  await nextTick()
  const el = inputRef.value?.$el?.querySelector?.('input') || null
  if (el) {
    el.focus()
    el.select()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    class="fl-room-name-dialog-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="fl-rename-title"
    @click.self="emit('cancel')"
  >
    <div class="fl-room-name-dialog card">
      <h2 id="fl-rename-title" class="title">Renommer la room</h2>
      <p class="hint">
        Le nouveau nom sera visible pour tous les membres immédiatement.
      </p>

      <form class="form" @submit.prevent="trySave">
        <FlInput
          ref="inputRef"
          v-model="draft"
          label="Nom de la room"
          placeholder="Set du dimanche"
          autofocus
        />

        <div class="actions">
          <FlButton variant="ghost" type="button" @click="emit('cancel')">
            Annuler
          </FlButton>
          <FlButton variant="primary" type="submit" :disabled="!draft.trim()">
            Valider
          </FlButton>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.fl-room-name-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(14, 13, 18, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  animation: fl-dialog-fade var(--duration-default) var(--easing-out);
}

.fl-room-name-dialog {
  width: 100%;
  max-width: var(--max-width-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.title {
  font-size: var(--fs-h2);
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.hint {
  font-size: var(--fs-body-sm);
  color: var(--text-dim);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

@keyframes fl-dialog-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
