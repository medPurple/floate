/**
 * useStreamHealth — surveille la santé d'un flux WebRTC entrant et
 * expose une ref `health` réactive ('good' | 'poor' | 'lost').
 *
 * Côté listener uniquement. Le composant parent décide quoi faire
 * (mettre l'audio en pause, swap le visualizer pour une icône).
 *
 * Inputs :
 *  - getStats : () => Promise<RTCStatsReport | null>
 *    typiquement `() => roomConn.getPeerStats(roomConn.hostId.value)`
 *  - active : Ref<boolean>
 *    quand false, on ne poll pas (économie + reset de l'état)
 *
 * La logique pure est dans lib/streamHealth.js — ici on ne fait que
 * cadencer les polls et exposer le state dans Vue.
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import {
  POLL_INTERVAL_MS,
  extractInboundAudio,
  initialHealthState,
  nextHealthState
} from '../lib/streamHealth.js'

export function useStreamHealth({ getStats, active }) {
  const health = ref('good')
  const reason = ref(null)

  let state = initialHealthState()
  let timer = null

  async function poll() {
    if (!active.value) return
    let report
    try {
      report = await getStats()
    } catch {
      return
    }
    const inbound = extractInboundAudio(report)
    state = nextHealthState(state, inbound, Date.now())
    if (state.health !== health.value) health.value = state.health
    if (state.reason !== reason.value) reason.value = state.reason
  }

  function start() {
    if (timer) return
    state = initialHealthState()
    health.value = 'good'
    reason.value = null
    // Premier poll immédiat — sinon on attend 1s avant de savoir.
    poll()
    timer = setInterval(poll, POLL_INTERVAL_MS)
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null }
    health.value = 'good'
    reason.value = null
    state = initialHealthState()
  }

  watch(active, (on) => { on ? start() : stop() }, { immediate: true })

  onBeforeUnmount(stop)

  return { health, reason }
}
