<!--
  FlVisualizer — DESIGN-SYSTEM.md §3.9
  Canvas 420×80, 48 barres verticales, gradient --accent → --accent-strong.
  Lissage : RISE=0.6 (attack), DECAY=0.88 (release).

  Cette étape : pas de Web Audio. Deux modes :
    - mode "ambient" (par défaut) : sinusoïde 0.5 Hz, opacity 0.18, stroke --accent.
    - bars (prop optionnelle) : Float32Array [0..1] de longueur BARS, pour démo et tests.

  Le câblage AnalyserNode viendra avec la couche WebRTC.
-->
<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  /** Float32Array de valeurs [0..1], longueur = BARS. Si null → mode ambient. */
  bars: { type: [Array, Float32Array], default: null },
  width: { type: Number, default: 420 },
  height: { type: Number, default: 80 }
})

const BARS = 48
const RISE = 0.6
const DECAY = 0.88

const canvas = ref(null)
let rafId = null
let smoothed = new Float32Array(BARS)
let startedAt = 0

function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function draw(now) {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = props.width
  const h = props.height

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  if (!props.bars) {
    // État ambient : sinusoïde 0.5 Hz, opacity 0.18, stroke --accent.
    const t = (now - startedAt) / 1000
    ctx.strokeStyle = readToken('--accent') || '#F4A261'
    ctx.globalAlpha = 0.18
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let x = 0; x <= w; x += 2) {
      const phase = (x / w) * Math.PI * 4 + t * Math.PI
      const y = h / 2 + Math.sin(phase) * (h * 0.18) * Math.sin(t * 0.5)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  } else {
    // Barres lissées.
    for (let i = 0; i < BARS; i++) {
      const raw = Math.max(0, Math.min(1, props.bars[i] ?? 0))
      const prev = smoothed[i]
      smoothed[i] = raw > prev ? prev + (raw - prev) * RISE : prev * DECAY
    }

    const gap = 2
    const barW = (w - gap * (BARS - 1)) / BARS
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, readToken('--accent') || '#F4A261')
    grad.addColorStop(1, readToken('--accent-strong') || '#E76F51')
    ctx.fillStyle = grad

    for (let i = 0; i < BARS; i++) {
      const barH = Math.max(2, smoothed[i] * h)
      const x = i * (barW + gap)
      const y = (h - barH) / 2
      ctx.beginPath()
      const r = Math.min(barW / 2, 2)
      // Capsule simple (rounded rect)
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + barW - r, y)
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r)
      ctx.lineTo(x + barW, y + barH - r)
      ctx.quadraticCurveTo(x + barW, y + barH, x + barW - r, y + barH)
      ctx.lineTo(x + r, y + barH)
      ctx.quadraticCurveTo(x, y + barH, x, y + barH - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.fill()
    }
  }

  rafId = requestAnimationFrame(draw)
}

function setupCanvas() {
  const c = canvas.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  c.width = props.width * dpr
  c.height = props.height * dpr
  c.style.width = `${props.width}px`
  c.style.height = `${props.height}px`
}

onMounted(() => {
  setupCanvas()
  startedAt = performance.now()
  rafId = requestAnimationFrame(draw)
})

watch(() => [props.width, props.height], () => {
  setupCanvas()
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <canvas
    ref="canvas"
    class="fl-visualizer"
    aria-label="Niveau audio"
    role="img"
  />
</template>

<style scoped>
.fl-visualizer {
  display: block;
  max-width: 100%;
}
</style>
