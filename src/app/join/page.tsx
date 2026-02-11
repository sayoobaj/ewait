'use client'

import { useState, Suspense, lazy } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Lazy load QR scanner to avoid SSR issues
const QRScanner = lazy(() => import('@/components/QRScanner'))

function JoinQueueContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCode = searchParams.get('q') || ''

  const [queueCode, setQueueCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [step, setStep] = useState<'scan' | 'details' | 'loading' | 'success'>('scan')
  const [ticketData, setTicketData] = useState<{
    id: string
    ticketNumber: number
    position: number
    estimatedWaitMinutes: number
    queueName: string
    locationName: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleQRScan = (result: string) => {
    // Extract queue code from URL or use raw value
    const urlMatch = result.match(/[?&]q=([^&]+)/)
    const code = urlMatch ? urlMatch[1] : result
    setQueueCode(code)
    setShowScanner(false)
    setStep('details')
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (queueCode.trim()) {
      setStep('details')
    }
  }

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep('loading')

    try {
      const res = await fetch('/api/queues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: queueCode,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join queue')
      }

      setTicketData(data)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('details')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 px-4">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="text-2xl font-bold">
            e<span className="text-yellow-400">Wait</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        {step === 'scan' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Join a Queue
            </h1>

            {/* QR Scanner */}
            {showScanner ? (
              <div className="mb-6">
                <Suspense fallback={
                  <div className="bg-gray-100 rounded-xl p-8 text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading camera...</p>
                  </div>
                }>
                  <QRScanner onScan={handleQRScan} />
                </Suspense>
                <button
                  onClick={() => setShowScanner(false)}
                  className="w-full mt-4 text-gray-600 py-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-8 mb-6 text-center">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-600 mb-4">
                  Scan QR code to join queue
                </p>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Open Camera
                </button>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">or enter code</span>
              </div>
            </div>

            {/* Manual Code Entry */}
            <form onSubmit={handleCodeSubmit}>
              <input
                type="text"
                value={queueCode}
                onChange={(e) => setQueueCode(e.target.value)}
                placeholder="Enter queue code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!queueCode.trim()}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {step === 'details' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Almost there!
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Queue: <span className="font-semibold font-mono">{queueCode}</span>
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleJoinQueue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-gray-400">(for SMS updates)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Join Queue 🎉
              </button>

              <button
                type="button"
                onClick={() => { setStep('scan'); setError('') }}
                className="w-full text-gray-600 py-2"
              >
                ← Back
              </button>
            </form>
          </div>
        )}

        {step === 'loading' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Joining queue...</p>
          </div>
        )}

        {step === 'success' && ticketData && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              You&apos;re in!
            </h1>
            
            <div className="bg-blue-50 rounded-xl p-6 my-6">
              <p className="text-gray-600 mb-2">Your ticket number</p>
              <p className="text-5xl font-bold text-blue-600">#{ticketData.ticketNumber}</p>
            </div>

            <div className="space-y-2 text-left bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Queue:</span>
                <span className="font-semibold">{ticketData.queueName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-semibold">{ticketData.locationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Position:</span>
                <span className="font-semibold">{ticketData.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. wait:</span>
                <span className="font-semibold">~{ticketData.estimatedWaitMinutes} mins</span>
              </div>
            </div>

            {phone && (
              <p className="text-sm text-gray-500 mb-4">
                📱 We&apos;ll SMS you at {phone} when it&apos;s almost your turn
              </p>
            )}

            <button
              onClick={() => router.push(`/status/${ticketData.id}`)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Track My Position →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function JoinQueue() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    }>
      <JoinQueueContent />
    </Suspense>
  )
}
