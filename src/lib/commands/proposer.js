/**
 * /proposer <url> [titre libre]
 *
 * Propose un lien à la room. La proposition apparaît mise en évidence
 * dans le chat ; chaque membre peut voter oui ou non. Expire au bout
 * de 10 minutes (cf. PROPOSAL_TTL dans useChat).
 *
 * Cette commande ne fait *que* déclencher `ctx.broadcastProposal()`.
 * Toute la logique d'identifiant, de vote, de ts, vit dans useChat —
 * c'est lui qui sait qui je suis et comment parler au serveur.
 *
 * Validation locale :
 *   - URL parseable + scheme http/https (file:, javascript:, etc. refusés)
 *   - titre optionnel, tronqué à 120 chars
 */
import { Command, registerCommand } from '../commands.js'

const proposerCommand = new Command({
  name: 'proposer',
  description: 'Propose un lien à voter par tout le monde dans la room.',
  usage: '/proposer <url> [titre]',
  run(rawArgs, ctx) {
    const text = String(rawArgs || '').trim()
    if (!text) {
      return {
        ok: false,
        reason: 'missing-args',
        message: 'Usage : /proposer <url> [titre optionnel]'
      }
    }

    const [first, ...rest] = text.split(/\s+/)
    let parsed
    try {
      parsed = new URL(first)
    } catch {
      return { ok: false, reason: 'invalid-url', message: `Lien invalide : ${first}` }
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, reason: 'invalid-url', message: 'Le lien doit commencer par http(s)://' }
    }

    const title = rest.join(' ').trim().slice(0, 120) || null

    if (typeof ctx?.broadcastProposal !== 'function') {
      return { ok: false, reason: 'no-transport', message: 'Impossible d\'envoyer la proposition.' }
    }
    ctx.broadcastProposal({ url: parsed.href, title })
    return { ok: true }
  }
})

registerCommand(proposerCommand)
export default proposerCommand
