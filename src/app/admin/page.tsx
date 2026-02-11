'use client'

import { useState } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

// Demo data - replace with API calls
const demoQueues = [
  { id: 'q1', name: 'Main Counter', waitingCount: 5, avgServiceTime: 5 },
  { id: 'q2', name: 'VIP Service', waitingCount: 2, avgServiceTime: 10 },
]

const demoEntries = [
  { id: 'e1', ticketNumber: 101, name: 'John Doe', status: 'WAITING', joinedAt: '10:30 AM', partySize: 2 },
  { id: 'e2', ticketNumber: 102, name: 'Jane Smith', status: 'WAITING', joinedAt: '10:35 AM', partySize: 1 },
  { id: 'e3', ticketNumber: 103, name: 'Bob Wilson', status: 'CALLED', joinedAt: '10:40 AM', partySize: 3 },
  { id: 'e4', ticketNumber: 104, name: 'Alice Brown', status: 'WAITING', joinedAt: '10:45 AM', partySize: 1 },
  { id: 'e5', ticketNumber: 105, name: 'Charlie Davis', status: 'WAITING', joinedAt: '10:50 AM', partySize: 2 },
]

export default function AdminDashboard() {
  const [selectedQueue, setSelectedQueue] = useState(demoQueues[0])
  const [entries, setEntries] = useState(demoEntries)
  const [showQR, setShowQR] = useState(false)

  const callNext = () => {
    const waiting = entries.filter(e => e.status === 'WAITING')
    if (waiting.length > 0) {
      setEntries(entries.map(e => 
        e.id === waiting[0].id ? { ...e, status: 'CALLED' } : e
      ))
    }
  }

  const markComplete = (id: string) => {
    setEntries(entries.map(e => 
      e.id === id ? { ...e, status: 'COMPLETED' } : e
    ))
  }

  const markNoShow = (id: string) => {
    setEntries(entries.map(e => 
      e.id === id ? { ...e, status: 'NO_SHOW' } : e
    ))
  }

  const waitingEntries = entries.filter(e => e.status === 'WAITING')
  const calledEntry = entries.find(e => e.status === 'CALLED')

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
            <span className="text-gray-600">Demo Business</span>
            <button className="text-gray-500 hover:text-gray-700">Logout</button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Queue Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">Your Queues</h2>
              <div className="space-y-2">
                {demoQueues.map(queue => (
                  <button
                    key={queue.id}
                    onClick={() => setSelectedQueue(queue)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedQueue.id === queue.id 
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
              <button className="w-full mt-4 border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors">
                + Create New Queue
              </button>
            </div>

            {/* QR Code */}
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
                  <p className="text-xs text-gray-500 mt-3">
                    Scan to join: {selectedQueue.name}
                  </p>
                  <button className="mt-3 text-sm text-blue-600 hover:underline">
                    Download QR
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Queue Management */}
          <div className="lg:col-span-2">
            {/* Currently Serving */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="font-semibold text-gray-700 mb-4">Now Serving</h2>
              {calledEntry ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-3xl font-bold text-green-600">#{calledEntry.ticketNumber}</span>
                      <p className="text-gray-600">{calledEntry.name}</p>
                      <p className="text-sm text-gray-500">Party of {calledEntry.partySize}</p>
                    </div>
                    <div className="space-x-2">
                      <button 
                        onClick={() => markComplete(calledEntry.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Complete ✓
                      </button>
                      <button 
                        onClick={() => markNoShow(calledEntry.id)}
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
                          <p className="font-medium">#{entry.ticketNumber} - {entry.name}</p>
                          <p className="text-sm text-gray-500">
                            Joined {entry.joinedAt} • Party of {entry.partySize}
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Call Now
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
