<!--
  EventFeed — ADMIN-PANEL-DESIGN.md §4.6
  Flux d'events récents. Exception : le dot --live à 6px est le SEUL
  endroit où la couleur live peut sortir de la room en diffusion.
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  events: { type: Array, required: true }  // [{ id, kind, who, room, ts }]
})

const VERBS = {
  join:   'a rejoint',
  leave:  'a quitté',
  create: 'a créé',
  live:   'a démarré une diffusion dans'
}

const recent = computed(() => props.events.slice(0, 8))

function relativeTime(ts) {
  const now = Math.floor(Date.now() / 1000)
  const d = now - ts
  if (d < 5) return "à l'instant"
  if (d < 60) return `${d}s`
  if (d < 3600) return `${Math.floor(d / 60)}min`
  if (d < 86400) return `${Math.floor(d / 3600)}h`
  return `${Math.floor(d / 86400)}j`
}
</script>

<template>
  <div class="feed" aria-live="polite">
    <transition-group name="feed">
      <p v-for="ev in recent" :key="ev.id" class="feed-line">
        <span :class="['feed-dot', `is-${ev.kind}`]" aria-hidden="true"></span>
        <span class="feed-text">
          <strong>{{ ev.who }}</strong>
          <span class="verb"> {{ VERBS[ev.kind] || ev.kind }} </span>
          <span class="room">{{ ev.room || '—' }}</span>
        </span>
        <span class="feed-ts">{{ relativeTime(ev.ts) }}</span>
      </p>
    </transition-group>
    <p v-if="!recent.length" class="empty">Pas encore d'activité.</p>
  </div>
</template>

<style scoped>
.feed {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feed-line {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: var(--fs-body-sm);
  color: var(--text-dim);
}

.feed-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* Exception §4.6 : --live autorisé ici comme dot 6px */
.feed-dot.is-join   { background: var(--good); }
.feed-dot.is-create { background: var(--accent); }
.feed-dot.is-leave  { background: var(--text-faint); }
.feed-dot.is-live   { background: var(--live); }

/* inline-flex + gap pour garantir l'espacement entre pseudo, verbe et
   nom de room. Sans ça, Vue compresse les whitespace entre balises et
   tout finit collé ("wila crééfunky set"). */
.feed-text {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}
.feed-text strong { color: var(--text); font-weight: 600; }
.feed-text .verb { color: var(--text-dim); }
.feed-text .room { color: var(--text); }

.feed-ts {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  color: var(--text-faint);
}

.feed-enter-active {
  transition: transform 0.35s var(--easing-out), opacity 0.35s var(--easing-out);
}
.feed-enter-from {
  transform: translateX(-8px);
  opacity: 0;
}

.empty {
  font-size: var(--fs-body-sm);
  color: var(--text-faint);
}
</style>
