import { create } from 'zustand'
import axiosClient from '../lib/axiosClient'

const CAREER_TITLES = [
  { title: 'Graduate Trainee', minXP: 0 },
  { title: 'Junior Associate', minXP: 500 },
  { title: 'Audit Associate', minXP: 1500 },
  { title: 'Senior Associate', minXP: 3000 },
  { title: 'Audit Manager', minXP: 6000 },
  { title: 'Senior Manager', minXP: 10000 },
  { title: 'Director', minXP: 15000 },
  { title: 'Partner', minXP: 25000 },
]

function getCareerTitle(xp) {
  let title = CAREER_TITLES[0].title
  for (const tier of CAREER_TITLES) {
    if (xp >= tier.minXP) title = tier.title
  }
  return title
}

function getNextTitleXP(xp) {
  for (const tier of CAREER_TITLES) {
    if (xp < tier.minXP) return tier.minXP
  }
  return null
}

const useGameStore = create((set, get) => ({
  currentWorld: 1,
  currentLevel: 1,
  lives: 3,
  focus: 5,
  coins: 0,
  xp: 0,
  careerTitle: 'Graduate Trainee',
  nextTitleXP: 500,
  streak: 0,
  notesCollected: 0,
  starsEarned: 0,
  levelsCompleted: 0,
  fraudCasesSolved: 0,
  badgesEarned: [],
  secondsToNextLife: null,
  isLoadingProgress: false,
  dailyChallenge: null,
  certificateEarned: false,

  loadProgress: async () => {
    set({ isLoadingProgress: true })
    try {
      const [progressRes, livesRes] = await Promise.all([
        axiosClient.get('/users/progress'),
        axiosClient.get('/game/lives'),
      ])
      const p = progressRes.data
      const l = livesRes.data
      set({
        currentWorld: p.current_world || 1,
        currentLevel: p.current_level || 1,
        xp: p.total_xp || 0,
        coins: p.coins || 0,
        streak: p.streak || 0,
        notesCollected: p.notes_collected || 0,
        starsEarned: p.stars_earned || 0,
        levelsCompleted: p.levels_completed || 0,
        fraudCasesSolved: p.fraud_cases_solved || 0,
        badgesEarned: p.badges_earned || [],
        careerTitle: getCareerTitle(p.total_xp || 0),
        nextTitleXP: getNextTitleXP(p.total_xp || 0),
        lives: l.lives ?? 3,
        secondsToNextLife: l.seconds_to_next_life || null,
        certificateEarned: p.certificate_earned || false,
        isLoadingProgress: false,
      })
    } catch (err) {
      console.error('Failed to load progress:', err)
      set({ isLoadingProgress: false })
    }
  },

  updateLives: (count, secondsToNext) => {
    set({ lives: count, secondsToNextLife: secondsToNext ?? null })
  },

  spendFocus: () => {
    const current = get().focus
    if (current > 0) set({ focus: current - 1 })
  },

  resetFocus: () => set({ focus: 5 }),

  gainXP: (amount) => {
    const newXP = get().xp + amount
    set({
      xp: newXP,
      careerTitle: getCareerTitle(newXP),
      nextTitleXP: getNextTitleXP(newXP),
    })
  },

  gainCoins: (amount) => set({ coins: get().coins + amount }),

  setLevel: (world, level) => set({ currentWorld: world, currentLevel: level }),

  setDailyChallenge: (challenge) => set({ dailyChallenge: challenge }),
}))

export { CAREER_TITLES, getCareerTitle, getNextTitleXP }
export default useGameStore
