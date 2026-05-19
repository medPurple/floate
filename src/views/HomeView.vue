<script setup>
import FlButton from '../components/atoms/FlButton.vue'
</script>

<template>
  <main class="home">
    <section class="card intro">
      <p class="intro-kicker">floate</p>
      <h1 class="intro-title">Le son d'un onglet, à plusieurs, en direct.</h1>
      <p class="intro-lead">
        Tu partages l'audio de ton navigateur avec ton groupe, sans installation.
        Une personne diffuse, les autres écoutent immédiatement.
      </p>
      <RouterLink class="intro-cta" :to="{ name: 'lobby' }">
        <FlButton variant="primary">Entrer dans le lobby</FlButton>
      </RouterLink>
    </section>

    <section class="card steps" aria-labelledby="steps-title">
      <h2 id="steps-title" class="panel-title">Comment ça fonctionne</h2>
      <ol class="steps-list">
        <li>
          <h3>1. Crée ou rejoins une room</h3>
          <p>Choisis un pseudo, puis utilise un code d'invitation ou crée ta room.</p>
        </li>
        <li>
          <h3>2. Lance la diffusion</h3>
          <p>Le host choisit un onglet audio et coche « Partager l'audio de l'onglet ».</p>
        </li>
        <li>
          <h3>3. Écoutez ensemble</h3>
          <p>Les invités entendent le flux en direct et peuvent demander la main.</p>
        </li>
      </ol>
      <p class="steps-note">
        Chrome ou Edge sont nécessaires pour diffuser l'audio d'un onglet.
      </p>
    </section>
  </main>
</template>

<style scoped>
.home {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.intro {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.intro-kicker {
  font-size: var(--fs-mini);
  color: var(--text-faint);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
}

.intro-title {
  font-size: var(--fs-display-sm);
  line-height: 1.15;
  letter-spacing: var(--tracking-tight);
}

.intro-lead {
  max-width: 540px;
  color: var(--text-dim);
}

.intro-cta { text-decoration: none; }

.steps-list {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: var(--space-md);
}

.steps-list h3 {
  margin: 0 0 6px;
  font-size: var(--fs-body-sm);
}

.steps-list p {
  margin: 0;
  color: var(--text-dim);
}

.steps-note {
  margin-top: var(--space-lg);
  color: var(--text-faint);
  font-size: var(--fs-mini);
}

@media (max-width: 480px) {
  .home { padding: var(--space-xl) var(--space-md); }
  .intro-title { font-size: 26px; }
}
</style>
