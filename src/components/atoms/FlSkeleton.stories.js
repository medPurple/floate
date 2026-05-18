import FlSkeleton from './FlSkeleton.vue'

export default {
  title: 'Atoms/FlSkeleton',
  component: FlSkeleton,
  tags: ['autodocs']
}

export const Tailles = () => ({
  components: { FlSkeleton },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; padding: 24px; width: 300px;">
      <FlSkeleton :width="180" :height="32" :radius="6" />
      <FlSkeleton :width="240" :height="16" :radius="4" />
      <FlSkeleton width="100%" :height="48" :radius="8" />
    </div>
  `
})
