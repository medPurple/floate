<!--
  FlToastStack — DESIGN-SYSTEM.md §3.5 + §5.3
  Stack fixe top-right, max-width 360px, gap 8px.
  Bordure gauche selon kind : info (--accent), success (--good), error (--live).
  S'utilise avec le composable useToasts().
-->
<script setup>
import { useToasts } from '../../composables/useToasts.js'

const { toasts, dismiss } = useToasts()
</script>

<template>
  <div class="fl-toast-stack" role="region" aria-label="Notifications" aria-live="polite">
    <transition-group name="fl-toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="['fl-toast', `is-${t.kind}`]"
        role="status"
      >
        <span class="fl-toast-msg">{{ t.message }}</span>
        <button
          type="button"
          class="fl-toast-close"
          aria-label="Fermer"
          @click="dismiss(t.id)"
        >×</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.fl-toast-stack {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: 360px;
  width: calc(100vw - 32px);
  z-index: 1000;
  pointer-events: none;
}

.fl-toast {
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: var(--fs-body-sm);
  color: var(--text);
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  pointer-events: auto;
}

.fl-toast.is-success { border-left-color: var(--good); }
.fl-toast.is-error   { border-left-color: var(--live); }

.fl-toast-msg { flex: 1; line-height: 1.4; }

.fl-toast-close {
  color: var(--text-faint);
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
  transition: color var(--duration-fast) var(--easing-default);
}
.fl-toast-close:hover { color: var(--text); }

/* Transition slideIn — §3.5 */
.fl-toast-enter-active,
.fl-toast-leave-active {
  transition: transform var(--duration-default) var(--easing-out),
              opacity var(--duration-default) var(--easing-out);
}
.fl-toast-enter-from,
.fl-toast-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
