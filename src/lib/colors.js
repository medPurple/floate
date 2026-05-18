/**
 * Couleur déterministe pour un pseudo (avatar listener).
 * Voir DESIGN-SYSTEM.md §2.1 — saturation 38%, lightness 52%
 * pour rester cohérent avec la palette.
 *
 * L'hôte ne passe jamais par ici : sa couleur est --accent.
 */
export function colorOf(pseudo) {
  if (!pseudo) return 'hsl(0, 0%, 40%)'
  let h = 0
  for (let i = 0; i < pseudo.length; i++) {
    h = (h * 31 + pseudo.charCodeAt(i)) | 0
  }
  return `hsl(${Math.abs(h) % 360}, 38%, 52%)`
}

/**
 * Initiale d'un pseudo, normalisée majuscule.
 * Gère les caractères accentués et les chaînes vides.
 */
export function initialOf(pseudo) {
  if (!pseudo) return '?'
  return pseudo.trim().charAt(0).toUpperCase() || '?'
}
