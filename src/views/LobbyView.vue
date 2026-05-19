<!--
  LobbyView — DESIGN-SYSTEM.md §4.1
  Max-width 720px centrée, hero, card primaire (pseudo+code+CTA),
  panneau de création repliable, liste de rooms publiques en mock.

  Règle d'or §3.1 : une seule .btn-primary par viewport.
  → Quand le panneau de création est ouvert, "Rejoindre la room" passe
    en variant="secondary" pour laisser "Créer la room" être la primary.
-->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

import FlButton from '../components/atoms/FlButton.vue'
import FlInput from '../components/atoms/FlInput.vue'
import FlToggle from '../components/atoms/FlToggle.vue'
import { useToasts } from '../composables/useToasts.js'
import { useSession } from '../composables/useSession.js'
import { newCode, normalizeCode } from '../lib/code.js'
import { ADMIN_HTTP_URL } from '../lib/config.js'

const router = useRouter()
const { push } = useToasts()
const session = useSession()

// État du formulaire principal — pseudo pré-rempli si déjà choisi
// dans cet onglet (sessionStorage).
const pseudo = ref(session.pseudo.value)
const code = ref('')

// On persiste à chaque modification : c'est ce pseudo que la Room lira.
watch(pseudo, (val) => session.setPseudo(val))

// État du panneau création (replié par défaut).
const creating = ref(false)
const roomName = ref('')
const visibility = ref('private')

const visibilityOptions = [
  { label: 'Publique', value: 'public' },
  { label: 'Privée',   value: 'private' }
]

// La règle d'or impose une seule btn-primary visible à la fois.
const joinVariant = computed(() => creating.value ? 'secondary' : 'primary')

// Rooms publiques en temps réel — fetch toutes les 15s.
const publicRooms = ref([])
const publicRoomsLoading = ref(true)
let publicRoomsTimer = null

async function fetchPublicRooms() {
  try {
    const res = await fetch(`${ADMIN_HTTP_URL}/api/public-rooms`)
    if (!res.ok) return
    const data = await res.json()
    publicRooms.value = data.rooms || []
  } catch {
    // silencieux : pas dramatique, on retentera
  } finally {
    publicRoomsLoading.value = false
  }
}

onMounted(() => {
  fetchPublicRooms()
  publicRoomsTimer = setInterval(fetchPublicRooms, 15_000)
})
onBeforeUnmount(() => {
  if (publicRoomsTimer) clearInterval(publicRoomsTimer)
})

function requirePseudo() {
  if (!pseudo.value.trim()) {
    push({ kind: 'error', message: 'Choisis un pseudo avant de continuer.' })
    return false
  }
  return true
}

function joinRoom() {
  if (!requirePseudo()) return
  const normalized = normalizeCode(code.value)
  if (!normalized) {
    push({ kind: 'error', message: "Ce code n'a pas l'air valide." })
    return
  }
  // Rejoindre par code : on ne connaît ni nom ni visibilité — la Room
  // affichera "Room AKZ-394" en fallback, et le vrai nom remontera
  // côté signaling quand on l'aura branché.
  router.push({ name: 'room', params: { code: normalized } })
}

function joinPublic(room) {
  if (!requirePseudo()) return
  router.push({
    name: 'room',
    params: { code: room.code },
    query: { name: room.name, v: 'public' }
  })
}

function openCreate() {
  creating.value = true
}

function cancelCreate() {
  creating.value = false
  roomName.value = ''
}

function createRoom() {
  if (!requirePseudo()) return
  const trimmed = roomName.value.trim()
  if (!trimmed) {
    push({ kind: 'error', message: 'Donne un nom à ta room.' })
    return
  }
  const generated = newCode()
  push({ kind: 'success', message: 'Room créée.' })
  router.push({
    name: 'room',
    params: { code: generated },
    query: { name: trimmed, v: visibility.value }
  })
}
</script>

<template>
  <main class="lobby">
    <header class="lobby-top">
      <span class="brand">floate</span>
      <span class="version">v0.1</span>
    </header>

    <section class="hero">
      <svg class="hero-mark" viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="floate-hero" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="var(--accent)" />
            <stop offset="100%" stop-color="var(--accent-strong)" />
          </linearGradient>
        </defs>
        <g stroke="url(#floate-hero)" stroke-width="2" stroke-linecap="round" fill="none">
          <path d="M 10 40 Q 30 10, 50 40 T 90 40 T 130 40 T 170 40" opacity="0.9" />
          <path d="M 10 40 Q 30 60, 50 40 T 90 40 T 130 40 T 170 40" opacity="0.5" />
        </g>
      </svg>
      <h1 class="hero-title">Le son d'un onglet, à plusieurs, en direct.</h1>
      <p class="hero-lead">
        Diffuse depuis ton navigateur. Tes invités écoutent en direct,
        sans installer quoi que ce soit.
      </p>
    </section>

    <section class="card lobby-card" aria-labelledby="lobby-form-title">
      <h2 id="lobby-form-title" class="sr-only">Rejoindre une room</h2>

      <div class="form-grid">
        <FlInput
          v-model="pseudo"
          label="Ton pseudo"
          placeholder="Léa"
          autofocus
        />
        <FlInput
          v-model="code"
          label="Code d'invitation"
          placeholder="AKZ-394"
          variant="mono"
        />
        <FlButton :variant="joinVariant" @click="joinRoom">
          Rejoindre la room
        </FlButton>
      </div>

      <div v-if="!creating" class="lobby-divider">
        <button type="button" class="lobby-create-link" @click="openCreate">
          Pas de code ? Crée ta room
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <transition name="fl-collapse">
        <div v-if="creating" class="create-panel">
          <h3 class="panel-title">Nouvelle room</h3>
          <div class="form-grid">
            <FlInput
              v-model="roomName"
              label="Nom de la room"
              placeholder="Set du dimanche"
            />
            <div class="form-field">
              <span class="form-field-label">Visibilité</span>
              <FlToggle
                v-model="visibility"
                :options="visibilityOptions"
                aria-label="Visibilité de la room"
              />
              <p class="form-field-hint">
                {{ visibility === 'private'
                  ? 'Seules les personnes avec le code peuvent rejoindre.'
                  : 'La room apparaît dans la liste publique.' }}
              </p>
            </div>
            <div class="create-actions">
              <FlButton variant="ghost" @click="cancelCreate">Annuler</FlButton>
              <FlButton variant="primary" @click="createRoom">Créer la room</FlButton>
            </div>
          </div>
        </div>
      </transition>
    </section>

    <section v-if="publicRooms.length || !publicRoomsLoading" class="public-rooms">
      <h3 class="panel-title">
        Rooms publiques en ce moment ({{ publicRooms.length }})
      </h3>
      <ul v-if="publicRooms.length" class="rooms-list">
        <li v-for="room in publicRooms" :key="room.code">
          <button class="room-item" type="button" @click="joinPublic(room)">
            <span class="room-name">{{ room.name }}</span>
            <span class="room-meta">{{ room.participants }} part.</span>
            <span class="room-arrow" aria-hidden="true">→</span>
          </button>
        </li>
      </ul>
      <p v-else class="rooms-empty">
        Aucune room publique pour l'instant. Crée la première.
      </p>
    </section>
  </main>
</template>

<style scoped>
.lobby {
  max-width: var(--max-width-lobby);
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

.lobby-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.brand {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.version {
  font-size: var(--fs-mini);
  color: var(--text-faint);
}

/* Hero */
.hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.hero-mark {
  width: 180px;
  height: 80px;
  margin-bottom: var(--space-sm);
}

.hero-title {
  font-size: var(--fs-display-sm);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  line-height: 1.15;
  max-width: 520px;
}

.hero-lead {
  font-size: var(--fs-body-sm);
  color: var(--text-dim);
  max-width: 460px;
}

/* Card */
.lobby-card {
  max-width: var(--max-width-card);
  width: 100%;
  margin: 0 auto;
  padding: 22px;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field-label {
  font-size: var(--fs-mini);
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

.form-field-hint {
  font-size: var(--fs-mini);
  color: var(--text-faint);
}

.lobby-divider {
  display: flex;
  justify-content: center;
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border);
}

.lobby-create-link {
  background: none;
  border: 0;
  padding: 4px 8px;
  color: var(--accent);
  font-size: var(--fs-body-sm);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-xs);
  transition: color var(--duration-fast) var(--easing-default);
}

.lobby-create-link:hover { color: var(--accent-strong); }

.create-panel {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border);
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

/* Transition collapse — pas d'overflow brutal, on travaille en opacity + max-height. */
.fl-collapse-enter-active,
.fl-collapse-leave-active {
  transition: opacity var(--duration-default) var(--easing-out),
              max-height var(--duration-default) var(--easing-out);
  overflow: hidden;
}
.fl-collapse-enter-from,
.fl-collapse-leave-to { opacity: 0; max-height: 0; }
.fl-collapse-enter-to,
.fl-collapse-leave-from { opacity: 1; max-height: 400px; }

/* Rooms publiques */
.public-rooms {
  max-width: var(--max-width-card);
  width: 100%;
  margin: 0 auto;
}

.rooms-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.room-item {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-md);
  padding: 14px 16px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text);
  font-size: var(--fs-body-sm);
  text-align: left;
  transition: border-color var(--duration-fast) var(--easing-default),
              background var(--duration-fast) var(--easing-default);
}

.room-item:hover {
  border-color: var(--accent);
}

.rooms-empty {
  text-align: center;
  font-size: var(--fs-body-sm);
  color: var(--text-faint);
  padding: var(--space-lg);
  background: var(--bg-elev);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
}

.room-name { font-weight: 500; }
.room-meta { color: var(--text-dim); font-size: var(--fs-meta); }
.room-arrow { color: var(--text-faint); transition: color var(--duration-fast) var(--easing-default); }
.room-item:hover .room-arrow { color: var(--accent); }

/* Mobile (§10 du DS — mobile-first à venir, ici on assure la lisibilité) */
@media (max-width: 480px) {
  .lobby { padding: var(--space-xl) var(--space-md); gap: var(--space-2xl); }
  .hero-title { font-size: 26px; }
}
</style>
