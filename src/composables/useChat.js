/**
 * useChat — chat texte + propositions votables, scoped à une room.
 *
 * Storage : 100% côté front. Le serveur ne fait que relayer (cf.
 * server/index.js, types `chat-message`, `proposal-created`,
 * `proposal-vote`). Les peers qui arrivent en cours de route ne
 * voient PAS l'historique — c'est volontaire et économe.
 *
 * Structure d'un message dans `messages.value` :
 *   { id, kind: 'text',     peerId, pseudo, text, ts }
 *   { id, kind: 'proposal', proposedBy, proposedByPseudo, url, title,
 *                            ts, expiresAt, expired, votes: {peerId: 'yes'|'no'} }
 *
 * Cap mémoire : MAX_MESSAGES anciens messages, on tronque par le début.
 *
 * Expiration des propositions : un setTimeout par proposition active.
 * Cleanup automatique au démontage du composable.
 */
import { ref, onBeforeUnmount } from 'vue'
import { executeCommand } from '../lib/commands.js'
// L'import enregistre la commande dans le registry global.
import '../lib/commands/proposer.js'

const MAX_MESSAGES = 200
const PROPOSAL_TTL_MS = 10 * 60 * 1000 // 10 min

function makeId() {
  try { return crypto.randomUUID() } catch { return `m-${Date.now()}-${Math.random()}` }
}

export function useChat({ peerId, pseudo, sendChat, sendProposal, sendVote }) {
  const messages = ref([])
  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  const expiryTimers = new Map()

  function pushMessage(msg) {
    const next = messages.value.slice()
    next.push(msg)
    if (next.length > MAX_MESSAGES) next.splice(0, next.length - MAX_MESSAGES)
    messages.value = next
  }

  function scheduleExpiry(id, expiresAt) {
    cancelExpiry(id)
    const delay = Math.max(0, expiresAt - Date.now())
    const timer = setTimeout(() => {
      expiryTimers.delete(id)
      messages.value = messages.value.map(m =>
        m.kind === 'proposal' && m.id === id ? { ...m, expired: true } : m
      )
    }, delay)
    expiryTimers.set(id, timer)
  }

  function cancelExpiry(id) {
    const t = expiryTimers.get(id)
    if (t) {
      clearTimeout(t)
      expiryTimers.delete(id)
    }
  }

  /**
   * Soumet ce que l'utilisateur a tapé. Renvoie le résultat d'exécution
   * pour que l'UI puisse afficher un toast d'erreur (commande inconnue,
   * URL invalide, etc.).
   */
  async function submit(rawText) {
    const text = String(rawText || '').trim()
    if (!text) return { ok: false, reason: 'empty' }

    // --- Commande (commence par /) ----------------------------------
    if (text.startsWith('/')) {
      return executeCommand(text, {
        broadcastProposal({ url, title }) {
          const id = makeId()
          const ts = Date.now()
          const expiresAt = ts + PROPOSAL_TTL_MS
          const me = peerId.value
          // 1. push local immédiat — UX réactive
          ingestProposal({
            id, url, title,
            proposedBy: me,
            proposedByPseudo: pseudo,
            ts, expiresAt,
            votes: {}
          })
          // 2. broadcast aux autres
          sendProposal({ id, url, title, ts, expiresAt })
        }
      })
    }

    // --- Message texte normal --------------------------------------
    const msg = {
      id: makeId(),
      kind: 'text',
      peerId: peerId.value,
      pseudo,
      text,
      ts: Date.now()
    }
    pushMessage(msg)
    sendChat(msg)
    return { ok: true }
  }

  /** Vote d'un membre sur une proposition (depuis l'UI). */
  function castVote(proposalId, value) {
    const next = value === 'yes' ? 'yes' : 'no'
    const proposal = messages.value.find(m => m.kind === 'proposal' && m.id === proposalId)
    if (!proposal || proposal.expired) return
    ingestVote({ proposalId, peerId: peerId.value, value: next })
    sendVote({ proposalId, value: next })
  }

  // --- Ingestion des évènements reçus du serveur --------------------

  function ingestChat(payload) {
    if (!payload?.id) return
    if (messages.value.some(m => m.id === payload.id)) return
    pushMessage({
      id: payload.id,
      kind: 'text',
      peerId: payload.peerId,
      pseudo: payload.pseudo,
      text: payload.text,
      ts: payload.ts || Date.now()
    })
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
      url: payload.url,
      title: payload.title || null,
      ts: payload.ts || Date.now(),
      expiresAt,
      expired,
      votes: { ...(payload.votes || {}) }
    }
    pushMessage(proposal)
    if (!expired) scheduleExpiry(proposal.id, expiresAt)
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

  onBeforeUnmount(() => {
    for (const t of expiryTimers.values()) clearTimeout(t)
    expiryTimers.clear()
  })

  return {
    messages,
    submit,
    castVote,
    ingestChat,
    ingestProposal,
    ingestVote
  }
}
