/**
 * Tests du serveur — node --test natif, zéro dépendance.
 *
 * Lance :  npm test
 * Cible :  /health (pour le bot Discord) et l'auth /admin/api/snapshot
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import WebSocket from 'ws'

process.env.PORT = '8788'           // port isolé pour les tests
process.env.ADMIN_TOKEN = 'test-token'

let server

before(async () => {
  const mod = await import('../index.js')
  server = mod._internals.httpServer
  // Petit délai pour que le httpServer ait fini de bind
  await new Promise(r => setTimeout(r, 100))
})

after(() => {
  server?.close()
  // Le serveur a aussi setInterval(kpi) — on laisse le process se terminer
  // naturellement (les setInterval ne bloquent pas Node après close).
  setTimeout(() => process.exit(0), 100).unref()
})

async function get(path, headers = {}) {
  const res = await fetch(`http://localhost:${process.env.PORT}${path}`, { headers })
  const body = await res.text()
  let json = null
  try { json = JSON.parse(body) } catch {}
  return { status: res.status, body, json }
}

async function openWs(path = '/signaling') {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${process.env.PORT}${path}`)
    ws.once('open', () => resolve(ws))
    ws.once('error', reject)
  })
}

async function waitForMessageType(ws, type, timeoutMs = 1000, predicate = null) {
  return new Promise((resolve, reject) => {
    const onMessage = (raw) => {
      let msg = null
      try { msg = JSON.parse(String(raw)) } catch { return }
      if (msg?.type !== type) return
      if (predicate && !predicate(msg)) return
      cleanup()
      resolve(msg)
    }
    const onTimeout = () => {
      cleanup()
      reject(new Error(`timeout waiting for message type "${type}"`))
    }
    const cleanup = () => {
      ws.off('message', onMessage)
      clearTimeout(timer)
    }
    const timer = setTimeout(onTimeout, timeoutMs)
    ws.on('message', onMessage)
  })
}

async function expectNoMessageType(ws, type, timeoutMs = 300, predicate = null) {
  return new Promise((resolve, reject) => {
    const onMessage = (raw) => {
      let msg = null
      try { msg = JSON.parse(String(raw)) } catch { return }
      if (msg?.type !== type) return
      if (predicate && !predicate(msg)) return
      cleanup()
      reject(new Error(`unexpected "${type}" message received`))
    }
    const onTimeout = () => {
      cleanup()
      resolve()
    }
    const cleanup = () => {
      ws.off('message', onMessage)
      clearTimeout(timer)
    }
    const timer = setTimeout(onTimeout, timeoutMs)
    ws.on('message', onMessage)
  })
}

test('GET /health → 200 avec payload attendu', async () => {
  const { status, json } = await get('/health')
  assert.equal(status, 200)
  assert.equal(json.ok, true)
  assert.ok(typeof json.version === 'string', 'version présent')
  assert.ok(Number.isInteger(json.uptimeSeconds), 'uptimeSeconds entier')
  assert.equal(typeof json.rooms, 'number')
  assert.equal(typeof json.users, 'number')
  assert.ok(json.timestamp.endsWith('Z'), 'timestamp ISO')
})

test('GET /health expose les noms exacts attendus par le bot Discord', async () => {
  const { json } = await get('/health')
  // Contrat figé : si on rename, on casse le bot. Les tests servent
  // précisément à empêcher ça par accident.
  for (const key of ['ok', 'version', 'uptimeSeconds', 'rooms', 'users', 'timestamp']) {
    assert.ok(key in json, `clé ${key} attendue`)
  }
})

test('GET /admin/api/snapshot sans token → 401', async () => {
  const { status, json } = await get('/admin/api/snapshot')
  assert.equal(status, 401)
  assert.equal(json.error, 'unauthorized')
})

test('GET /admin/api/snapshot avec token query → 200', async () => {
  const { status, json } = await get('/admin/api/snapshot?token=test-token')
  assert.equal(status, 200)
  assert.equal(json.type, 'kpi')
  assert.ok(Array.isArray(json.visitsByHour))
  assert.equal(json.visitsByHour.length, 24)
  assert.ok(Array.isArray(json.topRooms))
  assert.ok(Array.isArray(json.events))
})

test('GET /admin/api/snapshot avec Authorization Bearer → 200', async () => {
  const { status } = await get('/admin/api/snapshot', {
    Authorization: 'Bearer test-token'
  })
  assert.equal(status, 200)
})

test('GET /admin/api/snapshot avec mauvais token → 401', async () => {
  const { status } = await get('/admin/api/snapshot?token=wrong')
  assert.equal(status, 401)
})

test('Route inconnue → 404', async () => {
  const { status } = await get('/this-route-does-not-exist')
  assert.equal(status, 404)
})

test('CORS : sans CORS_ORIGIN défini, Allow-Origin = *', async () => {
  const res = await fetch(`http://localhost:${process.env.PORT}/health`)
  // En l'absence d'env CORS_ORIGIN, le défaut est '*'.
  assert.equal(res.headers.get('access-control-allow-origin'), '*')
})

test('OPTIONS preflight répond 204', async () => {
  const res = await fetch(`http://localhost:${process.env.PORT}/health`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://example.test' }
  })
  assert.equal(res.status, 204)
})

test('Refresh listener: la fermeture de l’ancienne socket ne supprime pas la nouvelle session', async () => {
  const host = await openWs()
  const listenerA = await openWs()
  let listenerB = null

  try {
    const room = 'RFRSH1'
    const listenerId = 'listener-refresh'

    host.send(JSON.stringify({ type: 'join', room, pseudo: 'Host' }))
    const hostWelcome = await waitForMessageType(host, 'welcome')
    const hostId = hostWelcome.peerId

    listenerA.send(JSON.stringify({
      type: 'join',
      room,
      peerId: listenerId,
      pseudo: 'Listener'
    }))
    await waitForMessageType(listenerA, 'welcome')
    await waitForMessageType(host, 'peer-joined', 1000, (msg) => msg.peer?.id === listenerId)

    listenerB = await openWs()
    listenerB.send(JSON.stringify({
      type: 'join',
      room,
      peerId: listenerId,
      pseudo: 'Listener'
    }))
    const refreshedWelcome = await waitForMessageType(listenerB, 'welcome')
    assert.equal(refreshedWelcome.peerId, listenerId)

    listenerA.close()
    await expectNoMessageType(host, 'peer-left', 400, (msg) => msg.peerId === listenerId)

    host.send(JSON.stringify({
      type: 'signal',
      to: listenerId,
      data: { kind: 'offer', sdp: { type: 'offer', sdp: 'dummy' } }
    }))
    const relayedSignal = await waitForMessageType(listenerB, 'signal')
    assert.equal(relayedSignal.from, hostId)
    assert.equal(relayedSignal.data.kind, 'offer')
  } finally {
    host.close()
    listenerA.close()
    listenerB?.close()
  }
})
