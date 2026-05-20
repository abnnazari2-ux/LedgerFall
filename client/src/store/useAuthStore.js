import { create } from 'zustand'
import axiosClient from '../lib/axiosClient'

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,

  loadFromStorage: () => {
    const token = localStorage.getItem('ledgerfall_token')
    const userStr = localStorage.getItem('ledgerfall_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ user, token })
      } catch {
        localStorage.removeItem('ledgerfall_token')
        localStorage.removeItem('ledgerfall_user')
      }
    }
  },

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const { data } = await axiosClient.post('/auth/login', credentials)
      const { token, user } = data
      localStorage.setItem('ledgerfall_token', token)
      localStorage.setItem('ledgerfall_user', JSON.stringify(user))
      set({ user, token, isLoading: false })
      return { success: true, user }
    } catch (error) {
      set({ isLoading: false })
      const message = error.response?.data?.message || 'Login failed. Please try again.'
      return { success: false, error: message }
    }
  },

  register: async (userData) => {
    set({ isLoading: true })
    try {
      const { data } = await axiosClient.post('/auth/register', userData)
      const { token, user } = data
      localStorage.setItem('ledgerfall_token', token)
      localStorage.setItem('ledgerfall_user', JSON.stringify(user))
      set({ user, token, isLoading: false })
      return { success: true, user, isNew: true }
    } catch (error) {
      set({ isLoading: false })
      const message = error.response?.data?.message || 'Registration failed. Please try again.'
      return { success: false, error: message }
    }
  },

  logout: () => {
    localStorage.removeItem('ledgerfall_token')
    localStorage.removeItem('ledgerfall_user')
    set({ user: null, token: null })
    window.location.href = '/'
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates }
    localStorage.setItem('ledgerfall_user', JSON.stringify(updated))
    set({ user: updated })
  },
}))

export default useAuthStore
