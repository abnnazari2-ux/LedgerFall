import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import useGameStore, { CAREER_TITLES } from '../store/useGameStore'
import LivesRefillTimer from '../components/LivesRefillTimer'
import WhatsAppShareButton from '../components/WhatsAppShareButton'
import axiosClient from '../lib/axiosClient'

const BADGE_LIST = [
  { id: '8.1', src: '/assets/badges/8.1_caffeine_auditor_badge.png', name: 'Caffeine Auditor', desc: 'Played 10 sessions' },
  { id: '8.2', src: '/assets/badges/8.2_fraud_hunter_badge.png', name: 'Fraud Hunter', desc: 'Detected 10 fraud cases' },
  { id: '8.3', src: '/assets/badges/8.3_big4_legend_badge.png', name: 'Big 4 Legend', desc: 'Reached Partner title' },
  { id: '8.4', src: '/assets/badges/8.4_zero_hints_hero_badge.png', name: 'Zero Hints Hero', desc: 'Completed a level without hints' },
]

const WORLD_NAMES = ['', 'The Warehouse', 'The Office', 'The Bank', 'HR Department', 'Night Warehouse', 'The Rooftop']

function XPProgressBar({ xp, nextTitleXP, currentTitle }) {
  const currentTierIndex = CAREER_TITLES.findIndex((t) => t.title === currentTitle)
  const prevTierXP = currentTierIndex > 0 ? CAREER_TITLES[currentTierIndex - 1].minXP : 0
  const tierMax = nextTitleXP ? nextTitleXP - prevTierXP : 1
  const tierProgress = xp - prevTierXP
  const pct = nextTitleXP ? Math.min((tierProgress / tierMax) * 100, 100) : 100

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{currentTitle}</span>
        {nextTitleXP ? <span>{xp.toLocaleString()} / {nextTitleXP.toLocaleString()} XP</span> : <span>Max Rank!</span>}
      </div>
      <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-gray-700/50">
        <div
          className="h-full bg-gradient-to-r from-game-crimson to-game-gold rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {nextTitleXP && (
        <p className="text-gray-600 text-xs mt-1">
          {(nextTitleXP - xp).toLocaleString()} XP to {CAREER_TITLES[currentTierIndex + 1]?.title}
        </p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentWorld, currentLevel, lives, focus, coins, xp, careerTitle, nextTitleXP,
    streak, starsEarned, levelsCompleted, fraudCasesSolved, badgesEarned,
    secondsToNextLife, certificateEarned, loadProgress, updateLives, dailyChallenge,
  } = useGameStore()

  const [dailyChallengeData, setDailyChallengeData] = useState(null)
  const [myRank, setMyRank] = useState(null)

  useEffect(() => {
    loadProgress()
    // Fetch daily challenge
    axiosClient.get('/game/daily-challenge').then(({ data }) => setDailyChallengeData(data)).catch(() => {})
    // Fetch my rank
    axiosClient.get('/leaderboard/me/rank').then(({ data }) => setMyRank(data)).catch(() => {})
  }, [])

  const avatarSrc = user?.avatar_gender === 'female'
    ? '/assets/characters/1.2_female_auditor_avatar_default_idle.png'
    : '/assets/characters/1.1_male_auditor_avatar_default_idle.png'

  const shareMessage = `I'm playing LEDGERFALL - the professional audit simulation! I'm a ${careerTitle} with ${xp.toLocaleString()} XP. Can you beat me?`
  const shareUrl = window.location.origin

  return (
    <div className="min-h-screen bg-game-dark py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Player Card ── */}
        <div
          className="bg-gray-900/80 border border-game-gold/20 rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #111130 0%, #1a1a3e 100%)' }}
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-3 border-game-gold/40 bg-game-crimson/20 overflow-hidden flex items-center justify-center">
                <img src={avatarSrc} alt="avatar" className="h-20 w-20 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-game-crimson text-white text-xs font-bold px-2 py-0.5 rounded-full">
                W{currentWorld}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div>
                  <h1 className="text-white font-bold text-xl sm:text-2xl">{user?.display_name || 'Auditor'}</h1>
                  <p className="text-gray-400 text-sm">{user?.firm_name || 'Independent Auditor'}</p>
                </div>
                {myRank?.global && (
                  <div className="text-right shrink-0">
                    <p className="text-game-gold text-xs font-pixel">RANK</p>
                    <p className="text-white font-bold text-lg">#{myRank.global}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="bg-game-crimson/20 text-game-crimson text-xs font-medium px-2 py-0.5 rounded">
                  {careerTitle}
                </span>
                {streak > 0 && (
                  <span className="bg-game-amber/20 text-game-amber text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    🔥 {streak} day streak
                  </span>
                )}
                {user?.user_type && (
                  <span className="bg-gray-700/50 text-gray-400 text-xs px-2 py-0.5 rounded capitalize">
                    {user.user_type}
                  </span>
                )}
              </div>

              <XPProgressBar xp={xp} nextTitleXP={nextTitleXP} currentTitle={careerTitle} />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-700/50">
            {[
              { icon: '/assets/hud/2.5_gold_coin_icon.png', value: xp.toLocaleString(), label: 'Total XP' },
              { icon: '/assets/hud/2.6_gold_star_icon.png', value: starsEarned, label: 'Stars' },
              { icon: '/assets/ui/4.3_mission_accomplished_checklist.png', value: levelsCompleted, label: 'Levels' },
              { icon: '/assets/effects/9.2_fraud_alert_flash.png', value: fraudCasesSolved, label: 'Frauds' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <img src={stat.icon} alt="" className="h-6 w-6 object-contain mb-1" />
                <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main action grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Continue Button */}
          <div className="bg-gray-900/80 border border-game-crimson/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <img src="/assets/backgrounds/3.1_world1_warehouse_background.png" alt="" className="h-12 w-12 rounded-lg object-cover" style={{ filter: 'brightness(0.6)' }} />
              <div>
                <p className="text-gray-400 text-xs">Continue where you left off</p>
                <p className="text-white font-bold">World {currentWorld}: {WORLD_NAMES[currentWorld]}</p>
                <p className="text-game-amber text-xs">Level {currentLevel}</p>
              </div>
            </div>
            {lives > 0 ? (
              <button
                onClick={() => navigate('/game')}
                className="w-full bg-game-crimson hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Continue Audit
              </button>
            ) : (
              <div className="text-center">
                <p className="text-red-400 text-sm mb-3">No lives remaining</p>
                <LivesRefillTimer secondsToNextLife={secondsToNextLife} onExpire={loadProgress} />
              </div>
            )}
          </div>

          {/* Lives Panel */}
          <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold">Lives</h3>
              {lives === 0 && secondsToNextLife && (
                <LivesRefillTimer secondsToNextLife={secondsToNextLife} compact onExpire={loadProgress} />
              )}
            </div>
            <div className="flex gap-3 justify-center mb-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <img
                    src="/assets/hud/2.7_red_heart_icon.png"
                    alt="life"
                    className={`h-10 w-10 object-contain transition-all ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-90'}`}
                  />
                  {i < lives && <div className="w-1.5 h-1.5 bg-game-crimson rounded-full" />}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <img src="/assets/hud/2.3_focus_brain_icon.png" alt="focus" className="h-5 w-5 object-contain" />
              <span className="text-gray-400 text-sm">Focus:</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm border ${i < focus ? 'bg-game-blue border-game-blue' : 'bg-transparent border-gray-700'}`}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-xs">{focus}/5</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <img src="/assets/hud/2.5_gold_coin_icon.png" alt="coins" className="h-5 w-5 object-contain" />
              <span className="text-gray-400 text-sm">Coins:</span>
              <span className="text-game-gold font-bold">{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Daily Challenge ── */}
        <div
          className="bg-gray-900/80 border border-game-gold/30 rounded-xl p-5 relative overflow-hidden"
          style={{ boxShadow: '0 0 20px rgba(255,215,0,0.05)' }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-game-gold/5 rounded-full blur-2xl" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/assets/ui/4.6_xp_award_popup.png" alt="" className="h-12 w-12 object-contain animate-pulse" />
              <div>
                <p className="font-pixel text-game-gold text-xs mb-1">DAILY AUDIT CHALLENGE</p>
                <p className="text-white font-bold">
                  {dailyChallengeData?.title || 'Today\'s Challenge Available!'}
                </p>
                <p className="text-gray-400 text-xs">
                  {dailyChallengeData?.description || 'Complete today\'s special audit scenario for bonus XP'}
                </p>
                {dailyChallengeData?.bonus_xp && (
                  <p className="text-game-amber text-xs mt-1">+{dailyChallengeData.bonus_xp} bonus XP</p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/game')}
              disabled={lives === 0}
              className="sm:ml-auto bg-game-gold hover:bg-yellow-500 disabled:opacity-40 text-black font-bold px-6 py-2.5 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 whitespace-nowrap"
            >
              Start Challenge
            </button>
          </div>
        </div>

        {/* ── Badges ── */}
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4">Badges Earned</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {BADGE_LIST.map((badge) => {
              const earned = badgesEarned.includes(badge.id)
              return (
                <div
                  key={badge.id}
                  title={`${badge.name}: ${badge.desc}`}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    earned ? 'border-game-gold/40 bg-game-gold/5' : 'border-gray-800 opacity-30 grayscale'
                  }`}
                >
                  <img src={badge.src} alt={badge.name} className="h-10 w-10 object-contain" />
                  <span className="text-xs text-gray-400 text-center leading-tight hidden sm:block">{badge.name}</span>
                </div>
              )
            })}
            {/* Locked placeholders */}
            {[...Array(4)].map((_, i) => (
              <div key={`lock-${i}`} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-800 opacity-20">
                <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600 hidden sm:block">Locked</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/study', icon: '/assets/props/7.1_stacked_acca_textbooks.png', label: 'Study Mode', color: 'border-game-blue/30 hover:border-game-blue/60' },
            { to: '/leaderboard', icon: '/assets/ui/4.5_leaderboard_panel.png', label: 'Leaderboard', color: 'border-game-gold/30 hover:border-game-gold/60' },
            { to: '/glossary', icon: '/assets/props/7.2_worlds_okayest_auditor_mug.png', label: 'Glossary', color: 'border-game-amber/30 hover:border-game-amber/60' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`bg-gray-900/80 border rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:bg-white/5 ${link.color}`}
            >
              <img src={link.icon} alt="" className="h-8 w-8 object-contain" />
              <span className="text-gray-300 text-sm font-medium">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* ── Certificate section ── */}
        {certificateEarned ? (
          <div className="bg-gray-900/80 border border-game-gold/40 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <img src="/assets/props/7.4_acca_certificate_framed.png" alt="certificate" className="h-16 w-16 object-contain" />
              <div className="flex-1">
                <h3 className="text-game-gold font-bold">Certificate Earned!</h3>
                <p className="text-gray-300 text-sm">You've completed all 6 worlds. Your certificate is ready.</p>
              </div>
              <Link
                to={`/certificate/${user?.id}`}
                className="bg-game-gold hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                View
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-3">
              <img src="/assets/props/7.4_acca_certificate_framed.png" alt="certificate" className="h-12 w-12 object-contain opacity-50" />
              <div>
                <h3 className="text-white font-bold">Certificate of Completion</h3>
                <p className="text-gray-400 text-sm">Complete all 6 worlds to unlock your shareable certificate</p>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg overflow-hidden h-2">
              <div
                className="h-full bg-gradient-to-r from-game-crimson to-game-gold transition-all"
                style={{ width: `${Math.min((currentWorld - 1) / 6 * 100, 100)}%` }}
              />
            </div>
            <p className="text-gray-600 text-xs mt-1">{currentWorld - 1}/6 worlds completed</p>
          </div>
        )}

        {/* ── WhatsApp Share ── */}
        <div className="flex justify-center">
          <WhatsAppShareButton
            message={shareMessage}
            url={shareUrl}
            label="Challenge a Friend on WhatsApp"
            size="lg"
          />
        </div>
      </div>
    </div>
  )
}
