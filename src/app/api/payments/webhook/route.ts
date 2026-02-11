import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const { reference, customer } = event.data
      
      const payment = await prisma.payment.findUnique({
        where: { reference }
      })

      if (payment && payment.status === 'PENDING') {
        const planDuration = 30 // days
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + planDuration)

        await prisma.$transaction([
          prisma.payment.update({
            where: { reference },
            data: {
              status: 'SUCCESS',
              paystackRef: reference,
              paidAt: new Date()
            }
          }),
          prisma.user.update({
            where: { id: payment.userId },
            data: {
              plan: payment.plan,
              planExpiresAt: expiresAt,
              paystackCustomerId: customer?.customer_code
            }
          })
        ])
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
