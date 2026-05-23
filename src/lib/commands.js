/**
 * Commandes slash (« /xxx ») pour le chat de la room.
 *
 * On reste volontairement frugal : pas de système d'argparse fancy, pas
 * de DI géante. Une commande déclare son nom, sa description, son usage,
 * et une fonction `run(rawArgs, ctx)` que `useChat` appelle quand
 * l'utilisateur tape « /nom … ». Le `ctx` est fourni par le composable
 * appelant (typiquement `useChat`) — la commande ne sait rien du
 * transport WebRTC/WS, juste qu'elle a une API « broadcastProposal »,
 * « addLocalMessage », etc.
 *
 * Conventions :
 *   - Le nom de la commande est en minuscules, sans le slash.
 *   - `run` peut être async. Retourne :
 *       { ok: true }
 *       { ok: false, reason: 'missing-args' | 'invalid-url' | ..., message }
 *     `useChat` lit `message` pour produire un toast d'erreur.
 *   - Une commande peut s'auto-enregistrer à l'import (cf. proposer.js).
 *
 * Pour ajouter une commande : créer un fichier dans `src/lib/commands/`,
 * `new Command({ ... })`, `registerCommand(cmd)`, puis l'importer
 * (côté useChat) pour qu'elle soit présente dans le registry.
 */

export class Command {
  constructor({ name, description, usage, run }) {
    if (!name || typeof name !== 'string') {
      throw new Error('Command: name requis')
    }
    if (typeof run !== 'function') {
      throw new Error(`Command(${name}): run requis`)
    }
    this.name = name.toLowerCase()
    this.description = description || ''
    this.usage = usage || `/${this.name}`
    this.run = run
  }
}

/** @type {Map<string, Command>} */
const registry = new Map()

export function registerCommand(cmd) {
  if (!(cmd instanceof Command)) {
    throw new Error('registerCommand: doit recevoir une instance de Command')
  }
  registry.set(cmd.name, cmd)
}

export function getCommand(name) {
  return registry.get(String(name || '').toLowerCase()) || null
}

export function listCommands() {
  return Array.from(registry.values())
}

/**
 * Sépare « /nom arg1 arg2… » en { name, rawArgs }.
 * Retourne null si ce n'est pas une commande.
 */
export function parseCommand(text) {
  const s = String(text || '')
  if (!s.startsWith('/')) return null
  const trimmed = s.slice(1).trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(\S+)\s*(.*)$/s)
  if (!match) return null
  return {
    name: match[1].toLowerCase(),
    rawArgs: match[2] || ''
  }
}

/**
 * Pipeline complet : parse → lookup → exécute. Si ce n'est pas une
 * commande, retourne null (l'appelant traite alors comme un message
 * texte normal).
 */
export async function executeCommand(text, ctx) {
  const parsed = parseCommand(text)
  if (!parsed) return null
  const cmd = registry.get(parsed.name)
  if (!cmd) {
    return {
      ok: false,
      reason: 'unknown-command',
      message: `Commande inconnue : /${parsed.name}`
    }
  }
  try {
    const result = await cmd.run(parsed.rawArgs, ctx || {})
    return result ?? { ok: true }
  } catch (err) {
    return {
      ok: false,
      reason: 'execution-failed',
      message: err?.message || 'Commande échouée.'
    }
  }
}
