import { useEffect, useMemo, useState } from 'react'
import { BestStrategy } from './components/BestStrategy'
import { CombosTable } from './components/CombosTable'
import { EditionRanking } from './components/EditionRanking'
import { FilterBreakdown } from './components/FilterBreakdown'
import { Home } from './components/Home'
import { SearchBox } from './components/SearchBox'
import { CardImage, ManaPips, RarityMark } from './components/Symbols'
import { LOCALES, useI18n, type Locale } from './i18n'
import { loadSmithData, type Card, type SmithData } from './lib/data'
import { computeStrategy, type Currency } from './lib/smith'

const cardFromHash = (data: SmithData) => {
  const name = decodeURIComponent(window.location.hash.slice(1))
  return data.cards.find((card) => card.name === name) ?? null
}

export default function App() {
  const { t, number, dateTime, locale, setLocale } = useI18n()
  const [data, setData] = useState<SmithData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [card, setCard] = useState<Card | null>(null)
  const [currency, setCurrency] = useState<Currency>('gold')
  const [modifier, setModifier] = useState(1)

  useEffect(() => {
    loadSmithData()
      .then((loaded) => {
        setData(loaded)
        setCard(cardFromHash(loaded))
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!data) return
    const onHashChange = () => setCard(cardFromHash(data))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [data])

  const select = (next: Card) => {
    window.location.hash = encodeURIComponent(next.name)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const strategy = useMemo(
    () => (data && card ? computeStrategy(data, card, currency, modifier) : null),
    [data, card, currency, modifier],
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#" aria-label={t.header.homeLabel}>
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">ForgeSmith</span>
            <span className="brand-tag">Spell Smith · Forge Adventure</span>
          </a>
          {data && <SearchBox cards={data.cards} onSelect={select} autoFocus={!card} />}
          <div className="settings">
            <div className="segmented" role="group" aria-label={t.header.currencyGroup}>
              {(['gold', 'shards'] as const).map((value) => (
                <button key={value} className={currency === value ? 'is-active' : undefined} onClick={() => setCurrency(value)}>
                  {value === 'gold' ? t.header.gold : t.header.shards}
                </button>
              ))}
            </div>
            <label className="modifier" title={t.header.modifierHint}>
              <span>{t.header.modifier}</span>
              <input
                type="number"
                min={0.25}
                max={3}
                step={0.05}
                value={modifier}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value) && value > 0) setModifier(Math.max(value, 0.25))
                }}
              />
            </label>
          </div>
        </div>
      </header>

      {data && !strategy && <Home cards={data.cards} onSelect={select} />}

      <main className={data && !strategy ? 'main main-empty' : 'main'}>
        {error && <p className="notice">{t.status.loadError(error)}</p>}
        {!data && !error && <p className="notice">{t.status.loading}</p>}

        {strategy && (
          <div className="layout">
            <aside className="card-col">
              <CardImage name={strategy.card.name} />
            </aside>

            <div className="content">
              <header className="card-head">
                <h1 className="card-name">{strategy.card.name}</h1>
                <p className="card-meta">
                  <ManaPips mask={strategy.card.mask} />
                  <span>CMC {strategy.card.cmc}</span>
                  <RarityMark rarity={strategy.card.rarity} />
                  <span>{t.card.editionsInSmith(number(strategy.editions.length - 1), strategy.editions.length - 1)}</span>
                </p>
              </header>

              <BestStrategy strategy={strategy} currency={currency} />
              <FilterBreakdown strategy={strategy} currency={currency} />
              <EditionRanking strategy={strategy} currency={currency} />
              <CombosTable strategy={strategy} />
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          <strong>{t.footer.formulaLabel}</strong>
          {t.footer.formula}
        </p>
        {data && (
          <p className="muted">
            {t.footer.data({
              cards: number(data.meta.cardCount),
              editions: number(data.meta.editionCount),
              commit: data.meta.forgeCommit,
              date: dateTime(data.meta.generatedAt),
            })}
          </p>
        )}
        <div className="language" role="group" aria-label={t.footer.language}>
          <span className="language-label">{t.footer.language}</span>
          {(Object.keys(LOCALES) as Locale[]).map((value) => (
            <button
              key={value}
              lang={value}
              className={value === locale ? 'is-active' : undefined}
              aria-pressed={value === locale}
              onClick={() => setLocale(value)}
            >
              {LOCALES[value].languageName}
            </button>
          ))}
        </div>
      </footer>
    </div>
  )
}
