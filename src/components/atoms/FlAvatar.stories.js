import FlAvatar from './FlAvatar.vue'

export default {
  title: 'Atoms/FlAvatar',
  component: FlAvatar,
  tags: ['autodocs'],
  argTypes: {
    pseudo: { control: 'text' },
    isHost: { control: 'boolean' },
    size: { control: { type: 'range', min: 20, max: 80, step: 4 } }
  }
}

const Template = (args) => ({
  components: { FlAvatar },
  setup() { return { args } },
  template: `<div style="padding: 24px;"><FlAvatar v-bind="args" /></div>`
})

export const Listener = Template.bind({})
Listener.args = { pseudo: 'Léa', isHost: false, size: 28 }

export const Host = Template.bind({})
Host.args = { pseudo: 'Sam', isHost: true, size: 28 }

// Galerie pour valider que les couleurs dérivées restent cohérentes.
export const Galerie = () => ({
  components: { FlAvatar },
  setup() {
    const pseudos = ['Sam', 'Léa', 'Marie', 'Pablo', 'Yuki', 'Théo', 'Inès', 'Mehdi']
    return { pseudos }
  },
  template: `
    <div style="display: flex; flex-wrap: wrap; gap: 16px; padding: 24px;">
      <div v-for="(p, i) in pseudos" :key="p" style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
        <FlAvatar :pseudo="p" :is-host="i === 0" />
        <span style="font-size: 11px; color: var(--text-dim);">
          {{ p }}<span v-if="i === 0" style="color: var(--accent);"> (host)</span>
        </span>
      </div>
    </div>
  `
})
