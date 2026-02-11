'use client'

import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

interface SocketStore {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  joinQueue: (queueId: string) => void
  leaveQueue: (queueId: string) => void
  joinEntry: (entryId: string) => void
}

export const useSocket = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    const { socket } = get()
    if (socket?.connected) return

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      path: '/api/socketio',
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      set({ isConnected: true })
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      set({ isConnected: false })
    })

    set({ socket: newSocket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },

  joinQueue: (queueId: string) => {
    const { socket } = get()
    if (socket) {
      socket.emit('join-queue', queueId)
    }
  },

  leaveQueue: (queueId: string) => {
    const { socket } = get()
    if (socket) {
      socket.emit('leave-queue', queueId)
    }
  },

  joinEntry: (entryId: string) => {
    const { socket } = get()
    if (socket) {
      socket.emit('join-entry', entryId)
    }
  }
}))

// Socket event types
export interface QueueUpdateEvent {
  type: 'entry-added' | 'entry-called' | 'entry-completed' | 'entry-cancelled'
  queueId: string
  entry?: {
    id: string
    ticketNumber: number
    status: string
  }
  waitingCount: number
}

export interface EntryUpdateEvent {
  type: 'status-changed' | 'position-changed'
  entryId: string
  status: string
  position: number
  peopleAhead: number
  estimatedWaitMinutes: number
}
