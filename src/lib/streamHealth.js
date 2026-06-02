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
 * Métriques utilisées (RTCInboundRtpStreamStats, kind=audio) :
 *  - concealedSamples / totalSamplesReceived → taux d'échantillons
 *    "comblés" par WebRTC quand des paquets manquent (PLC). C'est le
 *    meilleur signal de "le son que j'entends est en train d'être inventé".
 *  - bytesReceived → si le compteur stagne pendant N secondes, le flux
 *    est complètement coupé (pas juste dégradé).
 *
 * Seuils (option "strict") :
 *  - Pause si conceal rate > 5% sur l'intervalle, ou bytes flat > 2s
 *  - Reprise si conceal rate < 1% pendant 3s continus
 *
 * Les fonctions sont pures : testables sans Vue, sans WebRTC.
 */

export const POLL_INTERVAL_MS = 1000
export const POOR_CONCEAL_RATE = 0.05
export const RECOVER_CONCEAL_RATE = 0.01
export const NO_PACKETS_MS = 2000
export const RECOVER_MS = 3000

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
 *  - state : { health, reason, prev, lastBytesIncreaseAt, cleanSince }
 *  - inbound : RTCInboundRtpStreamStats actuel (peut être null)
 *  - now : timestamp ms
 *
 * Output : nouveau state (immutable update).
 *
 * Si inbound est null, on garde l'état précédent (pas de signal exploitable).
 */
export function nextHealthState(state, inbound, now) {
  if (!inbound) return state

  const bytes = inbound.bytesReceived || 0
  const prevBytes = state.prev ? (state.prev.bytesReceived || 0) : -1
  const bytesIncreased = bytes > prevBytes

  const lastBytesIncreaseAt = bytesIncreased ? now : state.lastBytesIncreaseAt
  const stalledMs = now - lastBytesIncreaseAt

  const concealRate = computeConcealRate(state.prev, inbound)

  let health = state.health
  let reason = state.reason
  let cleanSince = state.cleanSince

  if (stalledMs > NO_PACKETS_MS) {
    health = 'lost'
    reason = 'no-packets'
    cleanSince = null
  } else if (concealRate > POOR_CONCEAL_RATE) {
    health = 'poor'
    reason = 'conceal'
    cleanSince = null
  } else if (health !== 'good') {
    // Possibly recovering
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
    cleanSince
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
    cleanSince: null
  }
}
