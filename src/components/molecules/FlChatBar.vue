<!--
  FlChatBar — CHAT-DEDICACES.md §4
  Pill flottante en bas du stage. Input + bouton Historique (avec
  compteur) + bouton Envoyer mini-primary.

  Comportements :
    - Submit (Enter / clic Envoyer) → émet 'submit', vide l'input, blur.
    - Envoyer désactivé si vide OU si rate-limit local actif (canSend = false).
    - Hover sur Historique : très subtil.

  Placeholder volontairement distinct du composer modal :
    « Glisse une dédicace… » vs « Réponds à la conversation… »
-->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  historyCount: { type: Number, default: 0 },
  canSend: { type: Boolean, default: true },
  placeholder: { type: String, default: 'Glisse une dédicace…' }
})

const emit = defineEmits(['submit', 'open-history'])

const draft = ref('')
const inputRef = ref(null)

function send() {
  const text = draft.value.trim()
  if (!text || !props.canSend) return
  emit('submit', text)
  draft.value = ''
  inputRef.value?.blur?.()
}

function onEnter(e) {
  if (e.shiftKey) return
  e.preventDefault()
  send()
}
</script>

<template>
  <form class="fl-chat-bar" @submit.prevent="send">
    <input
      ref="inputRef"
      v-model="draft"
      class="cb-input"
      type="text"
      maxlength="140"
      :placeholder="placeholder"
      aria-label="Écrire une dédicace"
      @keydown.enter="onEnter"
    />

    <button
      type="button"
      class="cb-history"
      aria-label="Voir l'historique des messages"
      @click="emit('open-history')"
    >
      <span class="cb-history-label">Historique</span>
      <span v-if="historyCount > 0" class="cb-history-count">{{ historyCount }}</span>
    </button>

    <button
      type="submit"
      class="cb-send"
      :disabled="!draft.trim() || !canSend"
      :aria-label="canSend ? 'Envoyer la dédicace' : 'Patiente un instant'"
    >
      Envoyer
    </button>
  </form>
</template>

<style scoped>
.fl-chat-bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  background: rgba(24, 23, 31, 0.85);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
}

/* Adapt mode clair : fond crème translucide */
:root[data-theme="light"] .fl-chat-bar {
  background: rgba(250, 243, 234, 0.88);
}
@media (prefers-color-scheme: light) {
  :root[data-theme="auto"] .fl-chat-bar {
    background: rgba(250, 243, 234, 0.88);
  }
}

.cb-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--text);
  font-size: var(--fs-body-sm);
  padding: 8px 0;
}
.cb-input::placeholder { color: var(--text-faint); }

.cb-history {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-dim);
  font-size: var(--fs-mini);
  font-weight: 600;
  transition: background var(--duration-fast) var(--easing-default),
              color var(--duration-fast) var(--easing-default);
}
.cb-history:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
}
:root[data-theme="light"] .cb-history:hover {
  background: rgba(73, 51, 22, 0.06);
}
@media (prefers-color-scheme: light) {
  :root[data-theme="auto"] .cb-history:hover {
    background: rgba(73, 51, 22, 0.06);
  }
}

.cb-history-label { white-space: nowrap; }

.cb-history-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cb-send {
  height: 32px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  background: var(--accent-strong);
  color: var(--text-on-accent);
  font-size: var(--fs-mini);
  font-weight: 700;
  transition: background var(--duration-fast) var(--easing-default),
              transform var(--duration-instant) var(--easing-default);
}
.cb-send:hover:not(:disabled) { background: #d96344; }
.cb-send:active:not(:disabled) { transform: translateY(1px); }
.cb-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-elev-2);
  color: var(--text-faint);
}

/* Mobile : on resserre */
@media (max-width: 600px) {
  .fl-chat-bar { max-width: none; padding: 4px 4px 4px 12px; }
  .cb-history-label { display: none; }
  .cb-history { padding: 0 8px; }
}
</style>
