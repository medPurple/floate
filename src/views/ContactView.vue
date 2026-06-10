<!--
  ContactView — CONTACT.md
  Le seul canal entrant pour bug / idée / question RGPD / hello.
  Form 4 champs (nom + email + sujet + message), validation native HTML.
  Mock submit : on cache le form, on affiche une success card inline.

  À brancher en prod sur mailto:, Formspree ou une API + anti-spam
  (honeypot ou captcha invisible). Cf. §5 et §11 du spec.
-->
<script setup>
import { ref, nextTick } from 'vue'
import FlPageShell from '../components/molecules/FlPageShell.vue'
import FlButton from '../components/atoms/FlButton.vue'

const formRef = ref(null)
const submitted = ref(false)

const form = ref({
  name: '',
  email: '',
  subject: 'bug',
  message: ''
})

const subjectOptions = [
  { value: 'bug',     label: 'Signaler un bug' },
  { value: 'idea',    label: 'Suggérer une idée' },
  { value: 'data',    label: 'Question sur mes données' },
  { value: 'other',   label: 'Autre' }
]

function subjectLabel(value) {
  return subjectOptions.find(o => o.value === value)?.label || value
}

async function onSubmit() {
  if (!formRef.value) return
  // Validation native HTML : reportValidity affiche les bulles d'erreur.
  if (!formRef.value.checkValidity()) {
    formRef.value.reportValidity()
    return
  }
  // Mock : pas d'envoi réseau, on passe directement en état succès.
  submitted.value = true
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <FlPageShell
    eyebrow="Contact"
    title="Une question, un bug, une idée ?"
    lead="Écris-nous. On lit tout et on répond sous deux jours en général."
    screen-label="Contact"
  >
    <!-- Succès (mock) : remplace le formulaire dans le flux -->
    <section v-if="submitted" id="success" class="form-success" aria-live="polite">
      <div class="success-row">
        <span class="success-check" aria-hidden="true">✓</span>
        <div>
          <h2 class="success-title">Message envoyé.</h2>
          <p class="success-text">
            Merci {{ form.name || 'à toi' }} — on revient vers toi à
            <strong>{{ form.email }}</strong> au plus vite, sujet
            « {{ subjectLabel(form.subject) }} ».
          </p>
        </div>
      </div>
    </section>

    <!-- Formulaire -->
    <section v-else class="page-section">
      <form
        id="contact-form"
        ref="formRef"
        class="contact-grid"
        novalidate
        @submit.prevent="onSubmit"
      >
        <div class="contact-row">
          <div class="field">
            <label for="contact-name">Ton nom ou pseudo</label>
            <input
              id="contact-name"
              v-model="form.name"
              class="input"
              type="text"
              required
              autocomplete="nickname"
              maxlength="60"
            />
          </div>

          <div class="field">
            <label for="contact-email">Ton email</label>
            <input
              id="contact-email"
              v-model="form.email"
              class="input"
              type="email"
              required
              autocomplete="email"
              maxlength="120"
            />
          </div>
        </div>

        <div class="field">
          <label for="contact-subject">Sujet</label>
          <select
            id="contact-subject"
            v-model="form.subject"
            class="input"
            required
          >
            <option
              v-for="opt in subjectOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="contact-message">Ton message</label>
          <textarea
            id="contact-message"
            v-model="form.message"
            class="input textarea"
            required
            maxlength="2000"
            placeholder="Dis-nous tout — le contexte, ce que tu as vu, ce à quoi tu t'attendais…"
          />
        </div>

        <div class="form-actions">
          <FlButton variant="primary" type="submit">
            Envoyer le message
          </FlButton>
          <p class="form-note">On répond généralement sous 48 h.</p>
        </div>
      </form>
    </section>

    <!-- Canaux alternatifs : email direct + confidentialité -->
    <aside class="contact-aside">
      <article class="contact-channel">
        <h3>Email direct</h3>
        <p>
          <a href="mailto:bonjour@floate.app">bonjour@floate.app</a>
        </p>
      </article>
      <article class="contact-channel">
        <h3>Confidentialité</h3>
        <p>
          Avant d'écrire pour une question RGPD, vois la
          <router-link to="/infos">page Infos &amp; conditions</router-link>.
        </p>
      </article>
    </aside>
  </FlPageShell>
</template>

<style scoped>
/* --- Form layout --- */
.contact-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.contact-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: var(--fs-mini);
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

/* --- Inputs / select / textarea --- */
.input {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: var(--fs-body);
  font-family: inherit;
  color: var(--text);
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  transition: border-color var(--duration-fast) var(--easing-default),
              box-shadow var(--duration-fast) var(--easing-default);
}
.input::placeholder { color: var(--text-faint); }
.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

/* Select : chevron SVG en data-URI, couleur encodée --text-dim.
   À repasser en currentColor si le select devient un composant
   réutilisable. */
select.input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 36px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' fill='none' stroke='%2392899F' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat: no-repeat;
  background-position: right 14px center;
  cursor: pointer;
}

.textarea {
  min-height: 140px;
  resize: vertical;
  line-height: 1.5;
}

/* --- Actions --- */
.form-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-top: var(--space-xs);
}

.form-note {
  font-size: var(--fs-mini);
  color: var(--text-faint);
  margin: 0;
}

/* --- Success state --- */
.form-success {
  background: color-mix(in srgb, var(--good) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--good) 45%, transparent);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  margin-bottom: 48px;
}

.success-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.success-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--good);
  color: #0E1A14;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.success-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text);
}

.success-text {
  font-size: 15px;
  color: var(--text-dim);
  margin: 0;
  line-height: 1.5;
}

/* --- Aside : canaux alternatifs --- */
.contact-aside {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.contact-channel {
  flex: 1 1 200px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 16px 18px;
}

.contact-channel h3 {
  font-size: var(--fs-mini);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin: 0 0 8px 0;
}

.contact-channel p {
  font-size: 15px;
  color: var(--text);
  margin: 0;
  line-height: 1.5;
}

.contact-channel a {
  color: var(--accent);
  text-decoration: none;
}
.contact-channel a:hover { text-decoration: underline; }

/* --- Mobile --- */
@media (max-width: 560px) {
  .contact-row {
    grid-template-columns: 1fr;
  }
}
</style>
