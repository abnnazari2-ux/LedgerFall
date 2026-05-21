import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

const USER_TYPES = [
  { value: 'student', label: 'Student / Trainee' },
  { value: 'professional', label: 'Working Professional' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isLoading } = useAuthStore()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    firm_name: '',
    user_type: 'student',
  })

  const from = location.state?.from?.pathname || null

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please enter email and password.'); return }
    const result = await login({ email: form.email, password: form.password })
    if (result.success) {
      navigate(from || '/dashboard', { replace: true })
    } else {
      setError(result.error)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.display_name) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    const result = await register({
      email: form.email,
      password: form.password,
      display_name: form.display_name,
      firm_name: form.firm_name,
      user_type: form.user_type,
    })
    if (result.success) {
      navigate('/avatar', { replace: true })
    } else {
      setError(result.error)
    }
  }

  const handleGoogleAuth = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`
  }

  return (
    <div
      className="min-h-screen bg-game-dark flex items-center justify-center px-4 py-12"
      style={{
        backgroundImage: 'url(/assets/backgrounds/3.7_main_menu_background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/logo/10.1_ledgerfall_main_logo.png"
            alt="LEDGERFALL"
            className="h-16 mx-auto object-contain mb-3"
          />
          <p className="font-pixel text-game-gold text-xs tracking-widest">
            {mode === 'login' ? 'SIGN IN TO AUDIT' : 'CREATE YOUR ACCOUNT'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/95 border border-game-crimson/40 rounded-2xl p-8 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex bg-black/30 rounded-lg p-1 mb-6">
            {[['login', 'Sign In'], ['register', 'Register']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-game-crimson text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 rounded-lg transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-game-crimson hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Display Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="display_name"
                  value={form.display_name}
                  onChange={handleChange}
                  placeholder="The Audit Avenger"
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Firm / University Name</label>
                <input
                  type="text"
                  name="firm_name"
                  value={form.firm_name}
                  onChange={handleChange}
                  placeholder="Big 4 Alliance (optional)"
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {USER_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        form.user_type === type.value
                          ? 'border-game-gold bg-game-gold/10 text-game-gold'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="user_type"
                        value={type.value}
                        checked={form.user_type === type.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-3 h-3 rounded-full border-2 ${form.user_type === type.value ? 'border-game-gold bg-game-gold' : 'border-gray-500'}`} />
                      <span className="text-xs">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-game-crimson hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                ) : 'Create Account & Play Free'}
              </button>
              <p className="text-gray-600 text-xs text-center">
                By registering you agree to play fair and not cheat on the leaderboard.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
