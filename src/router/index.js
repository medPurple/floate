/**
 * Router floate — hash mode.
 * Choix hash plutôt que history pour éviter toute config serveur (l'app
 * doit pouvoir être servie statiquement, y compris derrière une URL
 * d'invitation copiée-collée).
 *
 *   /         → Lobby (entrée + création de room)
 *   /r/:code  → Room (écoute / diffusion)
 */
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'lobby',
    component: () => import('../views/LobbyView.vue'),
    meta: { title: 'floate' }
  },
  {
    path: '/r/:code',
    name: 'room',
    component: () => import('../views/RoomView.vue'),
    props: true,
    meta: { title: 'Room — floate' }
  },
  {
    path: '/admin/stats',
    name: 'admin-stats',
    component: () => import('../views/AdminStatsView.vue'),
    meta: { title: 'Stats — floate admin' }
  },
  {
    // Fallback : tout chemin inconnu retombe sur le lobby.
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = to.meta.title
})

export default router
