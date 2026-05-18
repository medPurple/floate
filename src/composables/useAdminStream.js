/**
 * useAdminStream — abonnement temps réel au flux admin.
 *
 * - WS sur /admin/stream pour les KPIs (push toutes ~2.5s côté serveur)
 *   et les events (par event)
 * - Backoff exponentiel à la reconnexion (1→2→4→8→30s)
 * - Polling REST fallback /admin/api/snapshot toutes les 30s si la WS
 *   tombe (jamais en parallèle, pour ne pas DDoS)
 *
 * Le token est stocké en localStorage 'floate.admin-token' — le call
 * site (la view) gère la prompt s'il manque.
 */
import { ref, onBeforeUnmount } from 'vue'
import { SIGNALING_URL, ADMIN_HTTP_URL } from '../lib/config.js'

const STORAGE_KEY = 'floate.admin-token'

export function getAdminToken() {
  try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}

export function setAdminToken(token) {
  try { localStorage.setItem(STORAGE_KEY, token) } catch { /* */ }
}

export function clearAdminToken() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* */ }
}

export function useAdminStream() {
  const kpi = ref(null)              // dernier snapshot KPI
  const topRooms = ref([])
  const events = ref([])             // ring buffer 50 max
  const status = ref('connecting')   // connecting | connected | reconnecting | unauthorized | error
  const lastUpdateTs = ref(null)

  let ws = null
  let backoffStep = 0
  let reconnectTimer = null
  let pollingTimer = null
  let stopped = false

  function buildWsUrl() {
    const token = getAdminToken()
    return `${SIGNALING_URL.replace(/\/$/, '')}/admin/stream?token=${encodeURIComponent(token)}`
  }

  function ingest(msg) {
    lastUpdateTs.value = Date.now()
    if (msg.type === 'kpi') kpi.value = msg
    else if (msg.type === 'rooms') topRooms.value = msg.top
    else if (msg.type === 'event') {
      events.value = [msg.event, ...events.value].slice(0, 50)
    }
  }

  async function pollOnce() {
    const token = getAdminToken()
    try {
      const res = await fetch(`${ADMIN_HTTP_URL}/admin/api/snapshot?token=${encodeURIComponent(token)}`)
      if (res.status === 401) {
        status.value = 'unauthorized'
        return
      }
      if (!res.ok) throw new Error(`http ${res.status}`)
      const data = await res.json()
      ingest(data)
      if (data.topRooms) topRooms.value = data.topRooms
      if (data.events) events.value = data.events
    } catch (e) {
      // silencieux — le WS retentera, le polling reste un fallback
    }
  }

  function startPolling() {
    if (pollingTimer) return
    pollOnce()
    pollingTimer = setInterval(pollOnce, 30_000)
  }

  function stopPolling() {
    if (pollingTimer) clearInterval(pollingTimer)
    pollingTimer = null
  }

  function scheduleReconnect() {
    if (stopped) return
    const delays = [1000, 2000, 4000, 8000, 30_000]
    const delay = delays[Math.min(backoffStep, delays.length - 1)]
    backoffStep += 1
    status.value = 'reconnecting'
    reconnectTimer = setTimeout(connect, delay)
  }

  function connect() {
    if (stopped) return
    if (!getAdminToken()) {
      status.value = 'unauthorized'
      return
    }
    try {
      ws = new WebSocket(buildWsUrl())
    } catch {
      scheduleReconnect()
      return
    }

    ws.addEventListener('open', () => {
      backoffStep = 0
      status.value = 'connected'
      stopPolling()
    })

    ws.addEventListener('message', (e) => {
      let msg
      try { msg = JSON.parse(e.data) } catch { return }
      ingest(msg)
    })

    ws.addEventListener('close', (e) => {
      ws = null
      if (e.code === 1008 || e.code === 4401) {
        status.value = 'unauthorized'
        return
      }
      startPolling()
      scheduleReconnect()
    })

    ws.addEventListener('error', () => {
      // close suivra
    })
  }

  function disconnect() {
    stopped = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (pollingTimer) clearInterval(pollingTimer)
    try { ws?.close() } catch { /* */ }
  }

  // Démarrage
  connect()

  onBeforeUnmount(disconnect)

  return {
    kpi, topRooms, events, status, lastUpdateTs,
    disconnect
  }
}
