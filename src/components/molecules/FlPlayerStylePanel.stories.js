import { ref } from 'vue'
import FlPlayerStylePanel from './FlPlayerStylePanel.vue'
import { PLAYERS } from '../../lib/players.js'

export default {
  title: 'Molecules/FlPlayerStylePanel',
  component: FlPlayerStylePanel,
  tags: ['autodocs']
}

export const Default = () => ({
  components: { FlPlayerStylePanel },
  setup() {
    const selected = ref('vinyl')
    function onChange(id) { selected.value = id }
    return { players: PLAYERS, selected, onChange }
  },
  template: `
    <div style="padding: 32px; background: var(--bg); max-width: 320px;">
      <FlPlayerStylePanel
        :players="players"
        :selected-id="selected"
        @change="onChange"
      />
      <p style="margin-top: 12px; font-size: 12px; color: var(--text-dim);">
        Sélection courante : {{ selected }}
      </p>
    </div>
  `
})
