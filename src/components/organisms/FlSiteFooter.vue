<!--
  FlSiteFooter — FOOTER-MONETISATION.md (variante editorial).
  Footer non-invasif : vit sous la ligne de flottaison, jamais sticky,
  jamais sonore, jamais d'animation d'attention.

  Layout editorial (§3 du spec) :
    .footer-cols en grid 1fr auto, align-items: center
      → colonne gauche : wordmark + baseline + bouton café + liens
      → colonne droite : cadre soft (.fl-frame) avec FlAdSlot panel

  Le cadre .fl-frame utilise color-mix sur var(--accent) : dans une
  Room, --accent suit la palette choisie par le host (usePalette), donc
  le cadre s'adapte automatiquement à la couleur de la room. Dans le
  Lobby c'est la palette par défaut (abricot).

  Mock café : push un toast success — à brancher sur Ko-fi / Stripe / etc.
-->
<script setup>
import FlAdSlot from '../atoms/FlAdSlot.vue'
import FlCoffeeIcon from '../atoms/FlCoffeeIcon.vue'
import { useToasts } from '../../composables/useToasts.js'

const { push } = useToasts()

function onCoffee() {
  // À brancher sur la vraie page de don (Stripe Payment Link / Ko-fi).
  push({ kind: 'success', message: 'Merci pour ton soutien.' })
}
</script>

<template>
  <footer class="site-footer" role="contentinfo">
    <div class="footer-inner">
      <div class="footer-cols">
        <div class="footer-text">
          <span class="footer-brand">floate</span>
          <p class="footer-baseline">
            floate est gratuit, sans compte et sans pub intrusive.
            Si tu veux qu'on continue, offre-nous un café.
          </p>

          <div class="footer-actions">
            <button
              type="button"
              class="coffee-btn"
              @click="onCoffee"
            >
              <FlCoffeeIcon :size="16" />
              <span>Offrir un café</span>
            </button>

            <nav class="footer-links" aria-label="Liens du pied de page">
              <a href="#/infos" class="footer-link">Infos &amp; conditions</a>
              <span class="footer-sep" aria-hidden="true">·</span>
              <a href="#/contact" class="footer-link">Contact</a>
            </nav>
          </div>
        </div>

        <div class="footer-slot">
          <div class="fl-frame">
            <FlAdSlot kind="panel" />
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--border);
  background: var(--bg-elev);
  /* margin-top: auto pousse le footer en bas quand le parent est en
     flex column avec min-height: 100vh (cas Lobby + Room). */
  margin-top: auto;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 28px 28px;
}

.footer-cols {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-2xl);
}

/* --- Colonne gauche (texte + actions) --- */
.footer-text {
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.footer-brand {
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.footer-baseline {
  color: var(--text-dim);
  font-size: var(--fs-body-sm);
  line-height: 1.55;
  margin: 0;
}

.footer-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-xs);
}

/* --- Bouton café (pas .btn-primary : affordance secondaire) --- */
.coffee-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  color: var(--accent-strong);
  border-radius: var(--radius-pill);
  font-size: var(--fs-mini);
  font-weight: 600;
  transition: background var(--duration-fast) var(--easing-default),
              color var(--duration-fast) var(--easing-default);
}
.coffee-btn:hover {
  background: var(--accent);
  color: var(--text-on-accent);
}

/* --- Liens institutionnels --- */
.footer-links {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-mini);
  color: var(--text-dim);
}

.footer-link {
  color: var(--text-dim);
  text-decoration: none;
  transition: color var(--duration-fast) var(--easing-default);
}
.footer-link:hover { color: var(--accent-strong); }

.footer-sep { color: var(--text-faint); }

/* --- Colonne droite (cadre + slot) --- */
.footer-slot {
  display: flex;
  justify-content: flex-end;
}

/* Cadre "boîte de dialogue" doux — double liseré accent.
   color-mix sur var(--accent) suit automatiquement la palette de la
   room. Sans room (Lobby), c'est la palette par défaut. */
.fl-frame {
  display: inline-block;
  padding: 8px;
  border-radius: 18px;
  background: var(--bg-elev-2);
  border: 2px solid color-mix(in srgb, var(--accent) 38%, var(--border));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--accent) 14%, transparent),
    0 4px 16px rgba(0, 0, 0, 0.18);
  transition: border-color var(--duration-default) var(--easing-default),
              box-shadow var(--duration-default) var(--easing-default);
}

/* --- Mobile : 1 colonne, cadre en pleine largeur --- */
@media (max-width: 760px) {
  .footer-inner {
    padding: 20px 16px 24px;
  }
  .footer-cols {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
  .footer-slot {
    justify-content: center;
  }
  .fl-frame {
    display: block;
    max-width: 360px;
    margin: 0 auto;
  }
}
</style>
