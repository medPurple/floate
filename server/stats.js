/**
 * Stats pour la console admin — persistées en PostgreSQL (server/schema.sql).
 * Plus de fichiers : chaque tracker écrit directement en base, les getters
 * (snapshot notamment) lisent la base à la volée. Il n'y a plus d'état
 * intermédiaire à charger/flusher au démarrage/arrêt.
 */
import { pool } from './db.js'

const STARTED_AT = Date.now()
const EVENT_BUFFER_SIZE = 50

// Ring buffer mémoire des derniers events, uniquement pour le replay
// immédiat à la connexion d'un admin WS — l'historique complet vit
// dans la table events.
const events = []
let eventSeq = 0

// Subscribers WS admin
const subs = new Set()

// --- Trackers (fire-and-forget : on ne bloque jamais le hot path WS) ------

export function trackVisit() {
  pool.query('INSERT INTO visits DEFAULT VALUES')
    .catch(err => console.warn('[stats] trackVisit:', err.message))
}

export function trackSessionClosed(joinedAt) {
  pool.query(
    'INSERT INTO closed_sessions (joined_at, left_at) VALUES (to_timestamp($1 / 1000.0), now())',
    [joinedAt]
  ).catch(err => console.warn('[stats] trackSessionClosed:', err.message))
}

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

  pool.query(
    'INSERT INTO events (kind, who, room) VALUES ($1, $2, $3)',
    [kind, who, room]
  ).catch(err => console.warn('[stats] trackEvent:', err.message))

  fanout({ type: 'event', event: ev })
}

export function trackChatMessage({ room, peerId, pseudo, text, ts }) {
  if (!room) return
  pool.query(
    'INSERT INTO chat_messages (room, peer_id, pseudo, text, ts) VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))',
    [room, peerId, pseudo, text, ts]
  ).catch(err => console.warn('[stats] trackChatMessage:', err.message))
}

// --- Classifiers pour sources / trafic / géo (purs, inchangés) ----------

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
  upsertListenSource(name)
}

export function trackTrafficSource({ referrer, hash }) {
  upsertTrafficSource(classifyTrafficSource({ referrer, hash }))
}

export function trackGeo(acceptLanguage) {
  upsertGeo(extractCountryCode(acceptLanguage))
}

// Trois fonctions dédiées plutôt qu'un helper générique paramétré par nom
// de table — évite toute interpolation SQL, même si les noms ne viennent
// jamais d'une entrée utilisateur.
function upsertListenSource(name) {
  pool.query(
    `INSERT INTO listen_sources (name, count) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET count = listen_sources.count + 1`,
    [name]
  ).catch(err => console.warn('[stats] upsertListenSource:', err.message))
}

function upsertTrafficSource(name) {
  pool.query(
    `INSERT INTO traffic_sources (name, count) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET count = traffic_sources.count + 1`,
    [name]
  ).catch(err => console.warn('[stats] upsertTrafficSource:', err.message))
}

function upsertGeo(name) {
  pool.query(
    `INSERT INTO geo_stats (name, count) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET count = geo_stats.count + 1`,
    [name]
  ).catch(err => console.warn('[stats] upsertGeo:', err.message))
}

// --- Getters (lecture live en base) --------------------------------------

export async function snapshot(rooms) {
  let usersOnline = 0
  let streamingRooms = 0
  for (const room of rooms.values()) {
    usersOnline += room.size
    if (room._streaming?.size > 0) streamingRooms += 1
  }

  const [visitsToday, visitsByHour, avgListenSeconds, listenSources, trafficSources, geo] =
    await Promise.all([
      countVisitsToday(),
      visitsByHourToday(),
      medianListenSeconds(),
      topCounts('listen_sources'),
      topCounts('traffic_sources'),
      topCounts('geo_stats')
    ])

  return {
    type: 'kpi',
    ts: Date.now(),
    usersOnline,
    activeRooms: rooms.size,
    streamingRooms,
    avgListenSeconds,
    visitsToday,
    visitsByHour,
    listenSources,
    trafficSources,
    geo,
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000)
  }
}

async function countVisitsToday() {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM visits WHERE ts >= date_trunc('day', now())`
  )
  return rows[0].n
}

async function visitsByHourToday() {
  const { rows } = await pool.query(
    `SELECT extract(hour FROM ts)::int AS h, count(*)::int AS n
     FROM visits WHERE ts >= date_trunc('day', now()) GROUP BY h`
  )
  const byHour = new Array(24).fill(0)
  for (const r of rows) byHour[r.h] = r.n
  return byHour
}

// Série pour le sélecteur 24h/7j/30j de la console admin. 24h renvoie un
// point par heure (jour courant, comme visitsByHourToday) ; 7j/30j renvoient
// un point par jour, avec generate_series pour ne pas sauter les jours à 0.
const RANGE_DAYS = { '7j': 7, '30j': 30 }

export async function visitsSeries(range) {
  if (range === '24h') {
    const values = await visitsByHourToday()
    return {
      values,
      labels: values.map((_, h) => `${String(h).padStart(2, '0')}h`)
    }
  }

  const days = RANGE_DAYS[range] || RANGE_DAYS['7j']
  const { rows } = await pool.query(
    `SELECT gs.day::date AS day, count(v.id)::int AS n
     FROM generate_series(
       date_trunc('day', now()) - ($1::int - 1) * interval '1 day',
       date_trunc('day', now()),
       interval '1 day'
     ) AS gs(day)
     LEFT JOIN visits v ON date_trunc('day', v.ts) = gs.day
     GROUP BY gs.day
     ORDER BY gs.day`,
    [days]
  )
  return {
    values: rows.map(r => r.n),
    labels: rows.map(r => {
      const d = new Date(r.day)
      return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    })
  }
}

async function medianListenSeconds() {
  const { rows } = await pool.query(
    `SELECT extract(epoch FROM (left_at - joined_at))::int AS dur
     FROM closed_sessions
     WHERE left_at >= now() - interval '24 hours'
     ORDER BY dur`
  )
  if (!rows.length) return 0
  const durations = rows.map(r => r.dur)
  const mid = Math.floor(durations.length / 2)
  return durations.length % 2 === 0
    ? Math.floor((durations[mid - 1] + durations[mid]) / 2)
    : durations[mid]
}

async function topCounts(table, limit = 12) {
  const { rows } = await pool.query(
    `SELECT name, count::int AS value FROM ${table} ORDER BY count DESC LIMIT $1`,
    [limit]
  )
  return rows
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

export function startedAt() {
  return STARTED_AT
}

// --- Maintenance : purge des vieilles sessions closes --------------------

export function startSessionPruning(intervalMs = 60 * 60 * 1000) {
  return setInterval(() => {
    pool.query(`DELETE FROM closed_sessions WHERE left_at < now() - interval '24 hours'`)
      .catch(err => console.warn('[stats] pruning:', err.message))
  }, intervalMs)
}

// --- Pub/sub pour le WS admin -------------------------------------------

export function subscribe(cb) { subs.add(cb) }
export function unsubscribe(cb) { subs.delete(cb) }

function fanout(msg) {
  for (const cb of subs) {
    try { cb(msg) } catch { /* swallow */ }
  }
}

export function startKpiBroadcaster(rooms, intervalMs = 2500) {
  return setInterval(async () => {
    if (subs.size === 0) return
    try {
      fanout(await snapshot(rooms))
      fanout({ type: 'rooms', top: topRooms(rooms) })
    } catch (err) {
      console.warn('[stats] kpi broadcast:', err.message)
    }
  }, intervalMs)
}
