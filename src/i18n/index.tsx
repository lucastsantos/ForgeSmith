import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { colorLetters } from '../lib/format'
import { en, type Messages } from './en'
import { ptBR } from './pt-BR'

export const LOCALES = { en, 'pt-BR': ptBR } satisfies Record<string, Messages>
export type Locale = keyof typeof LOCALES

const DEFAULT_LOCALE: Locale = 'en'
const STORAGE_KEY = 'forgesmith.locale'
const SUPPORTED = Object.keys(LOCALES) as Locale[]

/** First supported browser language: exact tag first, then base language ("pt-PT" → "pt-BR"), else English. */
export function detectLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const lower = tag.toLowerCase()
    const exact = SUPPORTED.find((locale) => locale.toLowerCase() === lower)
    if (exact) return exact
    const base = lower.split('-')[0]
    const sameBase = SUPPORTED.find((locale) => locale.toLowerCase().split('-')[0] === base)
    if (sameBase) return sameBase
  }
  return DEFAULT_LOCALE
}

/** A language picked in the footer wins over the browser language. */
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in LOCALES) return saved as Locale
  } catch {
    // Storage can be blocked (private mode, sandboxed frames).
  }
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language])
}

function createI18n(locale: Locale, setLocale: (locale: Locale) => void) {
  const t = LOCALES[locale]
  const integer = new Intl.NumberFormat(locale)
  const number = (value: number) => integer.format(value)

  return {
    locale,
    setLocale,
    t,
    number,
    dateTime: (iso: string) => {
      const date = new Date(iso)
      return Number.isNaN(date.getTime())
        ? iso
        : date.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    /** "best", "+31%" below 10×, "25×" above. */
    delta: (value: number, best: number) => {
      if (value === best) return t.common.best
      const ratio = value / best
      return ratio >= 10 ? `${number(Math.round(ratio))}×` : `+${number(Math.round((ratio - 1) * 100))}%`
    },
    colorNames: (mask: number) =>
      mask === 0 ? t.colors.colorless : colorLetters(mask).map((letter) => t.colors[letter as keyof Messages['colors']]).join(' + '),
    editionType: (type: string) => t.editionTypes[type] ?? type,
  }
}

export type I18n = ReturnType<typeof createI18n>

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be blocked; the choice then lasts for this page view only.
    }
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => createI18n(locale, setLocale), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
