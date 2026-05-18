/**
 * useMediaDevices — liste des sorties audio (audiooutput) du système.
 *
 * Pourquoi `unlockLabels()` ?
 *  enumerateDevices() ne livre les labels (et parfois ne révèle même
 *  pas les devices) qu'après qu'une permission micro ou caméra ait été
 *  accordée. C'est une protection anti-fingerprinting des navigateurs.
 *  → On demande une permission micro éphémère, on coupe le stream
 *    immédiatement, et on refait enumerateDevices(). Une fois unlocked,
 *    la permission reste valable pour la session (selon le navigateur).
 *
 * Caveats :
 *  - On NE branche PAS setSinkId ici. C'est l'élément <audio> de la
 *    room qui appellera audioEl.setSinkId(selectedId) à terme.
 *  - setSinkId n'est pas supporté sur Firefox ni Safari iOS.
 *  - Choix persisté en localStorage sous 'floate.audio-output'.
 *  - Les périphériques Bluetooth/USB apparaissent dans la liste comme
 *    n'importe quel audiooutput dès qu'ils sont reconnus par l'OS.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const STORAGE_KEY = 'floate.audio-output'

export function useMediaDevices() {
  const outputs = ref([])           // [{ deviceId, label, hasRealLabel }]
  const selectedId = ref(null)
  const supported = ref(true)
  const labelsUnlocked = ref(false) // au moins un label réel détecté
  const unlocking = ref(false)
  const error = ref(null)

  // Si aucun device n'a de label réel, on n'a pas encore la permission.
  const needsUnlock = computed(() =>
    outputs.value.length === 0 || !labelsUnlocked.value
  )

  async function refresh() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      supported.value = false
      return
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const list = devices.filter(d => d.kind === 'audiooutput')
      labelsUnlocked.value = list.some(d => !!d.label)
      outputs.value = list.map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Sortie ${i + 1}`,
        hasRealLabel: !!d.label
      }))

      // Restaure le choix mémorisé si l'appareil est encore là.
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && outputs.value.some(o => o.deviceId === stored)) {
        selectedId.value = stored
      } else if (outputs.value.length && !selectedId.value) {
        selectedId.value = outputs.value[0].deviceId
      }
    } catch (e) {
      error.value = e
    }
  }

  /**
   * Déverrouille les labels en demandant une permission micro éphémère.
   * Stoppe le stream immédiatement — on ne s'en sert pas, on voulait juste
   * la permission pour que enumerateDevices livre les vrais labels.
   */
  async function unlockLabels() {
    if (unlocking.value) return
    unlocking.value = true
    error.value = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      await refresh()
    } catch (e) {
      error.value = e
    } finally {
      unlocking.value = false
    }
  }

  function select(id) {
    selectedId.value = id
    try { localStorage.setItem(STORAGE_KEY, id) } catch { /* quota */ }
  }

  function onChange() { refresh() }

  onMounted(() => {
    refresh()
    navigator.mediaDevices?.addEventListener?.('devicechange', onChange)
  })

  onBeforeUnmount(() => {
    navigator.mediaDevices?.removeEventListener?.('devicechange', onChange)
  })

  return {
    outputs,
    selectedId,
    supported,
    error,
    labelsUnlocked,
    needsUnlock,
    unlocking,
    select,
    refresh,
    unlockLabels
  }
}
