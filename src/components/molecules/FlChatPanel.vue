<!--
  FlChatPanel — chat de la room, sous la stage, pleine largeur.
  DESIGN-SYSTEM.md §3.4 (panel) + §3.1 (boutons : Envoyer = secondary,
  car .btn-primary est déjà éventuellement sur la stage host-ready).

  Affiche deux types de messages :
   - text     → pseudo coloré (colorOf) + texte
   - proposal → card mise en évidence (fond accent-soft, bordure accent)
                avec lien, votes Oui/Non, compteurs en live, état expiré

  L'auto-scroll bas ne se déclenche que si l'utilisateur est déjà
  proche du bas — pour qu'il puisse lire l'historique sans être
  jeté en bas à chaque nouveau message.
-->
<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import FlButton from '../atoms/FlButton.vue'
import { colorOf } from '../../lib/colors.js'

const props = defineProps({
  messages: { type: Array, required: true },
  meId: { type: String, required: true }
})

const emit = defineEmits(['submit', 'vote'])

const draft = ref('')
const inputRef = ref(null)
const scrollRef = ref(null)

// --- Helpers --------------------------------------------------------

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function fmtHost(url) {
  try { return new URL(url).host.replace(/^www\./, '') }
  catch { return url }
}

function countVotes(votes) {
  let yes = 0, no = 0
  for (const v of Object.values(votes || {})) {
    if (v === 'yes') yes++
    else if (v === 'no') no++
  }
  return { yes, no }
}

function myVote(proposal) {
  return proposal.votes?.[props.meId] || null
}

// Affiche un compte à rebours grossier ("8 min", "1 min", "<1 min").
const now = ref(Date.now())
let tickTimer = null
onMounted(() => {
  tickTimer = setInterval(() => { now.value = Date.now() }, 30_000)
})
onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
})

function remaining(expiresAt) {
  const ms = expiresAt - now.value
  if (ms <= 0) return null
  const min = Math.round(ms / 60_000)
  if (min <= 0) return 'moins d\'1 min'
  if (min === 1) return '1 min'
  return `${min} min`
}

// --- Auto-scroll bottom (uniquement si on est déjà proche du bas) ---

function isNearBottom() {
  const el = scrollRef.value
  if (!el) return true
  const dist = el.scrollHeight - el.scrollTop - el.clientHeight
  return dist < 60
}

watch(() => props.messages.length, async (n, prev) => {
  if (n <= (prev || 0)) return
  const stickToBottom = isNearBottom()
  await nextTick()
  if (stickToBottom && scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  }
})

// --- Actions --------------------------------------------------------

function send() {
  const text = String(draft.value || '').trim()
  if (!text) return
  emit('submit', text)
  draft.value = ''
}

function onEnter(e) {
  if (e.shiftKey) return // laisse la nouvelle ligne (au cas où on passe en textarea plus tard)
  e.preventDefault()
  send()
}

function vote(proposalId, value) {
  emit('vote', proposalId, value)
}

const isEmpty = computed(() => props.messages.length === 0)
</script>

<template>
  <section class="panel fl-chat-panel" aria-label="Chat de la room">
    <header class="head">
      <h3 class="panel-title">Chat</h3>
      <p class="hint">
        Tape <code>/proposer &lt;url&gt;</code> pour proposer un lien à voter.
      </p>
    </header>

    <div ref="scrollRef" class="messages" role="log" aria-live="polite">
      <p v-if="isEmpty" class="empty">
        Personne n'a encore parlé. Tu peux ouvrir le bal.
      </p>

      <template v-for="m in messages" :key="m.id">
        <!-- Message texte -->
        <article v-if="m.kind === 'text'" class="msg msg-text" :class="{ 'is-me': m.peerId === meId }">
          <span class="msg-pseudo" :style="{ color: colorOf(m.pseudo) }">
            {{ m.pseudo }}
          </span>
          <span class="msg-text-body">{{ m.text }}</span>
          <time class="msg-time">{{ fmtTime(m.ts) }}</time>
        </article>

        <!-- Proposition -->
        <article
          v-else-if="m.kind === 'proposal'"
          class="msg msg-proposal"
          :class="{ 'is-expired': m.expired }"
        >
          <header class="prop-head">
            <span class="prop-author" :style="{ color: colorOf(m.proposedByPseudo) }">
              {{ m.proposedByPseudo }}
            </span>
            <span class="prop-tag">propose</span>
            <time class="msg-time">{{ fmtTime(m.ts) }}</time>
          </header>

          <p v-if="m.title" class="prop-title">{{ m.title }}</p>

          <a
            :href="m.url"
            target="_blank"
            rel="noopener noreferrer"
            class="prop-link"
          >
            {{ fmtHost(m.url) }}
            <span class="prop-link-note">ouvre dans un nouvel onglet</span>
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
            <span v-else class="prop-status">Expire dans {{ remaining(m.expiresAt) }}</span>
          </footer>
        </article>
      </template>
    </div>

    <form class="composer" @submit.prevent="send">
      <input
        ref="inputRef"
        v-model="draft"
        class="fl-input composer-input"
        type="text"
        maxlength="600"
        placeholder="Un mot pour la room, ou /proposer https://…"
        aria-label="Écrire un message"
        @keydown.enter="onEnter"
      />
      <FlButton variant="secondary" type="submit" :disabled="!draft.trim()">
        Envoyer
      </FlButton>
    </form>
  </section>
</template>

<style scoped>
.fl-chat-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-title {
  margin: 0;
}

.hint {
  font-size: var(--fs-mini);
  color: var(--text-faint);
}

.hint code {
  font-family: var(--font-mono);
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  color: var(--text-dim);
}

/* --- Messages container --------------------------------------- */
.messages {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 320px;
  min-height: 140px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.empty {
  color: var(--text-faint);
  font-size: var(--fs-body-sm);
  text-align: center;
  padding: var(--space-lg) 0;
}

/* --- Message texte -------------------------------------------- */
.msg {
  font-size: var(--fs-body-sm);
  line-height: 1.45;
  color: var(--text);
}

.msg-text {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-sm);
  align-items: baseline;
}

.msg-pseudo {
  font-weight: 700;
  white-space: nowrap;
}

.msg-text-body {
  word-break: break-word;
  white-space: pre-wrap;
}

.msg-time {
  font-size: var(--fs-micro);
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* --- Proposition ---------------------------------------------- */
.msg-proposal {
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-left-width: 3px;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  transition: opacity var(--duration-default) var(--easing-default);
}

.msg-proposal.is-expired {
  opacity: 0.55;
  border-color: var(--border);
  background: var(--bg-elev);
}

.prop-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
}

.prop-author {
  font-weight: 700;
  font-size: var(--fs-mini);
}

.prop-tag {
  font-size: var(--fs-micro);
  text-transform: uppercase;
  letter-spacing: var(--tracking-badge);
  color: var(--text-dim);
  font-weight: 700;
}

.prop-head .msg-time {
  margin-left: auto;
}

.prop-title {
  font-weight: 600;
  color: var(--text);
  font-size: var(--fs-body-sm);
}

.prop-link {
  font-size: var(--fs-body-sm);
  color: var(--accent);
  display: inline-flex;
  flex-direction: column;
  word-break: break-all;
}

.prop-link-note {
  font-size: var(--fs-micro);
  color: var(--text-faint);
  font-weight: 400;
}

.prop-foot {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.votes {
  display: inline-flex;
  gap: var(--space-xs);
}

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
  background: var(--good);
  color: var(--text-on-accent);
  border-color: var(--good);
}

.vote-btn.vote-no.is-active {
  background: var(--bg-elev-2);
  color: var(--text);
  border-color: var(--text-faint);
}

.prop-status {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-faint);
}

/* --- Composer -------------------------------------------------- */
.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-sm);
  align-items: center;
}

.composer-input {
  /* Hérite des styles globaux .fl-input. */
}

/* --- Mobile ---------------------------------------------------- */
@media (max-width: 600px) {
  .messages { max-height: 260px; }
  .msg-text {
    grid-template-columns: auto 1fr;
  }
  .msg-text .msg-time { grid-column: 2; justify-self: end; }
}
</style>
