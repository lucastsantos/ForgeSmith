export type Rarity = 'C' | 'U' | 'R' | 'M' | 'L' | 'S' | 'T'

export interface Card {
  index: number
  name: string
  mask: number
  cmc: number
  rarity: Rarity
}

export interface Edition {
  code: string
  name: string
  type: string
  date: string
  icon: string
  cards: number[]
  rarities: string
}

export interface SmithData {
  meta: { forgeCommit: string; generatedAt: string; cardCount: number; editionCount: number }
  cards: Card[]
  editions: Edition[]
  editionsByCard: number[][]
}

interface RawData {
  meta: SmithData['meta']
  cards: [string, number, number, Rarity][]
  editions: Edition[]
}

export async function loadSmithData(): Promise<SmithData> {
  // Revalidate every load: the server refreshes this file daily.
  const response = await fetch(`${import.meta.env.BASE_URL}data/smith.json`, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Falha ao carregar dados (${response.status})`)
  const raw: RawData = await response.json()

  const cards = raw.cards.map(([name, mask, cmc, rarity], index) => ({ index, name, mask, cmc, rarity }))
  const editionsByCard: number[][] = cards.map(() => [])
  raw.editions.forEach((edition, editionIndex) => {
    for (const cardIndex of edition.cards) editionsByCard[cardIndex].push(editionIndex)
  })
  return { meta: raw.meta, cards, editions: raw.editions, editionsByCard }
}
