<!--
  FlVolumeSlider — atom, slider horizontal stylé.
  Range 0–100, step 1. v-model en number.

  Esthétique sobre — le DS §9 interdit les potards skeumorphiques mais
  c'est ici un contrôle légitime de réception, pas de mix. On garde un
  rail discret aux tokens du DS, pas d'icône speaker.
-->
<script setup>
defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  ariaLabel: { type: String, default: 'Volume' }
})
defineEmits(['update:modelValue'])
</script>

<template>
  <input
    class="fl-volume"
    type="range"
    :min="min"
    :max="max"
    :step="step"
    :value="modelValue"
    :aria-label="ariaLabel"
    :aria-valuenow="modelValue"
    :aria-valuemin="min"
    :aria-valuemax="max"
    @input="$emit('update:modelValue', Number($event.target.value))"
  />
</template>

<style scoped>
.fl-volume {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 28px;
  background: transparent;
  cursor: pointer;
  margin: 0;
  padding: 0;
}

/* Rail (Chrome/Safari) */
.fl-volume::-webkit-slider-runnable-track {
  height: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}

.fl-volume::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  margin-top: -7px;  /* recentre sur le rail 4px */
  cursor: grab;
  transition: transform var(--duration-fast) var(--easing-default),
              background var(--duration-fast) var(--easing-default);
}
.fl-volume::-webkit-slider-thumb:hover { background: var(--accent-strong); }
.fl-volume:active::-webkit-slider-thumb { transform: scale(1.1); cursor: grabbing; }

/* Rail (Firefox) */
.fl-volume::-moz-range-track {
  height: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
}
.fl-volume::-moz-range-progress {
  height: 4px;
  background: linear-gradient(90deg, var(--accent), var(--accent-strong));
  border-radius: var(--radius-pill);
}
.fl-volume::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: grab;
}

.fl-volume:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}
</style>
