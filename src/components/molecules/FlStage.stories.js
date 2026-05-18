import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import FlStage from './FlStage.vue'

export default {
  title: 'Molecules/FlStage',
  component: FlStage,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    state: { control: 'select', options: ['connecting', 'host-ready', 'streaming'] },
    role:  { control: 'select', options: ['host', 'listener'] },
    floorState: { control: 'select', options: ['idle', 'pending', 'granted'] },
    isStreaming: { control: 'boolean' },
    listenerCount: { control: { type: 'number', min: 0, max: 8 } }
  }
}

const Template = (args) => ({
  components: { FlStage },
  setup() { return { args } },
  template: `
    <div style="max-width: 720px; margin: 0 auto;">
      <FlStage v-bind="args" />
    </div>
  `
})

// État A — squelette de connexion
export const Connexion = Template.bind({})
Connexion.args = { state: 'connecting' }

// État B — host avant diffusion, étape audio en highlight
export const HostOnboarding = Template.bind({})
HostOnboarding.args = {
  state: 'host-ready',
  pseudo: 'Sam',
  role: 'host',
  listenerCount: 2
}

// État C — host en diffusion
export const HostStreaming = Template.bind({})
HostStreaming.args = {
  state: 'streaming',
  role: 'host',
  hostName: 'Sam',
  isStreaming: true,
  listenerCount: 3
}

// État C — listener pendant que le host diffuse
export const ListenerActif = Template.bind({})
ListenerActif.args = {
  state: 'streaming',
  role: 'listener',
  hostName: 'Sam',
  isStreaming: true,
  floorState: 'idle'
}

// État C — listener avec demande de main en attente
export const ListenerPending = Template.bind({})
ListenerPending.args = {
  state: 'streaming',
  role: 'listener',
  hostName: 'Sam',
  isStreaming: true,
  floorState: 'pending',
  floorCountdown: 47
}

// État C — listener qui attend que le host démarre
export const ListenerEnAttente = Template.bind({})
ListenerEnAttente.args = {
  state: 'streaming',
  role: 'listener',
  hostName: 'Sam',
  isStreaming: false,
  floorState: 'idle'
}

/**
 * Toggle de debug — la story phare pour valider les 3 états visuellement.
 * Switche entre Connexion / Onboarding / Streaming, avec faux signal audio
 * simulé en mode streaming pour voir le visualizer s'animer.
 */
export const DebugToggle = () => ({
  components: { FlStage },
  setup() {
    const state = ref('host-ready')
    const role = ref('host')
    const isStreaming = ref(true)

    // Génération de faux signal pour le visualizer.
    const BARS = 48
    const bars = ref(new Array(BARS).fill(0))
    let raf = null

    function tick(t) {
      const arr = new Array(BARS)
      for (let i = 0; i < BARS; i++) {
        const wave = (Math.sin(i * 0.3 + t / 200) + 1) / 2
        const noise = Math.random() * 0.4
        arr[i] = Math.min(1, wave * 0.6 + noise)
      }
      bars.value = arr
      raf = requestAnimationFrame(tick)
    }
    onMounted(() => { raf = requestAnimationFrame(tick) })
    onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf) })

    const stageBars = computed(() =>
      state.value === 'streaming' ? bars.value : null
    )

    return { state, role, isStreaming, stageBars }
  },
  template: `
    <div style="max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px;">
      <div style="
        background: var(--bg-elev-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 12px 16px;
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: center;
        font-size: 13px;
      ">
        <span style="color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px;">
          Debug
        </span>
        <label>
          État
          <select v-model="state" style="background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; margin-left: 6px;">
            <option value="connecting">connecting</option>
            <option value="host-ready">host-ready</option>
            <option value="streaming">streaming</option>
          </select>
        </label>
        <label>
          Rôle
          <select v-model="role" style="background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; margin-left: 6px;">
            <option value="host">host</option>
            <option value="listener">listener</option>
          </select>
        </label>
        <label style="display: inline-flex; align-items: center; gap: 6px;">
          <input type="checkbox" v-model="isStreaming" />
          isStreaming
        </label>
      </div>

      <FlStage
        :state="state"
        :role="role"
        :is-streaming="isStreaming"
        pseudo="Sam"
        host-name="Sam"
        :listener-count="3"
        :bars="stageBars"
        @start="isStreaming = true"
        @stop="isStreaming = false"
      />
    </div>
  `
})
