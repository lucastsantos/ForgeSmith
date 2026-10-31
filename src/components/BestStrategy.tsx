import { useI18n } from '../i18n'
import type { Currency, Strategy } from '../lib/smith'
import { FilterChips } from './FilterChips'
import { SetIcon } from './Symbols'

export function BestStrategy({ strategy, currency }: { strategy: Strategy; currency: Currency }) {
  const { t, number } = useI18n()
  const { best, card } = strategy
  const unit = t.common.currency[currency]

  return (
    <section className="hero" aria-labelledby="best-title">
      <div className="hero-head">
        <p className="eyebrow eyebrow-accent" id="best-title">
          {t.best.title}
        </p>
        {best.edition && (
          <p className="hero-edition">
            <SetIcon icon={best.edition.icon} code={best.edition.code} />
            {best.edition.name}
          </p>
        )}
      </div>

      <p className="hero-cost">
        <span className="hero-cost-value">{number(best.expected)}</span>
        <span className="hero-cost-unit">{t.best.onAverage(unit)}</span>
      </p>

      <FilterChips card={card} combo={best} />

      <dl className="stats">
        <div>
          <dt>{t.best.pool}</dt>
          <dd>
            {number(best.pool)} <small>{t.common.cards(best.pool)}</small>
          </dd>
        </div>
        <div>
          <dt>{t.best.price}</dt>
          <dd>{number(best.price)}</dd>
        </div>
        <div>
          <dt>{t.best.decline}</dt>
          <dd>{number(best.decline)}</dd>
        </div>
        <div>
          <dt>{t.best.worstCase}</dt>
          <dd>{number(best.worstCase)}</dd>
        </div>
      </dl>

      <p className="hero-note">
        {best.pool === 1
          ? t.best.onlyCard(number(best.price), unit)
          : t.best.note({
              pulls: number(best.pool),
              declines: number(best.pool - 1),
              declineCount: best.pool - 1,
              decline: number(best.decline),
              price: number(best.price),
              unit,
            })}
      </p>
    </section>
  )
}
