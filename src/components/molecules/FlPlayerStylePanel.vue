<!--
  FlPlayerStylePanel — sidebar : sélection du style de lecteur affiché
  sur le stage de la room. Host uniquement (le parent décide via v-if).

  Émet 'change' avec l'id du style choisi ('vinyl' | 'cd' | 'digital').
  Le serveur valide via isPlayerId puis broadcast à tous les peers.

  En v0.5, les 3 lecteurs sont des placeholders procéduraux ; on garde
  l'animation actuelle FlVisualizer sur le stage en attendant les vrais
  SVG d'illustrateur. Ce panneau permet déjà au host de choisir et de
  voir sa préférence persistée.
-->
<script setup>
defineProps({
  players: { type: Array, required: true },
  selectedId: { type: String, required: true }
})

defineEmits(['change'])
</script>

<template>
  <section class="panel">
    <h3 class="panel-title">Style du lecteur</h3>

    <ul class="player-list" aria-label="Choisir un style de lecteur">
      <li v-for="p in players" :key="p.id">
        <button
          type="button"
          :class="['player-option', { 'is-active': p.id === selectedId }]"
          :aria-pressed="p.id === selectedId"
          @click="$emit('change', p.id)"
        >
          <!-- Mini-icône par type. Restera tel quel quand les vrais
               SVG arriveront — c'est juste une vignette de tri. -->
          <span class="player-swatch" aria-hidden="true">
            <svg v-if="p.id === 'vinyl'" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#0c0b10" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
              <circle cx="20" cy="20" r="10" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
              <circle cx="20" cy="20" r="6" fill="var(--accent)" />
              <circle cx="20" cy="20" r="1" fill="var(--bg-elev)" />
            </svg>
            <svg v-else-if="p.id === 'cd'" viewBox="0 0 40 40">
              <defs>
                <radialGradient id="swatch-cd" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stop-color="#e0e6ee" />
                  <stop offset="100%" stop-color="#9ca3b3" />
                </radialGradient>
              </defs>
              <circle cx="20" cy="20" r="18" fill="url(#swatch-cd)" />
              <circle cx="20" cy="20" r="6" fill="color-mix(in srgb, var(--accent) 20%, #d6dadf)" />
              <circle cx="20" cy="20" r="2" fill="var(--bg-elev)" />
            </svg>
            <svg v-else viewBox="0 0 40 40">
              <rect x="11" y="5" width="18" height="30" rx="3" fill="#dcdbe4" />
              <rect x="13.5" y="7.5" width="13" height="14" rx="0.6" fill="#16151c" />
              <rect x="14.5" y="9.5" width="6" height="0.8" fill="rgba(255,255,255,0.45)" />
              <rect x="14.5" y="11.5" width="9" height="0.8" fill="rgba(255,255,255,0.35)" />
              <circle cx="20" cy="28" r="4.5" fill="color-mix(in srgb, var(--accent) 15%, #ecebf0)" />
              <circle cx="20" cy="28" r="1.5" fill="color-mix(in srgb, var(--accent) 60%, #ffffff)" />
            </svg>
          </span>

          <span class="player-text">
            <span :class="['player-name', { 'is-active': p.id === selectedId }]">
              {{ p.label }}
            </span>
            <span class="player-desc">{{ p.description }}</span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.player-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.player-option {
  width: 100%;
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: var(--space-md);
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: left;
  transition: border-color var(--duration-fast) var(--easing-default),
              box-shadow var(--duration-fast) var(--easing-default);
}

.player-option:hover {
  border-color: var(--text-faint);
}

.player-option.is-active {
  border-width: 2px;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  padding: 9px 11px;
}

.player-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}
.player-swatch svg {
  width: 100%;
  height: 100%;
}

.player-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.player-name {
  font-size: var(--fs-body-sm);
  color: var(--text);
}
.player-name.is-active {
  font-weight: 700;
}

.player-desc {
  font-size: var(--fs-mini);
  color: var(--text-dim);
}
</style>
