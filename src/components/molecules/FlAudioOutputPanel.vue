<!--
  FlAudioOutputPanel — DESIGN-SYSTEM.md §4.5 (panneau #2)
  Liste les sorties audio détectées via enumerateDevices.

  Les navigateurs refusent de livrer les labels (et parfois les
  devices eux-mêmes) tant qu'une permission micro/caméra n'a pas été
  accordée. Tant qu'on est dans ce cas, on propose un bouton
  "Détecter mes appareils" qui demande une permission micro éphémère.

  Le branchement setSinkId se fera côté <audio> de la room (à venir).
  Bluetooth/USB : visibles automatiquement dès que l'OS les expose,
  pas de Web Bluetooth API à câbler.
-->
<script setup>
import { computed, watch } from 'vue'
import FlButton from '../atoms/FlButton.vue'
import { useMediaDevices } from '../../composables/useMediaDevices.js'
import { useToasts } from '../../composables/useToasts.js'

const emit = defineEmits(['change'])

const {
  outputs, selectedId, supported, error,
  labelsUnlocked, unlocking, select, unlockLabels
} = useMediaDevices()
const { push } = useToasts()

watch(selectedId, (id) => {
  if (id) emit('change', id)
})

function onSelect(e) {
  select(e.target.value)
}

const showUnlock = computed(() =>
  supported.value && !labelsUnlocked.value
)

async function onUnlock() {
  await unlockLabels()
  if (error.value) {
    push({
      kind: 'error',
      message: "Sans permission micro, je ne peux pas lister tes appareils."
    })
  }
}
</script>

<template>
  <section class="panel">
    <h3 class="panel-title">Sortie audio</h3>

    <template v-if="!supported">
      <p class="fl-audio-note">
        Ton navigateur ne te permet pas de choisir la sortie audio.
      </p>
    </template>

    <template v-else>
      <div class="fl-audio-select-wrap">
        <select
          class="fl-audio-select"
          :value="selectedId || ''"
          :disabled="!outputs.length"
          aria-label="Choisir la sortie audio"
          @change="onSelect"
        >
          <option v-if="!outputs.length" value="" disabled>
            Aucune sortie détectée
          </option>
          <option
            v-for="o in outputs"
            :key="o.deviceId"
            :value="o.deviceId"
          >
            {{ o.label }}
          </option>
        </select>
        <span class="fl-audio-chev" aria-hidden="true">▾</span>
      </div>

      <!-- Si pas de permission accordée, on n'a pas les vrais noms.
           AirPods, casques Bluetooth, USB… n'apparaîtront que sous
           "Sortie 1", "Sortie 2", ou pas du tout. -->
      <div v-if="showUnlock" class="fl-audio-unlock">
        <p class="fl-audio-note">
          Pour voir tes vrais appareils (AirPods, casque, sortie système…),
          je dois te demander une permission micro courte. Elle sert
          seulement à révéler les noms — je ne capte rien.
        </p>
        <FlButton
          variant="secondary"
          :disabled="unlocking"
          @click="onUnlock"
        >
          {{ unlocking ? 'Détection en cours…' : 'Détecter mes appareils' }}
        </FlButton>
      </div>

      <p v-else class="fl-audio-note">
        Le son sortira de l'appareil que tu choisis ici.
      </p>
    </template>
  </section>
</template>

<style scoped>
.fl-audio-select-wrap {
  position: relative;
  margin-bottom: var(--space-sm);
}

.fl-audio-select {
  appearance: none;
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 32px 10px 12px;
  color: var(--text);
  font-size: var(--fs-body-sm);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--easing-default),
              box-shadow var(--duration-fast) var(--easing-default);
}

.fl-audio-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.fl-audio-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fl-audio-chev {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-dim);
  pointer-events: none;
  font-size: 12px;
}

.fl-audio-note {
  font-size: var(--fs-mini);
  color: var(--text-faint);
  line-height: 1.4;
}

.fl-audio-unlock {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

/* On compresse le bouton dans la densité du panneau. */
.fl-audio-unlock :deep(.btn) {
  padding: 8px 14px;
  font-size: var(--fs-mini);
  width: 100%;
}
</style>
