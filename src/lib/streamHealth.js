/**
 * streamHealth — logique pure pour évaluer la santé d'un flux WebRTC
 * audio entrant (côté listener).
 *
 * Pourquoi : quand la connexion d'un listener est instable, WebRTC ne
 * coupe pas le son — il accélère ou ralentit la lecture pour rattraper
 * le buffer. Résultat : la musique semble distordue ("accélère / décélère").
 * Mieux vaut couper le son et le reprendre quand le réseau est OK,
 * comme une radio qui perd le signal.
 *
 * Stratégie anti faux-positifs (suite au feedback "trop sensible") :
 *   1. GRACE_PERIOD_MS — on ignore l'état pendant les premières secondes
 *      après l'attache (le jitter buffer de WebRTC met du temps à se
 *      caler, c'est normal d'avoir un peu de PLC au début).
 *   2. CONSECUTIVE_BAD_POLLS — pour passer en 'poor', il faut N polls
 *      consécutifs au-dessus du seuil. Un pic isolé ne déclenche pas.
 *   3. Seuils volontairement larges (15% conceal, 4s sans paquets).
 *      L'idée est de ne couper que quand c'est vraiment audible, pas
 *      à la moindre micro-perturbation.
 *
 * Métriques utilisées (RTCInboundRtpStreamStats, kind=audio) :
 *  - concealedSamples / totalSamplesReceived → taux d'échantillons
 *    "comblés" par WebRTC quand des paquets manquent (PLC).
 *  - bytesReceived → si le compteur stagne pendant N secondes, le flux
 *    est complètement coupé.
 *
 * Les fonctions sont pures : testables sans Vue, sans WebRTC.
 */

export const POLL_INTERVAL_MS = 1500
export const POOR_CONCEAL_RATE = 0.15
export const RECOVER_CONCEAL_RATE = 0.05
export const NO_PACKETS_MS = 4000
export const RECOVER_MS = 2000
export const GRACE_PERIOD_MS = 5000
export const CONSECUTIVE_BAD_POLLS = 2

/**
 * Extrait le report inbound-rtp audio d'un RTCStatsReport.
 * Renvoie null si non trouvé.
 */
export function extractInboundAudio(statsReport) {
  if (!statsReport || typeof statsReport.forEach !== 'function') return null
  let inbound = null
  statsReport.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
      inbound = report
    }
  })
  return inbound
}

/**
 * Calcule le taux d'échantillons comblés sur un intervalle.
 * dConcealed / dTotal. Renvoie 0 si pas assez de données.
 */
export function computeConcealRate(prev, curr) {
  if (!prev || !curr) return 0
  const dConcealed = Math.max(0, (curr.concealedSamples || 0) - (prev.concealedSamples || 0))
  const dTotal = Math.max(0, (curr.totalSamplesReceived || 0) - (prev.totalSamplesReceived || 0))
  if (dTotal <= 0) return 0
  return dConcealed / dTotal
}

/**
 * Machine d'état health.
 *
 * Inputs :
 *  - state : voir initialHealthState
 *  - inbound : RTCInboundRtpStreamStats actuel (peut être null)
 *  - now : timestamp ms
 *
 * Output : nouveau state (immutable update).
 *
 * Règles :
 *  - Pendant la grace period (5s après startedAt), on reste 'good'
 *    quelles que soient les métriques.
 *  - On passe 'lost' immédiatement après NO_PACKETS_MS sans bytes.
 *  - On passe 'poor' seulement après CONSECUTIVE_BAD_POLLS polls
 *    consécutifs au-dessus du seuil de conceal.
 *  - Retour à 'good' après RECOVER_MS continus en dessous du seuil
 *    bas de conceal.
 */
export function nextHealthState(state, inbound, now) {
  if (!inbound) return state

  const bytes = inbound.bytesReceived || 0
  const prevBytes = state.prev ? (state.prev.bytesReceived || 0) : -1
  const bytesIncreased = bytes > prevBytes

  const lastBytesIncreaseAt = bytesIncreased ? now : state.lastBytesIncreaseAt
  const stalledMs = now - lastBytesIncreaseAt
  const sinceStart = now - state.startedAt

  const concealRate = computeConcealRate(state.prev, inbound)
  const isPollBad = concealRate > POOR_CONCEAL_RATE

  // Compteur de polls consécutifs au-dessus du seuil (debounce).
  const consecutiveBadPolls = isPollBad
    ? state.consecutiveBadPolls + 1
    : 0

  let health = state.health
  let reason = state.reason
  let cleanSince = state.cleanSince

  // Période de grâce : pendant les premières secondes après l'attache,
  // on ne déclenche rien (le jitter buffer se cale).
  if (sinceStart < GRACE_PERIOD_MS) {
    return {
      health: 'good',
      reason: null,
      prev: inbound,
      lastBytesIncreaseAt,
      cleanSince: null,
      consecutiveBadPolls: 0,
      startedAt: state.startedAt
    }
  }

  if (stalledMs > NO_PACKETS_MS) {
    health = 'lost'
    reason = 'no-packets'
    cleanSince = null
  } else if (consecutiveBadPolls >= CONSECUTIVE_BAD_POLLS) {
    health = 'poor'
    reason = 'conceal'
    cleanSince = null
  } else if (health !== 'good') {
    // En cours de récupération
    if (concealRate < RECOVER_CONCEAL_RATE && stalledMs < 500) {
      if (cleanSince === null) cleanSince = now
      if (now - cleanSince >= RECOVER_MS) {
        health = 'good'
        reason = null
        cleanSince = null
      }
    } else {
      cleanSince = null
    }
  }

  return {
    health,
    reason,
    prev: inbound,
    lastBytesIncreaseAt,
    cleanSince,
    consecutiveBadPolls,
    startedAt: state.startedAt
  }
}

/**
 * État initial pour démarrer le tracking d'un flux.
 */
export function initialHealthState(now = Date.now()) {
  return {
    health: 'good',
    reason: null,
    prev: null,
    lastBytesIncreaseAt: now,
    cleanSince: null,
    consecutiveBadPolls: 0,
    startedAt: now
  }
}
