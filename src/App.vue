<!--
  Coquille routée. Les vues vivent dans src/views/.
  Le ToastStack est monté à la racine pour être disponible partout.
-->
<script setup>
import FlToastStack from './components/atoms/FlToastStack.vue'
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fl-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <FlToastStack />
</template>

<style>
.fl-fade-enter-active,
.fl-fade-leave-active {
  transition: opacity var(--duration-default) var(--easing-default);
}
.fl-fade-enter-from,
.fl-fade-leave-to { opacity: 0; }
</style>
