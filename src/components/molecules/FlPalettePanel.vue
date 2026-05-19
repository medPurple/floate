<script setup>
defineProps({
  palettes: {
    type: Array,
    required: true
  },
  selectedId: {
    type: String,
    required: true
  }
})

defineEmits(['change'])
</script>

<template>
  <section class="panel">
    <h3 class="panel-title">Palette de la room</h3>

    <ul class="palette-list" aria-label="Choisir une palette pour la room">
      <li v-for="palette in palettes" :key="palette.id">
        <button
          type="button"
          :class="['palette-option', { 'is-active': palette.id === selectedId }]"
          :aria-pressed="palette.id === selectedId"
          @click="$emit('change', palette.id)"
        >
          <span
            class="palette-swatch"
            :style="{
              '--palette-accent': palette.accent,
              '--palette-accent-strong': palette.accentStrong
            }"
            aria-hidden="true"
          />
          <span :class="['palette-name', { 'is-active': palette.id === selectedId }]">
            {{ palette.label }}
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.palette-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.palette-option {
  width: 100%;
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: var(--space-md);
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: left;
  transition: border-color var(--duration-fast) var(--easing-default),
              box-shadow var(--duration-fast) var(--easing-default);
}

.palette-option:hover {
  border-color: var(--text-faint);
}

.palette-option.is-active {
  border-width: 2px;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  padding: 9px 11px;
}

.palette-swatch {
  display: block;
  width: 100%;
  height: 22px;
  border-radius: var(--radius-pill);
  background: linear-gradient(120deg, var(--palette-accent) 0%, var(--palette-accent-strong) 100%);
}

.palette-name {
  font-size: var(--fs-body-sm);
  color: var(--text);
}

.palette-name.is-active {
  font-weight: 700;
}
</style>
