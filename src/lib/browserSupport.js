/**
 * Firefox et Safari implémentent getDisplayMedia() mais ignorent la
 * piste audio quelle que soit la surface partagée (onglet, fenêtre,
 * écran) — cf. bug Mozilla 1541425 et WebKit 186294, toujours ouverts.
 * On sniffe l'UA pour prévenir l'utilisateur avant le picker plutôt
 * que de le laisser partager pour rien.
 */
export function detectBrowser() {
  const ua = navigator.userAgent
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg\//.test(ua)) return 'safari'
  return 'other'
}

export function supportsTabAudioCapture() {
  return detectBrowser() === 'other'
}
