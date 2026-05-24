<!--
  FlDedications — CHAT-DEDICACES.md §3
  Overlay placé en absolute dans .fl-stage. Deux colonnes invisibles à
  gauche/droite du visualizer, où les bulles montent depuis le bas et
  fadent vers le haut sur 7s.

  Distribution L/R : parité du dernier code char du floatingId — assez
  aléatoire pour équilibrer dans le temps, pas un round-robin strict.

  pointer-events: none sur le conteneur pour ne pas voler les clics au
  visualizer ou aux boutons de la stage.
-->
<script setup>
import { computed } from 'vue'
import { colorOf } from '../../lib/colors.js'

const props = defineProps({
  /** Items en cours d'affichage (kind: 'msg' | 'system' | 'proposal'). */
  items: { type: Array, required: true }
})

function isRight(id) {
  if (!id) return false
  return id.charCodeAt(id.length - 1) % 2 === 1
}

const leftItems  = computed(() => props.items.filter(m => !isRight(m.floatingId)))
const rightItems = computed(() => props.items.filter(m =>  isRight(m.floatingId)))

function nameColor(item) {
  if (item.host) return 'var(--accent)'
  return colorOf(item.pseudo || item.proposedByPseudo || '')
}

function hostnameOf(url) {
  try { return new URL(url).host.replace(/^www\./, '') }
  catch { return url }
}
</script>

<template>
  <div
    class="fl-dedications"
    role="log"
    aria-live="polite"
    aria-label="Dédicaces des auditeurs"
  >
    <div class="col col-left">
      <article
        v-for="item in leftItems"
        :key="item.floatingId"
        class="dedication"
        :class="[`is-${item.kind}`]"
      >
        <!-- Message texte normal -->
        <template v-if="item.kind === 'msg'">
          <span class="avatar" :style="{ background: nameColor(item) }">
            {{ (item.pseudo || '?').charAt(0).toUpperCase() }}
          </span>
          <span class="who" :style="{ color: nameColor(item) }">{{ item.pseudo }}</span>
          <span class="text">{{ item.text }}</span>
        </template>

        <!-- Proposition (annonce brève, pas de boutons ici) -->
        <template v-else-if="item.kind === 'proposal'">
          <span class="avatar" :style="{ background: nameColor(item) }">
            {{ (item.proposedByPseudo || '?').charAt(0).toUpperCase() }}
          </span>
          <span class="who" :style="{ color: nameColor(item) }">{{ item.proposedByPseudo }}</span>
          <span class="text">propose · {{ hostnameOf(item.url) }}</span>
        </template>

        <!-- Système (état) -->
        <template v-else-if="item.kind === 'system'">
          <span class="system-text">{{ item.text }}</span>
        </template>
      </article>
    </div>

    <div class="col col-right">
      <article
        v-for="item in rightItems"
        :key="item.floatingId"
        class="dedication"
        :class="[`is-${item.kind}`]"
      >
        <template v-if="item.kind === 'msg'">
          <span class="avatar" :style="{ background: nameColor(item) }">
            {{ (item.pseudo || '?').charAt(0).toUpperCase() }}
          </span>
          <span class="who" :style="{ color: nameColor(item) }">{{ item.pseudo }}</span>
          <span class="text">{{ item.text }}</span>
        </template>

        <template v-else-if="item.kind === 'proposal'">
          <span class="avatar" :style="{ background: nameColor(item) }">
            {{ (item.proposedByPseudo || '?').charAt(0).toUpperCase() }}
          </span>
          <span class="who" :style="{ color: nameColor(item) }">{{ item.proposedByPseudo }}</span>
          <span class="text">propose · {{ hostnameOf(item.url) }}</span>
        </template>

        <template v-else-if="item.kind === 'system'">
          <span class="system-text">{{ item.text }}</span>
        </template>
      </article>
    </div>
  </div>
</template>

<style scoped>
.fl-dedications {
  position: absolute;
  inset: 24px 0 96px 0;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  z-index: 2;
}

.col {
  position: relative;
  width: clamp(180px, 28%, 260px);
  min-height: 0;
}

.dedication {
  position: absolute;
  bottom: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(34, 31, 43, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(42, 39, 53, 0.65);
  border-radius: var(--radius-pill);
  padding: 4px 12px 4px 4px;
  font-size: 12px;
  max-width: 240px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: fl-dedication-drift 7s ease-out forwards;
}

/* Adapt au mode clair : fond crème translucide */
:root[data-theme="light"] .dedication {
  background: rgba(250, 243, 234, 0.85);
  border-color: rgba(221, 208, 188, 0.7);
}
@media (prefers-color-scheme: light) {
  :root[data-theme="auto"] .dedication {
    background: rgba(250, 243, 234, 0.85);
    border-color: rgba(221, 208, 188, 0.7);
  }
}

.col-left .dedication  { left: 0; }
.col-right .dedication { right: 0; animation-name: fl-dedication-drift-right; }

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.who {
  font-weight: 600;
  font-size: 12px;
}

.text {
  color: var(--text-dim);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-proposal {
  border-color: var(--accent);
  background: rgba(244, 162, 97, 0.18);
}
.is-proposal .text { color: var(--accent); font-weight: 500; }

.is-system {
  background: transparent;
  border-color: transparent;
  backdrop-filter: none;
  padding: 4px 8px;
}
.system-text {
  font-style: italic;
  color: var(--text-faint);
  font-size: 12px;
}

@keyframes fl-dedication-drift {
  0%   { opacity: 0; transform: translate(-12px, 24px); }
  10%  { opacity: 1; transform: translate(0, 0); }
  80%  { opacity: 1; transform: translate(0, -200px); }
  100% { opacity: 0; transform: translate(0, -240px); }
}

@keyframes fl-dedication-drift-right {
  0%   { opacity: 0; transform: translate(12px, 24px); }
  10%  { opacity: 1; transform: translate(0, 0); }
  80%  { opacity: 1; transform: translate(0, -200px); }
  100% { opacity: 0; transform: translate(0, -240px); }
}

/* Reduced motion : on remplace le drift par un simple fade. */
@media (prefers-reduced-motion: reduce) {
  .dedication,
  .col-right .dedication {
    animation: fl-dedication-fade 7s linear forwards !important;
  }
  @keyframes fl-dedication-fade {
    0%        { opacity: 0; }
    10%, 85%  { opacity: 1; }
    100%      { opacity: 0; }
  }
}

@media (max-width: 600px) {
  .fl-dedications { inset: 16px 0 80px 0; }
  .col { width: clamp(140px, 38%, 200px); }
  .dedication { max-width: 200px; }
}
</style>
