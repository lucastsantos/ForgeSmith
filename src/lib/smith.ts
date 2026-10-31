import type { Card, Edition, Rarity, SmithData } from './data'

export type Currency = 'gold' | 'shards'

export interface Combo {
  id: string
  edition: Edition | null
  color: boolean
  rarity: boolean
  cmc: boolean
  /** Rarity the filter would use: the card's rarity inside the selected edition, or its unique print rarity. */
  rarityCode: Rarity
  filterCount: number
  pool: number
  price: number
  decline: number
  expected: number
  worstCase: number
}

export interface EditionSummary {
  edition: Edition | null
  best: Combo
}

export interface Strategy {
  card: Card
  combos: Combo[]
  best: Combo
  editions: EditionSummary[]
}

const BASE_PRICE = 125
const EDITION_MULT = 4
const CMC_MULT = 2.5
const RARITY_MULT: Partial<Record<Rarity, number>> = { C: 1.5, U: 2.5, R: 4, M: 5.5 }
const f = Math.fround

export const cmcBucket = (cmc: number) => (cmc <= 2 ? '0–2' : cmc <= 5 ? '3–5' : cmc <= 8 ? '6–8' : '9+')

export const colorCount = (mask: number) => {
  let count = 0
  for (let m = mask; m; m &= m - 1) count++
  return count
}

export const canFilterRarity = (rarity: Rarity) => rarity in RARITY_MULT

/** Mirrors SpellSmithScene.filterResults pricing, including Java float math and int truncation. */
function pricing(card: Card, combo: Pick<Combo, 'edition' | 'color' | 'rarity' | 'cmc' | 'rarityCode'>, currency: Currency, goldModifier: number) {
  let total = f(f(BASE_PRICE) * f(goldModifier))
  if (combo.edition) total = f(total * EDITION_MULT)
  // The colorless button counts as one selected color.
  if (combo.color) total = f(total * f(Math.min(Math.max(colorCount(card.mask), 1) * 2.5, 6)))
  if (combo.rarity) total = f(total * f(RARITY_MULT[combo.rarityCode]!))
  if (combo.cmc) total = f(total * CMC_MULT)
  const price = currency === 'gold' ? Math.trunc(total) : Math.trunc(f(total * f(0.2)))
  const decline = Math.trunc(f(price * f(0.1)))
  return { price, decline }
}

/** Pulls are uniform over the pool, so the attempts until the target are geometric with mean = pool. */
function costs(pool: number, price: number, decline: number) {
  const expected = price + decline * (pool - 1)
  const pulls90 = pool <= 1 ? 1 : Math.ceil(Math.log(0.1) / Math.log(1 - 1 / pool))
  return { expected, worstCase: price + decline * (pulls90 - 1) }
}

/** Pool sizes for the 8 color/rarity/cmc subsets of one edition context, indexed by bitmask. */
function countSubsets(target: Card, targetRarity: Rarity, members: Iterable<[Card, string]>) {
  const counts = new Array<number>(8).fill(0)
  const bucket = cmcBucket(target.cmc)
  for (const [card, rarity] of members) {
    const bits = (card.mask === target.mask ? 1 : 0) | (rarity === targetRarity ? 2 : 0) | (cmcBucket(card.cmc) === bucket ? 4 : 0)
    for (let subset = 0; subset < 8; subset++) if ((subset & bits) === subset) counts[subset]++
  }
  return counts
}

function* globalMembers(data: SmithData): Iterable<[Card, string]> {
  for (const card of data.cards) yield [card, card.rarity]
}

function* editionMembers(data: SmithData, edition: Edition): Iterable<[Card, string]> {
  for (let i = 0; i < edition.cards.length; i++) yield [data.cards[edition.cards[i]], edition.rarities[i]]
}

const byCost = (a: Combo, b: Combo) => a.expected - b.expected || a.price - b.price || a.filterCount - b.filterCount

export function computeStrategy(data: SmithData, card: Card, currency: Currency, goldModifier: number): Strategy {
  const contexts: { edition: Edition | null; rarity: Rarity; members: Iterable<[Card, string]> }[] = [
    { edition: null, rarity: card.rarity, members: globalMembers(data) },
    ...data.editionsByCard[card.index].map((editionIndex) => {
      const edition = data.editions[editionIndex]
      const rarity = edition.rarities[edition.cards.indexOf(card.index)] as Rarity
      return { edition, rarity, members: editionMembers(data, edition) }
    }),
  ]

  const combos: Combo[] = []
  for (const context of contexts) {
    const counts = countSubsets(card, context.rarity, context.members)
    for (let subset = 0; subset < 8; subset++) {
      const rarity = (subset & 2) !== 0
      if (rarity && !canFilterRarity(context.rarity)) continue
      const shape = { edition: context.edition, color: (subset & 1) !== 0, rarity, cmc: (subset & 4) !== 0, rarityCode: context.rarity }
      const { price, decline } = pricing(card, shape, currency, goldModifier)
      const pool = counts[subset]
      combos.push({
        ...shape,
        id: `${context.edition?.code ?? '-'}:${subset}`,
        filterCount: (context.edition ? 1 : 0) + (shape.color ? 1 : 0) + (rarity ? 1 : 0) + (shape.cmc ? 1 : 0),
        pool,
        price,
        decline,
        ...costs(pool, price, decline),
      })
    }
  }
  combos.sort(byCost)

  const bestPerEdition = new Map<string, Combo>()
  for (const combo of combos) {
    const key = combo.edition?.code ?? '-'
    if (!bestPerEdition.has(key)) bestPerEdition.set(key, combo)
  }
  const editions = [...bestPerEdition.values()].map((best) => ({ edition: best.edition, best }))

  return { card, combos, best: combos[0], editions }
}

/** Same edition context as `combo`, with one filter flipped. */
export function toggled(strategy: Strategy, combo: Combo, filter: 'color' | 'rarity' | 'cmc') {
  return strategy.combos.find(
    (c) =>
      c.edition === combo.edition &&
      c.color === (filter === 'color' ? !combo.color : combo.color) &&
      c.rarity === (filter === 'rarity' ? !combo.rarity : combo.rarity) &&
      c.cmc === (filter === 'cmc' ? !combo.cmc : combo.cmc),
  )
}
