<!--
  FlRoomHeader — DESIGN-SYSTEM.md §4.2
  Header glass : brand + nom + tag de genre + crayon + tag visibilité + Quitter.
  Padding 18/28, fond glass blur, bordure basse.

  Le tag de genre est juste un mot coloré (cf. lib/tags.js) — pas de
  badge, pas de fond, pour rester léger à côté du nom de room.
-->
<script setup>
import { computed } from 'vue'
import FlButton from '../atoms/FlButton.vue'
import FlThemeToggle from '../atoms/FlThemeToggle.vue'
import { getTag } from '../../lib/tags.js'

const props = defineProps({
  roomName: { type: String, required: true },
  /** Id du tag de genre (null si aucun). Voir lib/tags.js. */
  tag: { type: String, default: null },
  visibility: {
    type: String,
    default: 'private',
    validator: v => ['public', 'private'].includes(v)
  },
  /** Affiche le bouton crayon de renommage (host uniquement). */
  canEdit: { type: Boolean, default: false }
})

defineEmits(['leave', 'edit-name'])

const tagInfo = computed(() => getTag(props.tag))
</script>

<template>
  <header class="fl-room-header">
    <div class="fl-room-header-left">
      <router-link to="/" class="brand">floate</router-link>
      <h1 class="room-name">{{ roomName }}</h1>
      <span
        v-if="tagInfo"
        class="room-tag"
        :style="{ color: tagInfo.color }"
        :title="`Genre : ${tagInfo.label}`"
      >
        {{ tagInfo.label }}
      </span>
      <button
        v-if="canEdit"
        type="button"
        class="rename-btn"
        aria-label="Modifier la room"
        title="Modifier le nom et le tag"
        @click="$emit('edit-name')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 20h4l10-10-4-4L4 16v4Zm12.7-13.3 2.6-2.6a1 1 0 0 1 1.4 0l2.2 2.2a1 1 0 0 1 0 1.4l-2.6 2.6-3.6-3.6Z"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <span :class="['visibility-tag', `is-${visibility}`]">
        {{ visibility === 'private' ? 'Privée' : 'Publique' }}
      </span>
    </div>

    <div class="fl-room-header-right">
      <FlThemeToggle />
      <FlButton variant="ghost" @click="$emit('leave')">
        Quitter
      </FlButton>
    </div>
  </header>
</template>

<style scoped>
.fl-room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: 18px 28px;
  background: rgba(14, 13, 18, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.fl-room-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  min-width: 0;
  flex: 1;
}

.fl-room-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.brand {
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-decoration: none;
  flex-shrink: 0;
}
.brand:hover { text-decoration: none; opacity: 0.85; }

.room-name {
  font-size: var(--fs-h2);
  font-weight: 600;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tag de genre — juste un mot coloré, pas de fond ni de bordure.
   Préfixé par un séparateur "·" pour respirer à côté du nom. */
.room-tag {
  font-size: var(--fs-body-sm);
  font-weight: 600;
  letter-spacing: 0;
  flex-shrink: 0;
  position: relative;
  padding-left: 12px;
}
.room-tag::before {
  content: '·';
  position: absolute;
  left: 0;
  color: var(--text-faint);
  font-weight: 400;
}

.rename-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--text-dim);
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) var(--easing-default),
              background var(--duration-fast) var(--easing-default);
  flex-shrink: 0;
}
.rename-btn:hover {
  color: var(--accent);
  background: var(--accent-soft);
}

.visibility-tag {
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: var(--tracking-badge);
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid;
  flex-shrink: 0;
}

.visibility-tag.is-private {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.visibility-tag.is-public {
  color: var(--text-dim);
  border-color: var(--border);
  background: transparent;
}

@media (max-width: 600px) {
  .fl-room-header { padding: 14px 16px; }
  .room-name { font-size: var(--fs-body); }
}
</style>
