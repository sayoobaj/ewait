import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'MANAGER' | 'STAFF'
}

interface AppState {
  user: User | null
  selectedLocationId: string | null
  selectedQueueId: string | null
  setUser: (user: User | null) => void
  setSelectedLocation: (id: string | null) => void
  setSelectedQueue: (id: string | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      selectedLocationId: null,
      selectedQueueId: null,
      setUser: (user) => set({ user }),
      setSelectedLocation: (id) => set({ selectedLocationId: id }),
      setSelectedQueue: (id) => set({ selectedQueueId: id }),
      logout: () => set({ user: null, selectedLocationId: null, selectedQueueId: null })
    }),
    {
      name: 'ewait-storage'
    }
  )
)
