/**
 * Config runtime — lue depuis les variables d'env Vite (préfixe VITE_).
 * Surcharge via .env.local en dev, .env de prod sur le déploiement.
 */
export const SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:8787'

// Dérive l'URL HTTP du serveur d'admin depuis la WS (même host, http(s) au
// lieu de ws(s)). En prod tu peux la surcharger via VITE_ADMIN_HTTP_URL.
function deriveAdminHttp() {
  if (import.meta.env.VITE_ADMIN_HTTP_URL) return import.meta.env.VITE_ADMIN_HTTP_URL
  const u = new URL(SIGNALING_URL)
  u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:'
  return u.origin
}

export const ADMIN_HTTP_URL = deriveAdminHttp()

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]
