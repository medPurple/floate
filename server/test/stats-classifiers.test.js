/**
 * Tests des fonctions de classification stats (pures).
 * Pas de réseau, pas de fichier — uniquement la logique.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyListenSource,
  classifyTrafficSource,
  extractCountryCode
} from '../stats.js'

// --- classifyListenSource -----------------------------------------------

test('classifyListenSource : YouTube (www + youtu.be)', () => {
  assert.equal(classifyListenSource('https://www.youtube.com/watch?v=abc'), 'YouTube')
  assert.equal(classifyListenSource('https://youtu.be/abc'),                 'YouTube')
  assert.equal(classifyListenSource('https://music.youtube.com/playlist'),   'YouTube')
})

test('classifyListenSource : autres plateformes connues', () => {
  assert.equal(classifyListenSource('https://open.spotify.com/track/x'), 'Spotify')
  assert.equal(classifyListenSource('https://artist.bandcamp.com/album/x'), 'Bandcamp')
  assert.equal(classifyListenSource('https://soundcloud.com/user/track'), 'SoundCloud')
  assert.equal(classifyListenSource('https://www.twitch.tv/streamer'),      'Twitch')
})

test('classifyListenSource : fallback Autres', () => {
  assert.equal(classifyListenSource('https://exemple.fr/lecteur'), 'Autres')
})

test('classifyListenSource : entrées invalides', () => {
  assert.equal(classifyListenSource(''),         null)
  assert.equal(classifyListenSource(null),       null)
  assert.equal(classifyListenSource('pas-une-url'), null)
})

// --- classifyTrafficSource ----------------------------------------------

test('classifyTrafficSource : Direct (pas de referrer)', () => {
  assert.equal(classifyTrafficSource({ referrer: '', hash: '#/' }),  'Direct')
  assert.equal(classifyTrafficSource({}),                            'Direct')
})

test('classifyTrafficSource : Lien d\'invitation (hash /r/CODE)', () => {
  assert.equal(
    classifyTrafficSource({ referrer: '', hash: '#/r/ABC-123' }),
    'Lien d\'invitation'
  )
})

test('classifyTrafficSource : self-referrer = invitation', () => {
  assert.equal(
    classifyTrafficSource({ referrer: 'https://floate.app/?invited=1', hash: '' }),
    'Lien d\'invitation'
  )
  assert.equal(
    classifyTrafficSource({ referrer: 'https://floate.pages.dev/', hash: '' }),
    'Lien d\'invitation'
  )
})

test('classifyTrafficSource : réseaux sociaux', () => {
  assert.equal(classifyTrafficSource({ referrer: 'https://t.co/abc' }),         'Réseaux sociaux')
  assert.equal(classifyTrafficSource({ referrer: 'https://twitter.com/user' }), 'Réseaux sociaux')
  assert.equal(classifyTrafficSource({ referrer: 'https://reddit.com/r/x' }),   'Réseaux sociaux')
  assert.equal(classifyTrafficSource({ referrer: 'https://bsky.app/profile' }), 'Réseaux sociaux')
})

test('classifyTrafficSource : Autre par défaut', () => {
  assert.equal(classifyTrafficSource({ referrer: 'https://google.com/' }), 'Autre')
})

// --- extractCountryCode -------------------------------------------------

test('extractCountryCode : locale complète', () => {
  assert.equal(extractCountryCode('fr-FR,fr;q=0.9,en-US;q=0.8'), 'FR')
  assert.equal(extractCountryCode('en-US'),                      'US')
  assert.equal(extractCountryCode('de-AT'),                      'AT')
})

test('extractCountryCode : underscore aussi accepté', () => {
  assert.equal(extractCountryCode('fr_BE'), 'BE')
})

test('extractCountryCode : locale sans pays → Inconnu', () => {
  assert.equal(extractCountryCode('fr'),  'Inconnu')
  assert.equal(extractCountryCode(''),    'Inconnu')
  assert.equal(extractCountryCode(null),  'Inconnu')
})

test('extractCountryCode : valeur tronquée à 2 caractères', () => {
  assert.equal(extractCountryCode('fr-FRA'), 'FR') // 3 lettres → garde 2
})
