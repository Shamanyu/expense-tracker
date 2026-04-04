import type { Expense, ExpenseSplit, Settlement } from '@/lib/types/database.types'
import type { DebtSimplification } from '@/lib/types/app.types'

export function computeNetBalances(
  expenses: (Expense & { splits: ExpenseSplit[] })[],
  settlements: Settlement[]
): Record<string, number> {
  const balances: Record<string, number> = {}

  const ensure = (userId: string) => {
    if (!(userId in balances)) balances[userId] = 0
  }

  // Process expenses
  for (const expense of expenses) {
    if (expense.deleted_at) continue

    // The payer is owed the full amount
    ensure(expense.paid_by)
    balances[expense.paid_by] += Number(expense.amount)

    // Each split participant owes their share
    for (const split of expense.splits) {
      ensure(split.user_id)
      balances[split.user_id] -= Number(split.amount)
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    ensure(settlement.payer_id)
    ensure(settlement.payee_id)
    // Payer paid money, so reduce what they owe (increase balance)
    balances[settlement.payer_id] += Number(settlement.amount)
    // Payee received money, so reduce what they're owed (decrease balance)
    balances[settlement.payee_id] -= Number(settlement.amount)
  }

  return balances
}

export function simplifyDebts(
  balances: Record<string, number>
): DebtSimplification[] {
  // Filter out near-zero balances
  const entries = Object.entries(balances).filter(
    ([, amount]) => Math.abs(amount) > 0.01
  )

  // Separate into creditors (positive) and debtors (negative)
  const creditors: { id: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []

  for (const [id, amount] of entries) {
    if (amount > 0.01) {
      creditors.push({ id, amount })
    } else if (amount < -0.01) {
      debtors.push({ id, amount: Math.abs(amount) })
    }
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions: DebtSimplification[] = []

  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci]
    const debt = debtors[di]
    const amount = Math.min(credit.amount, debt.amount)

    if (amount > 0.01) {
      transactions.push({
        from: debt.id,
        to: credit.id,
        amount: Math.round(amount * 100) / 100,
      })
    }

    credit.amount -= amount
    debt.amount -= amount

    if (credit.amount < 0.01) ci++
    if (debt.amount < 0.01) di++
  }

  return transactions
}
