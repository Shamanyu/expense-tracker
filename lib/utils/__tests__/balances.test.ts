import { describe, it, expect } from 'vitest'
import { computeNetBalances, simplifyDebts } from '../balances'

// Helper to make expense objects
function makeExpense(
  id: string,
  paidBy: string,
  amount: number,
  splits: { user_id: string; amount: number }[],
  deleted = false,
) {
  return {
    id,
    group_id: 'g1',
    paid_by: paidBy,
    amount,
    currency: 'INR',
    description: 'test',
    category: 'Other',
    split_type: 'equal' as const,
    created_at: '2024-01-01',
    created_by: paidBy,
    deleted_at: deleted ? '2024-01-02' : null,
    date: '2024-01-01',
    splits: splits.map((s) => ({
      id: `s-${id}-${s.user_id}`,
      expense_id: id,
      user_id: s.user_id,
      amount: s.amount,
    })),
  }
}

function makeSettlement(payerId: string, payeeId: string, amount: number) {
  return {
    id: `settle-${payerId}-${payeeId}`,
    group_id: 'g1',
    payer_id: payerId,
    payee_id: payeeId,
    amount,
    currency: 'INR',
    created_at: '2024-01-01',
    created_by: payerId,
    date: '2024-01-01',
  }
}

describe('computeNetBalances', () => {
  it('returns empty object for no expenses', () => {
    expect(computeNetBalances([], [])).toEqual({})
  })

  it('computes correct balances for a single expense split equally', () => {
    const expense = makeExpense('e1', 'alice', 300, [
      { user_id: 'alice', amount: 100 },
      { user_id: 'bob', amount: 100 },
      { user_id: 'charlie', amount: 100 },
    ])
    const balances = computeNetBalances([expense], [])
    // alice paid 300, owes 100 → net +200
    expect(balances['alice']).toBeCloseTo(200)
    // bob owes 100
    expect(balances['bob']).toBeCloseTo(-100)
    // charlie owes 100
    expect(balances['charlie']).toBeCloseTo(-100)
  })

  it('skips deleted expenses', () => {
    const expense = makeExpense(
      'e1',
      'alice',
      300,
      [
        { user_id: 'alice', amount: 100 },
        { user_id: 'bob', amount: 100 },
        { user_id: 'charlie', amount: 100 },
      ],
      true,
    )
    const balances = computeNetBalances([expense], [])
    expect(balances).toEqual({})
  })

  it('accounts for settlements', () => {
    const expense = makeExpense('e1', 'alice', 200, [
      { user_id: 'alice', amount: 100 },
      { user_id: 'bob', amount: 100 },
    ])
    // bob pays alice 50
    const settlement = makeSettlement('bob', 'alice', 50)
    const balances = computeNetBalances([expense], [settlement])
    // alice: +200 (paid) -100 (split) -50 (received) = +50
    expect(balances['alice']).toBeCloseTo(50)
    // bob: -100 (split) +50 (paid settlement) = -50
    expect(balances['bob']).toBeCloseTo(-50)
  })

  it('handles multiple expenses with different payers', () => {
    const e1 = makeExpense('e1', 'alice', 100, [
      { user_id: 'alice', amount: 50 },
      { user_id: 'bob', amount: 50 },
    ])
    const e2 = makeExpense('e2', 'bob', 60, [
      { user_id: 'alice', amount: 30 },
      { user_id: 'bob', amount: 30 },
    ])
    const balances = computeNetBalances([e1, e2], [])
    // alice: +100 -50 -30 = +20
    expect(balances['alice']).toBeCloseTo(20)
    // bob: -50 +60 -30 = -20
    expect(balances['bob']).toBeCloseTo(-20)
  })

  it('net balances sum to zero', () => {
    const e1 = makeExpense('e1', 'alice', 150, [
      { user_id: 'alice', amount: 50 },
      { user_id: 'bob', amount: 50 },
      { user_id: 'charlie', amount: 50 },
    ])
    const e2 = makeExpense('e2', 'bob', 90, [
      { user_id: 'alice', amount: 30 },
      { user_id: 'bob', amount: 30 },
      { user_id: 'charlie', amount: 30 },
    ])
    const balances = computeNetBalances([e1, e2], [])
    const total = Object.values(balances).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(0)
  })
})

describe('simplifyDebts', () => {
  it('returns empty for zero balances', () => {
    expect(simplifyDebts({})).toEqual([])
  })

  it('returns empty for near-zero balances', () => {
    expect(simplifyDebts({ alice: 0.005, bob: -0.005 })).toEqual([])
  })

  it('produces a single transaction for two people', () => {
    const result = simplifyDebts({ alice: 100, bob: -100 })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'bob', to: 'alice', amount: 100 })
  })

  it('simplifies 3-person debts into minimal transactions', () => {
    // alice is owed 100, bob owes 60, charlie owes 40
    const result = simplifyDebts({ alice: 100, bob: -60, charlie: -40 })
    expect(result).toHaveLength(2)
    // total paid should equal 100
    const totalPaid = result.reduce((s, t) => s + t.amount, 0)
    expect(totalPaid).toBeCloseTo(100)
    // all transactions should go to alice
    expect(result.every((t) => t.to === 'alice')).toBe(true)
  })

  it('handles complex 4-person scenario', () => {
    // A is owed 50, B is owed 30, C owes 45, D owes 35
    const result = simplifyDebts({ A: 50, B: 30, C: -45, D: -35 })
    // Should minimize number of transactions
    expect(result.length).toBeLessThanOrEqual(3)
    // All amounts should be positive
    expect(result.every((t) => t.amount > 0)).toBe(true)
    // Total flow should balance
    const totalFrom: Record<string, number> = {}
    const totalTo: Record<string, number> = {}
    for (const t of result) {
      totalFrom[t.from] = (totalFrom[t.from] ?? 0) + t.amount
      totalTo[t.to] = (totalTo[t.to] ?? 0) + t.amount
    }
    expect(totalTo['A']).toBeCloseTo(50)
    expect(totalTo['B']).toBeCloseTo(30)
    expect(totalFrom['C']).toBeCloseTo(45)
    expect(totalFrom['D']).toBeCloseTo(35)
  })

  it('rounds amounts to 2 decimal places', () => {
    const result = simplifyDebts({ alice: 33.333, bob: -33.333 })
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(33.33)
  })
})
