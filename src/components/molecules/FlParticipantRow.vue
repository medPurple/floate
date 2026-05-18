<!--
  FlParticipantRow — DESIGN-SYSTEM.md §3.7 + §5.4 (redondance d'identification du host)
  Host : 3 indices redondants — bordure --accent, avatar --accent, tag "À LA MAIN".
  "(toi)" si is-me, en --text-dim weight normal.
-->
<script setup>
import FlAvatar from '../atoms/FlAvatar.vue'

defineProps({
  pseudo: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  isMe: { type: Boolean, default: false }
})
</script>

<template>
  <div
    :class="['fl-participant', { 'is-host': isHost, 'is-me': isMe }]"
  >
    <div class="fl-participant-left">
      <FlAvatar :pseudo="pseudo" :is-host="isHost" />
      <span class="fl-participant-name">
        {{ pseudo }}<span v-if="isMe" class="self-tag"> (toi)</span>
      </span>
    </div>

    <span v-if="isHost" class="role-tag">À LA MAIN</span>
  </div>
</template>

<style scoped>
.fl-participant {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--bg);
  border: 1px solid transparent;
  transition: background var(--duration-fast) var(--easing-default),
              border-color var(--duration-fast) var(--easing-default);
}

.fl-participant-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.fl-participant-name {
  font-size: var(--fs-body-sm);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.self-tag {
  color: var(--text-dim);
  font-weight: 400;
}

.fl-participant.is-me .fl-participant-name {
  font-weight: 600;
}

/* Host : 3 indices visuels redondants (§5.4) */
.fl-participant.is-host {
  background: var(--accent-soft);
  border-color: var(--accent);
}

.role-tag {
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: var(--tracking-badge);
  text-transform: uppercase;
  color: var(--accent);
  flex-shrink: 0;
}
</style>
