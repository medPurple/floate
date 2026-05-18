<!--
  FlStepper — DESIGN-SYSTEM.md §3.10
  Liste d'étapes numérotées, l'étape "highlight" tire l'œil avant clic.
  Pattern d'onboarding préventif (vs feedback correctif, §5.2).

  Format des steps : [{ body: string, hint?: string, highlight?: boolean }]
-->
<script setup>
defineProps({
  steps: {
    type: Array,
    required: true,
    validator: arr => arr.every(s => typeof s.body === 'string')
  }
})
</script>

<template>
  <ol class="fl-stepper">
    <li
      v-for="(step, i) in steps"
      :key="i"
      :class="['fl-step', { 'is-highlight': step.highlight }]"
    >
      <div class="fl-step-num">{{ i + 1 }}</div>
      <div class="fl-step-body">
        <p class="fl-step-text">{{ step.body }}</p>
        <p v-if="step.hint" class="fl-step-hint">{{ step.hint }}</p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.fl-stepper {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.fl-step {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: background var(--duration-fast) var(--easing-default),
              border-color var(--duration-fast) var(--easing-default);
}

.fl-step-num {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: var(--fs-micro);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.fl-step-body {
  flex: 1;
  min-width: 0;
}

.fl-step-text {
  font-size: var(--fs-body-sm);
  color: var(--text);
  line-height: 1.4;
}

.fl-step-hint {
  font-size: var(--fs-mini);
  color: var(--text-dim);
  margin-top: 4px;
}

/* Highlight — l'étape critique tire l'œil avant que l'utilisateur clique */
.fl-step.is-highlight {
  background: var(--accent-soft);
  border-color: var(--accent);
}

.fl-step.is-highlight .fl-step-num {
  background: var(--accent);
  color: var(--text-on-accent);
  border-color: var(--accent);
}

.fl-step.is-highlight .fl-step-text {
  color: var(--accent);
  font-weight: 600;
}
</style>
