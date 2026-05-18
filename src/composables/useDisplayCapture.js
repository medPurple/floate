/**
 * useDisplayCapture — capture l'audio d'un onglet via getDisplayMedia.
 *
 * Chrome force à demander video+audio (on ne peut pas demander audio seul
 * via getDisplayMedia). On garde donc la vidéo dans le stream pour
 * détecter le 'ended' (quand l'utilisateur clique "Arrêter le partage"
 * dans la bannière Chrome). On NE transmet PAS la vidéo aux peers —
 * c'est useRoomConnection qui décide quoi pousser.
 *
 * Cas d'erreur les plus fréquents :
 *  - 'no-audio-track' : l'utilisateur a oublié de cocher "Partager
 *    l'audio de l'onglet" dans la modale Chrome. C'est l'erreur la plus
 *    fréquente, le DS §5.2 a un stepper preventive prévu pour ça.
 *  - 'NotAllowedError' : l'utilisateur a refusé le partage.
 *  - 'NotSupportedError' : navigateur non compatible (Safari, Firefox
 *    desktop ne supporte pas audio dans getDisplayMedia).
 */
import { ref, onBeforeUnmount } from 'vue'

export function useDisplayCapture() {
  const stream = ref(null)
  const audioStream = ref(null)
  const error = ref(null)
  const capturing = ref(false)

  async function capture() {
    error.value = null
    if (!navigator.mediaDevices?.getDisplayMedia) {
      const err = new Error('not-supported')
      err.code = 'not-supported'
      error.value = err
      throw err
    }

    capturing.value = true
    try {
      // On désactive les traitements "voice call" que Chrome applique
      // par défaut sur les tracks audio (ils dégradent la musique) et
      // on demande explicitement 48kHz stéréo.
      const s = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2,
          sampleSize: 16
        }
      })

      const audioTracks = s.getAudioTracks()
      if (audioTracks.length === 0) {
        // L'utilisateur a oublié la case audio — on coupe tout.
        s.getTracks().forEach(t => t.stop())
        const err = new Error('no-audio-track')
        err.code = 'no-audio-track'
        error.value = err
        throw err
      }

      stream.value = s
      // Stream uniquement audio, à pousser aux peers.
      audioStream.value = new MediaStream(audioTracks)

      // L'utilisateur peut arrêter le partage via la bannière Chrome.
      const vTrack = s.getVideoTracks()[0]
      if (vTrack) {
        vTrack.addEventListener('ended', () => stop())
      }
      // Si l'audio track est coupée (rare), on stoppe aussi.
      audioTracks[0].addEventListener('ended', () => stop())

      return audioStream.value
    } catch (e) {
      if (!error.value) error.value = e
      throw e
    } finally {
      capturing.value = false
    }
  }

  function stop() {
    try { stream.value?.getTracks().forEach(t => t.stop()) } catch { /* */ }
    stream.value = null
    audioStream.value = null
  }

  onBeforeUnmount(stop)

  return { stream, audioStream, error, capturing, capture, stop }
}
