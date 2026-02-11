'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface EntryStatus {
  id: string
  ticketNumber: number
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  position: number
  peopleAhead: number
  estimatedWaitMinutes: number
  joinedAt: string
  calledAt: string | null
  queueName: string
  locationName: string
}

export default function StatusPage() {
  const params = useParams()
  const [entry, setEntry] = useState<EntryStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/entries/${params.id}`)
        if (!res.ok) {
          throw new Error('Entry not found')
        }
        const data = await res.json()
        setEntry(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load status')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-100 text-yellow-800'
      case 'CALLED': return 'bg-green-100 text-green-800 animate-pulse'
      case 'SERVING': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
      case 'NO_SHOW': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'WAITING': return '⏳'
      case 'CALLED': return '🔔'
      case 'SERVING': return '✅'
      case 'COMPLETED': return '🎉'
      case 'CANCELLED': return '❌'
      case 'NO_SHOW': return '👻'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your status...</p>
        </div>
      </main>
    )
  }

  if (error || !entry) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'Could not find your queue entry'}</p>
          <Link href="/join" className="text-blue-600 hover:underline">
            Join a new queue →
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`py-6 px-4 ${entry.status === 'CALLED' ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
        <div className="container mx-auto">
          <Link href="/" className="text-2xl font-bold">
            e<span className="text-yellow-400">Wait</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Called Alert */}
        {entry.status === 'CALLED' && (
          <div className="bg-green-500 text-white rounded-2xl p-6 mb-6 text-center animate-bounce">
            <div className="text-4xl mb-2">🔔</div>
            <h2 className="text-2xl font-bold">It&apos;s Your Turn!</h2>
            <p>Please proceed to the counter</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Location Info */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <p className="text-sm text-gray-500">Queue</p>
            <p className="font-semibold text-gray-800">{entry.queueName}</p>
            <p className="text-sm text-gray-600">{entry.locationName}</p>
          </div>

          {/* Ticket Number */}
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-2">Your Ticket</p>
            <p className="text-6xl font-bold text-blue-600">#{entry.ticketNumber}</p>
          </div>

          {/* Status Badge */}
          <div className="px-6 pb-4 text-center">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(entry.status)}`}>
              {getStatusEmoji(entry.status)} {entry.status}
            </span>
          </div>

          {/* Stats */}
          {entry.status === 'WAITING' && (
            <div className="border-t px-6 py-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{entry.position}</p>
                  <p className="text-xs text-gray-500">Position</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{entry.peopleAhead}</p>
                  <p className="text-xs text-gray-500">Ahead</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">~{entry.estimatedWaitMinutes}m</p>
                  <p className="text-xs text-gray-500">Wait</p>
                </div>
              </div>
            </div>
          )}

          {/* Joined Time */}
          <div className="border-t px-6 py-4 text-center text-sm text-gray-500">
            Joined at {new Date(entry.joinedAt).toLocaleTimeString()}
          </div>
        </div>

        {/* Auto-refresh notice */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Auto-refreshing every 10 seconds
        </p>
      </div>
    </main>
  )
}
