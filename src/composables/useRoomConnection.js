/**
 * useRoomConnection — mesh WebRTC + presence pour une room floate.
 *
 * Responsabilités :
 *  - Maintenir la liste des peers et l'identité du host (depuis le serveur).
 *  - Créer/teardown une RTCPeerConnection par peer distant.
 *  - Relayer les SDP et ICE via le canal de signaling.
 *  - Pour le host : attacher un MediaStream et le diffuser à tous.
 *  - Pour les listeners : exposer les remoteStreams reçus.
 *
 * Politeness (qui initie l'offer ?) :
 *  - Quand je reçois 'welcome', je suis le nouvel arrivant : j'initie
 *    une RTCPeerConnection vers chaque peer existant.
 *  - Quand je reçois 'peer-joined', je suis un ancien : je ne fais rien,
 *    j'attendrai l'offer du nouveau.
 *  C'est la règle la plus simple qui évite les collisions glare.
 *
 * Renégociation :
 *  Quand le host attache un MediaStream après la connexion (le cas usuel —
 *  on se connecte à la room avant de cliquer "Démarrer la diffusion"),
 *  on appelle addTrack() puis on refait createOffer() pour propager.
 *
 * Limites connues :
 *  - Pas de TURN, juste STUN public Google. Marche sur NAT classique en
 *    local. À ajouter avant un déploiement public.
 *  - Pas de reconnexion auto si la WS tombe.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSession } from './useSession.js'
import { useSignaling } from './useSignaling.js'
import { ICE_SERVERS } from '../lib/config.js'

// Booster Opus pour la musique : 256kbps maxBitrate, stereo on via SDP.
const OPUS_MAX_BITRATE = 256_000

function enableStereoOpus(sdp) {
  // Activer fmtp stereo=1; sprop-stereo=1; maxaveragebitrate sur Opus.
  // Fragile (dépend du format SDP exact) mais largement utilisé en prod.
  return sdp.replace(
    /a=fmtp:(\d+) ([^\r\n]*)/g,
    (full, pt, params) => {
      // On ne touche qu'à la ligne Opus. On la repère via le rtpmap juste avant.
      if (!params.includes('minptime')) return full
      const extras = `stereo=1;sprop-stereo=1;maxaveragebitrate=${OPUS_MAX_BITRATE};cbr=0`
      return `a=fmtp:${pt} ${params};${extras}`
    }
  )
}

async function boostSenderBitrate(pc) {
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'audio') continue
    try {
      const params = sender.getParameters()
      if (!params.encodings || !params.encodings.length) {
        params.encodings = [{}]
      }
      params.encodings[0].maxBitrate = OPUS_MAX_BITRATE
      await sender.setParameters(params)
    } catch (err) {
      console.warn('[room] setParameters failed', err)
    }
  }
}

export function useRoomConnection({ code, pseudo, roomName = null, visibility = null, onFloorRequest, onRemoteStream }) {
  const { peerId } = useSession()

  // --- State exposé -------------------------------------------------
  const peers = ref([])              // [{ id, pseudo, joinedAt }]
  const hostId = ref(null)
  const status = ref('connecting')   // connecting | connected | error | closed
  const lastError = ref(null)

  const me = computed(() => peers.value.find(p => p.id === peerId.value) || null)
  const host = computed(() => peers.value.find(p => p.id === hostId.value) || null)
  const role = computed(() => peerId.value === hostId.value ? 'host' : 'listener')
  const listenerCount = computed(() =>
    peers.value.filter(p => p.id !== hostId.value).length
  )
  const hostSharedLink = ref('')

  // --- WebRTC interne ----------------------------------------------
  /** Map<peerId, RTCPeerConnection> */
  const connections = new Map()
  /** Map<peerId, MediaStream> reçus en remote */
  const remoteStreams = new Map()
  /** Le stream local (host uniquement, null sinon) */
  const localStream = ref(null)

  function makePC(remotePeerId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    // Si on a déjà un stream local actif (host en cours de diffusion),
    // on l'attache à la nouvelle connection dès la création.
    if (localStream.value) {
      for (const track of localStream.value.getTracks()) {
        pc.addTrack(track, localStream.value)
      }
    } else {
      // Sinon on déclare explicitement qu'on veut recevoir de l'audio.
      // Sans ce transceiver, l'offer générée n'a aucun m=audio, et le
      // peer distant ne peut PAS y ajouter d'audio dans son answer —
      // c'est ce qui faisait que les listeners arrivés après le clic
      // "Démarrer la diffusion" n'entendaient rien.
      pc.addTransceiver('audio', { direction: 'recvonly' })
    }

    pc.addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        signaling.send({
          type: 'signal',
          to: remotePeerId,
          data: { kind: 'ice', candidate: e.candidate.toJSON() }
        })
      }
    })

    pc.addEventListener('track', (e) => {
      const stream = e.streams[0]
      remoteStreams.set(remotePeerId, stream)
      onRemoteStream?.(remotePeerId, stream)
    })

    pc.addEventListener('connectionstatechange', () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        // On laisse 'peer-left' faire le cleanup. Sauf si le peer
        // n'est plus dans la room — alors on nettoie ici.
      }
    })

    connections.set(remotePeerId, pc)
    return pc
  }

  async function initiateTo(remotePeerId) {
    const pc = makePC(remotePeerId)
    try {
      const offer = await pc.createOffer()
      // SDP munging pour activer Opus stéréo + bitrate musique.
      offer.sdp = enableStereoOpus(offer.sdp)
      await pc.setLocalDescription(offer)
      await boostSenderBitrate(pc)
      signaling.send({
        type: 'signal',
        to: remotePeerId,
        data: { kind: 'offer', sdp: pc.localDescription }
      })
    } catch (err) {
      console.error('[room] initiate failed', err)
    }
  }

  async function handleSignal(from, data) {
    let pc = connections.get(from)

    try {
      if (data.kind === 'offer') {
        if (!pc) pc = makePC(from)
        await pc.setRemoteDescription(data.sdp)
        const answer = await pc.createAnswer()
        answer.sdp = enableStereoOpus(answer.sdp)
        await pc.setLocalDescription(answer)
        await boostSenderBitrate(pc)
        signaling.send({
          type: 'signal',
          to: from,
          data: { kind: 'answer', sdp: pc.localDescription }
        })
      }
      else if (data.kind === 'answer') {
        if (!pc) return
        await pc.setRemoteDescription(data.sdp)
      }
      else if (data.kind === 'ice') {
        if (!pc) return
        await pc.addIceCandidate(data.candidate).catch(() => { /* ICE peut échouer benin */ })
      }
      else if (data.kind === 'host-shared-link') {
        if (from !== hostId.value) return
        hostSharedLink.value = typeof data.url === 'string' ? data.url : ''
      }
    } catch (err) {
      console.error('[room] handleSignal', data.kind, err)
    }
  }

  function normalizeSharedLink(raw) {
    const input = String(raw || '').trim()
    if (!input) return ''
    try {
      const u = new URL(input)
      if (!['http:', 'https:'].includes(u.protocol)) return null
      return u.href
    } catch {
      return null
    }
  }

  function teardownPeer(remotePeerId) {
    const pc = connections.get(remotePeerId)
    if (pc) {
      try { pc.close() } catch { /* */ }
      connections.delete(remotePeerId)
    }
    remoteStreams.delete(remotePeerId)
  }

  // --- Signaling dispatch ------------------------------------------
  const signaling = useSignaling({
    welcome(msg) {
      peers.value = msg.peers || []
      hostId.value = msg.hostId || null
      status.value = 'connected'
      // J'initie une RTCPeerConnection vers chaque peer déjà présent.
      for (const p of peers.value) {
        if (p.id !== peerId.value) initiateTo(p.id)
      }
    },

    'peer-joined'(msg) {
      if (!peers.value.some(p => p.id === msg.peer.id)) {
        peers.value = [...peers.value, msg.peer]
      }
      if (role.value === 'host' && hostSharedLink.value) {
        signaling.send({
          type: 'signal',
          to: msg.peer.id,
          data: { kind: 'host-shared-link', url: hostSharedLink.value }
        })
      }
      // Je ne fais rien — le nouveau viendra m'offrir.
    },

    'peer-left'(msg) {
      teardownPeer(msg.peerId)
      peers.value = peers.value.filter(p => p.id !== msg.peerId)
    },

    'host-changed'(msg) {
      hostId.value = msg.hostId
      hostSharedLink.value = ''
    },

    signal(msg) {
      handleSignal(msg.from, msg.data)
    },

    'floor-requested'(msg) {
      onFloorRequest?.(msg.peerId, msg.pseudo)
    },

    error(msg) {
      lastError.value = msg.code
      status.value = 'error'
    }
  })

  // --- API exposée pour le host ------------------------------------
  /**
   * Attache un MediaStream local et le pousse vers tous les peers.
   * Si une connection n'a pas encore le stream (ce sera le cas après
   * 'host-ready' → clic), on ajoute les tracks + on refait l'offer.
   */
  async function attachStream(stream) {
    localStream.value = stream
    for (const [remotePeerId, pc] of connections) {
      const senders = pc.getSenders()
      for (const track of stream.getTracks()) {
        const existing = senders.find(s => s.track?.kind === track.kind)
        if (existing) {
          await existing.replaceTrack(track)
        } else {
          pc.addTrack(track, stream)
        }
      }
      try {
        const offer = await pc.createOffer()
        offer.sdp = enableStereoOpus(offer.sdp)
        await pc.setLocalDescription(offer)
        await boostSenderBitrate(pc)
        signaling.send({
          type: 'signal',
          to: remotePeerId,
          data: { kind: 'offer', sdp: pc.localDescription }
        })
      } catch (err) {
        console.error('[room] reneg failed', err)
      }
    }
    // Notifie le serveur pour les stats admin.
    signaling.send({ type: 'stream-state', active: true })
  }

  function detachStream() {
    if (!localStream.value) return
    try { localStream.value.getTracks().forEach(t => t.stop()) } catch { /* */ }
    localStream.value = null
    for (const [, pc] of connections) {
      for (const sender of pc.getSenders()) {
        if (sender.track) {
          try { pc.removeTrack(sender) } catch { /* */ }
        }
      }
    }
    // Note : on ne refait pas d'offer ici. Les peers verront leurs
    // remoteStreams se vider via le 'mute' event sur la track.
    signaling.send({ type: 'stream-state', active: false })
  }

  function requestFloor() {
    signaling.send({ type: 'request-floor' })
  }

  function changeHost(newHostId) {
    signaling.send({ type: 'host-change', newHostId })
  }

  function setHostSharedLink(raw) {
    if (role.value !== 'host') return { ok: false, reason: 'not-host' }
    const next = normalizeSharedLink(raw)
    if (next === null) return { ok: false, reason: 'invalid-url' }
    hostSharedLink.value = next
    for (const p of peers.value) {
      if (p.id === peerId.value) continue
      signaling.send({
        type: 'signal',
        to: p.id,
        data: { kind: 'host-shared-link', url: next }
      })
    }
    return { ok: true, url: next }
  }

  // --- Lifecycle ----------------------------------------------------
  function joinIfReady() {
    if (signaling.status.value !== 'open') return false
    return signaling.send({
      type: 'join',
      room: code,
      peerId: peerId.value,
      pseudo,
      roomName,    // posés uniquement si on est le premier (sinon le serveur ignore)
      visibility
    })
  }

  onMounted(() => {
    signaling.connect()
    // Dès que la WS est ouverte, on émet le join.
    const stop = watch(signaling.status, (s) => {
      if (s === 'open') {
        joinIfReady()
        stop()
      }
    }, { immediate: true })
  })

  onBeforeUnmount(() => {
    for (const [, pc] of connections) {
      try { pc.close() } catch { /* */ }
    }
    connections.clear()
    remoteStreams.clear()
    detachStream()
    signaling.close()
  })

  return {
    // State
    peers, hostId, status, lastError,
    me, host, role, listenerCount,
    hostSharedLink,
    localStream,
    // Actions
    attachStream, detachStream,
    requestFloor, changeHost, setHostSharedLink
  }
}
