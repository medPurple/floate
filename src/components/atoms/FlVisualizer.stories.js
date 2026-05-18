import { ref, onMounted, onBeforeUnmount } from 'vue'
import FlVisualizer from './FlVisualizer.vue'

export default {
  title: 'Atoms/FlVisualizer',
  component: FlVisualizer,
  tags: ['autodocs']
}

// État ambient : pas de stream, sinusoïde subtile.
export const Ambient = () => ({
  components: { FlVisualizer },
  template: `<div style="padding: 24px;"><FlVisualizer /></div>`
})

// Mode bars : faux data simulant un signal audio. Démontre RISE/DECAY.
export const FauxStream = () => ({
  components: { FlVisualizer },
  setup() {
    const BARS = 48
    const bars = ref(new Array(BARS).fill(0))
    let raf = null

    function tick(t) {
      const arr = new Array(BARS)
      for (let i = 0; i < BARS; i++) {
        // Un mélange de sinus + bruit pour simuler un signal vivant.
        const wave = (Math.sin(i * 0.3 + t / 200) + 1) / 2
        const noise = Math.random() * 0.4
        arr[i] = Math.min(1, wave * 0.6 + noise)
      }
      bars.value = arr
      raf = requestAnimationFrame(tick)
    }

    onMounted(() => { raf = requestAnimationFrame(tick) })
    onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf) })

    return { bars }
  },
  template: `<div style="padding: 24px;"><FlVisualizer :bars="bars" /></div>`
})
