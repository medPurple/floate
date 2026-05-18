import FlParticipantsPanel from './FlParticipantsPanel.vue'

export default {
  title: 'Molecules/FlParticipantsPanel',
  component: FlParticipantsPanel,
  tags: ['autodocs']
}

const baseParticipants = [
  { id: 'sam',   pseudo: 'Sam' },
  { id: 'marie', pseudo: 'Marie' },
  { id: 'yuki',  pseudo: 'Yuki' },
  { id: 'me',    pseudo: 'Toi' }
]

export const ListenerView = () => ({
  components: { FlParticipantsPanel },
  setup() {
    return { participants: baseParticipants }
  },
  template: `
    <div style="width: 320px; padding: 24px;">
      <FlParticipantsPanel
        :participants="participants"
        host-id="sam"
        me-id="me"
      />
    </div>
  `
})

export const HostView = () => ({
  components: { FlParticipantsPanel },
  setup() {
    return { participants: baseParticipants }
  },
  template: `
    <div style="width: 320px; padding: 24px;">
      <FlParticipantsPanel
        :participants="participants"
        host-id="me"
        me-id="me"
      />
    </div>
  `
})

export const RoomPleine = () => ({
  components: { FlParticipantsPanel },
  setup() {
    const participants = [
      { id: 'sam', pseudo: 'Sam' },
      { id: 'a', pseudo: 'Marie' },
      { id: 'b', pseudo: 'Yuki' },
      { id: 'c', pseudo: 'Pablo' },
      { id: 'd', pseudo: 'Théo' },
      { id: 'e', pseudo: 'Inès' },
      { id: 'f', pseudo: 'Mehdi' },
      { id: 'me', pseudo: 'Toi' }
    ]
    return { participants }
  },
  template: `
    <div style="width: 320px; padding: 24px;">
      <FlParticipantsPanel
        :participants="participants"
        host-id="sam"
        me-id="me"
      />
    </div>
  `
})
