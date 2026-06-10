<!--
  AdminStatsView — ADMIN-PANEL-DESIGN.md §3
  Console admin temps réel. Pas exposé aux utilisateurs finaux.

  Auth : token simple en .env côté serveur (ADMIN_TOKEN). Si pas de
  token côté client (localStorage), on affiche une page de saisie
  (variante de la page 403 du spec §8).
-->
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import KpiCard from '../components/admin/KpiCard.vue'
import AreaChart from '../components/admin/AreaChart.vue'
import BarsList from '../components/admin/BarsList.vue'
import RangeToggle from '../components/admin/RangeToggle.vue'
import TopRoomsList from '../components/admin/TopRoomsList.vue'
import EventFeed from '../components/admin/EventFeed.vue'
import FlButton from '../components/atoms/FlButton.vue'

import { useAdminStream, getAdminToken, setAdminToken, clearAdminToken } from '../composables/useAdminStream.js'

const router = useRouter()

// --- Auth gate -------------------------------------------------------
const tokenInput = ref('')
const tokenSet = ref(!!getAdminToken())
const authErrored = ref(false)

function submitToken() {
  if (!tokenInput.value.trim()) return
  setAdminToken(tokenInput.value.trim())
  tokenSet.value = true
  authErrored.value = false
}

function signOut() {
  clearAdminToken()
  stream?.disconnect()
  tokenSet.value = false
}

// --- Stream (uniquement si on a un token) ----------------------------
// On garde les refs vides par défaut ; quand on a un token on remplace
// `stream` qui expose lui-même des refs. Le template les consomme via
// les computeds plus bas — pas de double-ref à l'intérieur des refs.
let stream = null

if (tokenSet.value) {
  stream = useAdminStream()
}

// Computeds qui exposent ce que le template attend, avec fallback vide.
const status = computed(() => stream?.status.value ?? 'connecting')
const topRooms = computed(() => stream?.topRooms.value ?? [])
const events = computed(() => stream?.events.value ?? [])

// --- Range toggle (24h / 7j / 30j) -----------------------------------
const range = ref('24h')

// --- Sources / trafic / géo (depuis le snapshot KPI serveur) ----------
// Le serveur agrège ces compteurs dans server/data/stats.json. Tant
// qu'aucune donnée n'est tombée, les tableaux peuvent être vides —
// les composants BarsList affichent un état vide cohérent dans ce cas.

// --- Format helpers --------------------------------------------------
function fmtNumber(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(n)
}

function fmtDuration(seconds) {
  if (!seconds) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// --- KPIs dérivés ----------------------------------------------------
const k = computed(() => stream?.kpi.value)

const usersValue   = computed(() => fmtNumber(k.value?.usersOnline))
const roomsValue   = computed(() => fmtNumber(k.value?.activeRooms))
const avgValue     = computed(() => fmtDuration(k.value?.avgListenSeconds))
const visitsValue  = computed(() => fmtNumber(k.value?.visitsToday))
const visitsByHour = computed(() => k.value?.visitsByHour || new Array(24).fill(0))

// Panneaux Sources / Trafic / Géo : alimentés par le snapshot serveur.
// Format harmonisé : [{ name, value }].
const listenSources  = computed(() => k.value?.listenSources  || [])
const trafficSources = computed(() => k.value?.trafficSources || [])
const geo            = computed(() => k.value?.geo            || [])

function leave() {
  router.push({ name: 'lobby' })
}

onUnmounted(() => stream?.disconnect())
</script>

<template>
  <!-- Auth gate -->
  <main v-if="!tokenSet" class="admin-gate">
    <article class="card gate-card">
      <p class="gate-tag">403 · Console admin</p>
      <h2 class="gate-title">Cette page est réservée à l'équipe floate.</h2>
      <p class="gate-hint">
        Si tu as un jeton d'accès, colle-le ci-dessous. Sinon, retour au lobby.
      </p>
      <form class="gate-form" @submit.prevent="submitToken">
        <input
          v-model="tokenInput"
          type="password"
          placeholder="Jeton admin"
          class="gate-input"
          autofocus
        />
        <FlButton variant="primary" type="submit">Entrer</FlButton>
      </form>
      <FlButton variant="ghost" @click="leave">Retour au lobby</FlButton>
    </article>
  </main>

  <!-- Console -->
  <div v-else class="admin">
    <header class="admin-header">
      <span class="brand">floate</span>
      <h1 class="admin-title">Statistiques</h1>
      <span class="admin-env">Console admin</span>
      <span class="admin-spacer" />
      <RangeToggle v-model="range" />
      <FlButton variant="ghost" @click="signOut">Quitter</FlButton>
    </header>

    <p
      v-if="status === 'reconnecting' || status === 'unauthorized'"
      class="conn-banner"
    >
      {{ status === 'unauthorized'
        ? 'Jeton refusé — vérifie ADMIN_TOKEN côté serveur.'
        : 'Connexion temps réel interrompue, on retente.' }}
    </p>

    <section class="overview-head">
      <h2 class="overview-title">Vue d'ensemble</h2>
      <span class="overview-live">
        <span class="live-dot" aria-hidden="true"></span>
        En direct · synchro 2 s
      </span>
    </section>

    <section class="kpis">
      <KpiCard
        label="Utilisateurs en ligne"
        :value="usersValue"
        live
      />
      <KpiCard
        label="Salons actifs"
        :value="roomsValue"
      />
      <KpiCard
        label="Temps moyen d'écoute"
        :value="avgValue"
        mono
      />
      <KpiCard
        label="Visites aujourd'hui"
        :value="visitsValue"
        :spark="visitsByHour"
      />
    </section>

    <section class="row-wide">
      <article class="panel chart-panel">
        <h3 class="panel-title">Visites · {{ range }}</h3>
        <AreaChart :data="visitsByHour" />
      </article>

      <article class="panel">
        <h3 class="panel-title">Sources d'écoute</h3>
        <BarsList :items="listenSources" />
      </article>
    </section>

    <section class="row-wide">
      <article class="panel">
        <h3 class="panel-title">Sources de trafic</h3>
        <BarsList :items="trafficSources" />
      </article>

      <article class="panel">
        <h3 class="panel-title">Géographie</h3>
        <BarsList :items="geo" />
      </article>
    </section>

    <section class="row-wide">
      <article class="panel">
        <h3 class="panel-title">Top salons (live)</h3>
        <TopRoomsList :rooms="topRooms" />
      </article>

      <article class="panel">
        <h3 class="panel-title">Activité en direct</h3>
        <EventFeed :events="events" />
      </article>
    </section>
  </div>
</template>

<style scoped>
.admin {
  max-width: var(--max-width-room);
  margin: 0 auto;
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.admin-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.brand {
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.admin-title {
  font-size: var(--fs-h2);
  font-weight: 600;
  color: var(--text);
}

/* Tag --good cohérent avec §3 du spec */
.admin-env {
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: var(--tracking-badge);
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  color: var(--good);
  border: 1px solid var(--good);
  background: rgba(128, 199, 156, 0.08);
}

.admin-spacer { flex: 1; }

.conn-banner {
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  border-left: 2px solid var(--live);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: var(--fs-mini);
  color: var(--text-dim);
}

.overview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.overview-title {
  font-size: var(--fs-display-sm);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
}

.overview-live {
  font-size: var(--fs-mini);
  color: var(--text-dim);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--good);
  animation: fl-pulse var(--duration-pulse) var(--easing-in-out) infinite;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.row-wide {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-lg);
}

.chart-panel { padding: 18px 20px; }

@media (max-width: 900px) {
  .admin { padding: var(--space-lg); }
  .kpis, .row-wide { grid-template-columns: 1fr; }
}

/* Gate */
.admin-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}
.gate-card {
  max-width: 460px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.gate-tag {
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: var(--tracking-badge);
  text-transform: uppercase;
  color: var(--text-dim);
}
.gate-title {
  font-size: var(--fs-h2);
  font-weight: 600;
}
.gate-hint {
  font-size: var(--fs-body-sm);
  color: var(--text-dim);
}
.gate-form {
  display: flex;
  gap: var(--space-sm);
}
.gate-input {
  flex: 1;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: var(--fs-body);
  color: var(--text);
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}
.gate-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
</style>
