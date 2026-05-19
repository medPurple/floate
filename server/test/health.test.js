/**
 * Tests du serveur — node --test natif, zéro dépendance.
 *
 * Lance :  npm test
 * Cible :  /health (pour le bot Discord) et l'auth /admin/api/snapshot
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { WebSocket } from 'ws'

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

function onceMessage(ws) {
  return new Promise((resolve, reject) => {
    const onMessage = (raw) => {
      cleanup()
      resolve(JSON.parse(raw.toString()))
    }
    const onError = (err) => {
      cleanup()
      reject(err)
    }
    const onClose = () => {
      cleanup()
      reject(new Error('socket closed before message'))
    }
    const cleanup = () => {
      ws.off('message', onMessage)
      ws.off('error', onError)
      ws.off('close', onClose)
    }

    ws.on('message', onMessage)
    ws.on('error', onError)
    ws.on('close', onClose)
  })
}

async function joinRoom(room, peerId, pseudo) {
  const ws = new WebSocket(`ws://localhost:${process.env.PORT}/signaling`)
  await new Promise((resolve, reject) => {
    ws.once('open', resolve)
    ws.once('error', reject)
  })
  ws.send(JSON.stringify({ type: 'join', room, peerId, pseudo }))
  const welcome = await onceMessage(ws)
  return { ws, welcome }
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

test('welcome expose la palette courante et un changement host est diffusé aux peers', async () => {
  const room = `PAL${Date.now()}A`
  const { ws: host, welcome: hostWelcome } = await joinRoom(room, 'host-a', 'Host')

  assert.equal(hostWelcome.type, 'welcome')
  assert.equal(hostWelcome.palette, 'ambiance-abricot')

  const joined = onceMessage(host)
  const { ws: listener, welcome: listenerWelcome } = await joinRoom(room, 'listener-a', 'Listener')

  assert.equal(listenerWelcome.palette, 'ambiance-abricot')
  assert.equal((await joined).type, 'peer-joined')

  host.send(JSON.stringify({ type: 'palette-change', palette: 'lavande' }))

  const hostPalette = await onceMessage(host)
  const listenerPalette = await onceMessage(listener)

  assert.deepEqual(hostPalette, { type: 'palette-changed', palette: 'lavande' })
  assert.deepEqual(listenerPalette, { type: 'palette-changed', palette: 'lavande' })

  host.close()
  listener.close()
})

test('palette-change ignore les listeners et persiste pour les nouveaux arrivants', async () => {
  const room = `PAL${Date.now()}B`
  const { ws: host } = await joinRoom(room, 'host-b', 'Host')

  const joined = onceMessage(host)
  const { ws: listener } = await joinRoom(room, 'listener-b', 'Listener')
  assert.equal((await joined).type, 'peer-joined')

  listener.send(JSON.stringify({ type: 'palette-change', palette: 'lagon' }))
  await new Promise(resolve => setTimeout(resolve, 75))

  host.send(JSON.stringify({ type: 'palette-change', palette: 'foret' }))
  await onceMessage(host)
  await onceMessage(listener)

  const { ws: newcomer, welcome } = await joinRoom(room, 'listener-c', 'Late listener')
  assert.equal(welcome.palette, 'foret')

  host.close()
  listener.close()
  newcomer.close()
})
