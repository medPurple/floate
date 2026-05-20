import { watch, onBeforeUnmount } from 'vue'
import { getPalette } from '../lib/palettes.js'

const PALETTE_TOKENS = [
  ['--accent', 'accent'],
  ['--accent-soft', 'accentSoft'],
  ['--accent-strong', 'accentStrong'],
  ['--accent-strong-hover', 'accentStrongHover'],
  ['--text-on-accent', 'textOnAccent']
]

export function usePalette(paletteIdRef) {
  function applyPalette(paletteId) {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const palette = getPalette(paletteId)

    for (const [token, key] of PALETTE_TOKENS) {
      root.style.setProperty(token, palette[key])
    }
  }

  function clearPalette() {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    for (const [token] of PALETTE_TOKENS) {
      root.style.removeProperty(token)
    }
  }

  watch(paletteIdRef, applyPalette, { immediate: true })
  onBeforeUnmount(clearPalette)
}
