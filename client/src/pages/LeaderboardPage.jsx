import React, { useEffect, useState, useCallback } from 'react'
import useLeaderboardStore from '../store/useLeaderboardStore'
import useAuthStore from '../store/useAuthStore'
import { useRealtimeChannel } from '../hooks/useSupabase'

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600']
const MEDAL_EMOJIS = ['🥇', '🥈', '🥉']

const TABS = [
  { id: 'overall', label: 'Overall', icon: '🌍' },
  { id: 'student', label: 'Students', icon: '📚' },
  { id: 'professional', label: 'Professionals', icon: '💼' },
  { id: 'firm', label: 'Firms', icon: '🏢' },
  { id: 'weekly', label: 'Weekly', icon: '📅' },
  { id: 'monthly', label: 'Monthly', icon: '📆' },
  { id: 'daily', label: 'Daily Challenge', icon: '⚡' },
]

function RankRow({ rank, player, isMe, isFirm }) {
  const medalIndex = rank <= 3 ? rank - 1 : -1
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 transition-colors ${
        isMe ? 'bg-game-gold/8 border-l-2 border-l-game-gold' : 'hover:bg-white/3'
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {medalIndex >= 0 ? (
          <span className="text-lg">{MEDAL_EMOJIS[medalIndex]}</span>
        ) : (
          <span className={`font-bold text-sm ${isMe ? 'text-game-gold' : 'text-gray-500'}`}>
            {rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      {!isFirm && (
        <div className="shrink-0">
          <img
            src={
              player.avatar_gender === 'female'
                ? '/assets/characters/1.2_female_auditor_avatar_default_idle.png'
                : '/assets/characters/1.1_male_auditor_avatar_default_idle.png'
            }
            alt=""
            className="w-8 h-8 rounded-full object-contain bg-gray-800"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium text-sm truncate ${isMe ? 'text-game-gold' : 'text-white'}`}>
            {isFirm ? player.firm_name : (player.display_name || 'Auditor')}
            {isMe && <span className="text-xs ml-1">(you)</span>}
          </p>
        </div>
        <p className="text-gray-500 text-xs truncate">
          {isFirm
            ? `${player.member_count || 0} members`
            : `${player.career_title || 'Graduate Trainee'} · ${player.firm_name || ''}`}
        </p>
      </div>

      {/* XP */}
      <div className="text-right shrink-0">
        <p className={`font-bold text-sm ${medalIndex === 0 ? 'text-yellow-400' : isMe ? 'text-game-gold' : 'text-gray-300'}`}>
          {(player.total_xp || 0).toLocaleString()} XP
        </p>
        {!isFirm && player.stars_earned !== undefined && (
          <p className="text-gray-600 text-xs">{player.stars_earned || 0} ⭐</p>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message = 'No data yet. Be the first!' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <img src="/assets/ui/4.5_leaderboard_panel.png" alt="" className="h-16 w-16 object-contain opacity-30 mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const {
    globalRankings,
    firmRankings,
    dailyRankings,
    myRanks,
    isLoading,
    fetchGlobal,
    fetchFirm,
    fetchDaily,
    fetchMyRanks,
    subscribeToRealtime,
  } = useLeaderboardStore()

  const [activeTab, setActiveTab] = useState('overall')

  useEffect(() => {
    fetchGlobal('all')
    fetchFirm()
    fetchDaily()
    fetchMyRanks()
    const unsub = subscribeToRealtime()
    return unsub
  }, [])

  // Realtime: re-fetch on leaderboard change
  useRealtimeChannel(
    'leaderboard_updates',
    [
      {
        event: 'UPDATE',
        table: 'user_progress',
        callback: () => {
          if (activeTab === 'overall') fetchGlobal('all')
          else if (activeTab === 'student') fetchGlobal('student')
          else if (activeTab === 'professional') fetchGlobal('professional')
          else if (activeTab === 'daily') fetchDaily()
        },
      },
    ],
    [activeTab]
  )

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
    if (tabId === 'overall') fetchGlobal('all')
    else if (tabId === 'student') fetchGlobal('student')
    else if (tabId === 'professional') fetchGlobal('professional')
    else if (tabId === 'weekly') fetchGlobal('all', 'weekly')
    else if (tabId === 'monthly') fetchGlobal('all', 'monthly')
    else if (tabId === 'firm') fetchFirm()
    else if (tabId === 'daily') fetchDaily()
  }, [fetchGlobal, fetchFirm, fetchDaily])

  const getTabData = () => {
    switch (activeTab) {
      case 'overall': return { data: globalRankings.all || [], isFirm: false }
      case 'student': return { data: globalRankings.student || [], isFirm: false }
      case 'professional': return { data: globalRankings.professional || [], isFirm: false }
      case 'firm': return { data: firmRankings, isFirm: true }
      case 'weekly': return { data: globalRankings.all || [], isFirm: false }
      case 'monthly': return { data: globalRankings.all || [], isFirm: false }
      case 'daily': return { data: dailyRankings, isFirm: false }
      default: return { data: [], isFirm: false }
    }
  }

  const { data: rankings, isFirm } = getTabData()
  const myRankValue = activeTab === 'firm' ? myRanks.firm : activeTab === 'daily' ? myRanks.daily : myRanks.global

  return (
    <div className="min-h-screen bg-game-dark py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/assets/ui/4.5_leaderboard_panel.png" alt="" className="h-10 w-10 object-contain" />
            <h1 className="font-pixel text-game-gold text-lg sm:text-xl leading-relaxed">
              LEADERBOARD
            </h1>
          </div>
          {myRankValue && (
            <p className="text-gray-400 text-sm">
              Your rank: <span className="text-game-gold font-bold">#{myRankValue}</span>
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-game-crimson text-white shadow'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-black/20 border-b border-gray-700/50">
            <div className="w-8" />
            {!isFirm && <div className="w-8 shrink-0" />}
            <div className="flex-1">
              <span className="text-gray-400 text-xs uppercase tracking-widest">
                {isFirm ? 'Firm' : 'Player'}
              </span>
            </div>
            <span className="text-gray-400 text-xs uppercase tracking-widest shrink-0">XP</span>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-game-gold/30 border-t-game-gold rounded-full animate-spin" />
            </div>
          )}

          {/* Rankings */}
          {!isLoading && rankings.length > 0 && rankings.map((player, i) => (
            <RankRow
              key={player.id || i}
              rank={i + 1}
              player={player}
              isMe={!isFirm && user?.id && player.user_id === user.id}
              isFirm={isFirm}
            />
          ))}

          {!isLoading && rankings.length === 0 && <EmptyState />}
        </div>

        {/* My rank callout (if not in top 25) */}
        {myRankValue && myRankValue > 25 && !isFirm && user && (
          <div className="mt-4 bg-game-gold/10 border border-game-gold/30 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-game-gold/20 flex items-center gap-2">
              <span className="text-game-gold text-xs font-pixel">YOUR RANK</span>
            </div>
            <RankRow
              rank={myRankValue}
              player={{
                display_name: user.display_name,
                firm_name: user.firm_name,
                career_title: user.career_title,
                avatar_gender: user.avatar_gender,
                total_xp: user.total_xp || 0,
              }}
              isMe
              isFirm={false}
            />
          </div>
        )}

        {/* Real-time note */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-500 text-xs">Live updates via Supabase Realtime</span>
        </div>
      </div>
    </div>
  )
}
