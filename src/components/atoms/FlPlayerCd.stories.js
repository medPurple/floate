import FlPlayerCd from './FlPlayerCd.vue'

export default {
  title: 'Atoms/FlPlayerCd',
  component: FlPlayerCd,
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
  components: { FlPlayerCd },
  setup: () => ({ args }),
  template: `
    <div style="padding: 32px; background: var(--bg);">
      <FlPlayerCd v-bind="args" />
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
  components: { FlPlayerCd },
  template: `
    <div style="padding: 32px; background: var(--bg); display: flex; gap: 32px; flex-wrap: wrap;">
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerCd state="off" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">off</figcaption>
      </figure>
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerCd state="standby" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">standby</figcaption>
      </figure>
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerCd state="playing" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">playing</figcaption>
      </figure>
      <figure style="margin:0; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <FlPlayerCd state="offline" :size="160" />
        <figcaption style="font-size:12px; color:var(--text-dim);">offline</figcaption>
      </figure>
    </div>
  `
})
