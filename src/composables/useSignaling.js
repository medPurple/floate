/**
 * useSignaling — couche WebSocket bas-niveau.
 *
 * Le parent passe un dispatch (map type → handler). Chaque message JSON
 * entrant est dispatché vers le handler correspondant. C'est intentionnel
 * de garder cette couche bête : la logique métier (presence, WebRTC) vit
 * dans useRoomConnection.
 *
 * Reconnexion : non gérée à cette étape — le serveur garde le state
 * tant qu'aucune socket ne se ferme, mais un reload côté client réinitie
 * la session. Pour une vraie reconnexion il faudra persister un token
 * de session et le rejouer ; pas prioritaire pour 8 peers en local.
 */
import { ref, onBeforeUnmount } from 'vue'
import { SIGNALING_URL } from '../lib/config.js'

export function useSignaling(dispatch = {}) {
  const status = ref('idle') // idle | connecting | open | closed | error
  let ws = null
  let intentionalClose = false

  function connect() {
    if (ws && (status.value === 'connecting' || status.value === 'open')) return
    status.value = 'connecting'
    intentionalClose = false
    ws = new WebSocket(SIGNALING_URL)

    ws.addEventListener('open', () => {
      status.value = 'open'
    })

    ws.addEventListener('message', (e) => {
      let msg
      try { msg = JSON.parse(e.data) } catch { return }
      const handler = dispatch[msg.type]
      if (handler) {
        try { handler(msg) }
        catch (err) { console.error('[signaling] handler error:', err) }
      }
    })

    ws.addEventListener('error', () => {
      status.value = 'error'
    })

    ws.addEventListener('close', () => {
      status.value = intentionalClose ? 'closed' : 'closed'
      ws = null
    })
  }

  function send(msg) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
      return true
    }
    return false
  }

  function close() {
    intentionalClose = true
    ws?.close()
  }

  onBeforeUnmount(close)

  return { status, connect, send, close }
}
