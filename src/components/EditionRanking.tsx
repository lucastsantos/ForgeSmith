import { useState } from 'react'
import { useI18n } from '../i18n'
import type { Currency, Strategy } from '../lib/smith'
import { FilterChips } from './FilterChips'
import { SetIcon } from './Symbols'

const COLLAPSED_ROWS = 6

/** Bar length on a log scale, so 2× and 200× gaps both stay readable. */
const relativeBar = (value: number, best: number, worst: number) =>
  worst <= best ? 1 : 1 - Math.log(value / best) / Math.log(worst / best) * 0.92

export function EditionRanking({ strategy, currency }: { strategy: Strategy; currency: Currency }) {
  const { t, number, delta, editionType } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const { editions, best, card } = strategy
  const worst = editions[editions.length - 1].best.expected
  const rows = expanded ? editions : editions.slice(0, COLLAPSED_ROWS)

  return (
    <section className="section" aria-labelledby="editions-title">
      <div className="section-head">
        <h2 className="section-title" id="editions-title">
          {t.editions.title}
        </h2>
        <p className="section-sub">{t.editions.subtitle}</p>
      </div>

      <ol className="ranking">
        {rows.map(({ edition, best: combo }, i) => (
          <li key={edition?.code ?? '-'} className={i === 0 ? 'rank-row is-best' : 'rank-row'}>
            <span className="rank-pos">{i + 1}</span>
            <span className="rank-name">
              {edition ? <SetIcon icon={edition.icon} code={edition.code} /> : <span className="set-icon set-icon-any">∗</span>}
              <span>
                <span className="rank-title">{edition ? edition.name : t.editions.noEdition}</span>
                <span className="rank-meta">
                  {edition
                    ? t.editions.meta(edition.code, editionType(edition.type), edition.date.slice(0, 4), number(edition.cards.length))
                    : t.editions.allCards}
                </span>
              </span>
            </span>
            <span className="rank-filters">
              <FilterChips card={card} combo={{ ...combo, edition: null }} compact />
            </span>
            <span className="rank-cost">
              {number(combo.expected)} <small>{t.common.currency[currency]}</small>
            </span>
            <span className={i === 0 ? 'delta' : 'delta delta-worse'}>{delta(combo.expected, best.expected)}</span>
            <span className="rank-bar" aria-hidden="true">
              <span style={{ width: `${relativeBar(combo.expected, best.expected, worst) * 100}%` }} />
            </span>
          </li>
        ))}
      </ol>

      {editions.length > COLLAPSED_ROWS && (
        <button className="link-button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t.editions.showLess : t.editions.showAll(number(editions.length))}
        </button>
      )}
    </section>
  )
}
