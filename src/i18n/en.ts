import type { Rarity } from '../lib/data'
import type { Currency } from '../lib/smith'

export const en = {
  locale: 'en',
  languageName: 'English',

  common: {
    best: 'best',
    cards: (n: number): string => (n === 1 ? 'card' : 'cards'),
    currency: { gold: 'gold', shards: 'shards' } as Record<Currency, string>,
  },

  rarity: {
    C: 'Common',
    U: 'Uncommon',
    R: 'Rare',
    M: 'Mythic',
    L: 'Basic land',
    S: 'Special',
    T: 'Token',
  } as Record<Rarity, string>,

  colors: { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', colorless: 'Colorless' },

  editionTypes: {
    Expansion: 'Expansion',
    Core: 'Core set',
    Commander: 'Commander',
    Duel_Deck: 'Duel Deck',
    Draft: 'Draft',
    Starter: 'Starter',
    Boxed_Set: 'Box set',
    Multiplayer: 'Multiplayer',
    Online: 'Online',
    Funny: 'Un-set',
    Other: 'Other',
  } as Record<string, string>,

  filters: { edition: 'Edition', color: 'Color', rarity: 'Rarity', cmc: 'CMC', none: 'no filters', off: 'off' },

  header: {
    homeLabel: 'ForgeSmith, home',
    currencyGroup: 'Currency',
    gold: 'Gold',
    shards: 'Shards',
    modifier: 'Modifier',
    modifierHint: 'Price multiplier from equipped items and blessings (minimum 0.25)',
    searchPlaceholder: 'Search a card, e.g. Glorybringer',
  },

  status: {
    loading: 'Loading cards…',
    loadError: (message: string) => `Could not load the data: ${message}`,
  },

  card: {
    editionsInSmith: (count: string, n: number) => `${count} ${n === 1 ? 'edition' : 'editions'} in the Smith`,
  },

  best: {
    title: 'Best strategy',
    onAverage: (unit: string) => `${unit} on average`,
    pool: 'Pool',
    price: 'Price',
    decline: 'Decline (10%)',
    worstCase: 'Worst case · 90%',
    onlyCard: (price: string, unit: string) => `It is the only card in the pool: it shows up on the first pull for ${price} ${unit}.`,
    note: (p: { pulls: string; declines: string; declineCount: number; decline: string; price: string; unit: string }) =>
      `On average ${p.pulls} pulls: ${p.declines} ${p.declineCount === 1 ? 'decline' : 'declines'} of ${p.decline} and one accept of ${p.price}. Keep at least ${p.price} ${p.unit} to pull.`,
  },

  breakdown: {
    title: 'Filter by filter',
    subtitle: 'How the expected cost changes if you flip one filter and keep the others.',
    unavailable: 'Unavailable',
    turnOn: 'Turn on',
    leaveOff: 'Leave off',
    anyEdition: 'Any edition',
    allColors: 'All colors',
    allRarities: 'All rarities',
    anyCost: 'Any cost',
    noEdition: 'No edition',
    runnerUp: (code: string) => `2nd best · ${code}`,
    ifOff: 'If turned off',
    ifOn: (value: string) => `If turned on · ${value}`,
  },

  editions: {
    title: 'Editions',
    subtitle:
      'Best combination inside each edition the card appears in. Smaller editions, like Commander decks and Duel Decks, tend to win.',
    noEdition: 'No edition filter',
    allCards: 'Pool with every card in the game',
    meta: (code: string, type: string, year: string, count: string) => `${code} · ${type} · ${year} · ${count} cards`,
    showLess: 'Show less',
    showAll: (n: string) => `See all ${n} options`,
  },

  combos: {
    title: 'All combinations',
    subtitle: (n: string) => `${n} possible combinations, from cheapest to most expensive.`,
    edition: 'Edition',
    color: 'Color',
    rarity: 'Rar.',
    cmc: 'CMC',
    pool: 'Pool',
    price: 'Price',
    expected: 'Expected cost',
    vsBest: 'vs best',
    showLess: 'Show less',
    showAll: (n: string) => `Show all ${n}`,
  },

  home: {
    eyebrow: 'Spell Smith · Forge Adventure',
    title: 'Which card do you want to forge?',
    lead: 'ForgeSmith compares every combination of edition, color, rarity and CMC and tells you which one costs the least, on average, until the card shows up. Pick one below or use the search.',
    examples: 'Example cards',
    viewStrategy: (name: string) => `See the best strategy for ${name}`,
    rules: [
      { title: 'Accepting costs 100%.', text: 'The full price of the pull, with whatever filters are on.' },
      { title: 'Declining costs 10%.', text: 'You pay the fee and can pull again, with the same filters or different ones.' },
      { title: 'Filters have a price.', text: 'Each one multiplies the cost of a pull, but shrinks the pool the card is drawn from.' },
    ],
  },

  footer: {
    formulaLabel: 'Expected cost',
    formula:
      ' = price + decline × (pool − 1). The card is drawn uniformly from the pool, so on average it takes as many pulls as there are cards in the pool. Worst case is the 90th percentile cost.',
    data: (p: { cards: string; editions: string; commit: string; date: string }) =>
      `${p.cards} cards and ${p.editions} editions from Forge (commit ${p.commit}), updated ${p.date}. Card images and symbols via Scryfall.`,
    language: 'Language',
  },
}

export type Messages = typeof en
