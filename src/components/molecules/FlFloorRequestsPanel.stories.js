import { ref } from 'vue'
import FlFloorRequestsPanel from './FlFloorRequestsPanel.vue'

export default {
  title: 'Molecules/FlFloorRequestsPanel',
  component: FlFloorRequestsPanel,
  tags: ['autodocs']
}

export const Default = () => ({
  components: { FlFloorRequestsPanel },
  setup() {
    const requests = ref([
      { id: 'marie', pseudo: 'Marie' },
      { id: 'yuki',  pseudo: 'Yuki' }
    ])
    function accept(id) { requests.value = requests.value.filter(r => r.id !== id) }
    function deny(id)   { requests.value = requests.value.filter(r => r.id !== id) }
    return { requests, accept, deny }
  },
  template: `
    <div style="width: 320px; padding: 24px;">
      <FlFloorRequestsPanel :requests="requests" @accept="accept" @deny="deny" />
    </div>
  `
})
