import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import { useTheme } from './composables/useTheme.js'

// Initialise le thème dès le démarrage (lit localStorage + applique
// data-theme="auto|dark|light" sur <html> avant que les vues montent).
useTheme()

createApp(App).use(router).mount('#app')
