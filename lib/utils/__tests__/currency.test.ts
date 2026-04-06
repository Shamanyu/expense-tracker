import { describe, it, expect } from 'vitest'
import {
  convertToUSD,
  convertFromUSD,
  convertCurrency,
  hasConversionRate,
  formatCurrency,
  FX_RATES_TO_USD,
} from '../currency'

describe('convertToUSD', () => {
  it('converts INR to USD', () => {
    const result = convertToUSD(1000, 'INR')
    expect(result).toBeCloseTo(1000 * 0.012)
  })

  it('USD to USD is identity', () => {
    expect(convertToUSD(100, 'USD')).toBe(100)
  })

  it('returns amount unchanged for unknown currency', () => {
    expect(convertToUSD(100, 'UNKNOWN')).toBe(100)
  })

  it('handles zero amount', () => {
    expect(convertToUSD(0, 'INR')).toBe(0)
  })

  it('handles negative amounts', () => {
    expect(convertToUSD(-1000, 'INR')).toBeCloseTo(-12)
  })
})

describe('convertFromUSD', () => {
  it('converts USD to INR', () => {
    const result = convertFromUSD(12, 'INR')
    expect(result).toBeCloseTo(12 / 0.012)
  })

  it('returns amount unchanged for unknown currency', () => {
    expect(convertFromUSD(100, 'UNKNOWN')).toBe(100)
  })
})

describe('convertCurrency', () => {
  it('same currency returns same amount', () => {
    expect(convertCurrency(500, 'INR', 'INR')).toBe(500)
  })

  it('converts INR to EUR via USD', () => {
    const result = convertCurrency(1000, 'INR', 'EUR')
    const expectedUSD = 1000 * 0.012
    const expectedEUR = expectedUSD / 1.08
    expect(result).toBeCloseTo(expectedEUR)
  })

  it('round-trip conversion is approximately stable', () => {
    const amount = 1000
    const converted = convertCurrency(amount, 'INR', 'USD')
    const backConverted = convertCurrency(converted, 'USD', 'INR')
    expect(backConverted).toBeCloseTo(amount, 0)
  })
})

describe('hasConversionRate', () => {
  it('returns true for known currencies', () => {
    expect(hasConversionRate('USD')).toBe(true)
    expect(hasConversionRate('INR')).toBe(true)
    expect(hasConversionRate('EUR')).toBe(true)
  })

  it('returns false for unknown currencies', () => {
    expect(hasConversionRate('XYZ')).toBe(false)
    expect(hasConversionRate('')).toBe(false)
  })
})

describe('formatCurrency', () => {
  it('formats a basic USD amount', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toContain('100.00')
  })

  it('formats negative amounts with minus sign', () => {
    const result = formatCurrency(-50, 'USD')
    expect(result).toContain('-')
    expect(result).toContain('50.00')
  })

  it('adds + sign when showSign is true and positive', () => {
    const result = formatCurrency(100, 'USD', { showSign: true })
    expect(result).toContain('+')
  })

  it('adds - sign when showSign is true and negative', () => {
    const result = formatCurrency(-100, 'USD', { showSign: true })
    expect(result).toContain('-')
  })

  it('no sign for zero with showSign', () => {
    const result = formatCurrency(0, 'USD', { showSign: true })
    expect(result).not.toContain('+')
    expect(result).not.toContain('-')
  })

  it('adds ~ prefix for unknown currency with approximate flag', () => {
    const result = formatCurrency(100, 'XYZ', { approximate: true })
    expect(result).toMatch(/^~/)
  })

  it('no ~ prefix for known currency even with approximate flag', () => {
    const result = formatCurrency(100, 'USD', { approximate: true })
    expect(result).not.toMatch(/^~/)
  })

  it('handles INR formatting', () => {
    const result = formatCurrency(1000, 'INR')
    // Should contain the amount in some format
    expect(result).toContain('1,000.00')
  })
})

describe('FX_RATES_TO_USD', () => {
  it('has reasonable number of currencies', () => {
    const count = Object.keys(FX_RATES_TO_USD).length
    expect(count).toBeGreaterThanOrEqual(30)
  })

  it('USD rate is exactly 1', () => {
    expect(FX_RATES_TO_USD['USD']).toBe(1)
  })

  it('all rates are positive numbers', () => {
    for (const [, rate] of Object.entries(FX_RATES_TO_USD)) {
      expect(rate).toBeGreaterThan(0)
    }
  })
})
