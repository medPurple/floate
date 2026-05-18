import { ref } from 'vue'
import FlInput from './FlInput.vue'

export default {
  title: 'Atoms/FlInput',
  component: FlInput,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['text', 'mono'] },
    disabled: { control: 'boolean' }
  }
}

const Template = (args) => ({
  components: { FlInput },
  setup() {
    const value = ref(args.modelValue ?? '')
    return { args, value }
  },
  template: `
    <div style="width: 320px; padding: 24px;">
      <FlInput v-bind="args" v-model="value" />
    </div>
  `
})

export const Pseudo = Template.bind({})
Pseudo.args = {
  label: 'Ton pseudo',
  placeholder: 'Léa',
  modelValue: ''
}

export const CodeInvitation = Template.bind({})
CodeInvitation.args = {
  label: "Code d'invitation",
  placeholder: 'AKZ-394',
  variant: 'mono',
  modelValue: ''
}

export const AvecHint = Template.bind({})
AvecHint.args = {
  label: 'Nom de la room',
  placeholder: 'Set du dimanche',
  hint: 'Visible par tes invités uniquement.'
}

export const Desactive = Template.bind({})
Desactive.args = {
  label: 'Code',
  modelValue: 'AKZ-394',
  variant: 'mono',
  disabled: true
}
