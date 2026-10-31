import { useState } from 'react'
import { useI18n } from '../i18n'
import { cmcBucket, type Strategy } from '../lib/smith'
import { SetIcon } from './Symbols'

const COLLAPSED_ROWS = 12

function Flag({ on, title }: { on: boolean; title: string }) {
  const { t } = useI18n()
  return <span className={on ? 'flag is-on' : 'flag'} title={on ? title : undefined} aria-label={on ? title : t.filters.off} />
}

export function CombosTable({ strategy }: { strategy: Strategy }) {
  const { t, number, delta, colorNames } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const { combos, best, card } = strategy
  const rows = expanded ? combos : combos.slice(0, COLLAPSED_ROWS)

  return (
    <section className="section section-quiet" aria-labelledby="combos-title">
      <div className="section-head">
        <h2 className="section-title" id="combos-title">
          {t.combos.title}
        </h2>
        <p className="section-sub">{t.combos.subtitle(number(combos.length))}</p>
      </div>

      <div className="table-wrap">
        <table className="combos">
          <thead>
            <tr>
              <th scope="col">{t.combos.edition}</th>
              <th scope="col" className="center">
                {t.combos.color}
              </th>
              <th scope="col" className="center">
                {t.combos.rarity}
              </th>
              <th scope="col" className="center">
                {t.combos.cmc}
              </th>
              <th scope="col" className="num">
                {t.combos.pool}
              </th>
              <th scope="col" className="num">
                {t.combos.price}
              </th>
              <th scope="col" className="num">
                {t.combos.expected}
              </th>
              <th scope="col" className="num">
                {t.combos.vsBest}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((combo) => (
              <tr key={combo.id} className={combo === best ? 'is-best' : undefined}>
                <td>
                  {combo.edition ? (
                    <span className="combo-edition">
                      <SetIcon icon={combo.edition.icon} code={combo.edition.code} />
                      <span title={combo.edition.name}>{combo.edition.code}</span>
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="center">
                  <Flag on={combo.color} title={colorNames(card.mask)} />
                </td>
                <td className="center">
                  <Flag on={combo.rarity} title={t.rarity[combo.rarityCode]} />
                </td>
                <td className="center">
                  <Flag on={combo.cmc} title={cmcBucket(card.cmc)} />
                </td>
                <td className="num">{number(combo.pool)}</td>
                <td className="num">{number(combo.price)}</td>
                <td className="num strong">{number(combo.expected)}</td>
                <td className="num">
                  <span className={combo === best ? 'delta' : 'delta delta-worse'}>{delta(combo.expected, best.expected)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {combos.length > COLLAPSED_ROWS && (
        <button className="link-button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t.combos.showLess : t.combos.showAll(number(combos.length))}
        </button>
      )}
    </section>
  )
}
