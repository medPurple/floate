import FlLiveBadge from './FlLiveBadge.vue'

export default {
  title: 'Atoms/FlLiveBadge',
  component: FlLiveBadge,
  tags: ['autodocs'],
  argTypes: {
    isLive: { control: 'boolean' }
  }
}

const Template = (args) => ({
  components: { FlLiveBadge },
  setup() { return { args } },
  template: `<div style="padding: 32px;"><FlLiveBadge v-bind="args" /></div>`
})

export const EnDirect = Template.bind({})
EnDirect.args = { isLive: true }

export const Eteint = Template.bind({})
Eteint.args = { isLive: false }
