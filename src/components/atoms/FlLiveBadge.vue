<!--
  FlLiveBadge — DESIGN-SYSTEM.md §3.6
  Le rouge --live est EXCLUSIF à l'état "ça diffuse" (§2.1).
  À n'afficher que si isStreaming === true || remoteStream !== null.
-->
<script setup>
defineProps({
  isLive: { type: Boolean, required: true }
})
</script>

<template>
  <div v-if="isLive" class="fl-live-badge" role="status" aria-label="En direct">
    <span class="fl-live-dot" aria-hidden="true"></span>
    <span>ON AIR</span>
  </div>
</template>

<style scoped>
.fl-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--live-bg);
  color: var(--live);
  border: 0.5px solid var(--live-border);
  border-radius: var(--radius-pill);
  padding: 4px 10px;
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: var(--tracking-badge);
  text-transform: uppercase;
  line-height: 1;
}

.fl-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--live);
  animation: fl-pulse var(--duration-pulse) var(--easing-in-out) infinite;
}
</style>
