export type SplitInput = {
  userId: string
  value: number // For equal: 1 if included, 0 if not; exact: amount; pct: percentage; shares: share count
}

export function calculateEqualSplit(
  totalAmount: number,
  members: SplitInput[]
): Record<string, number> {
  const included = members.filter((m) => m.value === 1)
  if (included.length === 0) return {}

  const perPerson = Math.floor((totalAmount * 100) / included.length) / 100
  const remainder = Math.round((totalAmount - perPerson * included.length) * 100) / 100

  const result: Record<string, number> = {}
  included.forEach((m, i) => {
    result[m.userId] = i === 0 ? perPerson + remainder : perPerson
  })
  return result
}

export function calculateExactSplit(
  members: SplitInput[]
): Record<string, number> {
  const result: Record<string, number> = {}
  members.forEach((m) => {
    if (m.value > 0) {
      result[m.userId] = Math.round(m.value * 100) / 100
    }
  })
  return result
}

export function calculatePercentageSplit(
  totalAmount: number,
  members: SplitInput[]
): Record<string, number> {
  const result: Record<string, number> = {}
  members.forEach((m) => {
    if (m.value > 0) {
      result[m.userId] = Math.round(totalAmount * (m.value / 100) * 100) / 100
    }
  })
  return result
}

export function calculateSharesSplit(
  totalAmount: number,
  members: SplitInput[]
): Record<string, number> {
  const totalShares = members.reduce((sum, m) => sum + m.value, 0)
  if (totalShares === 0) return {}

  const result: Record<string, number> = {}
  let allocated = 0
  const sorted = [...members].filter((m) => m.value > 0)

  sorted.forEach((m, i) => {
    if (i === sorted.length - 1) {
      // Last person gets the remainder to avoid rounding errors
      result[m.userId] = Math.round((totalAmount - allocated) * 100) / 100
    } else {
      const share = Math.round((totalAmount * (m.value / totalShares)) * 100) / 100
      result[m.userId] = share
      allocated += share
    }
  })

  return result
}

export function calculateSplit(
  type: 'equal' | 'exact' | 'percentage' | 'shares',
  totalAmount: number,
  members: SplitInput[]
): Record<string, number> {
  switch (type) {
    case 'equal':
      return calculateEqualSplit(totalAmount, members)
    case 'exact':
      return calculateExactSplit(members)
    case 'percentage':
      return calculatePercentageSplit(totalAmount, members)
    case 'shares':
      return calculateSharesSplit(totalAmount, members)
  }
}

export function validateSplit(
  type: 'equal' | 'exact' | 'percentage' | 'shares',
  totalAmount: number,
  members: SplitInput[]
): { valid: boolean; message?: string } {
  if (type === 'equal') {
    const included = members.filter((m) => m.value === 1)
    if (included.length === 0) return { valid: false, message: 'Select at least one member' }
    return { valid: true }
  }

  if (type === 'exact') {
    const total = members.reduce((sum, m) => sum + m.value, 0)
    const diff = Math.abs(total - totalAmount)
    if (diff > 0.01) {
      return { valid: false, message: `Total is ${total.toFixed(2)}, expected ${totalAmount.toFixed(2)}` }
    }
    return { valid: true }
  }

  if (type === 'percentage') {
    const total = members.reduce((sum, m) => sum + m.value, 0)
    if (Math.abs(total - 100) > 0.01) {
      return { valid: false, message: `Percentages total ${total.toFixed(1)}%, must equal 100%` }
    }
    return { valid: true }
  }

  if (type === 'shares') {
    const total = members.reduce((sum, m) => sum + m.value, 0)
    if (total <= 0) {
      return { valid: false, message: 'Total shares must be greater than 0' }
    }
    return { valid: true }
  }

  return { valid: true }
}
