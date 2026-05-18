import FlAudioOutputPanel from './FlAudioOutputPanel.vue'

export default {
  title: 'Molecules/FlAudioOutputPanel',
  component: FlAudioOutputPanel,
  tags: ['autodocs']
}

// La liste réelle dépend de ton OS. Sans permission micro/caméra,
// les labels seront génériques ("Sortie 1", "Sortie 2"…).
export const Default = () => ({
  components: { FlAudioOutputPanel },
  template: `
    <div style="width: 320px; padding: 24px;">
      <FlAudioOutputPanel @change="id => console.log('changement →', id)" />
    </div>
  `
})
