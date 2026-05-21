import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'

// Pages — lazy-loaded for code splitting
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import AvatarStudioPage from './pages/AvatarStudioPage'
import GamePage from './pages/GamePage'
import DashboardPage from './pages/DashboardPage'
import LeaderboardPage from './pages/LeaderboardPage'
import StudyModePage from './pages/StudyModePage'
import GlossaryPage from './pages/GlossaryPage'
import CertificatePage from './pages/CertificatePage'
import AdminPage from './pages/AdminPage'

// Challenge redirect component
function ChallengeRedirect() {
  const { token } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/game?challenge=${encodeURIComponent(token)}`, { replace: true })
  }, [token, navigate])
  return null
}

export default function App() {
  const { loadFromStorage } = useAuthStore()

  // Restore auth state from localStorage on app mount
  useEffect(() => {
    loadFromStorage()
  }, [])

  return (
    <div className="min-h-screen bg-game-dark">
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/study" element={<StudyModePage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/certificate/:userId" element={<CertificatePage />} />

        {/* Challenge token redirect */}
        <Route path="/challenge/:token" element={<ChallengeRedirect />} />

        {/* Protected routes */}
        <Route
          path="/avatar"
          element={
            <ProtectedRoute>
              <AvatarStudioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
