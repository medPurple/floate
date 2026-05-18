/**
 * Stats in-memory pour la console admin.
 *
 * Tout est volontairement en mémoire — quand le serveur redémarre, on
 * repart à zéro. Si on veut de la persistance, c'est SQLite/Redis qu'il
 * faudra brancher ici, derrière la même API.
 *
 * API exposée :
 *  - track*()  : événements internes appelés depuis index.js
 *  - snapshot() : état complet pour /admin/api/snapshot et le push WS
 *  - recentEvents() : flux d'activité
 *  - subscribe(cb) / unsubscribe(cb) : pour le WS admin temps réel
 */

const STARTED_AT = Date.now()

// Compteur cumulé de visites depuis 00:00 du jour courant.
let visitsToday = 0
let visitsResetAt = startOfDayMs()

function startOfDayMs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function maybeResetDailyCounters() {
  const newReset = startOfDayMs()
  if (newReset > visitsResetAt) {
    visitsToday = 0
    visitsResetAt = newReset
  }
}

// Histo des visites cumul horaire (24 buckets, ce jour)
const visitsByHour = new Array(24).fill(0)

// Sessions clôturées sur les dernières 24h : { joinedAt, leftAt }
const closedSessions = []
const SESSION_RETENTION_MS = 24 * 60 * 60 * 1000

// Ring buffer des derniers events (50 max)
const EVENT_BUFFER = 50
const events = []
let eventSeq = 0

// Subscribers WS admin
const subs = new Set()

/* ============================================================
   Trackers — appelés depuis l'index serveur
   ============================================================ */

export function trackVisit() {
  maybeResetDailyCounters()
  visitsToday += 1
  const hour = new Date().getHours()
  visitsByHour[hour] += 1
}

export function trackSessionClosed(joinedAt) {
  const now = Date.now()
  closedSessions.push({ joinedAt, leftAt: now })
  // Trim ce qui a > 24h
  const cutoff = now - SESSION_RETENTION_MS
  while (closedSessions.length && closedSessions[0].leftAt < cutoff) {
    closedSessions.shift()
  }
}

export function trackEvent(kind, who, room) {
  const ev = {
    id: ++eventSeq,
    kind,           // 'join' | 'leave' | 'create' | 'live'
    who,
    room,
    ts: Math.floor(Date.now() / 1000)
  }
  events.unshift(ev)
  if (events.length > EVENT_BUFFER) events.pop()
  fanout({ type: 'event', event: ev })
}

/* ============================================================
   Getters
   ============================================================ */

export function snapshot(rooms) {
  maybeResetDailyCounters()

  let usersOnline = 0
  let streamingRooms = 0
  for (const room of rooms.values()) {
    usersOnline += room.size
    if (room._streaming?.size > 0) streamingRooms += 1
  }

  return {
    type: 'kpi',
    ts: Date.now(),
    usersOnline,
    activeRooms: rooms.size,
    streamingRooms,
    avgListenSeconds: medianListenSeconds(),
    visitsToday,
    visitsByHour: [...visitsByHour],
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000)
  }
}

export function topRooms(rooms, limit = 6) {
  const list = []
  for (const [code, room] of rooms) {
    let hostPseudo = null
    let oldest = Infinity
    for (const [, p] of room) {
      if (p.joinedAt < oldest) {
        oldest = p.joinedAt
        hostPseudo = p.pseudo
      }
    }
    list.push({
      code,
      name: room._name || `Room ${code}`,
      host: hostPseudo,
      count: room.size,
      streaming: (room._streaming?.size || 0) > 0
    })
  }
  list.sort((a, b) => b.count - a.count)
  return list.slice(0, limit)
}

export function recentEvents(limit = 8) {
  return events.slice(0, limit)
}

function medianListenSeconds() {
  if (!closedSessions.length) return 0
  const durations = closedSessions
    .map(s => Math.floor((s.leftAt - s.joinedAt) / 1000))
    .sort((a, b) => a - b)
  const mid = Math.floor(durations.length / 2)
  return durations.length % 2 === 0
    ? Math.floor((durations[mid - 1] + durations[mid]) / 2)
    : durations[mid]
}

export function startedAt() {
  return STARTED_AT
}

/* ============================================================
   Pub/sub pour le WS admin
   ============================================================ */

export function subscribe(cb) { subs.add(cb) }
export function unsubscribe(cb) { subs.delete(cb) }

function fanout(msg) {
  for (const cb of subs) {
    try { cb(msg) } catch { /* swallow */ }
  }
}

/**
 * Pousse périodiquement le snapshot KPI à tous les abonnés admin.
 * Appelé depuis index.js avec la map rooms.
 */
export function startKpiBroadcaster(rooms, intervalMs = 2500) {
  return setInterval(() => {
    if (subs.size === 0) return
    fanout(snapshot(rooms))
    fanout({ type: 'rooms', top: topRooms(rooms) })
  }, intervalMs)
}
