import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import useGameStore from '../store/useGameStore'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/study', label: 'Study' },
  { to: '/glossary', label: 'Glossary' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { lives, xp, careerTitle } = useGameStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Hide navbar on game page
  if (location.pathname === '/game') return null

  const avatarSrc = user?.avatar_gender === 'female'
    ? '/assets/characters/1.2_female_auditor_avatar_default_idle.png'
    : '/assets/characters/1.1_male_auditor_avatar_default_idle.png'

  return (
    <nav className="bg-game-dark border-b border-game-crimson sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/assets/logo/10.2_ledgerfall_app_icon.png"
              alt="LEDGERFALL"
              className="h-8 w-8 object-contain"
            />
            <span className="font-pixel text-game-gold text-xs hidden sm:block tracking-wider">
              LEDGERFALL
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  location.pathname === link.to
                    ? 'text-game-gold bg-game-crimson/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Lives indicator */}
                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <img
                      key={i}
                      src="/assets/hud/2.7_red_heart_icon.png"
                      alt="life"
                      className={`h-5 w-5 object-contain transition-opacity ${i < lives ? 'opacity-100' : 'opacity-25'}`}
                    />
                  ))}
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full pr-3 pl-1 py-1 transition-colors"
                  >
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="h-8 w-8 object-contain rounded-full bg-game-crimson/20"
                    />
                    <div className="hidden sm:block text-left">
                      <p className="text-white text-xs font-medium leading-tight">
                        {user.display_name || 'Auditor'}
                      </p>
                      <p className="text-game-gold text-xs leading-tight opacity-75">
                        {careerTitle}
                      </p>
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-game-crimson/50 rounded-lg shadow-2xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-white text-sm font-medium">{user.display_name}</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                        <p className="text-game-gold text-xs mt-1">{xp.toLocaleString()} XP</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/avatar"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5"
                      >
                        Edit Avatar
                      </Link>
                      <Link
                        to="/game"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-game-amber hover:text-game-gold hover:bg-white/5"
                      >
                        Play Game
                      </Link>
                      {user.is_admin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2 text-sm text-game-crimson hover:text-red-400 hover:bg-white/5"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <hr className="border-gray-700 my-1" />
                      <button
                        onClick={() => { setProfileOpen(false); logout() }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-game-crimson hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-game-crimson/30 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-game-gold bg-game-crimson/20'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/game"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm font-medium text-game-amber hover:text-game-gold hover:bg-white/5"
            >
              Play Game
            </Link>
          )}
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(profileOpen || menuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setProfileOpen(false); setMenuOpen(false) }}
        />
      )}
    </nav>
  )
}
