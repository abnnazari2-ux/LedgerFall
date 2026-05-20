import React, { useState, useEffect } from 'react'

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function LivesRefillTimer({ secondsToNextLife, onExpire, compact = false }) {
  const [remaining, setRemaining] = useState(secondsToNextLife || 0)

  useEffect(() => {
    setRemaining(secondsToNextLife || 0)
  }, [secondsToNextLife])

  useEffect(() => {
    if (!remaining || remaining <= 0) return

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remaining, onExpire])

  if (!secondsToNextLife || secondsToNextLife <= 0) return null

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-game-amber">
        <img src="/assets/hud/2.7_red_heart_icon.png" alt="life" className="w-4 h-4 object-contain opacity-50" />
        <span className="font-pixel text-xs">{formatTime(remaining)}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-black/60 border border-game-crimson/50 rounded-lg px-6 py-4">
      <div className="flex gap-2 items-center">
        <img src="/assets/hud/2.7_red_heart_icon.png" alt="life" className="w-6 h-6 object-contain opacity-40" />
        <span className="text-gray-300 text-sm">Next life in</span>
      </div>
      <span className="font-pixel text-game-gold text-2xl tracking-widest">{formatTime(remaining)}</span>
      <p className="text-gray-500 text-xs text-center">Lives refill automatically over time</p>
    </div>
  )
}
