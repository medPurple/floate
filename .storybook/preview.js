import '../src/styles.css'

/** @type { import('@storybook/vue3').Preview } */
const preview = {
  parameters: {
    backgrounds: {
      default: 'floate-night',
      values: [
        { name: 'floate-night', value: '#0E0D12' },
        { name: 'elev-1', value: '#18171F' }
      ]
    },
    layout: 'centered',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i }
    }
  }
}

export default preview
