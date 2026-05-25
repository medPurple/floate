/**
 * banwords — liste de mots/patterns interdits dans le chat dédicaces.
 *
 * Front-only pour le MVP. Un client modifié peut contourner le filtre :
 * si l'app prend du volume, déplacer la même logique côté serveur dans
 * server/index.js (handler `chat-message`).
 *
 * Comment éditer :
 *   - BANWORDS : mots simples, matching insensible à la casse + word
 *     boundaries (\b). Exemple : "merde" matchera "Merde" et "MERDE",
 *     mais pas "merdier" (entouré par d'autres lettres → pas un bord).
 *   - BAN_PATTERNS : RegExp pour variantes l33t, espacement bizarre,
 *     contournements (« f.u.c.k », « m€rde »…). Utilise toujours le
 *     flag `i` dans la regex.
 *
 * Quand un message matche, useChat.submit refuse l'envoi, déclenche
 * le cooldown 2s (anti-spam testing), et renvoie un toast neutre
 * (« Message refusé. ») sans répéter le mot fautif.
 */

/** Mots simples — matching mot entier, insensible à la casse. */
export const BANWORDS = [
  // À compléter selon les règles de modération de l'instance.
  // Garde la liste courte et ciblée : slurs, contenu illégal, harcèlement.
]

/** Patterns regex — pour variantes contournées (l33t, ponctuation, etc.). */
export const BAN_PATTERNS = [
  // Exemples (commentés) :
  //   /f[\W_]*u[\W_]*c[\W_]*k/i      → fuck, f.u.c.k, f-u-c-k
  //   /n[i1!|][g6][g6]/i             → variantes l33t
]

// --- Implémentation -------------------------------------------------------

// Échappe les méta-caractères regex pour les BANWORDS simples.
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Regex unifiée (mémoïsée). Combine BANWORDS (avec \b) + BAN_PATTERNS.
let cachedRegex
let cachedRegexBuilt = false

function buildRegex() {
  if (cachedRegexBuilt) return cachedRegex
  cachedRegexBuilt = true
  const parts = []
  if (BANWORDS.length) {
    const escaped = BANWORDS.map(escapeRegex).filter(Boolean)
    if (escaped.length) parts.push(`\\b(?:${escaped.join('|')})\\b`)
  }
  for (const p of BAN_PATTERNS) {
    if (p instanceof RegExp) parts.push(p.source)
  }
  cachedRegex = parts.length ? new RegExp(parts.join('|'), 'i') : null
  return cachedRegex
}

/**
 * Renvoie true si le texte contient au moins un banword ou un pattern.
 * Vide / null / undefined → false.
 */
export function containsBanword(text) {
  const re = buildRegex()
  if (!re) return false
  return re.test(String(text || ''))
}

/**
 * Pour les tests : reset le cache si on modifie BANWORDS/BAN_PATTERNS
 * à chaud (mutation depuis l'extérieur — pas le cas en prod).
 */
export function _resetBanwordsCache() {
  cachedRegex = undefined
  cachedRegexBuilt = false
}
