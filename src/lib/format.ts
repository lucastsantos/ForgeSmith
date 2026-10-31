export const COLORS = [
  { bit: 1, letter: 'W' },
  { bit: 2, letter: 'U' },
  { bit: 4, letter: 'B' },
  { bit: 8, letter: 'R' },
  { bit: 16, letter: 'G' },
]

/** Mana symbol letters for a color mask; colorless is "C". */
export const colorLetters = (mask: number) => (mask === 0 ? ['C'] : COLORS.filter((c) => mask & c.bit).map((c) => c.letter))

/** Lowercase, accent-free and punctuation-free, so "sphinx rev" finds "Sphinx's Revelation". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
