<!--
  BarsList — ADMIN-PANEL-DESIGN.md §4.3 + §6.3
  Liste horizontale "nom + bar + valeur". Grid 130px 1fr 56px.
-->
<script setup>
const props = defineProps({
  items: { type: Array, required: true }, // [{ name, value }]
  suffix: { type: String, default: '%' },
  max: { type: Number, default: null }    // si null, prend max(items)
})

function width(value) {
  const m = props.max ?? Math.max(...props.items.map(i => i.value), 1)
  return Math.max(0, Math.min(100, (value / m) * 100))
}
</script>

<template>
  <ul class="bars">
    <li v-for="item in items" :key="item.name">
      <span class="bars-name">{{ item.name }}</span>
      <span class="bars-track">
        <span class="bars-fill" :style="{ width: `${width(item.value)}%` }" />
      </span>
      <span class="bars-value">{{ item.value }}{{ suffix }}</span>
    </li>
  </ul>
</template>

<style scoped>
.bars {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bars li {
  display: grid;
  grid-template-columns: 130px 1fr 56px;
  align-items: center;
  gap: 12px;
  font-size: var(--fs-body-sm);
}

.bars-name {
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bars-track {
  height: 8px;
  background: var(--bg);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.bars-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-strong));
  border-radius: var(--radius-pill);
  transition: width 0.6s var(--easing-default);
}

.bars-value {
  text-align: right;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-meta);
}
</style>
