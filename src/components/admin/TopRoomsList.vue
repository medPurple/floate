<!--
  TopRoomsList — ADMIN-PANEL-DESIGN.md §4.5
  Top 6 salons par nombre d'auditeurs. Re-tri live possible.
-->
<script setup>
defineProps({
  rooms: { type: Array, required: true }  // [{ code, name, host, count }]
})

function label(n) {
  return n === 1 ? '1 auditeur' : `${n} auditeurs`
}
</script>

<template>
  <ul v-if="rooms.length" class="top-rooms">
    <li v-for="(r, i) in rooms" :key="r.code">
      <span class="rank">{{ i + 1 }}</span>
      <div class="meta">
        <span class="name">{{ r.name }}</span>
        <span class="host">Animé par {{ r.host || '—' }}</span>
      </div>
      <span class="count">{{ label(r.count) }}</span>
    </li>
  </ul>
  <p v-else class="empty">Aucun salon actif pour l'instant.</p>
</template>

<style scoped>
.top-rooms {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.top-rooms li {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 12px;
}
.rank {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elev-2);
  border-radius: 50%;
  color: var(--text-dim);
  font-size: var(--fs-micro);
  font-weight: 700;
}
.meta { min-width: 0; }
.name {
  display: block;
  font-size: var(--fs-body-sm);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host {
  display: block;
  font-size: var(--fs-mini);
  color: var(--text-dim);
}
.count {
  color: var(--accent);
  font-weight: 600;
  font-size: var(--fs-meta);
  white-space: nowrap;
}
.empty {
  color: var(--text-dim);
  font-size: var(--fs-body-sm);
}
</style>
