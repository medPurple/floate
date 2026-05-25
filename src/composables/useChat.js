/**
 * useChat — dédicaces éphémères de la room (CHAT-DEDICACES.md).
 *
 * Deux états visuels distincts :
 *   - `messages`  : historique complet (max 200), consulté via la modal Historique.
 *   - `floating`  : file éphémère visible à l'écran (TTL 7s, cap 6) qui alimente
 *                   le composant FlDedications. Chaque item s'auto-retire.
 *
 * Storage : 100% côté front. Le serveur ne fait que relayer (cf. server/index.js).
 * Les peers qui arrivent en cours de route ne voient ni l'historique ni les
 * dédicaces déjà passées — c'est l'esprit "signal radio" du spec.
 *
 * Types de message :
 *   { id, kind: 'msg',      peerId, pseudo, host, text, ts }
 *   { id, kind: 'system',   text, ts }                            ← générés côté front
 *   { id, kind: 'proposal', proposedBy, proposedByPseudo, host,
 *                            url, title, ts, expiresAt, expired,
 *                            votes: {peerId: 'yes'|'no'} }
 *
 * Rate limit local : 1 envoi / 2s par cet utilisateur. Au-delà, submit
 * renvoie { ok: false, reason: 'rate-limited' } — l'UI désactive Envoyer.
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import { executeCommand } from '../lib/commands.js'
import { containsBanword } from '../lib/banwords.js'
// L'import enregistre la commande dans le registry global.
import '../lib/commands/proposer.js'

const MAX_HISTORY = 200
const MAX_FLOATING = 6
const FLOATING_TTL_MS = 7000
const PROPOSAL_TTL_MS = 10 * 60 * 1000 // 10 min
const SEND_COOLDOWN_MS = 2000

function makeId() {
  try { return crypto.randomUUID() } catch { return `m-${Date.now()}-${Math.random()}` }
}

export function useChat({ peerId, pseudo, isHost, sendChat, sendProposal, sendVote }) {
  // --- State exposé -----------------------------------------------------
  const messages = ref([])
  const floating = ref([])
  const historyCount = computed(() => messages.value.length)

  // Rate limit local (cooldown 2s entre deux envois de cet utilisateur)
  const cooldownRemainingMs = ref(0)
  const canSend = computed(() => cooldownRemainingMs.value <= 0)
  let cooldownTimer = null

  // --- Helpers ---------------------------------------------------------

  function isHostNow() {
    if (typeof isHost === 'function') return !!isHost()
    if (isHost && typeof isHost.value !== 'undefined') return !!isHost.value
    return !!isHost
  }

  function pushHistory(msg) {
    const next = messages.value.slice()
    next.push(msg)
    if (next.length > MAX_HISTORY) next.splice(0, next.length - MAX_HISTORY)
    messages.value = next
  }

  /** Place une bulle dans la file flottante. Auto-retrait après TTL. */
  function pushFloating(msg) {
    if (msg.kind === 'proposal' && msg.expired) return
    const floatingId = makeId()
    const item = { ...msg, floatingId }
    const next = floating.value.slice()
    next.push(item)
    // Cap à MAX_FLOATING : on lâche l'ancienne (skip son anim de sortie).
    while (next.length > MAX_FLOATING) next.shift()
    floating.value = next
    setTimeout(() => {
      floating.value = floating.value.filter(m => m.floatingId !== floatingId)
    }, FLOATING_TTL_MS)
  }

  function startCooldown() {
    if (cooldownTimer) clearInterval(cooldownTimer)
    cooldownRemainingMs.value = SEND_COOLDOWN_MS
    const startedAt = Date.now()
    cooldownTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const left = SEND_COOLDOWN_MS - elapsed
      if (left <= 0) {
        cooldownRemainingMs.value = 0
        clearInterval(cooldownTimer)
        cooldownTimer = null
      } else {
        cooldownRemainingMs.value = left
      }
    }, 200)
  }

  // --- Proposition : expiration côté front (mute du vote) -------------
  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  const proposalExpiryTimers = new Map()

  function scheduleProposalExpiry(id, expiresAt) {
    cancelProposalExpiry(id)
    const delay = Math.max(0, expiresAt - Date.now())
    const t = setTimeout(() => {
      proposalExpiryTimers.delete(id)
      messages.value = messages.value.map(m =>
        m.kind === 'proposal' && m.id === id ? { ...m, expired: true } : m
      )
    }, delay)
    proposalExpiryTimers.set(id, t)
  }

  function cancelProposalExpiry(id) {
    const t = proposalExpiryTimers.get(id)
    if (t) { clearTimeout(t); proposalExpiryTimers.delete(id) }
  }

  // --- Soumission utilisateur ----------------------------------------

  async function submit(rawText) {
    if (!canSend.value) {
      return { ok: false, reason: 'rate-limited' }
    }
    const text = String(rawText || '').trim()
    if (!text) return { ok: false, reason: 'empty' }

    // -- Banword filter (cf. lib/banwords.js) --
    // On déclenche le cooldown pour décourager le testing en boucle,
    // et on renvoie un message neutre — sans répéter le mot fautif.
    if (containsBanword(text)) {
      startCooldown()
      return { ok: false, reason: 'banword', message: 'Message refusé.' }
    }

    // -- Commande --
    if (text.startsWith('/')) {
      const result = await executeCommand(text, {
        broadcastProposal({ url, title }) {
          const id = makeId()
          const ts = Date.now()
          const expiresAt = ts + PROPOSAL_TTL_MS
          const me = peerId.value
          // 1. push local
          ingestProposal({
            id, url, title,
            proposedBy: me,
            proposedByPseudo: pseudo,
            host: isHostNow(),
            ts, expiresAt, votes: {}
          })
          // 2. broadcast
          sendProposal({ id, url, title, ts, expiresAt, host: isHostNow() })
          startCooldown()
        }
      })
      // En cas d'erreur de commande, on ne déclenche pas le cooldown.
      return result || { ok: true }
    }

    // -- Message texte simple --
    const msg = {
      id: makeId(),
      kind: 'msg',
      peerId: peerId.value,
      pseudo,
      host: isHostNow(),
      text,
      ts: Date.now()
    }
    pushHistory(msg)
    pushFloating(msg)
    sendChat({ id: msg.id, text: msg.text, host: msg.host })
    startCooldown()
    return { ok: true }
  }

  // --- Émissions internes (système) ----------------------------------

  /**
   * Ajoute un message système local (« Sam a démarré la diffusion. »).
   * Non broadcasté : chaque client construit ses propres système-msgs
   * à partir des événements signaling qu'il reçoit.
   */
  function pushSystem(text) {
    const trimmed = String(text || '').trim()
    if (!trimmed) return
    const msg = {
      id: makeId(),
      kind: 'system',
      text: trimmed,
      ts: Date.now()
    }
    pushHistory(msg)
    pushFloating(msg)
  }

  // --- Vote sur une proposition --------------------------------------

  function castVote(proposalId, value) {
    const next = value === 'yes' ? 'yes' : 'no'
    const proposal = messages.value.find(m => m.kind === 'proposal' && m.id === proposalId)
    if (!proposal || proposal.expired) return
    ingestVote({ proposalId, peerId: peerId.value, value: next })
    sendVote({ proposalId, value: next })
  }

  // --- Ingestion (messages reçus du serveur) -------------------------

  function ingestChat(payload) {
    if (!payload?.id) return
    if (messages.value.some(m => m.id === payload.id)) return
    const msg = {
      id: payload.id,
      kind: 'msg',
      peerId: payload.peerId,
      pseudo: payload.pseudo,
      host: !!payload.host,
      text: payload.text,
      ts: payload.ts || Date.now()
    }
    pushHistory(msg)
    pushFloating(msg)
  }

  function ingestProposal(payload) {
    if (!payload?.id) return
    if (messages.value.some(m => m.kind === 'proposal' && m.id === payload.id)) return
    const expiresAt = Number(payload.expiresAt) || (Date.now() + PROPOSAL_TTL_MS)
    const expired = expiresAt <= Date.now()
    const proposal = {
      id: payload.id,
      kind: 'proposal',
      proposedBy: payload.proposedBy,
      proposedByPseudo: payload.proposedByPseudo,
      host: !!payload.host,
      url: payload.url,
      title: payload.title || null,
      ts: payload.ts || Date.now(),
      expiresAt,
      expired,
      votes: { ...(payload.votes || {}) }
    }
    pushHistory(proposal)
    pushFloating(proposal)
    if (!expired) scheduleProposalExpiry(proposal.id, expiresAt)
  }

  function ingestVote({ proposalId, peerId: voterId, value }) {
    if (!proposalId || !voterId) return
    const next = value === 'yes' ? 'yes' : value === 'no' ? 'no' : null
    if (!next) return
    messages.value = messages.value.map(m => {
      if (m.kind !== 'proposal' || m.id !== proposalId) return m
      if (m.votes[voterId] === next) return m
      return { ...m, votes: { ...m.votes, [voterId]: next } }
    })
  }

  // --- Cleanup --------------------------------------------------------

  onBeforeUnmount(() => {
    if (cooldownTimer) clearInterval(cooldownTimer)
    for (const t of proposalExpiryTimers.values()) clearTimeout(t)
    proposalExpiryTimers.clear()
    floating.value = []
  })

  return {
    messages, floating, historyCount,
    canSend, cooldownRemainingMs,
    submit, castVote, pushSystem,
    ingestChat, ingestProposal, ingestVote
  }
}
