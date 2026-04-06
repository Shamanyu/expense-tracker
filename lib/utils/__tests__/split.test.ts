import { describe, it, expect } from 'vitest'
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  calculateSplit,
  validateSplit,
  type SplitInput,
} from '../split'

describe('calculateEqualSplit', () => {
  it('splits evenly among 2 people', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 1 },
      { userId: 'b', value: 1 },
    ]
    const result = calculateEqualSplit(100, members)
    expect(result['a']).toBe(50)
    expect(result['b']).toBe(50)
  })

  it('handles remainder correctly for 3-way split', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 1 },
      { userId: 'b', value: 1 },
      { userId: 'c', value: 1 },
    ]
    const result = calculateEqualSplit(100, members)
    // 100 / 3 = 33.33 each, first person gets remainder
    expect(result['a']).toBeCloseTo(33.34)
    expect(result['b']).toBeCloseTo(33.33)
    expect(result['c']).toBeCloseTo(33.33)
    // Total should equal original
    const total = Object.values(result).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(100)
  })

  it('excludes members with value 0', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 1 },
      { userId: 'b', value: 0 },
      { userId: 'c', value: 1 },
    ]
    const result = calculateEqualSplit(100, members)
    expect(result['a']).toBe(50)
    expect(result['b']).toBeUndefined()
    expect(result['c']).toBe(50)
  })

  it('returns empty if no one is included', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 0 },
      { userId: 'b', value: 0 },
    ]
    expect(calculateEqualSplit(100, members)).toEqual({})
  })

  it('handles single member split', () => {
    const members: SplitInput[] = [{ userId: 'a', value: 1 }]
    const result = calculateEqualSplit(100, members)
    expect(result['a']).toBe(100)
  })

  it('handles small amounts with many members', () => {
    const members: SplitInput[] = Array.from({ length: 7 }, (_, i) => ({
      userId: `u${i}`,
      value: 1,
    }))
    const result = calculateEqualSplit(1, members)
    const total = Object.values(result).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('calculateExactSplit', () => {
  it('uses exact values provided', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 60 },
      { userId: 'b', value: 40 },
    ]
    const result = calculateExactSplit(members)
    expect(result['a']).toBe(60)
    expect(result['b']).toBe(40)
  })

  it('excludes zero values', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 100 },
      { userId: 'b', value: 0 },
    ]
    const result = calculateExactSplit(members)
    expect(result['a']).toBe(100)
    expect(result['b']).toBeUndefined()
  })

  it('rounds to 2 decimal places', () => {
    const members: SplitInput[] = [{ userId: 'a', value: 33.335 }]
    const result = calculateExactSplit(members)
    expect(result['a']).toBe(33.34)
  })
})

describe('calculatePercentageSplit', () => {
  it('calculates correct amounts from percentages', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 60 },
      { userId: 'b', value: 40 },
    ]
    const result = calculatePercentageSplit(200, members)
    expect(result['a']).toBe(120)
    expect(result['b']).toBe(80)
  })

  it('handles uneven percentages', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 33.33 },
      { userId: 'b', value: 33.33 },
      { userId: 'c', value: 33.34 },
    ]
    const result = calculatePercentageSplit(100, members)
    const total = Object.values(result).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(100)
  })

  it('excludes zero-percent members', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 100 },
      { userId: 'b', value: 0 },
    ]
    const result = calculatePercentageSplit(50, members)
    expect(result['a']).toBe(50)
    expect(result['b']).toBeUndefined()
  })
})

describe('calculateSharesSplit', () => {
  it('distributes by share ratio', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 2 },
      { userId: 'b', value: 1 },
    ]
    const result = calculateSharesSplit(300, members)
    expect(result['a']).toBe(200)
    expect(result['b']).toBe(100)
  })

  it('handles remainder in last person', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 1 },
      { userId: 'b', value: 1 },
      { userId: 'c', value: 1 },
    ]
    const result = calculateSharesSplit(100, members)
    const total = Object.values(result).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(100)
  })

  it('returns empty for zero total shares', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 0 },
      { userId: 'b', value: 0 },
    ]
    expect(calculateSharesSplit(100, members)).toEqual({})
  })

  it('excludes members with zero shares', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 3 },
      { userId: 'b', value: 0 },
      { userId: 'c', value: 1 },
    ]
    const result = calculateSharesSplit(100, members)
    expect(result['a']).toBe(75)
    expect(result['b']).toBeUndefined()
    expect(result['c']).toBe(25)
  })
})

describe('calculateSplit (router)', () => {
  const members: SplitInput[] = [
    { userId: 'a', value: 1 },
    { userId: 'b', value: 1 },
  ]

  it('routes to equal split', () => {
    const result = calculateSplit('equal', 100, members)
    expect(result['a']).toBe(50)
  })

  it('routes to exact split', () => {
    const exactMembers: SplitInput[] = [
      { userId: 'a', value: 70 },
      { userId: 'b', value: 30 },
    ]
    const result = calculateSplit('exact', 100, exactMembers)
    expect(result['a']).toBe(70)
  })

  it('routes to percentage split', () => {
    const pctMembers: SplitInput[] = [
      { userId: 'a', value: 50 },
      { userId: 'b', value: 50 },
    ]
    const result = calculateSplit('percentage', 200, pctMembers)
    expect(result['a']).toBe(100)
  })

  it('routes to shares split', () => {
    const shareMembers: SplitInput[] = [
      { userId: 'a', value: 3 },
      { userId: 'b', value: 1 },
    ]
    const result = calculateSplit('shares', 400, shareMembers)
    expect(result['a']).toBe(300)
  })
})

describe('validateSplit', () => {
  it('equal: valid when at least one member included', () => {
    const members: SplitInput[] = [{ userId: 'a', value: 1 }]
    expect(validateSplit('equal', 100, members)).toEqual({ valid: true })
  })

  it('equal: invalid when no one included', () => {
    const members: SplitInput[] = [{ userId: 'a', value: 0 }]
    const result = validateSplit('equal', 100, members)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('at least one member')
  })

  it('exact: valid when total matches', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 60 },
      { userId: 'b', value: 40 },
    ]
    expect(validateSplit('exact', 100, members)).toEqual({ valid: true })
  })

  it('exact: invalid when total does not match', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 60 },
      { userId: 'b', value: 30 },
    ]
    const result = validateSplit('exact', 100, members)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('90.00')
    expect(result.message).toContain('100.00')
  })

  it('exact: rejects diff of exactly 0.01 (uses strict >)', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 33.33 },
      { userId: 'b', value: 33.33 },
      { userId: 'c', value: 33.33 },
    ]
    // total = 99.99, diff = 0.01 → just over threshold, invalid
    const result = validateSplit('exact', 100, members)
    expect(result.valid).toBe(false)
  })

  it('exact: allows diff smaller than 0.01', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 33.34 },
      { userId: 'b', value: 33.33 },
      { userId: 'c', value: 33.33 },
    ]
    // total = 100.00 → valid
    expect(validateSplit('exact', 100, members)).toEqual({ valid: true })
  })

  it('percentage: valid when totals 100%', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 50 },
      { userId: 'b', value: 50 },
    ]
    expect(validateSplit('percentage', 200, members)).toEqual({ valid: true })
  })

  it('percentage: invalid when not 100%', () => {
    const members: SplitInput[] = [
      { userId: 'a', value: 50 },
      { userId: 'b', value: 40 },
    ]
    const result = validateSplit('percentage', 200, members)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('90.0%')
  })

  it('shares: valid when total shares > 0', () => {
    const members: SplitInput[] = [{ userId: 'a', value: 1 }]
    expect(validateSplit('shares', 100, members)).toEqual({ valid: true })
  })

  it('shares: invalid when total shares is 0', () => {
    const members: SplitInput[] = [{ userId: 'a', value: 0 }]
    const result = validateSplit('shares', 100, members)
    expect(result.valid).toBe(false)
    expect(result.message).toContain('greater than 0')
  })
})
