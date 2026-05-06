import { describe, it, expect } from 'vitest'
import { CATEGORY_META, CATEGORIES, catStyle } from './category'
import type { Theme } from './types'

describe('CATEGORY_META', () => {
  it('has metadata for all categories', () => {
    CATEGORIES.forEach((cat) => {
      const meta = CATEGORY_META[cat]
      expect(meta).toBeDefined()
      expect(meta.label).toBeDefined()
      expect(meta.mono).toBeDefined()
      expect(meta.hue).toBeDefined()
      expect(meta.icon).toBeDefined()
    })
  })

  it('contains expected categories', () => {
    expect(CATEGORIES).toContain('code')
    expect(CATEGORIES).toContain('url')
    expect(CATEGORIES).toContain('email')
    expect(CATEGORIES).toContain('phone')
    expect(CATEGORIES).toContain('color')
    expect(CATEGORIES).toContain('path')
    expect(CATEGORIES).toContain('text')
    expect(CATEGORIES).toContain('address')
    expect(CATEGORIES).toContain('number')
  })
})

describe('catStyle', () => {
  const lightTheme: Theme = {
    dark: false,
    dense: false,
    fontUi: 'system-ui',
    fontMono: 'monospace',
    accent: '#000',
    accentSoft: '#000',
    accentTextOn: '#fff',
    accentInk: '#fff',
    bgRoot: '#fff',
    bgWindow: '#fff',
    bgSurface: '#fff',
    bgSurfaceAlt: '#f0f0f0',
    bgHover: '#e0e0e0',
    bgSelected: '#d0d0d0',
    border: '#ccc',
    borderSoft: '#eee',
    fg: '#000',
    fgMuted: '#666',
    fgFaint: '#999',
    micaBg: '#fff',
    rowH: 48,
    rowHTall: 64,
    pad: 12,
    radius: 6,
    radiusLg: 12,
  }

  const darkTheme: Theme = {
    ...lightTheme,
    dark: true,
    bgRoot: '#000',
    bgWindow: '#111',
    bgSurface: '#222',
    fg: '#fff',
  }

  it('returns correct style for light theme', () => {
    const style = catStyle(lightTheme, 'code')
    expect(style.label).toBe('Code')
    expect(style.mono).toBe('CODE')
    expect(style.icon).toBe('{ }')
    expect(style.bg).toMatch(/oklch\(94%/)
  })

  it('returns correct style for dark theme', () => {
    const style = catStyle(darkTheme, 'url')
    expect(style.label).toBe('Link')
    expect(style.mono).toBe('URL')
    expect(style.icon).toBe('↗')
    expect(style.bg).toMatch(/oklch\(28%/)
  })

  it('returns unique hue per category', () => {
    const hues = CATEGORIES.map((cat) => CATEGORY_META[cat].hue)
    expect(new Set(hues).size).toBe(CATEGORIES.length)
  })
})