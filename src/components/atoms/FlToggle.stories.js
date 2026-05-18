import { ref } from 'vue'
import FlToggle from './FlToggle.vue'

export default {
  title: 'Atoms/FlToggle',
  component: FlToggle,
  tags: ['autodocs']
}

export const Visibilite = () => ({
  components: { FlToggle },
  setup() {
    const value = ref('public')
    const options = [
      { label: 'Publique', value: 'public' },
      { label: 'Privée',   value: 'private' }
    ]
    return { value, options }
  },
  template: `
    <div style="padding: 24px;">
      <FlToggle v-model="value" :options="options" aria-label="Visibilité de la room" />
      <p style="color: var(--text-faint); font-size: 12px; margin-top: 12px;">
        Choix actuel : <strong style="color: var(--text);">{{ value }}</strong>
      </p>
    </div>
  `
})
