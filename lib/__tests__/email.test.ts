import { describe, it, expect } from 'vitest'
import { isLargeExpense } from '../email'

describe('isLargeExpense', () => {
  it('1000 INR is a large expense (≈$12 USD)', () => {
    expect(isLargeExpense(1000, 'INR')).toBe(true)
  })

  it('500 INR is not a large expense (≈$6 USD)', () => {
    expect(isLargeExpense(500, 'INR')).toBe(false)
  })

  it('12 USD is a large expense (exactly threshold)', () => {
    expect(isLargeExpense(12, 'USD')).toBe(true)
  })

  it('11.99 USD is not a large expense', () => {
    expect(isLargeExpense(11.99, 'USD')).toBe(false)
  })

  it('10 EUR is a large expense (≈$10.80 → above threshold)', () => {
    // 10 EUR * 1.08 = $10.80 — actually below $12
    expect(isLargeExpense(10, 'EUR')).toBe(false)
  })

  it('12 EUR is a large expense (≈$12.96)', () => {
    expect(isLargeExpense(12, 'EUR')).toBe(true)
  })

  it('1500 JPY is not a large expense (≈$10.05)', () => {
    // 1500 * 0.0067 = $10.05
    expect(isLargeExpense(1500, 'JPY')).toBe(false)
  })

  it('2000 JPY is a large expense (≈$13.40)', () => {
    // 2000 * 0.0067 = $13.40
    expect(isLargeExpense(2000, 'JPY')).toBe(true)
  })

  it('zero is not a large expense', () => {
    expect(isLargeExpense(0, 'USD')).toBe(false)
  })

  it('handles unknown currency (amount passed through as USD)', () => {
    // Unknown currency returns amount as-is from convertToUSD
    expect(isLargeExpense(15, 'UNKNOWN')).toBe(true)
    expect(isLargeExpense(5, 'UNKNOWN')).toBe(false)
  })
})
