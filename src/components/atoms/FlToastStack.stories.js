import FlToastStack from './FlToastStack.vue'
import { useToasts } from '../../composables/useToasts.js'

export default {
  title: 'Atoms/FlToastStack',
  component: FlToastStack,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' }
}

// Le stack est globalement positionné en fixed top-right.
// Les boutons déclenchent des push via le composable useToasts.
export const Demo = () => ({
  components: { FlToastStack },
  setup() {
    const { push, clear } = useToasts()
    return {
      info:     () => push({ kind: 'info',    message: 'Marie a rejoint la room.' }),
      success:  () => push({ kind: 'success', message: 'Code copié.' }),
      error:    () => push({ kind: 'error',   message: 'Code invalide.' }),
      critical: () => push({ kind: 'error',   message: "Tu n'as pas coché « Partager l'audio de l'onglet ».", duration: 6000 }),
      clear
    }
  },
  template: `
    <div style="padding: 40px; min-height: 100vh;">
      <h2 style="margin-bottom: 16px;">Déclencheurs</h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="info">Info</button>
        <button class="btn btn-secondary" @click="success">Succès</button>
        <button class="btn btn-secondary" @click="error">Erreur</button>
        <button class="btn btn-secondary" @click="critical">Critique (6s)</button>
        <button class="btn btn-ghost" @click="clear">Tout fermer</button>
      </div>
      <FlToastStack />
    </div>
  `
})
