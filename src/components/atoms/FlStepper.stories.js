import FlStepper from './FlStepper.vue'

export default {
  title: 'Atoms/FlStepper',
  component: FlStepper,
  tags: ['autodocs']
}

export const OnboardingHost = () => ({
  components: { FlStepper },
  setup() {
    const steps = [
      { body: "Choisis l'onglet où ta musique joue." },
      {
        body: "Coche bien « Partager l'audio de l'onglet ».",
        hint: 'Sans cette case, la diffusion part en silence.',
        highlight: true
      }
    ]
    return { steps }
  },
  template: `
    <div style="max-width: 420px; padding: 24px;">
      <FlStepper :steps="steps" />
    </div>
  `
})
