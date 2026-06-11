import FlPlayerDigital from './FlPlayerDigital.vue'

export default {
  title: 'Atoms/FlPlayerDigital',
  component: FlPlayerDigital,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['off', 'standby', 'playing', 'offline']
    },
    size: { control: { type: 'number', min: 80, max: 320, step: 20 } }
  }
}

const Template = (args) => ({
  components: { FlPlayerDigital },
  setup: () => ({ args }),
  template: `
    <div style="padding: 32px; background: var(--bg);">
      <FlPlayerDigital v-bind="args" />
    </div>
  `
})

export const Off      = Template.bind({})
Off.args      = { state: 'off',      size: 220 }

export const Standby  = Template.bind({})
Standby.args  = { state: 'standby',  size: 220 }

export const Playing  = Template.bind({})
Playing.args  = { state: 'playing',  size: 220 }

export const Offline  = Template.bind({})
Offline.args  = { state: 'offline',  size: 220 }

export const AllStates = () => ({
  components: { FlPlayerDigital },
  template: `
    <div style="padding: 32px; background: var(--bg); display: flex; gap: 32px; flex-wrap: wrap;">
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerDigital state="off" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">off</figcaption>
      </figure>
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerDigital state="standby" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">standby</figcaption>
      </figure>
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerDigital state="playing" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">playing</figcaption>
      </figure>
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerDigital state="offline" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">offline</figcaption>
      </figure>
    </div>
  `
})
