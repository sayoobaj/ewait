'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    const reference = searchParams.get('reference')
    
    if (reference) {
      verifyPayment(reference)
    } else {
      setStatus('failed')
    }
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const res = await fetch(`/api/payments/verify?reference=${reference}`)
      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setPlan(data.plan)
        // Redirect to dashboard after 3 seconds
        setTimeout(() => router.push('/admin'), 3000)
      } else {
        setStatus('failed')
      }
    } catch {
      setStatus('failed')
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Verifying Payment...
            </h1>
            <p className="text-gray-600">Please wait while we confirm your payment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              You are now subscribed to the <strong>{plan}</strong> plan
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600 mb-6">
              Something went wrong with your payment. Please try again.
            </p>
            <Link 
              href="/admin/billing"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Try Again
            </Link>
          </>
        )}
      </div>
    </main>
  )
}

export default function BillingCallback() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </main>
    }>
      <CallbackContent />
    </Suspense>
  )
}
