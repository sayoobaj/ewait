'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function JoinQueue() {
  const [queueCode, setQueueCode] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'scan' | 'details' | 'success'>('scan')
  const [ticketNumber, setTicketNumber] = useState<number | null>(null)

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (queueCode.trim()) {
      setStep('details')
    }
  }

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API call to join queue
    // For now, simulate success
    setTicketNumber(Math.floor(Math.random() * 100) + 1)
    setStep('success')
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

            {/* QR Scanner Placeholder */}
            <div className="bg-gray-100 rounded-xl p-8 mb-6 text-center">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-gray-600 mb-4">
                Scan QR code to join queue
              </p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Open Camera
              </button>
            </div>

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
                onChange={(e) => setQueueCode(e.target.value.toUpperCase())}
                placeholder="Enter queue code (e.g., ABC123)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={8}
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
              Queue: <span className="font-semibold">{queueCode}</span>
            </p>

            <form onSubmit={handleJoinQueue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (for notifications)
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
                onClick={() => setStep('scan')}
                className="w-full text-gray-600 py-2"
              >
                ← Back
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              You&apos;re in the queue!
            </h1>
            
            <div className="bg-blue-50 rounded-xl p-6 my-6">
              <p className="text-gray-600 mb-2">Your ticket number</p>
              <p className="text-5xl font-bold text-blue-600">#{ticketNumber}</p>
            </div>

            <div className="space-y-2 text-left bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Position in queue:</span>
                <span className="font-semibold">3rd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated wait:</span>
                <span className="font-semibold">~15 mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">People ahead:</span>
                <span className="font-semibold">2</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              We&apos;ll notify you when it&apos;s almost your turn!
            </p>

            <Link
              href={`/status/${ticketNumber}`}
              className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Track My Position
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
