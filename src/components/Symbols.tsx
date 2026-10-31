import { useState } from 'react'
import type { Rarity } from '../lib/data'
import { useI18n } from '../i18n'
import { colorLetters } from '../lib/format'

const SYMBOLS_URL = 'https://svgs.scryfall.io'

export function ManaPips({ mask, size = 'md' }: { mask: number; size?: 'sm' | 'md' }) {
  return (
    <span className={`pips pips-${size}`}>
      {colorLetters(mask).map((letter) => (
        <img key={letter} src={`${SYMBOLS_URL}/card-symbols/${letter}.svg`} alt={letter} loading="lazy" />
      ))}
    </span>
  )
}

export function RarityMark({ rarity }: { rarity: Rarity }) {
  const { t } = useI18n()
  return (
    <span className={`rarity rarity-${rarity}`}>
      <span className="rarity-dot" aria-hidden="true" />
      {t.rarity[rarity]}
    </span>
  )
}

export function SetIcon({ icon, code }: { icon: string; code: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="set-icon set-icon-fallback">{code.slice(0, 3)}</span>
  return (
    <img
      className="set-icon"
      src={`${SYMBOLS_URL}/sets/${icon}.svg`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function CardImage({ name }: { name: string }) {
  const [failedFor, setFailedFor] = useState<string | null>(null)
  if (failedFor === name) {
    return (
      <div className="card-image card-image-fallback">
        <span>{name}</span>
      </div>
    )
  }
  return (
    <img
      key={name}
      className="card-image"
      src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`}
      alt={name}
      onError={() => setFailedFor(name)}
    />
  )
}
