import FlButton from './FlButton.vue'

export default {
  title: 'Atoms/FlButton',
  component: FlButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'pending']
    },
    disabled: { control: 'boolean' }
  }
}

const Template = (args) => ({
  components: { FlButton },
  setup() { return { args } },
  template: `<FlButton v-bind="args">{{ args.label }}</FlButton>`
})

export const Primary = Template.bind({})
Primary.args = { variant: 'primary', label: 'Démarrer la diffusion' }

export const Secondary = Template.bind({})
Secondary.args = { variant: 'secondary', label: 'Demander la main' }

export const Ghost = Template.bind({})
Ghost.args = { variant: 'ghost', label: 'Quitter' }

export const Danger = Template.bind({})
Danger.args = { variant: 'danger', label: 'Arrêter la diffusion' }

export const Pending = Template.bind({})
Pending.args = { variant: 'pending', label: 'Demande envoyée · 47s' }

export const Disabled = Template.bind({})
Disabled.args = { variant: 'primary', label: 'Démarrer la diffusion', disabled: true }

// Vue d'ensemble — toutes les variantes côte à côte.
export const AllVariants = () => ({
  components: { FlButton },
  template: `
    <div style="display: flex; flex-wrap: wrap; gap: 12px; padding: 24px;">
      <FlButton variant="primary">Démarrer la diffusion</FlButton>
      <FlButton variant="secondary">Demander la main</FlButton>
      <FlButton variant="ghost">Quitter</FlButton>
      <FlButton variant="danger">Arrêter la diffusion</FlButton>
      <FlButton variant="pending">Demande envoyée · 47s</FlButton>
      <FlButton variant="primary" disabled>Désactivé</FlButton>
    </div>
  `
})
