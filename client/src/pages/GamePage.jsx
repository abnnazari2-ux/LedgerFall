import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useGameStore from '../store/useGameStore'
import LivesRefillTimer from '../components/LivesRefillTimer'
import PhaserGame from '../game/PhaserGame'

export default function GamePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { lives, secondsToNextLife, loadProgress } = useGameStore()

  const challengeToken = searchParams.get('challenge')
  const worldParam = searchParams.get('world')
  const levelParam = searchParams.get('level')

  useEffect(() => {
    loadProgress()
  }, [])

  // Pass context to Phaser via window globals (Phaser reads on scene init)
  useEffect(() => {
    window.__ledgerfall_context = {
      challengeToken,
      world: worldParam ? parseInt(worldParam) : null,
      level: levelParam ? parseInt(levelParam) : null,
    }
    return () => { window.__ledgerfall_context = null }
  }, [challengeToken, worldParam, levelParam])

  // ESC to exit
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') navigate('/dashboard') }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  return (
    <div className="fixed inset-0 bg-game-dark overflow-hidden">
      {/* Phaser Game */}
      <PhaserGame />

      {/* Lives depleted overlay */}
      {lives === 0 && secondsToNextLife && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-40">
          <div className="flex flex-col items-center gap-6 text-center px-6">
            <div className="flex gap-3">
              {[...Array(3)].map((_, i) => (
                <img key={i} src="/assets/hud/2.7_red_heart_icon.png" alt="" className="w-10 h-10 object-contain opacity-20" />
              ))}
            </div>
            <div>
              <p className="font-pixel text-game-crimson text-sm mb-2">OUT OF LIVES</p>
              <p className="text-gray-300 text-sm">Your lives will refill automatically</p>
            </div>
            <LivesRefillTimer
              secondsToNextLife={secondsToNextLife}
              onExpire={() => loadProgress()}
            />
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white text-sm transition-colors mt-2"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-4 left-4 z-30 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg transition-colors border border-gray-700/50"
      >
        ← Exit
      </button>
    </div>
  )
}
