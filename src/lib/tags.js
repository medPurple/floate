/**
 * tags — étiquettes de genre musical d'une room (chill, electro, jazz…).
 *
 * Un seul tag par room, optionnel. C'est le host qui le pose via
 * FlRoomNameDialog ; l'autorité = serveur (room._tag), broadcasté à
 * tous via 'room-tag-changed'.
 *
 * Affichage : juste le mot, dans sa couleur. Pas de badge / fond
 * (voir DESIGN-SYSTEM.md §4.2 — header reste léger).
 *
 * Les couleurs sont choisies pour rester lisibles à la fois sur le
 * fond sombre (#15131A) et sur le fond crème (#FAF3EA) — luminosité
 * moyenne, saturation modérée.
 */

const RAW_TAGS = [
  { id: 'chill',     label: 'chill',     color: '#B595DB' }, // lavande
  { id: 'electro',   label: 'electro',   color: '#5FAEC1' }, // cyan
  { id: 'jazz',      label: 'jazz',      color: '#C28F3E' }, // ambré
  { id: 'hip-hop',   label: 'hip-hop',   color: '#D85A3A' }, // orange brûlé
  { id: 'rock',      label: 'rock',      color: '#C44A6A' }, // cramoisi
  { id: 'pop',       label: 'pop',       color: '#DB718C' }, // rose
  { id: 'lo-fi',     label: 'lo-fi',     color: '#9C8268' }, // taupe
  { id: 'classique', label: 'classique', color: '#6B92C8' }, // bleu doux
  { id: 'soul',      label: 'soul',      color: '#C9962F' }, // doré
  { id: 'reggae',    label: 'reggae',    color: '#5FA371' }, // vert
  { id: 'house',     label: 'house',     color: '#BE6FB1' }, // magenta
  { id: 'metal',     label: 'métal',     color: '#7B8089' }  // acier
]

export const ROOM_TAGS = RAW_TAGS

export const ROOM_TAGS_BY_ID = Object.fromEntries(
  ROOM_TAGS.map(t => [t.id, t])
)

/** Retourne le tag complet pour un id, ou null si inconnu / null. */
export function getTag(id) {
  if (!id) return null
  return ROOM_TAGS_BY_ID[id] || null
}

/** Vrai ssi l'id correspond à un tag valide. */
export function isTagId(id) {
  return typeof id === 'string' && id in ROOM_TAGS_BY_ID
}
