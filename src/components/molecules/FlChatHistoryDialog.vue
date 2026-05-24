<!--
  FlChatHistoryDialog — CHAT-DEDICACES.md §5
  Modal d'historique du chat. 520px max, max-h 90vh, centrée.

  Trois zones :
    1. Header : titre + compteur + bouton Fermer (texte, pas d'icône)
    2. Body  : liste scrollable, denses (avatar + métadonnées visibles)
    3. Footer: composer "Réponds à la conversation…"

  Comportements :
    - Auto-scroll bas à l'ouverture, focus l'input 50ms après.
    - Nouveau message en cours d'ouverture → auto-scroll bas seulement si
      l'utilisateur est déjà près du fond (delta < 80px).
    - Esc / click overlay / clic Fermer → emit 'close'.
    - Submit envoie via 'submit' — la dédicace flottante apparaît derrière.
    - Vote sur proposition via 'vote'(id, value).
-->
<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { colorOf, initialOf } from '../../lib/colors.js'

const props = defineProps({
  messages: { type: Array, required: true },
  meId: { type: String, required: true },
  canSend: { type: Boolean, default: true }
})

const emit = defineEmits(['submit', 'vote', 'close'])

const draft = ref('')
const inputRef = ref(null)
const scrollRef = ref(null)

// --- Format temps relatif ("il y a 3m", "à l'instant")
const now = ref(Date.now())
let tickTimer = null

function fmtRelative(ts) {
  if (!ts) return ''
  const diff = Math.max(0, now.value - ts)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

function fmtHost(url) {
  try { return new URL(url).host.replace(/^www\./, '') }
  catch { return url }
}

function fmtRemaining(expiresAt) {
  const ms = expiresAt - now.value
  if (ms <= 0) return null
  const min = Math.round(ms / 60_000)
  if (min <= 0) return 'moins d\'1 min'
  if (min === 1) return '1 min'
  return `${min} min`
}

function countVotes(votes) {
  let yes = 0, no = 0
  for (const v of Object.values(votes || {})) {
    if (v === 'yes') yes++
    else if (v === 'no') no++
  }
  return { yes, no }
}

function myVote(p) {
  return p.votes?.[props.meId] || null
}

const isEmpty = computed(() => props.messages.length === 0)

// --- Scroll bottom -----------------------------------------------------

function isNearBottom() {
  const el = scrollRef.value
  if (!el) return true
  return (el.scrollHeight - el.scrollTop - el.clientHeight) < 80
}

function scrollToBottom() {
  const el = scrollRef.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(() => props.messages.length, async (n, prev) => {
  if (n <= (prev || 0)) return
  const stick = isNearBottom()
  await nextTick()
  if (stick) scrollToBottom()
})

// --- Keyboard ----------------------------------------------------------

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  tickTimer = setInterval(() => { now.value = Date.now() }, 30_000)
  await nextTick()
  scrollToBottom()
  setTimeout(() => { inputRef.value?.focus?.() }, 50)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (tickTimer) clearInterval(tickTimer)
})

// --- Submit ------------------------------------------------------------

function send() {
  const text = draft.value.trim()
  if (!text || !props.canSend) return
  emit('submit', text)
  draft.value = ''
}

function onEnter(e) {
  if (e.shiftKey) return
  e.preventDefault()
  send()
}

function vote(id, value) {
  emit('vote', id, value)
}
</script>

<template>
  <div
    class="fl-chat-history-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Historique des messages"
    @click.self="emit('close')"
  >
    <div class="fl-chat-history card">
      <header class="ch-head">
        <div class="ch-head-text">
          <h2 class="ch-title">Historique</h2>
          <p v-if="!isEmpty" class="ch-sub">
            {{ messages.length }} {{ messages.length > 1 ? 'messages' : 'message' }} depuis le début
          </p>
          <p v-else class="ch-sub">Pas encore de dédicace.</p>
        </div>
        <button
          type="button"
          class="ch-close"
          aria-label="Fermer l'historique"
          @click="emit('close')"
        >
          Fermer
        </button>
      </header>

      <div ref="scrollRef" class="ch-body">
        <p v-if="isEmpty" class="ch-empty">
          Lance la conversation, sans casser l'écoute.
        </p>

        <template v-for="m in messages" :key="m.id">
          <!-- Message texte -->
          <article v-if="m.kind === 'msg'" class="msg" :class="{ 'is-host': m.host, 'is-me': m.peerId === meId }">
            <div class="avatar" :style="{ background: m.host ? 'var(--accent)' : colorOf(m.pseudo) }">
              {{ initialOf(m.pseudo) }}
            </div>
            <div class="msg-body">
              <header class="msg-meta">
                <span class="msg-who" :style="{ color: m.host ? 'var(--accent)' : 'inherit' }">
                  {{ m.pseudo }}<span v-if="m.peerId === meId" class="msg-me-tag"> (toi)</span>
                </span>
                <time class="msg-ts">{{ fmtRelative(m.ts) }}</time>
              </header>
              <p class="msg-text">{{ m.text }}</p>
            </div>
          </article>

          <!-- Système -->
          <p v-else-if="m.kind === 'system'" class="msg-system">
            {{ m.text }}
          </p>

          <!-- Proposition (votable) -->
          <article
            v-else-if="m.kind === 'proposal'"
            class="msg msg-proposal"
            :class="{ 'is-expired': m.expired }"
          >
            <div class="avatar" :style="{ background: m.host ? 'var(--accent)' : colorOf(m.proposedByPseudo) }">
              {{ initialOf(m.proposedByPseudo) }}
            </div>
            <div class="msg-body">
              <header class="msg-meta">
                <span class="msg-who" :style="{ color: m.host ? 'var(--accent)' : 'inherit' }">
                  {{ m.proposedByPseudo }}
                </span>
                <span class="prop-tag">propose</span>
                <time class="msg-ts">{{ fmtRelative(m.ts) }}</time>
              </header>
              <p v-if="m.title" class="prop-title">{{ m.title }}</p>
              <a
                :href="m.url"
                target="_blank"
                rel="noopener noreferrer"
                class="prop-link"
              >
                {{ fmtHost(m.url) }}
              </a>
              <footer class="prop-foot">
                <div class="votes">
                  <button
                    type="button"
                    class="vote-btn vote-yes"
                    :class="{ 'is-active': myVote(m) === 'yes' }"
                    :disabled="m.expired"
                    @click="vote(m.id, 'yes')"
                  >
                    Oui · {{ countVotes(m.votes).yes }}
                  </button>
                  <button
                    type="button"
                    class="vote-btn vote-no"
                    :class="{ 'is-active': myVote(m) === 'no' }"
                    :disabled="m.expired"
                    @click="vote(m.id, 'no')"
                  >
                    Non · {{ countVotes(m.votes).no }}
                  </button>
                </div>
                <span v-if="m.expired" class="prop-status">Expirée</span>
                <span v-else class="prop-status">Expire dans {{ fmtRemaining(m.expiresAt) }}</span>
              </footer>
            </div>
          </article>
        </template>
      </div>

      <form class="ch-foot" @submit.prevent="send">
        <input
          ref="inputRef"
          v-model="draft"
          class="fl-input ch-foot-input"
          type="text"
          maxlength="280"
          placeholder="Réponds à la conversation…"
          aria-label="Répondre à la conversation"
          @keydown.enter="onEnter"
        />
        <button
          type="submit"
          class="ch-foot-send"
          :disabled="!draft.trim() || !canSend"
        >
          Envoyer
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.fl-chat-history-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(14, 13, 18, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  animation: fl-ch-fade var(--duration-default) var(--easing-out);
}

.fl-chat-history {
  width: 100%;
  max-width: 520px;
  max-height: min(720px, 90vh);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

/* --- Header --- */
.ch-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border);
}
.ch-title {
  font-size: var(--fs-h2);
  font-weight: 700;
  color: var(--text);
}
.ch-sub {
  font-size: var(--fs-mini);
  color: var(--text-dim);
  margin-top: 2px;
}
.ch-close {
  align-self: flex-start;
  font-size: var(--fs-body-sm);
  color: var(--text-dim);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) var(--easing-default),
              background var(--duration-fast) var(--easing-default);
}
.ch-close:hover { color: var(--text); background: rgba(255, 255, 255, 0.04); }
:root[data-theme="light"] .ch-close:hover { background: rgba(73, 51, 22, 0.06); }
@media (prefers-color-scheme: light) {
  :root[data-theme="auto"] .ch-close:hover { background: rgba(73, 51, 22, 0.06); }
}

/* --- Body --- */
.ch-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  scroll-behavior: smooth;
}

.ch-empty {
  color: var(--text-faint);
  font-size: var(--fs-body-sm);
  text-align: center;
  padding: 32px;
}

/* --- Message (texte ou proposition) --- */
.msg {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: var(--space-sm);
  align-items: start;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.msg.is-host .avatar { color: var(--text-on-accent); }

.msg-body { min-width: 0; }

.msg-meta {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  margin-bottom: 2px;
}

.msg-who {
  font-weight: 600;
  font-size: var(--fs-meta);
  color: var(--text);
}
.msg-me-tag {
  font-weight: 400;
  color: var(--text-dim);
  font-size: var(--fs-mini);
}

.msg-ts {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.msg-text {
  font-size: var(--fs-body-sm);
  line-height: 1.45;
  color: var(--text);
  word-break: break-word;
  white-space: pre-wrap;
}

/* --- Système --- */
.msg-system {
  font-style: italic;
  color: var(--text-faint);
  font-size: var(--fs-mini);
  text-align: center;
  padding: 4px 0;
}

/* --- Proposition --- */
.msg-proposal .msg-body {
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-left-width: 3px;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.msg-proposal.is-expired .msg-body {
  background: var(--bg);
  border-color: var(--border);
  opacity: 0.6;
}

.prop-tag {
  font-size: var(--fs-micro);
  text-transform: uppercase;
  letter-spacing: var(--tracking-badge);
  color: var(--text-dim);
  font-weight: 700;
}

.prop-title {
  font-weight: 600;
  font-size: var(--fs-body-sm);
  color: var(--text);
}

.prop-link {
  font-size: var(--fs-body-sm);
  color: var(--accent);
  word-break: break-all;
}

.prop-foot {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.votes { display: inline-flex; gap: var(--space-xs); }

.vote-btn {
  font-size: var(--fs-mini);
  font-weight: 600;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-dim);
  transition: border-color var(--duration-fast) var(--easing-default),
              color var(--duration-fast) var(--easing-default),
              background var(--duration-fast) var(--easing-default);
}
.vote-btn:hover:not(:disabled) {
  color: var(--text);
  border-color: var(--text-faint);
}
.vote-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.vote-btn.vote-yes.is-active {
  background: var(--good); color: var(--text-on-accent); border-color: var(--good);
}
.vote-btn.vote-no.is-active {
  background: var(--bg-elev-2); color: var(--text); border-color: var(--text-faint);
}

.prop-status {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-faint);
}

/* --- Footer composer --- */
.ch-foot {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl) var(--space-lg);
  border-top: 1px solid var(--border);
}

.ch-foot-send {
  height: 38px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  background: var(--bg-elev-2);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: var(--fs-body-sm);
  font-weight: 600;
  transition: border-color var(--duration-fast) var(--easing-default),
              transform var(--duration-instant) var(--easing-default);
}
.ch-foot-send:hover:not(:disabled) { border-color: var(--text-faint); }
.ch-foot-send:active:not(:disabled) { transform: translateY(1px); }
.ch-foot-send:disabled { opacity: 0.45; cursor: not-allowed; }

@keyframes fl-ch-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@media (max-width: 600px) {
  .ch-head, .ch-body, .ch-foot {
    padding-left: var(--space-lg);
    padding-right: var(--space-lg);
  }
}
</style>
