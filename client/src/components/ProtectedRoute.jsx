import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

export default function ProtectedRoute({ children }) {
  const { user, token, isLoading } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!user && !token) {
      const stored = localStorage.getItem('ledgerfall_token')
      if (stored) {
        useAuthStore.getState().loadFromStorage()
      }
    }
  }, [user, token])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-game-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-pixel text-game-gold text-xs">LOADING...</p>
        </div>
      </div>
    )
  }

  if (!user && !localStorage.getItem('ledgerfall_token')) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
