import type { Messages } from './en'

export const ptBR: Messages = {
  locale: 'pt-BR',
  languageName: 'Português',

  common: {
    best: 'melhor',
    cards: (n) => (n === 1 ? 'carta' : 'cartas'),
    currency: { gold: 'ouro', shards: 'shards' },
  },

  rarity: {
    C: 'Comum',
    U: 'Incomum',
    R: 'Rara',
    M: 'Mítica',
    L: 'Terreno básico',
    S: 'Especial',
    T: 'Token',
  },

  colors: { W: 'Branco', U: 'Azul', B: 'Preto', R: 'Vermelho', G: 'Verde', colorless: 'Incolor' },

  editionTypes: {
    Expansion: 'Expansão',
    Core: 'Coleção básica',
    Commander: 'Commander',
    Duel_Deck: 'Duel Deck',
    Draft: 'Draft',
    Starter: 'Starter',
    Boxed_Set: 'Box set',
    Multiplayer: 'Multiplayer',
    Online: 'Online',
    Funny: 'Un-set',
    Other: 'Outro',
  },

  filters: { edition: 'Edição', color: 'Cor', rarity: 'Raridade', cmc: 'CMC', none: 'sem filtros', off: 'desligado' },

  header: {
    homeLabel: 'ForgeSmith, início',
    currencyGroup: 'Moeda',
    gold: 'Ouro',
    shards: 'Shards',
    modifier: 'Modificador',
    modifierHint: 'Multiplicador de preço de itens equipados e bênçãos (mínimo 0,25)',
    searchPlaceholder: 'Buscar carta, ex: Glorybringer',
  },

  status: {
    loading: 'Carregando cartas…',
    loadError: (message) => `Não foi possível carregar os dados: ${message}`,
  },

  card: {
    editionsInSmith: (count, n) => `${count} ${n === 1 ? 'edição' : 'edições'} no Smith`,
  },

  best: {
    title: 'Melhor estratégia',
    onAverage: (unit) => `${unit} em média`,
    pool: 'Pool',
    price: 'Preço',
    decline: 'Recusa (10%)',
    worstCase: 'Pior caso · 90%',
    onlyCard: (price, unit) => `A carta é a única do pool: sai na primeira puxada por ${price} ${unit}.`,
    note: (p) =>
      `Em média ${p.pulls} puxadas: ${p.declines} ${p.declineCount === 1 ? 'recusa' : 'recusas'} de ${p.decline} e o aceite de ${p.price}. Tenha ao menos ${p.price} ${p.unit} para puxar.`,
  },

  breakdown: {
    title: 'Filtro a filtro',
    subtitle: 'O que muda no custo esperado se você mexer em um filtro, mantendo os outros.',
    unavailable: 'Indisponível',
    turnOn: 'Ligar',
    leaveOff: 'Deixar desligado',
    anyEdition: 'Qualquer edição',
    allColors: 'Todas as cores',
    allRarities: 'Todas as raridades',
    anyCost: 'Qualquer custo',
    noEdition: 'Sem edição',
    runnerUp: (code) => `2ª melhor · ${code}`,
    ifOff: 'Se desligar',
    ifOn: (value) => `Se ligar · ${value}`,
  },

  editions: {
    title: 'Edições',
    subtitle:
      'Melhor combinação dentro de cada edição em que a carta aparece. Edições menores, como decks de Commander e Duel Decks, costumam ganhar.',
    noEdition: 'Sem filtro de edição',
    allCards: 'Pool com todas as cartas do jogo',
    meta: (code, type, year, count) => `${code} · ${type} · ${year} · ${count} cartas`,
    showLess: 'Mostrar menos',
    showAll: (n) => `Ver todas as ${n} opções`,
  },

  combos: {
    title: 'Todas as combinações',
    subtitle: (n) => `${n} combinações possíveis, da mais barata para a mais cara.`,
    edition: 'Edição',
    color: 'Cor',
    rarity: 'Rar.',
    cmc: 'CMC',
    pool: 'Pool',
    price: 'Preço',
    expected: 'Custo esperado',
    vsBest: 'vs melhor',
    showLess: 'Mostrar menos',
    showAll: (n) => `Mostrar todas as ${n}`,
  },

  home: {
    eyebrow: 'Spell Smith · Forge Adventure',
    title: 'Qual carta você quer forjar?',
    lead: 'O ForgeSmith compara todas as combinações de edição, cor, raridade e CMC e diz qual custa menos, em média, até a carta sair. Escolha uma abaixo ou use a busca.',
    examples: 'Cartas de exemplo',
    viewStrategy: (name) => `Ver a melhor estratégia para ${name}`,
    rules: [
      { title: 'Aceitar custa 100%.', text: 'O preço cheio da puxada, com os filtros que estiverem ligados.' },
      { title: 'Recusar custa 10%.', text: 'Você paga a taxa e pode puxar de novo, com os mesmos filtros ou outros.' },
      { title: 'Filtros têm preço.', text: 'Cada um multiplica o custo da puxada, mas encolhe o pool de onde a carta é sorteada.' },
    ],
  },

  footer: {
    formulaLabel: 'Custo esperado',
    formula:
      ' = preço + recusa × (pool − 1). A carta sai sorteada de forma uniforme dentro do pool, então em média são necessárias tantas puxadas quanto cartas no pool. Pior caso é o custo no percentil 90.',
    data: (p) =>
      `${p.cards} cartas e ${p.editions} edições do Forge (commit ${p.commit}), atualizado em ${p.date}. Imagens e símbolos via Scryfall.`,
    language: 'Idioma',
  },
}
