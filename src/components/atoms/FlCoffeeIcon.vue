<!--
  FlCoffeeIcon — pictogramme monoline pour le bouton "Offrir un café"
  du footer (FOOTER-MONETISATION.md §7). Pas un emoji : un SVG stroke
  qui hérite de currentColor pour s'aligner sur la couleur du bouton
  (qui passe accent-strong → text-on-accent au hover).
-->
<script setup>
defineProps({
  size: { type: Number, default: 16 }
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Tasse -->
    <path d="M4 10h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z" />
    <!-- Anse -->
    <path d="M16 11h2a3 3 0 0 1 0 6h-2" />
    <!-- Vapeur -->
    <path d="M7 3c0 1.2 1 1.6 1 3M11 3c0 1.2 1 1.6 1 3" />
  </svg>
</template>
