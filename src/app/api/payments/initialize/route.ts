import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

const PLANS = {
  STARTER: { amount: 500000, name: 'Starter Plan' }, // ₦5,000/month
  BUSINESS: { amount: 1500000, name: 'Business Plan' }, // ₦15,000/month
  ENTERPRISE: { amount: 5000000, name: 'Enterprise Plan' } // ₦50,000/month
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const planDetails = PLANS[plan as keyof typeof PLANS]
    const reference = `ewait_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // Create payment record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: planDetails.amount,
        reference,
        plan: plan as 'STARTER' | 'BUSINESS' | 'ENTERPRISE',
        status: 'PENDING'
      }
    })

    // Initialize Paystack transaction
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: planDetails.amount,
        reference,
        callback_url: `${process.env.NEXTAUTH_URL}/admin/billing/callback`,
        metadata: {
          plan,
          user_id: user.id
        }
      })
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 })
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference
    })
  } catch (error) {
    console.error('Payment init error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
