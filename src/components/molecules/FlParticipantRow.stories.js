import FlParticipantRow from './FlParticipantRow.vue'

export default {
  title: 'Molecules/FlParticipantRow',
  component: FlParticipantRow,
  tags: ['autodocs']
}

export const Liste = () => ({
  components: { FlParticipantRow },
  template: `
    <div style="display: flex; flex-direction: column; gap: 4px; width: 280px; padding: 24px;">
      <FlParticipantRow pseudo="Sam" :is-host="true" />
      <FlParticipantRow pseudo="Marie" :is-me="true" />
      <FlParticipantRow pseudo="Yuki" />
      <FlParticipantRow pseudo="Pablo" />
    </div>
  `
})
