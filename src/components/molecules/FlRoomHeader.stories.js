import FlRoomHeader from './FlRoomHeader.vue'

export default {
  title: 'Molecules/FlRoomHeader',
  component: FlRoomHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    visibility: { control: 'select', options: ['public', 'private'] }
  }
}

const Template = (args) => ({
  components: { FlRoomHeader },
  setup() { return { args } },
  template: `<FlRoomHeader v-bind="args" @leave="() => alert('Quitter')" />`
})

export const Privee = Template.bind({})
Privee.args = { roomName: 'Set du dimanche', visibility: 'private' }

export const Publique = Template.bind({})
Publique.args = { roomName: 'Lo-fi du matin', visibility: 'public' }

export const NomLong = Template.bind({})
NomLong.args = {
  roomName: 'Très très très long nom de room qui doit être tronqué proprement',
  visibility: 'private'
}
