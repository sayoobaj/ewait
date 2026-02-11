'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

interface Queue {
  id: string
  name: string
  description: string | null
  isActive: boolean
  avgServiceTime: number
  waitingCount: number
}

interface QueueEntry {
  id: string
  ticketNumber: number
  name: string | null
  phone: string | null
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  partySize: number
  joinedAt: string
  calledAt: string | null
}

interface Location {
  id: string
  name: string
  queues: Queue[]
}

// Demo owner ID - in production this comes from auth
const DEMO_OWNER_ID = 'demo-owner-123'

export default function AdminDashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  const [entries, setEntries] = useState<QueueEntry[]>([])
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')

  // Fetch locations and queues
  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(`/api/locations?ownerId=${DEMO_OWNER_ID}`)
      const data = await res.json()
      setLocations(Array.isArray(data) ? data : [])
      
      // Auto-select first queue if none selected
      if (!selectedQueue && data.length > 0 && data[0].queues?.length > 0) {
        setSelectedQueue(data[0].queues[0])
      }
    } catch (error) {
      console.error('Fetch locations error:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedQueue])

  // Fetch entries for selected queue
  const fetchEntries = useCallback(async () => {
    if (!selectedQueue) return

    try {
      const res = await fetch(`/api/queues/${selectedQueue.id}`)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Fetch entries error:', error)
    }
  }, [selectedQueue])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  useEffect(() => {
    if (selectedQueue) {
      fetchEntries()
      // Poll every 5 seconds
      const interval = setInterval(fetchEntries, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedQueue, fetchEntries])

  const createLocation = async () => {
    if (!newLocationName.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLocationName.trim(),
          ownerId: DEMO_OWNER_ID
        })
      })

      if (res.ok) {
        setNewLocationName('')
        fetchLocations()
      }
    } catch (error) {
      console.error('Create location error:', error)
    } finally {
      setCreating(false)
    }
  }

  const callNext = async () => {
    if (!selectedQueue) return

    try {
      const res = await fetch(`/api/queues/${selectedQueue.id}/call-next`, {
        method: 'POST'
      })
      if (res.ok) {
        fetchEntries()
        fetchLocations()
      }
    } catch (error) {
      console.error('Call next error:', error)
    }
  }

  const updateEntryStatus = async (entryId: string, status: string) => {
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchEntries()
        fetchLocations()
      }
    } catch (error) {
      console.error('Update entry error:', error)
    }
  }

  const waitingEntries = entries.filter(e => e.status === 'WAITING')
  const calledEntry = entries.find(e => e.status === 'CALLED' || e.status === 'SERVING')
  const allQueues = locations.flatMap(l => l.queues)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            e<span className="text-yellow-500">Wait</span>
            <span className="text-sm font-normal text-gray-500 ml-2">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{locations[0]?.name || 'No Location'}</span>
            <Link href="/admin/login" className="text-gray-500 hover:text-gray-700">Logout</Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* No locations state */}
        {locations.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Create Your First Location</h2>
            <p className="text-gray-600 mb-6">Add a business location to start managing queues</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Business name"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={createLocation}
                disabled={creating || !newLocationName.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        {locations.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Queue Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow p-4 mb-4">
                <h2 className="font-semibold text-gray-700 mb-3">Your Queues</h2>
                <div className="space-y-2">
                  {allQueues.map(queue => (
                    <button
                      key={queue.id}
                      onClick={() => setSelectedQueue(queue)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedQueue?.id === queue.id 
                          ? 'bg-blue-50 border-2 border-blue-500' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{queue.name}</span>
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                          {queue.waitingCount} waiting
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              {selectedQueue && (
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-gray-700">Queue QR Code</h2>
                    <button 
                      onClick={() => setShowQR(!showQR)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {showQR ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showQR && (
                    <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                      <QRCode 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?q=${selectedQueue.id}`}
                        size={180}
                      />
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Scan to join: {selectedQueue.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Code: {selectedQueue.id.slice(0, 8)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Queue Management */}
            <div className="lg:col-span-2">
              {!selectedQueue ? (
                <div className="bg-white rounded-xl shadow p-8 text-center">
                  <p className="text-gray-500">Select a queue to manage</p>
                </div>
              ) : (
                <>
                  {/* Currently Serving */}
                  <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <h2 className="font-semibold text-gray-700 mb-4">Now Serving</h2>
                    {calledEntry ? (
                      <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-3xl font-bold text-green-600">#{calledEntry.ticketNumber}</span>
                            <p className="text-gray-600">{calledEntry.name || 'Guest'}</p>
                            <p className="text-sm text-gray-500">Party of {calledEntry.partySize}</p>
                          </div>
                          <div className="space-x-2">
                            <button 
                              onClick={() => updateEntryStatus(calledEntry.id, 'COMPLETED')}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                              Complete ✓
                            </button>
                            <button 
                              onClick={() => updateEntryStatus(calledEntry.id, 'NO_SHOW')}
                              className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200"
                            >
                              No Show
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-4xl mb-2">🎯</p>
                        <p>No one is currently being served</p>
                      </div>
                    )}
                  </div>

                  {/* Call Next */}
                  <button
                    onClick={callNext}
                    disabled={waitingEntries.length === 0}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors mb-6 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    📢 Call Next ({waitingEntries.length} waiting)
                  </button>

                  {/* Waiting List */}
                  <div className="bg-white rounded-xl shadow">
                    <div className="p-4 border-b">
                      <h2 className="font-semibold text-gray-700">Waiting List</h2>
                    </div>
                    <div className="divide-y">
                      {waitingEntries.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <p className="text-4xl mb-2">✨</p>
                          <p>No one is waiting</p>
                        </div>
                      ) : (
                        waitingEntries.map((entry, index) => (
                          <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium">#{entry.ticketNumber} - {entry.name || 'Guest'}</p>
                                <p className="text-sm text-gray-500">
                                  Joined {new Date(entry.joinedAt).toLocaleTimeString()} • Party of {entry.partySize}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => updateEntryStatus(entry.id, 'CALLED')}
                                className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 bg-blue-50 rounded"
                              >
                                Call Now
                              </button>
                              <button 
                                onClick={() => updateEntryStatus(entry.id, 'CANCELLED')}
                                className="text-red-600 hover:text-red-800 text-sm px-3 py-1 bg-red-50 rounded"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
