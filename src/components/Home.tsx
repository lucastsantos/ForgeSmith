import { useState, type CSSProperties } from 'react'
import type { Card } from '../lib/data'
import { useI18n } from '../i18n'

const FEATURED = [
  'Counterspell',
  'Llanowar Elves',
  'Baneslayer Angel',
  'Glorybringer',
  'Sheoldred, the Apocalypse',
  "Sphinx's Revelation",
  'Lightning Bolt',
]

const imageUrl = (name: string) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`

function FanCard({ card, offset, edge, onSelect }: { card: Card; offset: number; edge: boolean; onSelect: (card: Card) => void }) {
  const { t } = useI18n()
  const [failed, setFailed] = useState(false)
  // Each card overlaps the right side of the previous one, so every name (top-left of the card) stays readable.
  const style = { '--i': offset, zIndex: 10 + offset * 2 } as CSSProperties
  return (
    <button
      className="fan-card"
      style={style}
      data-edge={edge || undefined}
      onClick={() => onSelect(card)}
      aria-label={t.home.viewStrategy(card.name)}
    >
      {failed ? (
        <span className="fan-card-fallback">{card.name}</span>
      ) : (
        <img src={imageUrl(card.name)} alt="" loading="eager" onError={() => setFailed(true)} />
      )}
    </button>
  )
}

export function Home({ cards, onSelect }: { cards: Card[]; onSelect: (card: Card) => void }) {
  const { t } = useI18n()
  const featured = FEATURED.map((name) => cards.find((card) => card.name === name)).filter((card): card is Card => !!card)
  const middle = (featured.length - 1) / 2

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-text">
          <p className="eyebrow eyebrow-on-dark">{t.home.eyebrow}</p>
          <h1 className="home-title">{t.home.title}</h1>
          <p className="home-lead">{t.home.lead}</p>
        </div>

        <div className="fan" role="list" aria-label={t.home.examples}>
          {featured.map((card, i) => (
            <div role="listitem" key={card.index}>
              <FanCard card={card} offset={i - middle} edge={Math.abs(i - middle) === middle} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </section>

      <section className="home-rules">
        <ol className="rules">
          {t.home.rules.map((rule) => (
            <li key={rule.title}>
              <strong>{rule.title}</strong>
              <span>{rule.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
