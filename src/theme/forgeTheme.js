export const themes = {
  ember: {
    id: 'ember',
    fog: '#342548',
    background: '#342548',
    fakeFireColor: '#ff9b2b',
    fakeFireEmissive: '#ff9b2b',
    fakeFireIntensity: 4,
    tableEmissive: '#eb199a',
    nuggetColor: '#ff9b2b',
    particleColor: '#cc2200',
    particleEmissive: '#ff9b2b',
    fluidColor(velocity, colorVec) {
      const rCol = Math.max(2.9, Math.abs(velocity.x) * 255)
      const gCol = Math.max(0.2, Math.abs(velocity.y))
      const bCol = Math.max(0, (rCol + gCol) / 100.5)
      return colorVec.set(rCol + 50, gCol, bCol)
    },
  },
  frost: {
    id: 'frost',
    fog: '#0a1628',
    background: '#0a1628',
    fakeFireColor: '#3aa0ff',
    fakeFireEmissive: '#6ec8ff',
    fakeFireIntensity: 5,
    tableEmissive: '#2a6bff',
    nuggetColor: '#5eb8ff',
    particleColor: '#4da6ff',
    particleEmissive: '#a8e4ff',
    fluidColor(velocity, colorVec) {
      const bCol = Math.max(2.2, Math.abs(velocity.x) * 165)
      const gCol = Math.max(0.4, Math.abs(velocity.y) * 1.2)
      const rCol = Math.max(0, gCol / 120)
      return colorVec.set(rCol, gCol + 6, bCol + 18)
    },
  },
  chaos: {
    id: 'chaos',
    fog: '#2a1410',
    background: '#2a1410',
    fakeFireColor: '#ff6a1a',
    fakeFireEmissive: '#ff3a1a',
    fakeFireIntensity: 3,
    tableEmissive: '#d41818',
    nuggetColor: '#ff5520',
    particleColor: '#e02010',
    particleEmissive: '#ff6a1a',
    fluidColor(velocity, colorVec) {
      const rCol = Math.max(2.8, Math.abs(velocity.x) * 180)
      const gCol = Math.max(0.12, Math.abs(velocity.y) * 0.5)
      const bCol = Math.max(0, gCol / 160)
      return colorVec.set(rCol + 35, gCol + 8, bCol)
    },
  },
  tide: {
    id: 'tide',
    fog: '#0a1f22',
    background: '#0a1f22',
    fakeFireColor: '#6DBEB7',
    fakeFireEmissive: '#8fd4cf',
    fakeFireIntensity: 4,
    tableEmissive: '#4a9a94',
    nuggetColor: '#6DBEB7',
    particleColor: '#3d8a84',
    particleEmissive: '#6DBEB7',
    fluidColor(velocity, colorVec) {
      const gCol = Math.max(2.4, Math.abs(velocity.x) * 140)
      const bCol = Math.max(1.8, Math.abs(velocity.y) * 1.4)
      const rCol = Math.max(0, gCol / 180)
      return colorVec.set(rCol + 8, gCol + 22, bCol + 28)
    },
  },
  moss: {
    id: 'moss',
    fog: '#121a0e',
    background: '#121a0e',
    fakeFireColor: '#8CC269',
    fakeFireEmissive: '#a8d88a',
    fakeFireIntensity: 4,
    tableEmissive: '#5a8a3a',
    nuggetColor: '#8CC269',
    particleColor: '#5a7a38',
    particleEmissive: '#8CC269',
    fluidColor(velocity, colorVec) {
      const gCol = Math.max(2.6, Math.abs(velocity.x) * 150)
      const rCol = Math.max(0.2, Math.abs(velocity.y) * 0.8)
      const bCol = Math.max(0, gCol / 200)
      return colorVec.set(rCol + 12, gCol + 28, bCol + 6)
    },
  },
  violet: {
    id: 'violet',
    fog: '#160d24',
    background: '#160d24',
    fakeFireColor: '#9B5DE5',
    fakeFireEmissive: '#c49bf0',
    fakeFireIntensity: 4,
    tableEmissive: '#6b3a9e',
    nuggetColor: '#9B5DE5',
    particleColor: '#7a45b8',
    particleEmissive: '#9B5DE5',
    fluidColor(velocity, colorVec) {
      const bCol = Math.max(2.5, Math.abs(velocity.x) * 155)
      const rCol = Math.max(0.8, Math.abs(velocity.y) * 1.1)
      const gCol = Math.max(0, rCol / 160)
      return colorVec.set(rCol + 28, gCol + 6, bCol + 32)
    },
  },
}

export function getTheme(playthrough = 1) {
  if (playthrough === 6) return themes.violet
  if (playthrough === 5) return themes.moss
  if (playthrough === 4) return themes.tide
  if (playthrough >= 3) return themes.chaos
  if (playthrough === 2) return themes.frost
  return themes.ember
}
