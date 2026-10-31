import { useId, useMemo, useRef, useState } from 'react'
import type { Card } from '../lib/data'
import { normalize } from '../lib/format'
import { useI18n } from '../i18n'
import { ManaPips } from './Symbols'

interface Props {
  cards: Card[]
  onSelect: (card: Card) => void
  autoFocus?: boolean
}

const MAX_RESULTS = 8

export function SearchBox({ cards, onSelect, autoFocus }: Props) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const index = useMemo(() => cards.map((card) => ({ card, key: normalize(card.name) })), [cards])

  // Every word must appear; prefix matches rank first, then word starts, then any substring.
  const results = useMemo(() => {
    const q = normalize(query)
    if (!q) return []
    const words = q.split(' ')
    const ranked: { card: Card; rank: number }[] = []
    for (const { card, key } of index) {
      if (!words.every((word) => key.includes(word))) continue
      const at = key.indexOf(words[0])
      const rank = key.startsWith(q) ? 0 : at === 0 || key[at - 1] === ' ' ? 1 : 2
      ranked.push({ card, rank })
    }
    ranked.sort((a, b) => a.rank - b.rank || a.card.name.length - b.card.name.length || a.card.name.localeCompare(b.card.name))
    return ranked.slice(0, MAX_RESULTS).map((r) => r.card)
  }, [index, query])

  const choose = (card: Card) => {
    onSelect(card)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && results[active]) {
      choose(results[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const expanded = open && results.length > 0

  return (
    <div className="search">
      <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="M13 13l4 4" />
      </svg>
      <input
        ref={inputRef}
        className="search-input"
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={t.header.searchPlaceholder}
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {expanded && (
        <ul className="search-results" id={listId} role="listbox">
          {results.map((card, i) => (
            <li
              key={card.index}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : undefined}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(event) => {
                event.preventDefault()
                choose(card)
              }}
            >
              <span className="search-result-name">{card.name}</span>
              <ManaPips mask={card.mask} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
