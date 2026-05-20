const BASE_TEXT_ON_ACCENT = '#1A0F0A'

const RAW_PALETTES = [
  {
    id: 'ambiance-abricot',
    label: 'Ambiance Abricot',
    accent: '#F4A261',
    accentStrong: '#E76F51',
    textOnAccent: BASE_TEXT_ON_ACCENT
  },
  {
    id: 'crepuscule',
    label: 'Crépuscule',
    accent: '#F08FA3',
    accentStrong: '#D44A6F',
    textOnAccent: '#FFF4F7'
  },
  {
    id: 'foret',
    label: 'Forêt',
    accent: '#9CC4A1',
    accentStrong: '#5B8C6F',
    textOnAccent: '#F2FBF4'
  },
  {
    id: 'lavande',
    label: 'Lavande',
    accent: '#C1A8E0',
    accentStrong: '#8E6CB8',
    textOnAccent: '#F7F2FF'
  },
  {
    id: 'lagon',
    label: 'Lagon',
    accent: '#7BC4D1',
    accentStrong: '#4F8FA3',
    textOnAccent: '#F2FCFF'
  }
]

export const PALETTES = RAW_PALETTES.map(palette => ({
  ...palette,
  accentSoft: `${palette.accent}22`
}))

export const DEFAULT_PALETTE_ID = PALETTES[0].id

export const PALETTES_BY_ID = Object.fromEntries(
  PALETTES.map(palette => [palette.id, palette])
)

export function getPalette(id) {
  return PALETTES_BY_ID[id] || PALETTES_BY_ID[DEFAULT_PALETTE_ID]
}

export function isPaletteId(id) {
  return typeof id === 'string' && id in PALETTES_BY_ID
}
