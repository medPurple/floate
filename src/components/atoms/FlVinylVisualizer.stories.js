import { ref } from 'vue'
import FlVinylVisualizer from './FlVinylVisualizer.vue'

export default {
  title: 'Atoms/FlVinylVisualizer',
  component: FlVinylVisualizer,
  tags: ['autodocs']
}

// Vinyle posé : immobile, label visible avec la palette par défaut.
export const Idle = () => ({
  components: { FlVinylVisualizer },
  template: `
    <div style="padding: 32px; background: var(--bg);">
      <FlVinylVisualizer :is-streaming="false" />
    </div>
  `
})

// Vinyle qui tourne : diffusion active.
export const Spinning = () => ({
  components: { FlVinylVisualizer },
  template: `
    <div style="padding: 32px; background: var(--bg);">
      <FlVinylVisualizer :is-streaming="true" />
    </div>
  `
})

// Toggle live pour comparer rapidement les deux états.
export const Toggle = () => ({
  components: { FlVinylVisualizer },
  setup() {
    const playing = ref(true)
    return { playing }
  },
  template: `
    <div style="padding: 32px; background: var(--bg);">
      <FlVinylVisualizer :is-streaming="playing" />
      <div style="margin-top: 24px;">
        <button
          @click="playing = !playing"
          style="padding: 8px 16px; background: var(--accent-strong); color: white; border-radius: 999px;"
        >
          {{ playing ? 'Stop' : 'Play' }}
        </button>
      </div>
    </div>
  `
})

// Côte à côte : vérifie que la palette s'applique correctement et
// que les deux tailles paraissent harmonieuses.
export const SizeVariants = () => ({
  components: { FlVinylVisualizer },
  template: `
    <div style="padding: 32px; background: var(--bg); display: flex; gap: 32px; align-items: center;">
      <FlVinylVisualizer :is-streaming="true" :size="140" />
      <FlVinylVisualizer :is-streaming="true" :size="200" />
      <FlVinylVisualizer :is-streaming="true" :size="280" />
    </div>
  `
})
