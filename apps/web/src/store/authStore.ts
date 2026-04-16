import { create } from 'zustand'
import api from '@/lib/api'

interface User {
  _id: string
  email: string
  name: string
  createdAt: string
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,  // true until fetchMe resolves

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const me = await api.get('/users/me')
    set({ user: me.data })
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const me = await api.get('/users/me')
    set({ user: me.data })
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await api.post('/auth/logout', { refreshToken })
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ user: null })
    }
  },

  fetchMe: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const { data } = await api.get('/users/me')
      set({ user: data })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      set({ loading: false })
    }
  },
}))
