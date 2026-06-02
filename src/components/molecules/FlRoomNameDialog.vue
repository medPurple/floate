<!--
  FlRoomNameDialog — DESIGN-SYSTEM.md §3.4 (Card) + §7 (voix)
  Modale d'édition de la room : nom + tag de genre (lib/tags.js).
  Overlay sombre, card centré, FlInput + chips tag + Annuler/Valider.
  Esc ferme, Enter (dans le champ nom) soumet, autofocus + sélection
  du texte initial.

  Émet save({ name, tag }) — tag = string id ou null si « Aucun ».
  La règle 1–64 caractères sur le nom vit côté serveur ; la validation
  du tag aussi (via isTagId).
-->
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import FlButton from '../atoms/FlButton.vue'
import FlInput from '../atoms/FlInput.vue'
import { ROOM_TAGS } from '../../lib/tags.js'

const props = defineProps({
  initialName: { type: String, default: '' },
  /** Id du tag actuel, ou null si aucun. */
  initialTag: { type: String, default: null }
})

const emit = defineEmits(['save', 'cancel'])

const draftName = ref(props.initialName || '')
const draftTag = ref(props.initialTag || null)
const inputRef = ref(null)

function trySave() {
  const nextName = String(draftName.value || '').trim().slice(0, 64)
  if (!nextName) return
  emit('save', { name: nextName, tag: draftTag.value || null })
}

function pickTag(id) {
  // Re-clic sur le tag actif → on retire le tag.
  draftTag.value = draftTag.value === id ? null : id
}

function onKey(e) {
  if (e.key === 'Escape') emit('cancel')
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
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
      <h2 id="fl-rename-title" class="title">Modifier la room</h2>
      <p class="hint">
        Nom et genre — visibles pour tous les membres immédiatement.
      </p>

      <form class="form" @submit.prevent="trySave">
        <FlInput
          ref="inputRef"
          v-model="draftName"
          label="Nom de la room"
          placeholder="Set du dimanche"
          autofocus
        />

        <div class="tag-section">
          <span class="tag-label">Genre (optionnel)</span>
          <div class="tag-chips" role="listbox" aria-label="Choisir un genre">
            <button
              type="button"
              class="tag-chip"
              :class="{ 'is-selected': !draftTag }"
              role="option"
              :aria-selected="!draftTag"
              @click="draftTag = null"
            >
              aucun
            </button>
            <button
              v-for="t in ROOM_TAGS"
              :key="t.id"
              type="button"
              class="tag-chip"
              :class="{ 'is-selected': draftTag === t.id }"
              :style="draftTag === t.id ? { color: t.color, borderColor: t.color } : null"
              role="option"
              :aria-selected="draftTag === t.id"
              @click="pickTag(t.id)"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <div class="actions">
          <FlButton variant="ghost" type="button" @click="emit('cancel')">
            Annuler
          </FlButton>
          <FlButton variant="primary" type="submit" :disabled="!draftName.trim()">
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

.tag-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.tag-label {
  font-size: var(--fs-mini);
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  font-size: var(--fs-mini);
  font-weight: 600;
  color: var(--text-dim);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 4px 12px;
  transition: color var(--duration-fast) var(--easing-default),
              border-color var(--duration-fast) var(--easing-default),
              background var(--duration-fast) var(--easing-default);
}
.tag-chip:hover {
  border-color: var(--text-dim);
  color: var(--text);
}
.tag-chip.is-selected {
  border-color: var(--text);
  color: var(--text);
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
