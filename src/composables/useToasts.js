/**
 * useToasts — store singleton minimal pour FlToastStack.
 * Voir DESIGN-SYSTEM.md §3.5 et §5.3 (toast policy).
 *
 *   import { useToasts } from '@/composables/useToasts'
 *   const { push } = useToasts()
 *   push({ kind: 'success', message: 'Code copié.' })
 */
import { reactive } from 'vue'

const state = reactive({
  items: []
})

let nextId = 1

const DURATION = {
  info: 3000,
  success: 2500,
  error: 4000,
  critical: 6000
}

function push({ kind = 'info', message, duration }) {
  const id = nextId++
  const d = duration ?? DURATION[kind] ?? DURATION.info
  state.items.push({ id, kind, message })
  if (d > 0) {
    setTimeout(() => dismiss(id), d)
  }
  return id
}

function dismiss(id) {
  const i = state.items.findIndex(t => t.id === id)
  if (i !== -1) state.items.splice(i, 1)
}

function clear() {
  state.items.splice(0)
}

export function useToasts() {
  return { toasts: state.items, push, dismiss, clear }
}
