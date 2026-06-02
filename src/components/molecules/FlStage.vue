<!--
  FlStage — DESIGN-SYSTEM.md §4.4
  3 états, choisis via la prop `state` :
    A — connecting   : skeleton, label "Connexion"
    B — host-ready   : onboarding host, stepper, CTA "Démarrer la diffusion"
    C — streaming    : live badge + visualizer + bouton selon le rôle

  Le composant émet :
    - 'start'          (état B → l'host clique "Démarrer la diffusion")
    - 'stop'           (état C, role=host streaming → "Arrêter la diffusion")
    - 'request-floor'  (état C, role=listener → "Demander la main")

  Tokens : design-tokens.json > component.stage (radius 14px, padding 32px,
  min-height 360px) + §4.4 du DS pour les copys.
-->
<script setup>
import { computed } from 'vue'
import FlButton from '../atoms/FlButton.vue'
import FlLiveBadge from '../atoms/FlLiveBadge.vue'
import FlSkeleton from '../atoms/FlSkeleton.vue'
import FlStepper from '../atoms/FlStepper.vue'
import FlStreamPaused from '../atoms/FlStreamPaused.vue'
import FlVisualizer from '../atoms/FlVisualizer.vue'

const props = defineProps({
  state: {
    type: String,
    required: true,
    validator: v => ['connecting', 'host-ready', 'streaming'].includes(v)
  },
  /** Pseudo de l'utilisateur courant — pour "Bienvenue, X" en état B. */
  pseudo: { type: String, default: '' },
  /** Nom de la personne qui a (ou aura) la main — affiché en état C. */
  hostName: { type: String, default: '' },
  role: {
    type: String,
    default: 'listener',
    validator: v => ['host', 'listener'].includes(v)
  },
  /** Le host diffuse-t-il vraiment ? Pilote l'affichage du badge. */
  isStreaming: { type: Boolean, default: false },
  /** Nombre d'auditeurs côté host (pour le foot d'onboarding et le status). */
  listenerCount: { type: Number, default: 0 },
  /** État de la demande de main pour un listener (§5.1). */
  floorState: {
    type: String,
    default: 'idle',
    validator: v => ['idle', 'pending', 'granted'].includes(v)
  },
  /** Secondes restantes pour le btn-pending. */
  floorCountdown: { type: Number, default: 0 },
  /** Barres optionnelles à passer au visualizer (Float32Array [0..1]). */
  bars: { type: [Array, Float32Array], default: null },
  /** Santé du flux entrant (listener uniquement) — 'good' | 'poor' | 'lost'.
      Si != good, on swap le visualizer pour FlStreamPaused et on adapte
      la status line. Le host n'est pas concerné (il ne reçoit pas). */
  streamHealth: {
    type: String,
    default: 'good',
    validator: v => ['good', 'poor', 'lost'].includes(v)
  }
})

defineEmits(['start', 'stop', 'request-floor'])

const onboardingSteps = [
  {
    body: "Choisis l'onglet où ta musique joue."
  },
  {
    body: "Coche bien « Partager l'audio de l'onglet ».",
    hint: 'Sans cette case, la diffusion part en silence.',
    highlight: true
  }
]

// Status string §4.4 état C
const statusLine = computed(() => {
  if (props.role === 'host' && props.isStreaming) {
    const n = props.listenerCount
    if (n === 0) return 'Personne ne t\'écoute encore.'
    if (n === 1) return 'Tu diffuses pour 1 personne.'
    return `Tu diffuses pour ${n} personnes.`
  }
  if (props.role === 'listener' && props.isStreaming) {
    // Mute la status line "Diffusion en cours" quand le signal flanche —
    // FlStreamPaused (qui remplace le visualizer) porte déjà le message.
    if (props.streamHealth === 'lost') return 'Son en pause — réception coupée.'
    if (props.streamHealth === 'poor') return 'Son en pause — réception instable.'
    return 'Diffusion en cours.'
  }
  if (props.role === 'listener' && !props.isStreaming) {
    return props.hostName
      ? `${props.hostName} n'a pas encore démarré.`
      : 'En attente du host.'
  }
  return ''
})

// Quand swap-t-on le visualizer pour FlStreamPaused ?
// Listener qui reçoit un flux mais dont la réception est mauvaise.
const showStreamPaused = computed(() =>
  props.role === 'listener' && props.isStreaming && props.streamHealth !== 'good'
)

const listenerWaitingLine = computed(() => {
  const n = props.listenerCount
  if (n === 0) return null
  if (n === 1) return '1 personne attend.'
  return `${n} personnes attendent.`
})
</script>

<template>
  <section class="fl-stage" :class="{ 'has-chat': isStreaming && state === 'streaming' }" :data-state="state">
    <!-- Overlay dédicaces (position absolute, pointer-events:none).
         Vit dans toutes les states mais le parent ne le rendra qu'en
         streaming via le slot conditionnel. -->
    <slot name="dedications" />

    <!-- État A : Connexion -->
    <template v-if="state === 'connecting'">
      <p class="fl-stage-label">Connexion</p>
      <div class="fl-stage-skeletons">
        <FlSkeleton :width="180" :height="32" :radius="6" />
        <FlSkeleton :width="240" :height="16" :radius="4" />
      </div>
    </template>

    <!-- État B : Host avant diffusion -->
    <template v-else-if="state === 'host-ready'">
      <p class="fl-stage-label">Prêt à diffuser</p>
      <h2 class="fl-stage-title">
        Bienvenue, {{ pseudo || 'toi' }}
      </h2>

      <FlStepper :steps="onboardingSteps" />

      <div class="fl-stage-actions">
        <FlButton variant="primary" @click="$emit('start')">
          Démarrer la diffusion
        </FlButton>
      </div>

      <p v-if="listenerWaitingLine" class="fl-stage-foot">
        {{ listenerWaitingLine }}
      </p>
    </template>

    <!-- État C : En diffusion / en écoute -->
    <template v-else-if="state === 'streaming'">
      <FlLiveBadge :is-live="isStreaming" />

      <p class="fl-stage-label">Diffusion</p>

      <h2 v-if="hostName" class="fl-stage-host">
        {{ hostName }}
      </h2>

      <p class="fl-stage-status">{{ statusLine }}</p>

      <!-- Swap visualizer ↔ FlStreamPaused selon la santé de la réception.
           Listener avec signal dégradé → on cache les barres animées
           (qui n'auraient pas de sens, le son ne joue pas). -->
      <FlStreamPaused v-if="showStreamPaused" :state="streamHealth" />
      <FlVisualizer v-else :bars="bars" />

      <!-- Pill flottante composer + bouton historique. Visible dès que
           le son tourne (CHAT-DEDICACES.md §4.3). On se base sur
           isStreaming — la même source que le live badge et le bouton
           "Arrêter la diffusion", donc garanti réactif. -->
      <div v-if="isStreaming" class="fl-stage-chat-bar">
        <slot name="chat-bar" />
      </div>

      <div class="fl-stage-actions">
        <!-- Host en diffusion : seul cas où btn-danger est légitime (§3.1). -->
        <FlButton
          v-if="role === 'host' && isStreaming"
          variant="danger"
          @click="$emit('stop')"
        >
          Arrêter la diffusion
        </FlButton>

        <!-- Listener : Demander la main, avec son state machine §5.1 -->
        <FlButton
          v-else-if="role === 'listener' && floorState === 'idle'"
          variant="secondary"
          @click="$emit('request-floor')"
        >
          Demander la main
        </FlButton>

        <FlButton
          v-else-if="role === 'listener' && floorState === 'pending'"
          variant="pending"
        >
          Demande envoyée · {{ floorCountdown }}s
        </FlButton>
      </div>
    </template>
  </section>
</template>

<style scoped>
.fl-stage {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  padding: 32px;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  text-align: center;
  box-shadow: var(--shadow);
  position: relative;
}

/* Quand le chat est actif, on empêche les dédicaces de fuir hors du
   stage (overflow:hidden) et on réserve l'espace en bas pour la pill
   composer (qui flotte en absolute, indépendamment du flux flex). */
.fl-stage.has-chat {
  overflow: hidden;
  padding-bottom: 84px;
}

/* Pill composer ancrée au bas du stage — CHAT-DEDICACES.md §4.3.
   Position absolue : reste visible quelle que soit la hauteur du stage
   et indépendamment du flux des autres éléments (visualizer, actions). */
.fl-stage-chat-bar {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 3;
}

.fl-stage-label {
  font-size: var(--fs-mini);
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

.fl-stage-skeletons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.fl-stage-title {
  font-size: var(--fs-h1-stage);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.fl-stage-host {
  font-size: var(--fs-h1-stage);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.fl-stage-status {
  font-size: var(--fs-body-sm);
  color: var(--text-dim);
}

.fl-stage-actions {
  margin-top: var(--space-sm);
  display: flex;
  gap: var(--space-md);
}

.fl-stage-foot {
  font-size: var(--fs-meta);
  color: var(--text-faint);
  margin-top: var(--space-sm);
}

/* Onboarding : on contraint la largeur du stepper pour qu'il reste lisible. */
.fl-stage :deep(.fl-stepper) {
  width: 100%;
  max-width: 420px;
  text-align: left;
}
</style>
