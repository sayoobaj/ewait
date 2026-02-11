'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserPlan {
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE'
  planExpiresAt: string | null
}

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    features: ['1 Location', '1 Queue', '50 entries/day', 'Basic analytics'],
    popular: false
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 5000,
    features: ['3 Locations', '5 Queues', '500 entries/day', 'SMS notifications', 'Priority support'],
    popular: false
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: 15000,
    features: ['10 Locations', 'Unlimited Queues', 'Unlimited entries', 'SMS + WhatsApp', 'Custom branding', 'API access'],
    popular: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 50000,
    features: ['Unlimited everything', 'Dedicated support', 'SLA guarantee', 'Custom integrations', 'On-premise option'],
    popular: false
  }
]

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchUserPlan()
    }
  }, [session])

  const fetchUserPlan = async () => {
    try {
      const res = await fetch('/api/user/plan')
      if (res.ok) {
        const data = await res.json()
        setUserPlan(data)
      }
    } catch (error) {
      console.error('Fetch plan error:', error)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (planId === 'FREE') return
    
    setLoading(planId)
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      })

      const data = await res.json()

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        alert('Failed to initialize payment')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-2xl font-bold text-blue-600">
              e<span className="text-yellow-500">Wait</span>
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-600">Billing</span>
          </div>
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-blue-600">
              {userPlan?.plan || 'FREE'}
            </span>
            {userPlan?.planExpiresAt && (
              <span className="text-gray-500">
                Expires: {new Date(userPlan.planExpiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Plans */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Choose Your Plan
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(plan => (
            <div 
              key={plan.id}
              className={`bg-white rounded-xl shadow-lg p-6 relative ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              
              <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
              
              <div className="my-4">
                <span className="text-4xl font-bold">
                  ₦{plan.price.toLocaleString()}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-500">/month</span>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id || userPlan?.plan === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  userPlan?.plan === plan.id
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : plan.id === 'FREE'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading === plan.id
                  ? 'Processing...'
                  : userPlan?.plan === plan.id
                  ? 'Current Plan'
                  : plan.id === 'FREE'
                  ? 'Free Forever'
                  : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Secure payments powered by Paystack 🔒</p>
          <p>Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </main>
  )
}
