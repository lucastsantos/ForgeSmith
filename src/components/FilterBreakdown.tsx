import type { ReactNode } from 'react'
import { useI18n } from '../i18n'
import { canFilterRarity, cmcBucket, toggled, type Combo, type Currency, type Strategy } from '../lib/smith'
import { SetIcon } from './Symbols'

interface Alternative {
  label: string
  combo?: Combo
}

function AlternativeLine({ alternative, best, unit }: { alternative: Alternative; best: Combo; unit: string }) {
  const { number, delta } = useI18n()
  if (!alternative.combo) return null
  const worse = alternative.combo.expected > best.expected
  return (
    <li className="alt">
      <span className="alt-label">{alternative.label}</span>
      <span className="alt-cost">
        {number(alternative.combo.expected)} <small>{unit}</small>
      </span>
      <span className={worse ? 'delta delta-worse' : 'delta'}>{delta(alternative.combo.expected, best.expected)}</span>
    </li>
  )
}

function Tile({ title, on, value, children }: { title: string; on: boolean | null; value: ReactNode; children: ReactNode }) {
  const { t } = useI18n()
  const state = on === null ? t.breakdown.unavailable : on ? t.breakdown.turnOn : t.breakdown.leaveOff
  return (
    <article className={on ? 'tile is-on' : 'tile'}>
      <header className="tile-head">
        <h3 className="eyebrow">{title}</h3>
        <span className={on ? 'state state-on' : 'state'}>{state}</span>
      </header>
      <p className="tile-value">{value}</p>
      <ul className="alts">{children}</ul>
    </article>
  )
}

export function FilterBreakdown({ strategy, currency }: { strategy: Strategy; currency: Currency }) {
  const { t, colorNames } = useI18n()
  const { best, card, editions } = strategy
  const unit = t.common.currency[currency]
  const noEdition = editions.find((e) => e.edition === null)?.best
  const runnerUp = editions.find((e) => e.edition !== null && e.edition !== best.edition)
  const rarityAvailable = canFilterRarity(best.rarityCode)
  const rarityName = t.rarity[best.rarityCode]

  const flip = (filter: 'color' | 'rarity' | 'cmc', onLabel: string): Alternative => {
    const combo = toggled(strategy, best, filter)
    const isOn = filter === 'color' ? best.color : filter === 'rarity' ? best.rarity : best.cmc
    return { label: isOn ? t.breakdown.ifOff : t.breakdown.ifOn(onLabel), combo }
  }

  return (
    <section className="section" aria-labelledby="breakdown-title">
      <div className="section-head">
        <h2 className="section-title" id="breakdown-title">
          {t.breakdown.title}
        </h2>
        <p className="section-sub">{t.breakdown.subtitle}</p>
      </div>

      <div className="tiles">
        <Tile
          title={t.filters.edition}
          on={best.edition !== null}
          value={
            best.edition ? (
              <>
                <SetIcon icon={best.edition.icon} code={best.edition.code} />
                <span>
                  {best.edition.name} <small className="muted">{best.edition.code}</small>
                </span>
              </>
            ) : (
              t.breakdown.anyEdition
            )
          }
        >
          {best.edition && <AlternativeLine alternative={{ label: t.breakdown.noEdition, combo: noEdition }} best={best} unit={unit} />}
          {runnerUp && (
            <AlternativeLine
              alternative={{ label: t.breakdown.runnerUp(runnerUp.edition!.code), combo: runnerUp.best }}
              best={best}
              unit={unit}
            />
          )}
        </Tile>

        <Tile title={t.filters.color} on={best.color} value={best.color ? colorNames(card.mask) : t.breakdown.allColors}>
          <AlternativeLine alternative={flip('color', colorNames(card.mask))} best={best} unit={unit} />
        </Tile>

        <Tile
          title={t.filters.rarity}
          on={rarityAvailable ? best.rarity : null}
          value={best.rarity || !rarityAvailable ? rarityName : t.breakdown.allRarities}
        >
          {rarityAvailable && <AlternativeLine alternative={flip('rarity', rarityName)} best={best} unit={unit} />}
        </Tile>

        <Tile title={t.filters.cmc} on={best.cmc} value={best.cmc ? cmcBucket(card.cmc) : t.breakdown.anyCost}>
          <AlternativeLine alternative={flip('cmc', cmcBucket(card.cmc))} best={best} unit={unit} />
        </Tile>
      </div>
    </section>
  )
}
