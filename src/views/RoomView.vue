<!--
  RoomView — DESIGN-SYSTEM.md §4.2 + §4.3 + §4.5
  Layout : header glass sticky en haut, grid 1fr 320px en dessous.
  Breakpoint 900px : sidebar passe sous le stage.

  Cette étape : on branche le vrai signaling.
    - peers + hostId viennent de useRoomConnection (WS + WebRTC mesh)
    - le host capture son onglet via useDisplayCapture et pousse l'audio
    - les listeners reçoivent le remoteStream du host et le jouent dans
      un <audio> auquel on applique setSinkId selon le panneau sortie
    - le visualizer est alimenté par un AnalyserNode sur le stream actif

  Règle d'or §3.1 : la seule .btn-primary possible vit dans FlStage
  (état host-ready). Aucun autre primary dans cette vue.
-->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import FlRoomHeader from '../components/molecules/FlRoomHeader.vue'
import FlInvitePanel from '../components/molecules/FlInvitePanel.vue'
import FlAudioOutputPanel from '../components/molecules/FlAudioOutputPanel.vue'
import FlVolumePanel from '../components/molecules/FlVolumePanel.vue'
import FlPalettePanel from '../components/molecules/FlPalettePanel.vue'
import FlFloorRequestsPanel from '../components/molecules/FlFloorRequestsPanel.vue'
import FlParticipantsPanel from '../components/molecules/FlParticipantsPanel.vue'
import FlStage from '../components/molecules/FlStage.vue'

import { useToasts } from '../composables/useToasts.js'
import { useSession } from '../composables/useSession.js'
import { usePalette } from '../composables/usePalette.js'
import { useRoomConnection } from '../composables/useRoomConnection.js'
import { useDisplayCapture } from '../composables/useDisplayCapture.js'
import { PALETTES } from '../lib/palettes.js'

const props = defineProps({
  code: { type: String, required: true }
})

const router = useRouter()
const route = useRoute()
const { push } = useToasts()
const { peerId, pseudo: storedPseudo } = useSession()

// --- Garde : sans pseudo, on renvoie au Lobby (pas d'identité, pas de room)
if (!storedPseudo.value) {
  router.replace({ name: 'lobby' })
}

// --- Métadonnées de la room ---------------------------------------------
// Transmises par le Lobby en query params (?name=...&v=public|private).
const queryName = typeof route.query.name === 'string' ? route.query.name : ''
const queryVis  = route.query.v === 'public' ? 'public' : 'private'

const roomName   = ref(queryName || `Room ${props.code}`)
const visibility = ref(queryVis)

// --- Connexion à la room -----------------------------------------------
// Demandes de main (host only, alimenté par le callback onFloorRequest)
const floorRequests = ref([])

function handleFloorRequest(remotePeerId, remotePseudo) {
  if (floorRequests.value.some(r => r.id === remotePeerId)) return
  floorRequests.value.push({ id: remotePeerId, pseudo: remotePseudo })
  push({ kind: 'info', message: `${remotePseudo} demande la main.` })
}

// Map<peerId, MediaStream> des streams reçus, on retient celui du host.
const remoteStreams = new Map()
const remoteHostStream = ref(null)

function handleRemoteStream(remotePeerId, stream) {
  remoteStreams.set(remotePeerId, stream)
  if (remotePeerId === roomConn.hostId.value) {
    remoteHostStream.value = stream
  }
}

const roomConn = useRoomConnection({
  code: props.code,
  pseudo: storedPseudo.value,
  roomName: queryName || null,
  visibility: queryVis,
  onFloorRequest: handleFloorRequest,
  onRemoteStream: handleRemoteStream
})

usePalette(roomConn.palette)

// Si le host change, on met à jour le stream actif.
watch(roomConn.hostId, (newHostId) => {
  remoteHostStream.value = newHostId ? (remoteStreams.get(newHostId) || null) : null
})

// --- Capture display (host uniquement) ---------------------------------
const display = useDisplayCapture()

// --- Stream actif (ce qu'on entend) ------------------------------------
//   - host qui diffuse  → son propre stream (display.audioStream)
//   - listener          → le stream remote du host
const activeStream = computed(() => {
  if (roomConn.role.value === 'host') return display.audioStream.value
  return remoteHostStream.value
})

const isStreaming = computed(() => !!activeStream.value)

// --- Stage state -------------------------------------------------------
const stageState = computed(() => {
  if (roomConn.status.value !== 'connected') return 'connecting'
  if (roomConn.role.value === 'host' && !display.audioStream.value) return 'host-ready'
  return 'streaming'
})

// --- Cooldown demande de main (§5.1) ----------------------------------
const floorState = ref('idle')
const floorCountdown = ref(0)
let cooldownTimer = null

function startCooldown() {
  floorCountdown.value = 60
  floorState.value = 'pending'
  cooldownTimer = setInterval(() => {
    floorCountdown.value -= 1
    if (floorCountdown.value <= 0) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
      floorState.value = 'idle'
    }
  }, 1000)
}

// Si on devient host pendant une demande en cours, on annule le cooldown.
watch(roomConn.role, (r) => {
  if (r === 'host' && floorState.value === 'pending') {
    clearInterval(cooldownTimer)
    cooldownTimer = null
    floorState.value = 'idle'
    push({ kind: 'success', message: 'Tu as la main.' })
  }
})

// --- Handlers émis par FlStage -----------------------------------------
async function onStart() {
  try {
    const stream = await display.capture()
    await roomConn.attachStream(stream)
  } catch (e) {
    if (e.code === 'no-audio-track') {
      push({
        kind: 'error',
        duration: 6000,
        message: "Tu n'as pas coché « Partager l'audio de l'onglet »."
      })
    } else if (e.name === 'NotAllowedError') {
      push({ kind: 'error', message: 'Partage refusé.' })
    } else if (e.code === 'not-supported') {
      push({
        kind: 'error',
        duration: 6000,
        message: 'Ton navigateur ne sait pas capturer un onglet. Essaye Chrome ou Edge.'
      })
    } else {
      push({ kind: 'error', message: 'Impossible de démarrer la diffusion.' })
      console.error(e)
    }
  }
}

function onStop() {
  display.stop()
  roomConn.detachStream()
}

function onRequestFloor() {
  if (floorState.value !== 'idle') return
  startCooldown()
  roomConn.requestFloor()
  push({ kind: 'info', message: 'Demande envoyée au host.' })
}

function leave() {
  router.push({ name: 'lobby' })
}

// --- Demandes de main : décisions du host ------------------------------
function acceptRequest(id) {
  const req = floorRequests.value.find(r => r.id === id)
  floorRequests.value = floorRequests.value.filter(r => r.id !== id)
  if (req) {
    onStop()                       // on lâche d'abord notre propre flux
    roomConn.changeHost(id)        // puis on transfère
    push({ kind: 'success', message: `${req.pseudo} a la main.` })
  }
}

function denyRequest(id) {
  floorRequests.value = floorRequests.value.filter(r => r.id !== id)
}

function onPaletteChange(id) {
  roomConn.changePalette(id)
}

// --- Audio playback côté listener + setSinkId --------------------------
const audioEl = ref(null)

// Quand on est listener et qu'on reçoit un stream du host, on l'attache.
// Quand on est host, on ne joue rien (sinon on s'entend boucler).
watch(activeStream, (stream) => {
  if (!audioEl.value) return
  if (roomConn.role.value === 'host') {
    audioEl.value.srcObject = null
    return
  }
  audioEl.value.srcObject = stream || null
  if (stream) {
    audioEl.value.play().catch(() => { /* autoplay bloqué — UI à venir */ })
  }
})

async function onAudioOutputChange(deviceId) {
  if (!audioEl.value || typeof audioEl.value.setSinkId !== 'function') return
  try { await audioEl.value.setSinkId(deviceId) }
  catch (err) { console.warn('[room] setSinkId failed', err) }
}

// Volume de réception (0..1). Émis par FlVolumePanel, persisté côté
// composant. On l'applique aussi au mount initial (FlVolumePanel
// émet sa valeur stockée dès le onMounted).
function onVolumeChange(normalized) {
  if (audioEl.value) audioEl.value.volume = normalized
}

// --- Visualizer alimenté par un AnalyserNode sur le stream actif -------
const BARS = 48
const bars = ref(null)
let audioCtx = null
let analyser = null
let analyserSource = null
let analyserData = null
let analyserRaf = null

function startAnalyser(stream) {
  stopAnalyser()
  if (!stream || !stream.getAudioTracks().length) return
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    analyserSource = audioCtx.createMediaStreamSource(stream)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 128 // → 64 bins
    analyser.smoothingTimeConstant = 0.6
    analyserSource.connect(analyser)
    analyserData = new Uint8Array(analyser.frequencyBinCount)
    tick()
  } catch (err) {
    console.warn('[room] analyser failed', err)
  }
}

function tick() {
  if (!analyser) return
  analyser.getByteFrequencyData(analyserData)
  const arr = new Array(BARS)
  for (let i = 0; i < BARS; i++) {
    const idx = Math.floor((i / BARS) * analyserData.length)
    arr[i] = analyserData[idx] / 255
  }
  bars.value = arr
  analyserRaf = requestAnimationFrame(tick)
}

function stopAnalyser() {
  if (analyserRaf) cancelAnimationFrame(analyserRaf)
  try { analyserSource?.disconnect() } catch { /* */ }
  try { audioCtx?.close() } catch { /* */ }
  analyserRaf = analyserSource = analyser = audioCtx = analyserData = null
  bars.value = null
}

watch(activeStream, (s) => startAnalyser(s), { immediate: false })

onBeforeUnmount(() => {
  stopAnalyser()
  if (cooldownTimer) clearInterval(cooldownTimer)
})

// --- Bandeau debug (mode DEV uniquement) -------------------------------
const isDev = import.meta.env?.DEV ?? false
</script>

<template>
  <div class="room">
    <!-- Bandeau debug : visible uniquement en npm run dev -->
    <aside v-if="isDev" class="dev-bar" aria-label="Bandeau de développement">
      <span class="dev-tag">DEV</span>
      <span>peerId : <strong>{{ peerId.slice(0, 8) }}</strong></span>
      <span>pseudo : <strong>{{ storedPseudo }}</strong></span>
      <span>rôle : <strong>{{ roomConn.role.value }}</strong></span>
      <span>signaling : <strong>{{ roomConn.status.value }}</strong></span>
      <span>hostId : <strong>{{ roomConn.hostId.value?.slice(0, 8) || '—' }}</strong></span>
      <span class="dev-info">code : {{ code }}</span>
    </aside>

    <FlRoomHeader
      :room-name="roomName"
      :visibility="visibility"
      @leave="leave"
    />

    <div class="room-body">
      <FlStage
        class="room-stage"
        :state="stageState"
        :role="roomConn.role.value"
        :pseudo="storedPseudo"
        :host-name="roomConn.host.value?.pseudo"
        :is-streaming="isStreaming"
        :listener-count="roomConn.listenerCount.value"
        :floor-state="floorState"
        :floor-countdown="floorCountdown"
        :bars="bars"
        @start="onStart"
        @stop="onStop"
        @request-floor="onRequestFloor"
      />

      <aside class="room-sidebar" aria-label="Panneaux de la room">
        <!-- Ordre §4.5 :
             1. Code (si privée)
             2. Sortie audio
             3. Demandes de main (host + pending > 0)
             4. Participants
        -->
        <FlInvitePanel v-if="visibility === 'private'" :code="code" />

        <FlAudioOutputPanel @change="onAudioOutputChange" />

        <FlVolumePanel
          :disabled="roomConn.role.value === 'host'"
          :disabled-hint="roomConn.role.value === 'host' ? 'Sans effet pendant que tu diffuses.' : ''"
          @change="onVolumeChange"
        />

        <FlPalettePanel
          v-if="roomConn.role.value === 'host'"
          :palettes="PALETTES"
          :selected-id="roomConn.palette.value"
          @change="onPaletteChange"
        />

        <FlFloorRequestsPanel
          v-if="roomConn.role.value === 'host' && floorRequests.length"
          :requests="floorRequests"
          @accept="acceptRequest"
          @deny="denyRequest"
        />

        <FlParticipantsPanel
          :participants="roomConn.peers.value"
          :host-id="roomConn.hostId.value"
          :me-id="peerId"
        />
      </aside>
    </div>

    <!-- Élément audio caché — joue le stream du host pour les listeners -->
    <audio ref="audioEl" autoplay playsinline />
  </div>
</template>

<style scoped>
.room {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.room-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr var(--sidebar-width);
  gap: var(--space-2xl);
  padding: var(--space-2xl);
  max-width: var(--max-width-room);
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.room-stage { min-width: 0; }

.room-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  min-width: 0;
}

/* §4.3 — sous 900px : une seule colonne, sidebar sous le stage */
@media (max-width: 900px) {
  .room-body {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
    padding: var(--space-lg);
  }
}

/* Bandeau debug */
.dev-bar {
  background: var(--bg-elev-2);
  border-bottom: 1px solid var(--border);
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.dev-bar strong {
  color: var(--text);
  font-weight: 600;
}

.dev-tag {
  background: var(--accent);
  color: var(--text-on-accent);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-family: var(--font-sans);
}

.dev-info {
  margin-left: auto;
  color: var(--text-faint);
}

/* L'élément audio est invisible, mais on garde le slot pour l'a11y */
audio {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}
</style>
