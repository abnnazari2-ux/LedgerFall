import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import axiosClient from '../lib/axiosClient'

const MALE_AVATARS = [
  { id: 'male_idle', src: '/assets/characters/1.1_male_auditor_avatar_default_idle.png', label: 'Default' },
  { id: 'male_victory', src: '/assets/characters/1.3_male_auditor_celebration_victory_pose.png', label: 'Victory' },
  { id: 'male_investigate', src: '/assets/characters/1.5_auditor_investigating_working_pose.png', label: 'Detective' },
  { id: 'male_shocked', src: '/assets/characters/1.6_auditor_shocked_alert_pose.png', label: 'Alert' },
]

const FEMALE_AVATARS = [
  { id: 'female_idle', src: '/assets/characters/1.2_female_auditor_avatar_default_idle.png', label: 'Default' },
  { id: 'female_victory', src: '/assets/characters/1.4_female_auditor_celebration_victory_pose.png', label: 'Victory' },
  { id: 'female_investigate', src: '/assets/characters/1.5_auditor_investigating_working_pose.png', label: 'Detective' },
  { id: 'female_shocked', src: '/assets/characters/1.6_auditor_shocked_alert_pose.png', label: 'Alert' },
]

const TABS = ['name', 'firm', 'type']

export default function AvatarStudioPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()

  const [gender, setGender] = useState(user?.avatar_gender || 'male')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_id || 'male_idle')
  const [activeTab, setActiveTab] = useState('name')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    firm_name: user?.firm_name || '',
    user_type: user?.user_type || 'student',
  })

  const avatarList = gender === 'female' ? FEMALE_AVATARS : MALE_AVATARS
  const previewSrc = avatarList.find((a) => a.id === selectedAvatar)?.src || avatarList[0].src

  const handleGenderChange = (g) => {
    setGender(g)
    setSelectedAvatar(g === 'female' ? 'female_idle' : 'male_idle')
  }

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    if (!form.display_name.trim()) {
      setError('Display name is required.')
      setActiveTab('name')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const payload = {
        avatar_id: selectedAvatar,
        avatar_gender: gender,
        display_name: form.display_name,
        firm_name: form.firm_name,
        user_type: form.user_type,
      }
      const { data } = await axiosClient.put('/users/avatar', payload)
      updateUser(data.user || payload)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save avatar. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-game-dark py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-game-gold text-base sm:text-lg leading-relaxed mb-2">
            AVATAR STUDIO
          </h1>
          <p className="text-gray-400 text-sm">Choose your auditor. Customise your profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Avatar Preview */}
          <div className="bg-gray-900/80 border border-game-gold/20 rounded-2xl p-6 flex flex-col items-center">
            {/* Gender toggle */}
            <div className="flex bg-black/30 rounded-lg p-1 mb-6 w-full">
              {[['male', 'Male Auditor'], ['female', 'Female Auditor']].map(([g, label]) => (
                <button
                  key={g}
                  onClick={() => handleGenderChange(g)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    gender === g ? 'bg-game-crimson text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Avatar preview */}
            <div
              className="relative w-40 h-40 rounded-full border-4 border-game-gold/40 bg-game-crimson/10 flex items-center justify-center mb-6 overflow-hidden"
              style={{ boxShadow: '0 0 30px rgba(255,215,0,0.15)' }}
            >
              <img
                src={previewSrc}
                alt="Selected avatar"
                className="h-36 w-36 object-contain"
              />
              {/* Portrait frame overlay */}
              <img
                src="/assets/hud/1.7_avatar_portrait_frame.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            </div>

            {/* Avatar selector */}
            <div className="grid grid-cols-4 gap-2 w-full">
              {avatarList.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    selectedAvatar === avatar.id
                      ? 'border-game-gold bg-game-gold/10'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <img src={avatar.src} alt={avatar.label} className="h-10 w-10 object-contain" />
                  <span className="text-gray-400 text-xs">{avatar.label}</span>
                </button>
              ))}
            </div>

            {/* Preview name */}
            <div className="mt-4 text-center">
              <p className="text-white font-bold text-lg">{form.display_name || 'Your Name'}</p>
              <p className="text-game-gold text-xs">{form.firm_name || 'Independent Auditor'}</p>
              <p className="text-gray-500 text-xs mt-1">Graduate Trainee</p>
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="bg-gray-900/80 border border-gray-700/50 rounded-2xl overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-gray-700">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-game-gold border-b-2 border-game-gold bg-game-gold/5'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Name tab */}
              {activeTab === 'name' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Display Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      name="display_name"
                      value={form.display_name}
                      onChange={handleChange}
                      placeholder="The Audit Avenger"
                      maxLength={30}
                      className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                    />
                    <p className="text-gray-600 text-xs mt-1">{form.display_name.length}/30 chars · Visible on leaderboard</p>
                  </div>
                  <div className="bg-game-blue/10 border border-game-blue/20 rounded-lg p-3">
                    <p className="text-blue-300 text-xs leading-relaxed">
                      This name will appear on the global leaderboard and your certificate. Choose wisely!
                    </p>
                  </div>
                </div>
              )}

              {/* Firm tab */}
              {activeTab === 'firm' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Firm / University Name</label>
                    <input
                      type="text"
                      name="firm_name"
                      value={form.firm_name}
                      onChange={handleChange}
                      placeholder="Alliance & Associates (optional)"
                      maxLength={50}
                      className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                    />
                    <p className="text-gray-600 text-xs mt-1">Used for the Firm League leaderboard</p>
                  </div>
                  <div className="bg-game-amber/10 border border-game-amber/20 rounded-lg p-3">
                    <p className="text-amber-300 text-xs leading-relaxed">
                      Players with the same firm name are grouped into a Firm League. Compete to be the top firm!
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                    <img src="/assets/props/7.7_alliance_associates_billboard.png" alt="" className="h-10 w-10 object-contain" />
                    <div>
                      <p className="text-white text-sm">{form.firm_name || 'No firm set'}</p>
                      <p className="text-gray-500 text-xs">Your firm on the leaderboard</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Type tab */}
              {activeTab === 'type' && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">I am a...</p>
                  <div className="space-y-3">
                    {[
                      { value: 'student', label: 'Student / Trainee', desc: 'Currently studying for ACCA, CPA, CIA or university accounting', icon: '/assets/props/7.1_stacked_acca_textbooks.png' },
                      { value: 'professional', label: 'Working Professional', desc: 'Currently working in audit, finance, or accounting', icon: '/assets/props/7.4_acca_certificate_framed.png' },
                    ].map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          form.user_type === type.value
                            ? 'border-game-gold bg-game-gold/10'
                            : 'border-gray-700 hover:border-gray-500'
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
                        <img src={type.icon} alt="" className="h-10 w-10 object-contain shrink-0" />
                        <div>
                          <p className={`font-medium text-sm ${form.user_type === type.value ? 'text-game-gold' : 'text-white'}`}>
                            {type.label}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">{type.desc}</p>
                        </div>
                        <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${form.user_type === type.value ? 'border-game-gold bg-game-gold' : 'border-gray-600'}`} />
                      </label>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs">Used to sort global leaderboard by Student vs Professional categories</p>
                </div>
              )}
            </div>

            {/* Navigation between tabs */}
            <div className="px-6 pb-4 flex justify-between">
              <button
                onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) - 1] || 'name')}
                disabled={activeTab === 'name'}
                className="text-gray-400 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              {activeTab !== 'type' ? (
                <button
                  onClick={() => setActiveTab(TABS[TABS.indexOf(activeTab) + 1])}
                  className="text-game-blue hover:text-blue-300 text-sm"
                >
                  Next →
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-lg px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Save button */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-sm py-3 px-5 rounded-lg transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-game-gold hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</>
            ) : (
              <><img src="/assets/hud/2.6_gold_star_icon.png" alt="" className="w-4 h-4 object-contain" /> Save &amp; Start Playing</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
