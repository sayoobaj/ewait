'use client'

import { useEffect, useState, use } from 'react'

interface QueueEntry {
  id: string
  ticketNumber: number
  name: string | null
  status: 'WAITING' | 'CALLED' | 'SERVING'
  partySize: number
}

interface QueueData {
  id: string
  name: string
  location: {
    name: string
  }
  entries: QueueEntry[]
  waitingCount: number
}

export default function QueueDisplay({ params }: { params: Promise<{ queueId: string }> }) {
  const resolvedParams = use(params)
  const [queue, setQueue] = useState<QueueData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`/api/queues/${resolvedParams.queueId}`)
        if (res.ok) {
          const data = await res.json()
          setQueue(data)
        }
      } catch (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchQueue()
    // Poll every 3 seconds for responsive updates
    const interval = setInterval(fetchQueue, 3000)
    return () => clearInterval(interval)
  }, [resolvedParams.queueId])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!queue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  const calledEntries = queue.entries.filter(e => e.status === 'CALLED' || e.status === 'SERVING')
  const waitingEntries = queue.entries.filter(e => e.status === 'WAITING')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">{queue.location.name}</h1>
          <p className="text-xl text-blue-300">{queue.name}</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold text-white font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xl text-gray-400">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Now Serving */}
        <div className="bg-green-600/90 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white/80 mb-6">NOW SERVING</h2>
          {calledEntries.length > 0 ? (
            <div className="space-y-4">
              {calledEntries.map(entry => (
                <div key={entry.id} className="bg-white/20 rounded-2xl p-6 backdrop-blur animate-pulse">
                  <p className="text-8xl font-bold text-white text-center">
                    #{entry.ticketNumber}
                  </p>
                  {entry.name && (
                    <p className="text-2xl text-white/80 text-center mt-2">{entry.name}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-2xl p-8 text-center">
              <p className="text-4xl text-white/60">—</p>
              <p className="text-white/60 mt-2">Waiting for next customer</p>
            </div>
          )}
        </div>

        {/* Waiting */}
        <div className="bg-gray-800/90 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white/80">WAITING</h2>
            <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-xl font-semibold">
              {waitingEntries.length}
            </span>
          </div>
          
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {waitingEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl">✨</p>
                <p className="text-white/60 mt-2">No one waiting</p>
              </div>
            ) : (
              waitingEntries.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index === 0 ? 'bg-yellow-500 text-gray-900' : 'bg-blue-600/30 text-blue-300'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-3xl font-bold text-white">#{entry.ticketNumber}</span>
                  </div>
                  {entry.name && (
                    <span className="text-white/60">{entry.name}</span>
                  )}
                </div>
              ))
            )}
            {waitingEntries.length > 10 && (
              <p className="text-center text-white/40 py-2">
                +{waitingEntries.length - 10} more waiting
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-2xl text-white/60">
          Scan QR code to join the queue
        </p>
        <p className="text-blue-400 mt-2">
          e<span className="text-yellow-400">Wait</span>
        </p>
      </div>
    </div>
  )
}
