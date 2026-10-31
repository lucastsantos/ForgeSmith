import type { Card } from '../lib/data'
import { useI18n } from '../i18n'
import { cmcBucket, type Combo } from '../lib/smith'

interface Props {
  card: Card
  combo: Combo
  compact?: boolean
}

export function FilterChips({ card, combo, compact }: Props) {
  const { t, colorNames } = useI18n()
  const chips = [
    { key: 'edition', label: t.filters.edition, value: combo.edition?.code ?? '', on: combo.edition !== null },
    { key: 'color', label: t.filters.color, value: colorNames(card.mask), on: combo.color },
    { key: 'rarity', label: t.filters.rarity, value: t.rarity[combo.rarityCode], on: combo.rarity },
    { key: 'cmc', label: t.filters.cmc, value: cmcBucket(card.cmc), on: combo.cmc },
  ]
  const visible = compact ? chips.filter((chip) => chip.on) : chips

  if (compact && visible.length === 0) return <span className="chips chips-compact muted">{t.filters.none}</span>

  return (
    <span className={compact ? 'chips chips-compact' : 'chips'}>
      {visible.map((chip) => (
        <span key={chip.key} className={chip.on ? 'chip is-on' : 'chip'}>
          <span className="chip-label">{chip.label}</span>
          {chip.on && <span className="chip-value">{chip.value}</span>}
        </span>
      ))}
    </span>
  )
}
