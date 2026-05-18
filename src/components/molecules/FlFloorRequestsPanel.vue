<!--
  FlFloorRequestsPanel — DESIGN-SYSTEM.md §4.5 (panneau #3, host only)
  Liste des demandes de main en attente, avec accept/refuser par ligne.
  Le parent décide d'afficher ou non (si pending > 0 ET role=host).
-->
<script setup>
import FlAvatar from '../atoms/FlAvatar.vue'
import FlButton from '../atoms/FlButton.vue'

defineProps({
  /** [{ id, pseudo, since? }] */
  requests: {
    type: Array,
    required: true
  }
})

defineEmits(['accept', 'deny'])
</script>

<template>
  <section class="panel">
    <h3 class="panel-title">Demandes de main ({{ requests.length }})</h3>

    <ul class="fl-floor-list">
      <li v-for="r in requests" :key="r.id" class="fl-floor-item">
        <div class="fl-floor-left">
          <FlAvatar :pseudo="r.pseudo" :size="24" />
          <span class="fl-floor-name">{{ r.pseudo }}</span>
        </div>
        <div class="fl-floor-actions">
          <FlButton variant="ghost" @click="$emit('deny', r.id)">Refuser</FlButton>
          <FlButton variant="secondary" @click="$emit('accept', r.id)">Donner</FlButton>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.fl-floor-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.fl-floor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.fl-floor-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.fl-floor-name {
  font-size: var(--fs-body-sm);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fl-floor-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* On compresse le padding des boutons dans cette densité. */
.fl-floor-actions :deep(.btn) {
  padding: 6px 10px;
  font-size: var(--fs-mini);
}
</style>
