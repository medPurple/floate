/**
 * Génération et normalisation des codes d'invitation floate.
 * Format : 3 caractères + tiret + 3 caractères, ex : AKZ-394.
 * Caractères choisis pour limiter les confusions (pas de 0/O, I/1).
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function pickChar() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
}

export function newCode() {
  const block = () => `${pickChar()}${pickChar()}${pickChar()}`
  return `${block()}-${block()}`
}

/**
 * Normalise une saisie utilisateur : uppercase, retire les espaces,
 * insère le tiret si manquant. Retourne null si la chaîne n'est pas
 * exploitable (moins de 6 caractères alphanumériques).
 */
export function normalizeCode(raw) {
  if (!raw) return null
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.length < 6) return null
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`
}
