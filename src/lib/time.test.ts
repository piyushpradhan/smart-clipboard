import { describe, it, expect } from 'vitest'
import { relTime, truncate } from './time'

describe('relTime', () => {
  it('returns "just now" for less than 1 minute', () => {
    expect(relTime(0)).toBe('just now')
    expect(relTime(0.5)).toBe('just now')
  })

  it('returns minutes for less than 60 minutes', () => {
    expect(relTime(1)).toBe('1m ago')
    expect(relTime(30)).toBe('30m ago')
    expect(relTime(59)).toBe('59m ago')
  })

  it('returns hours for less than 24 hours', () => {
    expect(relTime(60)).toBe('1h ago')
    expect(relTime(120)).toBe('2h ago')
    expect(relTime(1439)).toBe('23h ago')
  })

  it('returns days for less than 7 days', () => {
    expect(relTime(1440)).toBe('1d ago')
    expect(relTime(7199)).toBe('4d ago')
  })

  it('returns weeks for 7+ days', () => {
    expect(relTime(10080)).toBe('1w ago')
    expect(relTime(10081)).toBe('1w ago')
    expect(relTime(20160)).toBe('2w ago')
  })
})

describe('truncate', () => {
  it('returns original string if under length limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
    expect(truncate('abc', 5)).toBe('abc')
  })

  it('truncates and adds ellipsis when over limit', () => {
    expect(truncate('hello world', 8)).toBe('hello w…')
    expect(truncate('abc', 2)).toBe('a…')
  })

  it('handles exact boundary', () => {
    expect(truncate('abc', 3)).toBe('abc')
  })
})