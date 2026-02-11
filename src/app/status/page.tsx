'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CheckStatus() {
  const router = useRouter()
  const [ticketId, setTicketId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticketId.trim()) {
      router.push(`/status/${ticketId.trim()}`)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 px-4">
        <div className="container mx-auto">
          <Link href="/" className="text-2xl font-bold">
            e<span className="text-yellow-400">Wait</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-800">Check Your Status</h1>
            <p className="text-gray-600 mt-2">
              Enter your ticket ID to see your position
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket ID
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="Enter your ticket ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                You received this ID when you joined the queue
              </p>
            </div>

            <button
              type="submit"
              disabled={!ticketId.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Check Status
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/join" className="text-blue-600 hover:underline text-sm">
              Need to join a queue? →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
