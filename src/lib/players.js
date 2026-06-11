/**
 * players — styles de lecteur audio affichés sur le stage.
 *
 * Le host choisit un appareil parmi 3 (vinyle, CD, digital), c'est la
 * room qui le porte (persisté serveur, broadcasté à tous les peers).
 * En v0.5, les 3 composants sont des PLACEHOLDERS — on attend les
 * vraies illustrations SVG dessinées à la main pour les remplir.
 *
 * Chaque player connaît 4 états (cf. atoms/FlPlayer*) :
 *   - 'off'      éteint, le host n'a pas démarré
 *   - 'standby'  démarré mais pas de son (pause host)
 *   - 'playing'  diffusion en cours
 *   - 'offline'  pas de réseau / signal perdu (équivalent FlStreamPaused)
 */

const RAW_PLAYERS = [
  {
    id: 'vinyl',
    label: 'Vinyle',
    description: 'Le disque qui tourne. Chaleureux, contemplatif.'
  },
  {
    id: 'cd',
    label: 'CD',
    description: 'L\'irrisé argenté. Sobre, années 2000.'
  },
  {
    id: 'digital',
    label: 'Digital',
    description: 'L\'écran portable. Compact, moderne.'
  }
]

export const PLAYERS = RAW_PLAYERS

export const PLAYERS_BY_ID = Object.fromEntries(
  PLAYERS.map(p => [p.id, p])
)

export const DEFAULT_PLAYER_ID = 'vinyl'

/** États possibles d'un lecteur (validateur partagé). */
export const PLAYER_STATES = ['off', 'standby', 'playing', 'offline']

export function isPlayerState(state) {
  return typeof state === 'string' && PLAYER_STATES.includes(state)
}

export function getPlayer(id) {
  if (!id) return null
  return PLAYERS_BY_ID[id] || null
}

export function isPlayerId(id) {
  return typeof id === 'string' && id in PLAYERS_BY_ID
}
