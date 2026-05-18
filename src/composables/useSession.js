/**
 * useSession — identité de l'utilisateur pour la durée de l'onglet.
 *
 * peerId : UUID stable persisté en sessionStorage. Survit au reload mais
 *          pas à la fermeture de l'onglet (ce qui est désiré : un nouveau
 *          onglet = un nouveau peer dans la room).
 * pseudo : le pseudo choisi dans le Lobby. Idem sessionStorage.
 *
 * Module-level state : un singleton suffit, on n'a pas plusieurs identités
 * par onglet.
 */
import { ref } from 'vue'

const STORAGE_PEER = 'floate.peerId'
const STORAGE_PSEUDO = 'floate.pseudo'

function readPeerId() {
  try {
    let id = sessionStorage.getItem(STORAGE_PEER)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(STORAGE_PEER, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

function readPseudo() {
  try { return sessionStorage.getItem(STORAGE_PSEUDO) || '' } catch { return '' }
}

const peerId = ref(readPeerId())
const pseudo = ref(readPseudo())

export function useSession() {
  function setPseudo(p) {
    const trimmed = String(p || '').trim().slice(0, 32)
    pseudo.value = trimmed
    try { sessionStorage.setItem(STORAGE_PSEUDO, trimmed) } catch { /* quota */ }
  }

  function clear() {
    pseudo.value = ''
    try {
      sessionStorage.removeItem(STORAGE_PSEUDO)
      sessionStorage.removeItem(STORAGE_PEER)
    } catch { /* */ }
    peerId.value = readPeerId()
  }

  return { peerId, pseudo, setPseudo, clear }
}
