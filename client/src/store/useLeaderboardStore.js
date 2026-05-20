import { create } from 'zustand'
import axiosClient from '../lib/axiosClient'
import supabase from '../lib/supabaseClient'

const useLeaderboardStore = create((set, get) => ({
  globalRankings: { all: [], student: [], professional: [] },
  firmRankings: [],
  dailyRankings: [],
  weeklyRankings: [],
  monthlyRankings: [],
  myRanks: {},
  isLoading: false,
  realtimeSubscribed: false,

  fetchGlobal: async (type = 'all', period = 'all') => {
    set({ isLoading: true })
    try {
      const { data } = await axiosClient.get('/leaderboard/global', {
        params: { type, period },
      })
      const rankings = data.rankings || data || []
      set((state) => ({
        globalRankings: {
          ...state.globalRankings,
          [type]: rankings,
        },
        isLoading: false,
      }))
    } catch (err) {
      console.error('Failed to fetch global rankings:', err)
      set({ isLoading: false })
    }
  },

  fetchFirm: async () => {
    set({ isLoading: true })
    try {
      const { data } = await axiosClient.get('/leaderboard/firm')
      set({ firmRankings: data.rankings || data || [], isLoading: false })
    } catch (err) {
      console.error('Failed to fetch firm rankings:', err)
      set({ isLoading: false })
    }
  },

  fetchDaily: async () => {
    set({ isLoading: true })
    try {
      const { data } = await axiosClient.get('/leaderboard/daily')
      set({ dailyRankings: data.rankings || data || [], isLoading: false })
    } catch (err) {
      console.error('Failed to fetch daily rankings:', err)
      set({ isLoading: false })
    }
  },

  fetchMyRanks: async () => {
    try {
      const { data } = await axiosClient.get('/leaderboard/me/rank')
      set({ myRanks: data || {} })
    } catch (err) {
      console.error('Failed to fetch my ranks:', err)
    }
  },

  subscribeToRealtime: () => {
    if (get().realtimeSubscribed) return

    const channel = supabase
      .channel('leaderboard_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leaderboard_global' }, () => {
        get().fetchGlobal('all')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leaderboard_global' }, () => {
        get().fetchGlobal('all')
      })
      .subscribe()

    set({ realtimeSubscribed: true })
    return () => supabase.removeChannel(channel)
  },
}))

export default useLeaderboardStore
