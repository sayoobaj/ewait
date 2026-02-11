'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Analytics {
  summary: {
    totalJoins: number
    completed: number
    noShows: number
    cancelled: number
    waiting: number
  }
  dailyStats: Array<{
    date: string
    totalJoins: number
    totalServed: number
    avgWaitMinutes: number | null
  }>
  recentEntries: Array<{
    id: string
    ticketNumber: number
    name: string | null
    status: string
    joinedAt: string
    queueName: string
  }>
  topQueues: Array<{
    queueId: string
    queueName: string
    count: number
  }>
  locations: Array<{ id: string; name: string }>
}

export default function AnalyticsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?days=${days}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Fetch analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'WAITING': return 'bg-yellow-100 text-yellow-800'
      case 'CALLED': return 'bg-blue-100 text-blue-800'
      case 'NO_SHOW': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  const completionRate = analytics.summary.totalJoins > 0
    ? Math.round((analytics.summary.completed / analytics.summary.totalJoins) * 100)
    : 0

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-2xl font-bold text-blue-600">
              e<span className="text-yellow-500">Wait</span>
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-600">Analytics</span>
          </div>
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Period Selector */}
        <div className="flex justify-end mb-6">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">Total Joins</p>
            <p className="text-3xl font-bold text-gray-800">{analytics.summary.totalJoins}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">Served</p>
            <p className="text-3xl font-bold text-green-600">{analytics.summary.completed}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">No Shows</p>
            <p className="text-3xl font-bold text-red-600">{analytics.summary.noShows}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-3xl font-bold text-gray-600">{analytics.summary.cancelled}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-3xl font-bold text-blue-600">{completionRate}%</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Queues */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Queues</h2>
            {analytics.topQueues.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topQueues.map((queue, i) => (
                  <div key={queue.queueId} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-gray-700">{queue.queueName}</span>
                    <span className="text-gray-500">{queue.count} joins</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
            {analytics.recentEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.recentEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">#{entry.ticketNumber}</span>
                      <span className="text-gray-500 ml-2">{entry.name || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Daily Chart (simple bar representation) */}
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Joins</h2>
          {analytics.dailyStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data for this period</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {analytics.dailyStats.map((day, i) => {
                const maxJoins = Math.max(...analytics.dailyStats.map(d => d.totalJoins), 1)
                const height = (day.totalJoins / maxJoins) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: day.totalJoins > 0 ? '4px' : '0' }}
                    />
                    <span className="text-xs text-gray-400 mt-2">
                      {new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
