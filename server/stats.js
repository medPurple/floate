/**
 * Stats pour la console admin — version v0.5 avec persistance fichier.
 *
 * Stockage texte (JSON + NDJSON) le temps de la version 0.6 qui
 * apportera une vraie base de données. Layout :
 *
 *   server/data/
 *     stats.json          KPIs cumulés (visites, sessions, sources,
 *                         trafic, géo). Flushé en debounce 30s + sur
 *                         SIGTERM/SIGINT.
 *     events.log          NDJSON append-only des events d'activité.
 *     chat/<code>.log     NDJSON append-only par room (cf. index.js).
 *
 * API exposée :
 *  - track*()    : événements internes appelés depuis index.js
 *  - snapshot()  : état complet pour /admin/api/snapshot + push WS
 *  - recentEvents() : flux d'activité (ring buffer en mémoire)
 *  - subscribe(cb) / unsubscribe(cb) : pour le WS admin temps réel
 *  - loadFromDisk() / flushNow() / startAutoFlush() : persistance
 */

import fs from 'node:fs'
import path from 'node:path'

const STARTED_AT = Date.now()

// --- Paramétrage ---------------------------------------------------------

const DATA_DIR  = process.env.FLOATE_DATA_DIR || path.join(process.cwd(), 'data')
const STATS_FILE = path.join(DATA_DIR, 'stats.json')
const EVENTS_LOG = path.join(DATA_DIR, 'events.log')
const CHAT_DIR   = path.join(DATA_DIR, 'chat')

const SESSION_RETENTION_MS = 24 * 60 * 60 * 1000
const FLUSH_INTERVAL_MS    = 30_000
const EVENT_BUFFER_SIZE    = 50

// --- État en mémoire (snapshot persistant) ------------------------------

const state = {
  visitsToday: 0,
  visitsResetAt: startOfDayMs(),
  visitsByHour: new Array(24).fill(0),
  closedSessions: [],
  // Compteurs cumulés depuis l'install. Maps { name → count }.
  listenSources: Object.create(null),
  trafficSources: Object.create(null),
  geo: Object.create(null)
}

// Ring buffer des derniers events (50 max) — pour le push admin.
// L'historique complet vit dans events.log côté disque.
const events = []
let eventSeq = 0

// Subscribers WS admin
const subs = new Set()

// Persistance : dirty bit + timer
let dirty = false
let flushTimer = null

// --- Utilitaires ---------------------------------------------------------

function startOfDayMs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function maybeResetDailyCounters() {
  const newReset = startOfDayMs()
  if (newReset > state.visitsResetAt) {
    state.visitsToday = 0
    state.visitsResetAt = newReset
    state.visitsByHour = new Array(24).fill(0)
    dirty = true
  }
}

function ensureDataDirs() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.mkdirSync(CHAT_DIR, { recursive: true })
  } catch (err) {
    console.warn('[stats] mkdir data dirs failed:', err.message)
  }
}

function safeIncrement(map, key) {
  if (!key) return
  map[key] = (map[key] || 0) + 1
  dirty = true
}

function mapToList(map, limit = 12) {
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

// --- Persistance (lecture/écriture) -------------------------------------

export function loadFromDisk() {
  ensureDataDirs()
  if (!fs.existsSync(STATS_FILE)) return
  try {
    const raw = fs.readFileSync(STATS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    // Merge prudent : on garde les nouveaux champs absents du fichier.
    if (Number.isFinite(data.visitsToday))   state.visitsToday   = data.visitsToday
    if (Number.isFinite(data.visitsResetAt)) state.visitsResetAt = data.visitsResetAt
    if (Array.isArray(data.visitsByHour) && data.visitsByHour.length === 24) {
      state.visitsByHour = data.visitsByHour.map(n => Number(n) || 0)
    }
    if (Array.isArray(data.closedSessions)) {
      const cutoff = Date.now() - SESSION_RETENTION_MS
      state.closedSessions = data.closedSessions
        .filter(s => s && Number.isFinite(s.leftAt) && s.leftAt >= cutoff)
    }
    if (data.listenSources  && typeof data.listenSources  === 'object') Object.assign(state.listenSources,  data.listenSources)
    if (data.trafficSources && typeof data.trafficSources === 'object') Object.assign(state.trafficSources, data.trafficSources)
    if (data.geo            && typeof data.geo            === 'object') Object.assign(state.geo,            data.geo)
    // Si la journée a changé pendant l'arrêt, reset.
    maybeResetDailyCounters()
    console.log('[stats] loaded from', STATS_FILE)
  } catch (err) {
    console.warn('[stats] load failed:', err.message)
  }
}

export function flushNow() {
  if (!dirty) return
  ensureDataDirs()
  try {
    const payload = JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      ...state
    }, null, 2)
    fs.writeFileSync(STATS_FILE, payload, 'utf-8')
    dirty = false
  } catch (err) {
    console.warn('[stats] flush failed:', err.message)
  }
}

export function startAutoFlush(intervalMs = FLUSH_INTERVAL_MS) {
  if (flushTimer) return flushTimer
  flushTimer = setInterval(flushNow, intervalMs)
  return flushTimer
}

export function stopAutoFlush() {
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null }
}

// --- Trackers ------------------------------------------------------------

export function trackVisit() {
  maybeResetDailyCounters()
  state.visitsToday += 1
  state.visitsByHour[new Date().getHours()] += 1
  dirty = true
}

export function trackSessionClosed(joinedAt) {
  const now = Date.now()
  state.closedSessions.push({ joinedAt, leftAt: now })
  // Trim ce qui a > 24h.
  const cutoff = now - SESSION_RETENTION_MS
  while (state.closedSessions.length && state.closedSessions[0].leftAt < cutoff) {
    state.closedSessions.shift()
  }
  dirty = true
}

/**
 * trackEvent — push dans le ring buffer mémoire (pour admin temps réel)
 * + append au fichier events.log (NDJSON).
 */
export function trackEvent(kind, who, room) {
  const ev = {
    id: ++eventSeq,
    kind,
    who,
    room,
    ts: Math.floor(Date.now() / 1000)
  }
  events.unshift(ev)
  if (events.length > EVENT_BUFFER_SIZE) events.pop()

  // Append au log persistant. Async, on ignore les erreurs (pas critique).
  fs.appendFile(EVENTS_LOG, JSON.stringify(ev) + '\n', (err) => {
    if (err) console.warn('[stats] events.log append failed:', err.message)
  })

  fanout({ type: 'event', event: ev })
}

/**
 * trackChatMessage — append au log chat de la room (server/data/chat/<code>.log).
 * Pas de buffer mémoire ici (le serveur ne stocke pas l'historique chat,
 * c'est uniquement pour audit / modération post-mortem).
 */
export function trackChatMessage({ room, peerId, pseudo, text, ts }) {
  if (!room) return
  ensureDataDirs()
  const file = path.join(CHAT_DIR, `${sanitizeCode(room)}.log`)
  const line = JSON.stringify({ peerId, pseudo, text, ts }) + '\n'
  fs.appendFile(file, line, (err) => {
    if (err) console.warn('[stats] chat log append failed:', err.message)
  })
}

function sanitizeCode(code) {
  return String(code).replace(/[^A-Za-z0-9_-]/g, '')
}

// --- Classifiers pour sources / trafic / géo ----------------------------

/**
 * Classe une URL d'onglet en source d'écoute connue. Renvoie 'Autres'
 * par défaut, null si l'URL est invalide ou vide.
 */
export function classifyListenSource(url) {
  if (!url) return null
  let host
  try { host = new URL(url).hostname.replace(/^www\./, '').toLowerCase() }
  catch { return null }
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube'
  if (host.includes('spotify.com')) return 'Spotify'
  if (host.includes('bandcamp.com')) return 'Bandcamp'
  if (host.includes('soundcloud.com')) return 'SoundCloud'
  if (host.includes('twitch.tv')) return 'Twitch'
  if (host.includes('mixcloud.com')) return 'Mixcloud'
  if (host.includes('deezer.com')) return 'Deezer'
  if (host.includes('apple.com')) return 'Apple Music'
  return 'Autres'
}

/**
 * Classe l'origine d'une session (referrer + URL d'entrée).
 *   - Direct           : pas de referrer
 *   - Lien d'invitation : referrer ou hash contient /r/CODE
 *   - Réseaux sociaux  : referrer sur facebook/twitter/x/instagram/reddit/etc
 *   - Autre            : tout le reste
 */
export function classifyTrafficSource({ referrer, hash }) {
  const hashStr = String(hash || '')
  if (hashStr.includes('/r/')) return 'Lien d\'invitation'

  const ref = String(referrer || '').trim()
  if (!ref) return 'Direct'

  let host
  try { host = new URL(ref).hostname.replace(/^www\./, '').toLowerCase() }
  catch { return 'Autre' }

  // Self-referrer (on rentre depuis la page invitation) → invitation.
  if (host === 'floate.app' || host.endsWith('.floate.app') || host.includes('floate.pages.dev')) {
    return 'Lien d\'invitation'
  }

  const socials = ['facebook', 't.co', 'twitter', 'x.com', 'instagram',
                   'reddit', 'tiktok', 'youtube', 'linkedin', 'discord',
                   'mastodon', 'bsky.app']
  if (socials.some(s => host.includes(s))) return 'Réseaux sociaux'

  return 'Autre'
}

/**
 * Extrait un code pays depuis un header Accept-Language. Stopgap honnête :
 * la locale ne reflète pas vraiment la géo, mais c'est mieux que rien
 * sans dépendance externe. À remplacer par geo IP en v0.6.
 *
 *   "fr-FR,fr;q=0.9,en-US;q=0.8" → "FR"
 *   "en-US"                       → "US"
 *   "fr"                          → "Inconnu" (pas de pays)
 */
export function extractCountryCode(acceptLanguage) {
  if (!acceptLanguage) return 'Inconnu'
  const primary = String(acceptLanguage).split(',')[0].trim()
  const parts = primary.split(/[-_]/)
  if (parts.length < 2 || !parts[1]) return 'Inconnu'
  const cc = parts[1].toUpperCase().slice(0, 2)
  return /^[A-Z]{2}$/.test(cc) ? cc : 'Inconnu'
}

export function trackListenSource(url) {
  const name = classifyListenSource(url)
  if (!name) return
  safeIncrement(state.listenSources, name)
}

export function trackTrafficSource({ referrer, hash }) {
  const name = classifyTrafficSource({ referrer, hash })
  safeIncrement(state.trafficSources, name)
}

export function trackGeo(acceptLanguage) {
  const name = extractCountryCode(acceptLanguage)
  safeIncrement(state.geo, name)
}

// --- Getters ------------------------------------------------------------

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
    visitsToday: state.visitsToday,
    visitsByHour: [...state.visitsByHour],
    listenSources:  mapToList(state.listenSources),
    trafficSources: mapToList(state.trafficSources),
    geo:            mapToList(state.geo),
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
  if (!state.closedSessions.length) return 0
  const durations = state.closedSessions
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

// --- Pub/sub pour le WS admin -------------------------------------------

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

// --- Pour les tests : exposer les chemins ------------------------------

export const _paths = { DATA_DIR, STATS_FILE, EVENTS_LOG, CHAT_DIR }
