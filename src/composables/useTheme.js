/**
 * useTheme — gestion du thème sombre / clair non blanc.
 *
 * Trois modes :
 *   'auto'  → suit prefers-color-scheme du système
 *   'dark'  → force le sombre (défaut historique de floate)
 *   'light' → force le clair sépia/crème
 *
 * Persisté en localStorage 'floate.theme'. Applique data-theme sur
 * <html> et synchronise le meta theme-color pour la barre du
 * navigateur sur mobile (sombre ou crème selon le rendu effectif).
 *
 * Module-level state : un seul thème par onglet, c'est une décision
 * globale — un singleton suffit largement.
 */
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'floate.theme'
const VALID = ['auto', 'dark', 'light']

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return VALID.includes(v) ? v : 'auto'
  } catch {
    return 'auto'
  }
}

const mode = ref(readStored())

function systemPrefersLight() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-color-scheme: light)').matches === true
}

const effective = computed(() => {
  if (mode.value === 'dark') return 'dark'
  if (mode.value === 'light') return 'light'
  return systemPrefersLight() ? 'light' : 'dark'
})

function applyToDom() {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', mode.value)

  // Met à jour le meta theme-color pour la barre du browser mobile.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', effective.value === 'light' ? '#F5EDE3' : '#0E0D12')
  }
}

watch(mode, (m) => {
  try { localStorage.setItem(STORAGE_KEY, m) } catch { /* */ }
  applyToDom()
}, { immediate: true })

// Quand l'OS change de thème et qu'on est en 'auto', refresh.
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: light)')
  mql.addEventListener?.('change', () => {
    if (mode.value === 'auto') applyToDom()
  })
}

export function useTheme() {
  function setMode(m) {
    if (VALID.includes(m)) mode.value = m
  }

  function cycle() {
    const order = ['auto', 'dark', 'light']
    const i = order.indexOf(mode.value)
    setMode(order[(i + 1) % order.length])
  }

  return { mode, effective, setMode, cycle }
}
