/**
 * SMS Service using Termii API
 * https://developers.termii.com/
 */

const TERMII_API_KEY = process.env.TERMII_API_KEY
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'eWait'
const TERMII_BASE_URL = 'https://api.ng.termii.com/api'

interface SendSMSParams {
  to: string
  message: string
}

interface TermiiResponse {
  message_id?: string
  message?: string
  balance?: number
  user?: string
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TERMII_API_KEY) {
    console.warn('TERMII_API_KEY not set, skipping SMS')
    return { success: false, error: 'SMS not configured' }
  }

  // Format Nigerian phone number
  let phone = to.replace(/\s+/g, '').replace(/^0/, '234')
  if (!phone.startsWith('234')) {
    phone = '234' + phone
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: phone,
        from: TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'generic',
      }),
    })

    const data: TermiiResponse = await response.json()

    if (response.ok && data.message_id) {
      return { success: true, messageId: data.message_id }
    }

    return { success: false, error: data.message || 'Failed to send SMS' }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error: 'Network error' }
  }
}

// Queue notification templates
export const SMSTemplates = {
  joined: (ticketNumber: number, position: number, queueName: string) =>
    `eWait: You're #${ticketNumber} in ${queueName}. Position: ${position}. We'll notify you when it's your turn!`,

  almostTurn: (ticketNumber: number, peopleAhead: number) =>
    `eWait: Heads up! You're #${ticketNumber} and there are only ${peopleAhead} people ahead. Please be ready!`,

  yourTurn: (ticketNumber: number, locationName: string) =>
    `eWait: IT'S YOUR TURN! Ticket #${ticketNumber}. Please proceed to ${locationName} now.`,

  noShow: (ticketNumber: number) =>
    `eWait: Ticket #${ticketNumber} was marked as no-show. Visit ${process.env.NEXT_PUBLIC_APP_URL}/join to rejoin.`,
}

// Send notification based on status change
export async function sendQueueNotification(
  phone: string,
  type: 'joined' | 'almostTurn' | 'yourTurn' | 'noShow',
  data: {
    ticketNumber: number
    position?: number
    peopleAhead?: number
    queueName?: string
    locationName?: string
  }
) {
  let message: string

  switch (type) {
    case 'joined':
      message = SMSTemplates.joined(data.ticketNumber, data.position || 1, data.queueName || 'the queue')
      break
    case 'almostTurn':
      message = SMSTemplates.almostTurn(data.ticketNumber, data.peopleAhead || 1)
      break
    case 'yourTurn':
      message = SMSTemplates.yourTurn(data.ticketNumber, data.locationName || 'the counter')
      break
    case 'noShow':
      message = SMSTemplates.noShow(data.ticketNumber)
      break
    default:
      return { success: false, error: 'Unknown notification type' }
  }

  return sendSMS({ to: phone, message })
}
