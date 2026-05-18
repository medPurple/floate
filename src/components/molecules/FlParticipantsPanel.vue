<!--
  FlParticipantsPanel — DESIGN-SYSTEM.md §4.5 (panneau #4, toujours visible)
  Liste l'ensemble des présents dans la room.
  Le host (id = hostId) apparaît avec les 3 indices visuels (§5.4).
  Le compteur dans le titre rappelle la limite (§9 : max 8 par room).
-->
<script setup>
import { computed } from 'vue'
import FlParticipantRow from './FlParticipantRow.vue'

const props = defineProps({
  /** [{ id, pseudo }] */
  participants: { type: Array, required: true },
  hostId: { type: String, default: null },
  meId: { type: String, default: null },
  maxParticipants: { type: Number, default: 8 }
})

// Trier : host d'abord, puis moi, puis les autres.
const ordered = computed(() => {
  const list = [...props.participants]
  return list.sort((a, b) => {
    if (a.id === props.hostId) return -1
    if (b.id === props.hostId) return 1
    if (a.id === props.meId) return -1
    if (b.id === props.meId) return 1
    return 0
  })
})
</script>

<template>
  <section class="panel">
    <h3 class="panel-title">
      Participants ({{ participants.length }}/{{ maxParticipants }})
    </h3>
    <div class="fl-participants-list">
      <FlParticipantRow
        v-for="p in ordered"
        :key="p.id"
        :pseudo="p.pseudo"
        :is-host="p.id === hostId"
        :is-me="p.id === meId"
      />
    </div>
  </section>
</template>

<style scoped>
.fl-participants-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
