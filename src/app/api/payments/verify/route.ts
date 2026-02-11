import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    }

    // Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`
        }
      }
    )

    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      // Update payment as failed
      await prisma.payment.update({
        where: { reference },
        data: { status: 'FAILED' }
      })

      return NextResponse.json({ error: 'Payment failed' }, { status: 400 })
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { reference }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment and user plan
    const planDuration = 30 // days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + planDuration)

    await prisma.$transaction([
      prisma.payment.update({
        where: { reference },
        data: {
          status: 'SUCCESS',
          paystackRef: paystackData.data.reference,
          paidAt: new Date()
        }
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.plan,
          planExpiresAt: expiresAt,
          paystackCustomerId: paystackData.data.customer?.customer_code
        }
      })
    ])

    return NextResponse.json({
      success: true,
      plan: payment.plan,
      expiresAt
    })
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
