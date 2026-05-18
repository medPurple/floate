import FlInvitePanel from './FlInvitePanel.vue'
import FlToastStack from '../atoms/FlToastStack.vue'

export default {
  title: 'Molecules/FlInvitePanel',
  component: FlInvitePanel,
  tags: ['autodocs']
}

export const Default = () => ({
  components: { FlInvitePanel, FlToastStack },
  template: `
    <div style="width: 320px; padding: 24px;">
      <FlInvitePanel code="AKZ-394" />
      <FlToastStack />
    </div>
  `
})
