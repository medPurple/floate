/**
 * floate — serveur de signaling + console admin.
 *
 * Un seul process Node, un seul port. Deux upgrades WS distincts :
 *   /signaling  → mesh peer-to-peer (clients)
 *   /admin/stream → push KPIs/events temps réel (console admin)
 *
 * Endpoints HTTP :
 *   GET /health                       → public, pour le bot Discord
 *   GET /admin/api/snapshot?token=…  → JSON KPIs + top rooms + events
 *   GET /admin/api/events?token=…    → JSON flux d'activité
 *
 * Le path WS par défaut historique reste accessible aussi (compat dev) :
 * une socket qui se connecte sans /signaling tombe sur le namespace mesh.
 */
import http from 'node:http'
import { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'

import {
  trackVisit, trackSessionClosed, trackEvent,
  snapshot, topRooms, recentEvents, startedAt,
  subscribe, unsubscribe, startKpiBroadcaster
} from './stats.js'

const PORT = Number(process.env.PORT) || 8787
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin'
const MAX_PEERS_PER_ROOM = 8
const VERSION = '0.2.0'

// Origines autorisées pour CORS et pour la vérif WS upgrade.
// '*' en dev (défaut), liste séparée par virgules en prod :
//   CORS_ORIGIN="https://floate.pages.dev,https://floate.tondomaine.com"
const CORS_ORIGINS = (process.env.CORS_ORIGIN || '*')
  .split(',').map(s => s.trim()).filter(Boolean)

function originAllowed(origin) {
  if (!origin) return true                    // requests same-origin / curl
  if (CORS_ORIGINS.includes('*')) return true
  return CORS_ORIGINS.includes(origin)
}

function pickAllowOrigin(req) {
  if (CORS_ORIGINS.includes('*')) return '*'
  const o = req.headers.origin
  return o && CORS_ORIGINS.includes(o) ? o : CORS_ORIGINS[0] || 'null'
}

// Map<roomCode, Map<peerId, { ws, pseudo, joinedAt }>>
const rooms = new Map()

/* ============================================================
   HTTP : health + admin REST
   ============================================================ */

function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', pickAllowOrigin(req))
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function sendJson(req, res, status, body) {
  setCors(req, res)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function checkAdmin(req) {
  const url = new URL(req.url, 'http://x')
  const fromQuery = url.searchParams.get('token')
  const auth = req.headers.authorization || ''
  const fromHeader = auth.startsWith('Bearer ') ? auth.slice(7) : null
  return (fromQuery || fromHeader) === ADMIN_TOKEN
}

const httpServer = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(req, res)
    res.writeHead(204)
    return res.end()
  }

  const url = new URL(req.url, 'http://x')

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(req, res, 200, buildHealth())
  }

  if (req.method === 'GET' && url.pathname === '/admin/api/snapshot') {
    if (!checkAdmin(req)) return sendJson(req, res, 401, { error: 'unauthorized' })
    return sendJson(req, res, 200, {
      ...snapshot(rooms),
      topRooms: topRooms(rooms),
      events: recentEvents()
    })
  }

  if (req.method === 'GET' && url.pathname === '/admin/api/events') {
    if (!checkAdmin(req)) return sendJson(req, res, 401, { error: 'unauthorized' })
    return sendJson(req, res, 200, { events: recentEvents(50) })
  }

  // Endpoint public : la liste des rooms publiques actives.
  // Pas d'auth, c'est un annuaire — comme la section "Rooms publiques en
  // ce moment" du Lobby (§4.1 du DS).
  if (req.method === 'GET' && url.pathname === '/api/public-rooms') {
    return sendJson(req, res, 200, { rooms: listPublicRooms() })
  }

  res.writeHead(404)
  res.end('Not found')
})

function listPublicRooms() {
  const out = []
  for (const [code, room] of rooms) {
    if (room._visibility !== 'public') continue
    out.push({
      code,
      name: room._name || `Room ${code}`,
      participants: room.size
    })
  }
  // Trier par activité décroissante
  out.sort((a, b) => b.participants - a.participants)
  return out
}

function buildHealth() {
  let usersOnline = 0
  for (const room of rooms.values()) usersOnline += room.size
  return {
    ok: true,
    version: VERSION,
    uptimeSeconds: Math.floor((Date.now() - startedAt()) / 1000),
    rooms: rooms.size,
    users: usersOnline,
    timestamp: new Date().toISOString()
  }
}

/* ============================================================
   WS : signaling (mesh) + admin (stream)
   ============================================================ */

const wssSignaling = new WebSocketServer({ noServer: true })
const wssAdmin = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (req, socket, head) => {
  // Vérif d'origine : protège contre les attaques cross-site WS depuis
  // un autre site qui aurait ouvert une socket à ta place.
  if (!originAllowed(req.headers.origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
    socket.destroy()
    return
  }

  const url = new URL(req.url, 'http://x')

  if (url.pathname === '/admin/stream') {
    if (url.searchParams.get('token') !== ADMIN_TOKEN) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }
    wssAdmin.handleUpgrade(req, socket, head, ws => wssAdmin.emit('connection', ws, req))
    return
  }

  // /signaling et / (compat) : namespace mesh
  wssSignaling.handleUpgrade(req, socket, head, ws => wssSignaling.emit('connection', ws, req))
})

/* ============================================================
   Helpers signaling
   ============================================================ */

function getRoom(code) {
  if (!rooms.has(code)) {
    const room = new Map()
    room._streaming = new Set()
    room._name = null
    rooms.set(code, room)
  }
  return rooms.get(code)
}

function publicPeers(room) {
  return Array.from(room.entries()).map(([id, p]) => ({
    id, pseudo: p.pseudo, joinedAt: p.joinedAt
  }))
}

function hostOf(room) {
  if (room._explicitHost && room.has(room._explicitHost)) return room._explicitHost
  let oldest = null
  for (const [id, p] of room) {
    if (!oldest || p.joinedAt < oldest.joinedAt) oldest = { id, joinedAt: p.joinedAt }
  }
  return oldest?.id || null
}

function broadcast(code, msg, exceptPeerId = null) {
  const room = rooms.get(code)
  if (!room) return
  const payload = JSON.stringify(msg)
  for (const [peerId, peer] of room) {
    if (peerId === exceptPeerId) continue
    if (peer.ws?.readyState === 1) peer.ws.send(payload)
  }
}

function sendTo(code, peerId, msg) {
  const peer = rooms.get(code)?.get(peerId)
  if (peer?.ws?.readyState === 1) peer.ws.send(JSON.stringify(msg))
}

/* ============================================================
   Signaling handler
   ============================================================ */

wssSignaling.on('connection', (ws) => {
  let myRoom = null
  let myId = null

  trackVisit()

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    if (msg.type === 'join') {
      if (myRoom) return
      myRoom = String(msg.room || '').toUpperCase()
      const room = getRoom(myRoom)

      if (room.size >= MAX_PEERS_PER_ROOM) {
        ws.send(JSON.stringify({ type: 'error', code: 'room-full' }))
        ws.close(1000, 'room-full')
        return
      }

      myId = msg.peerId || randomUUID()
      const isFirst = room.size === 0

      room.set(myId, {
        ws,
        pseudo: String(msg.pseudo || 'Anonyme').slice(0, 32),
        joinedAt: Date.now()
      })

      // Pose le nom et la visibilité (uniquement à la création, le premier décide).
      if (isFirst) {
        if (typeof msg.roomName === 'string') {
          room._name = msg.roomName.slice(0, 64)
        }
        room._visibility = msg.visibility === 'public' ? 'public' : 'private'
      }

      ws.send(JSON.stringify({
        type: 'welcome',
        peerId: myId,
        peers: publicPeers(room),
        hostId: hostOf(room),
        roomName: room._name
      }))

      const me = room.get(myId)
      broadcast(myRoom, {
        type: 'peer-joined',
        peer: { id: myId, pseudo: me.pseudo, joinedAt: me.joinedAt }
      }, myId)

      if (isFirst) trackEvent('create', me.pseudo, room._name || myRoom)
      else trackEvent('join', me.pseudo, room._name || myRoom)

      console.log(`[floate] ${myId.slice(0, 8)} (${me.pseudo}) join ${myRoom} — ${room.size}/${MAX_PEERS_PER_ROOM}`)
    }

    else if (msg.type === 'signal') {
      if (!myRoom || !myId || !msg.to) return
      sendTo(myRoom, msg.to, { type: 'signal', from: myId, data: msg.data })
    }

    else if (msg.type === 'request-floor') {
      if (!myRoom || !myId) return
      const room = rooms.get(myRoom)
      const hostId = hostOf(room)
      const me = room?.get(myId)
      if (hostId && me) {
        sendTo(myRoom, hostId, { type: 'floor-requested', peerId: myId, pseudo: me.pseudo })
      }
    }

    else if (msg.type === 'host-change') {
      if (!myRoom || !myId || !msg.newHostId) return
      const room = rooms.get(myRoom)
      if (hostOf(room) !== myId) return
      if (!room?.has(msg.newHostId)) return
      room._explicitHost = msg.newHostId
      broadcast(myRoom, { type: 'host-changed', hostId: msg.newHostId })
    }

    else if (msg.type === 'stream-state') {
      if (!myRoom || !myId) return
      const room = rooms.get(myRoom)
      if (!room) return
      const me = room.get(myId)
      if (msg.active) {
        room._streaming.add(myId)
        if (me) trackEvent('live', me.pseudo, room._name || myRoom)
      } else {
        room._streaming.delete(myId)
      }
    }
  })

  ws.on('close', () => {
    if (!myRoom || !myId) return
    const room = rooms.get(myRoom)
    if (!room) return
    const currentPeer = room.get(myId)
    // Cas "refresh" : un nouveau ws peut déjà avoir repris le même peerId.
    // On ignore la fermeture de l'ancienne socket pour ne pas supprimer
    // le peer reconnecté.
    if (!currentPeer || currentPeer.ws !== ws) return

    const wasHost = hostOf(room) === myId
    trackSessionClosed(currentPeer.joinedAt)
    room.delete(myId)
    room._streaming?.delete(myId)

    trackEvent('leave', currentPeer.pseudo, room._name || myRoom)

    if (room.size === 0) {
      rooms.delete(myRoom)
      return
    }

    broadcast(myRoom, { type: 'peer-left', peerId: myId })

    if (wasHost) {
      if (room._explicitHost === myId) delete room._explicitHost
      const newHost = hostOf(room)
      if (newHost) broadcast(myRoom, { type: 'host-changed', hostId: newHost })
    }
  })

  ws.on('error', (err) => console.error('[floate] ws error:', err.message))
})

/* ============================================================
   Admin WS — push KPIs + events
   ============================================================ */

wssAdmin.on('connection', (ws) => {
  const send = (msg) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg))
  }

  // Push d'abord un snapshot complet, puis on s'abonne au stream.
  send(snapshot(rooms))
  send({ type: 'rooms', top: topRooms(rooms) })
  for (const ev of recentEvents()) send({ type: 'event', event: ev })

  subscribe(send)

  ws.on('close', () => unsubscribe(send))
  ws.on('error', () => unsubscribe(send))
})

const kpiTimer = startKpiBroadcaster(rooms, 2500)

/* ============================================================
   Démarrage
   ============================================================ */

httpServer.listen(PORT, () => {
  console.log(`[floate] http://localhost:${PORT}    (health + admin REST)`)
  console.log(`[floate] ws://localhost:${PORT}      (signaling mesh)`)
  console.log(`[floate] ws://localhost:${PORT}/admin/stream  (admin push, token requis)`)
  console.log(`[floate] CORS_ORIGIN = ${CORS_ORIGINS.join(', ')}`)
  console.log(`[floate] max ${MAX_PEERS_PER_ROOM} peers/room — version ${VERSION}`)
})

// Pour les tests : exporter les internals si chargé en module test.
export const _internals = { rooms, buildHealth, checkAdmin, httpServer }

// Cleanup propre
function shutdown() {
  clearInterval(kpiTimer)
  httpServer.close(() => process.exit(0))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
