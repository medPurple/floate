<!--
  FlPageShell — gabarit commun aux pages institutionnelles
  (InfosView, ContactView). Spec INFOS-CONDITIONS.md §3 et CONTACT.md §3 :
  même header + même hero, seul le slot de contenu change.

  Anatomie :
    .page-header  → wordmark cliquable + bouton Retour
    .page-hero    → eyebrow / title / lead
    <slot/>       → corps de la page (sections, formulaire…)
    FlSiteFooter  → footer non-invasif (même que Lobby/Room)

  Max-width 760px volontairement plus étroit que les 1200px de l'app :
  c'est de la lecture, on plafonne la longueur de ligne (§3 du spec).

  Toute évolution du header/hero doit rester ICI pour que les deux pages
  restent synchronisées.
-->
<script setup>
import { useRouter } from 'vue-router'
import FlButton from '../atoms/FlButton.vue'
import FlSiteFooter from '../organisms/FlSiteFooter.vue'

defineProps({
  eyebrow: { type: String, required: true },
  title:   { type: String, required: true },
  lead:    { type: String, default: '' },
  /** Étiquette de l'écran pour debug / accessibilité (data attribute). */
  screenLabel: { type: String, default: '' }
})

const router = useRouter()

function goBack() {
  // Si on est arrivé via lien direct (history.length === 1), on renvoie
  // au Lobby plutôt que de fermer l'onglet.
  if (window.history.length > 1) router.back()
  else router.push({ name: 'lobby' })
}
</script>

<template>
  <div class="page-wrapper">
    <main class="page" :data-screen-label="screenLabel">
      <header class="page-header">
        <router-link to="/" class="page-brand">floate</router-link>
        <FlButton variant="ghost" @click="goBack">Retour</FlButton>
      </header>

      <section class="page-hero">
        <span class="page-eyebrow">{{ eyebrow }}</span>
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="lead" class="page-lead">{{ lead }}</p>
      </section>

      <slot />
    </main>

    <FlSiteFooter />
  </div>
</template>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
}

.page {
  /* Pousse le footer sous la ligne de flottaison. */
  min-height: 100vh;
  max-width: 760px;
  margin: 0 auto;
  padding: 0 24px 80px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* --- Header --- */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 24px 0 32px;
}

.page-brand {
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-decoration: none;
}
.page-brand:hover { opacity: 0.85; }

/* --- Hero --- */
.page-hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-bottom: 32px;
  margin-bottom: 44px;
  border-bottom: 1px solid var(--border);
}

.page-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.page-title {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  text-wrap: balance;
  margin: 0;
}

.page-lead {
  font-size: 17px;
  color: var(--text-dim);
  max-width: 56ch;
  margin: 0;
  line-height: 1.55;
}

/* --- Sections (styles partagés, accessibles via :deep depuis le slot) --- */
.page :deep(.page-section) {
  margin-bottom: 48px;
}

.page :deep(.page-section:last-child) {
  margin-bottom: 0;
}

.page :deep(.page-section > h2),
.page :deep(.label-upper) {
  font-size: var(--fs-mini);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin: 0 0 var(--space-md) 0;
}

.page :deep(.page-section h3) {
  font-size: 18px;
  font-weight: 600;
  margin: var(--space-lg) 0 var(--space-xs) 0;
  color: var(--text);
}

.page :deep(.page-prose) {
  font-size: 15px;
  line-height: 1.65;
  color: var(--text);
  max-width: 64ch;
}

.page :deep(.page-prose p) {
  margin: 0 0 var(--space-md) 0;
}

.page :deep(.page-prose ul) {
  margin: var(--space-sm) 0 var(--space-md) 0;
  padding-left: 22px;
}

.page :deep(.page-prose li) {
  margin-bottom: 6px;
}

.page :deep(.page-prose a) {
  color: var(--accent);
  text-decoration: none;
}
.page :deep(.page-prose a:hover) {
  text-decoration: underline;
}

.page :deep(.page-meta) {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
  margin-top: var(--space-lg);
}

/* --- Mobile --- */
@media (max-width: 560px) {
  .page { padding: 0 16px 64px; }
  .page-title { font-size: 30px; }
  .page-lead { font-size: 16px; }
}
</style>
