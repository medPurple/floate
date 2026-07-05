<!--
  InfosView — INFOS-CONDITIONS.md
  Page institutionnelle « est-ce que je peux faire confiance à floate ? »
  Fonctionnement, confidentialité, conditions, mentions légales.

  4 sections dans cet ordre — du concret rassurant vers le formel.
  Contenu volontairement concis : le juridique sera repassé par un
  juriste avant prod (cf. avertissement final).
-->
<script setup>
import FlPageShell from '../components/molecules/FlPageShell.vue'
</script>

<template>
  <FlPageShell
    eyebrow="Infos & conditions"
    title="Tout savoir sur floate"
    lead="Le son d'un onglet, à plusieurs, en direct — voici comment ça marche
          et ce qui se passe avec ton son et tes données."
    screen-label="Infos"
  >
    <!-- §4.1 Comment ça marche -->
    <section class="page-section">
      <h2>Comment ça marche</h2>
      <div class="page-prose">
        <h3>Diffusion directe navigateur-à-navigateur</h3>
        <p>
          floate capture l'audio d'un onglet de ton navigateur et l'envoie
          directement aux autres participants en pair-à-pair (WebRTC).
          Aucun fichier n'est hébergé : on ne fait que mettre les
          navigateurs en relation.
        </p>

        <h3>Sans compte, par invitation</h3>
        <p>
          Pas d'inscription, pas d'email, pas de mot de passe. Tu crées
          une room, tu partages le code ou le lien, et c'est parti.
          Pseudo simple, jusqu'à <strong>8 personnes en simultané</strong>.
        </p>

        <h3>Toi seul lances le son</h3>
        <p>
          Seul l'hôte diffuse à un instant donné. Les auditeurs écoutent
          en synchro et réagissent dans le chat (dédicaces éphémères).
          Quand l'hôte quitte, la diffusion s'arrête.
        </p>
      </div>
    </section>

    <!-- §4.1bis Compatibilité navigateur -->
    <section class="page-section">
      <h2>Compatibilité navigateur</h2>
      <div class="page-prose">
        <h3>Navigateurs compatibles</h3>
        <p>
          La diffusion audio d'onglet repose sur une fonctionnalité que
          seuls les navigateurs basés sur Chromium supportent pleinement :
        </p>
        <ul>
          <li>Google Chrome (desktop)</li>
          <li>Microsoft Edge (desktop)</li>
          <li>Brave, Opera, et autres navigateurs basés Chromium (desktop)</li>
        </ul>

        <h3>Firefox et Safari</h3>
        <p>
          Firefox et Safari ne transmettent jamais le son d'un onglet,
          d'une fenêtre ou de l'écran partagé — c'est une limitation de
          ces navigateurs, pas de floate (bugs ouverts depuis plusieurs
          années côté Mozilla et WebKit). Si tu es hôte sur l'un de ces
          navigateurs, floate t'en informe avant même d'ouvrir le partage.
        </p>
        <p>
          Deux solutions si tu ne peux pas changer de navigateur :
        </p>
        <ul>
          <li>Écoute en tant qu'auditeur : ça fonctionne partout, seule la diffusion (côté hôte) est concernée.</li>
          <li>
            Installe un câble audio virtuel, qui fait apparaître le son
            de ton ordinateur comme un micro que floate peut capter via
            <code>getUserMedia</code> :
            <ul>
              <li><strong>macOS</strong> : BlackHole (gratuit, open source)</li>
              <li><strong>Windows</strong> : VB-Audio Virtual Cable, ou VoiceMeeter</li>
              <li><strong>Linux</strong> : module-loopback via pavucontrol (PulseAudio/PipeWire)</li>
            </ul>
          </li>
        </ul>
      </div>
    </section>

    <!-- §4.2 Confidentialité -->
    <section class="page-section">
      <h2>Confidentialité</h2>
      <div class="page-prose">
        <p>
          floate est conçu pour en demander le moins possible. Concrètement :
        </p>
        <ul>
          <li>Pas de compte, donc pas d'email ni de mot de passe stockés.</li>
          <li>Le pseudo est éphémère : il vit le temps de la session.</li>
          <li>
            L'audio circule en P2P : il n'est ni enregistré, ni stocké,
            ni réécouté côté serveur.
          </li>
          <li>
            Des statistiques d'usage <strong>agrégées et anonymes</strong>
            uniquement (nombre de rooms actives, durées moyennes). Jamais
            de donnée nominative.
          </li>
        </ul>
        <p>
          Question sur tes données ?
          <router-link to="/contact">Écris-nous</router-link>.
        </p>
      </div>
    </section>

    <!-- §4.3 Conditions d'utilisation -->
    <section class="page-section">
      <h2>Conditions d'utilisation</h2>
      <div class="page-prose">
        <p>
          floate est un outil pour écouter ensemble entre proches.
          En l'utilisant tu acceptes ce cadre :
        </p>
        <ul>
          <li>
            Tu respectes le droit d'auteur des contenus que tu diffuses.
            Diffuse ce que tu as le droit de partager.
          </li>
          <li>
            Pas de harcèlement, pas de contenu illicite dans les rooms
            ni dans le chat — modération côté hôte, mais on coupe en
            cas d'abus signalé.
          </li>
          <li>
            Le service est fourni « tel quel », sans garantie de
            disponibilité ou de qualité de réception (qui dépend de
            ta connexion).
          </li>
        </ul>
      </div>
    </section>

    <!-- §4.4 Mentions légales -->
    <section class="page-section">
      <h2>Mentions légales</h2>
      <div class="page-prose">
        <p>
          Éditeur et hébergement disponibles sur demande via la
          <router-link to="/contact">page Contact</router-link>.
        </p>
        <p class="page-meta">
          Dernière mise à jour : 2026-06-10 · version v0.5
        </p>
      </div>
    </section>
  </FlPageShell>
</template>
