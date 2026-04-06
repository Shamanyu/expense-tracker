import { convertToUSD } from '@/lib/utils/currency'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'shubhamshamanyu@gmail.com'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Settl'

// ~1000 INR in USD
const LARGE_EXPENSE_THRESHOLD_USD = 12

export async function sendInviteEmail({
  to,
  inviterName,
  type,
  groupName,
}: {
  to: string
  inviterName: string
  type: 'friend' | 'group'
  groupName?: string
}) {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set — skipping invite email')
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expense-tracker-ochre-kappa.vercel.app'

  const subject =
    type === 'group'
      ? `${inviterName} invited you to join "${groupName}" on Settl`
      : `${inviterName} wants to connect with you on Settl`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 28px; font-weight: 600; color: #0F172A; margin-bottom: 8px;">Settl</h1>
      <p style="color: #64748B; font-size: 14px; margin-bottom: 32px;">Split expenses. Settle up. Stay friends.</p>

      <p style="font-size: 16px; color: #1E293B; line-height: 1.6;">
        ${type === 'group'
          ? `<strong>${inviterName}</strong> invited you to join the group <strong>"${groupName}"</strong> on Settl.`
          : `<strong>${inviterName}</strong> wants to add you as a friend on Settl.`
        }
      </p>

      <p style="font-size: 16px; color: #1E293B; line-height: 1.6;">
        Settl makes it easy to split expenses with friends and groups. Sign up with Google to get started — your invitation will be automatically applied.
      </p>

      <a href="${appUrl}"
         style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 500; font-size: 15px; margin-top: 16px;">
        Join Settl
      </a>

      <p style="font-size: 13px; color: #94A3B8; margin-top: 32px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Failed to send invite email:', body)
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set — skipping email')
    return
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Failed to send email:', body)
  }
}

function emailWrapper(body: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expense-tracker-ochre-kappa.vercel.app'
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 28px; font-weight: 600; color: #0F172A; margin-bottom: 8px;">Settl</h1>
      <p style="color: #64748B; font-size: 14px; margin-bottom: 32px;">Split expenses. Settle up. Stay friends.</p>
      ${body}
      <a href="${appUrl}"
         style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 500; font-size: 15px; margin-top: 24px;">
        Open Settl
      </a>
      <p style="font-size: 13px; color: #94A3B8; margin-top: 32px;">
        You received this because you use Settl.
      </p>
    </div>
  `
}

/** Send friend request notification to an existing Settl user */
export async function sendFriendRequestEmail({
  to,
  requesterName,
}: {
  to: string
  requesterName: string
}) {
  const subject = `${requesterName} sent you a friend request on Settl`
  const html = emailWrapper(`
    <p style="font-size: 16px; color: #1E293B; line-height: 1.6;">
      <strong>${requesterName}</strong> wants to add you as a friend on Settl.
    </p>
    <p style="font-size: 16px; color: #1E293B; line-height: 1.6;">
      Open the app to accept or decline the request.
    </p>
  `)
  await sendEmail(to, subject, html)
}

/** Returns true if the expense amount (in any currency) is above ~₹1,000 */
export function isLargeExpense(amount: number, currency: string): boolean {
  const usd = convertToUSD(amount, currency)
  return usd >= LARGE_EXPENSE_THRESHOLD_USD
}

/** Notify group members about a large expense */
export async function sendExpenseNotificationEmail({
  to,
  adderName,
  description,
  amount,
  currency,
  groupName,
  yourShare,
}: {
  to: string
  adderName: string
  description: string
  amount: string
  currency: string
  groupName: string
  yourShare?: string
}) {
  const subject = `💸 ${adderName} added "${description}" (${amount}) in ${groupName}`
  const shareText = yourShare ? `<p style="font-size: 15px; color: #4F46E5; font-weight: 500; margin-top: 8px;">Your share: ${yourShare}</p>` : ''
  const html = emailWrapper(`
    <p style="font-size: 16px; color: #1E293B; line-height: 1.6;">
      <strong>${adderName}</strong> added a new expense in <strong>${groupName}</strong>:
    </p>
    <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="font-size: 18px; font-weight: 600; color: #0F172A; margin: 0;">${description}</p>
      <p style="font-size: 22px; font-weight: 700; color: #4F46E5; margin: 8px 0 0 0;">${amount}</p>
      ${shareText}
    </div>
  `)
  await sendEmail(to, subject, html)
}
