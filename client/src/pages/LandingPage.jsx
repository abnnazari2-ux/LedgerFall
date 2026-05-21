import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosClient from '../lib/axiosClient'

// ── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(phrases, typingSpeed = 80, pauseTime = 2000) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex]
    let timeout

    if (!deleting && charIndex <= current.length) {
      timeout = setTimeout(() => {
        setText(current.slice(0, charIndex))
        setCharIndex((i) => i + 1)
      }, typingSpeed)
    } else if (!deleting && charIndex > current.length) {
      timeout = setTimeout(() => setDeleting(true), pauseTime)
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setText(current.slice(0, charIndex - 1))
        setCharIndex((i) => i - 1)
      }, typingSpeed / 2)
    } else if (deleting && charIndex === 0) {
      setDeleting(false)
      setPhraseIndex((i) => (i + 1) % phrases.length)
    }

    return () => clearTimeout(timeout)
  }, [charIndex, deleting, phraseIndex, phrases, typingSpeed, pauseTime])

  return text
}

// ── Intersection Observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView]
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function AnimatedSection({ children, className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

// ── World data ───────────────────────────────────────────────────────────────
const WORLDS = [
  { id: 1, name: 'The Warehouse', subtitle: 'Accounts Payable', bg: '/assets/backgrounds/3.1_world1_warehouse_background.png', color: '#C8860A', desc: 'Invoice fraud, three-way match, ghost vendors' },
  { id: 2, name: 'The Office', subtitle: 'Accounts Receivable', bg: '/assets/backgrounds/3.2_world2_office_background.png', color: '#1A6BCC', desc: 'Lapping fraud, debtor confirmations, aging analysis' },
  { id: 3, name: 'The Bank', subtitle: 'Bank & Cash', bg: '/assets/backgrounds/3.3_world3_bank_background.png', color: '#2E7D32', desc: 'Kiting schemes, bank reconciliations, cash fraud' },
  { id: 4, name: 'HR Department', subtitle: 'Payroll Fraud', bg: '/assets/backgrounds/3.4_world4_hr_background.png', color: '#7B1FA2', desc: 'Ghost employees, timesheet fraud, payroll manipulation' },
  { id: 5, name: 'Night Warehouse', subtitle: 'Inventory', bg: '/assets/backgrounds/3.5_world5_warehouse_night_background.png', color: '#E65100', desc: 'Stock shrinkage, inventory count, cut-off errors' },
  { id: 6, name: 'The Rooftop', subtitle: 'Internal Controls', bg: '/assets/backgrounds/3.6_world6_rooftop_background.png', color: '#8B0000', desc: 'The Fraud Triangle, COSO framework, segregation of duties' },
]

const HOW_IT_WORKS = [
  { step: '01', icon: '/assets/hud/2.7_red_heart_icon.png', title: 'Choose Your World', desc: 'Each world covers a real audit area. Start at the Warehouse and work your way up to Partner.' },
  { step: '02', icon: '/assets/documents/5.1_supplier_invoice_document.png', title: 'Review the Evidence', desc: 'Examine invoices, bank statements, and payroll sheets. Spot the fraud hiding in the numbers.' },
  { step: '03', icon: '/assets/stamps/6.3_fraud_risk_stamp.png', title: 'Stamp Your Decision', desc: 'Flag anomalies, reconcile accounts, or clear transactions. Every decision has consequences.' },
  { step: '04', icon: '/assets/hud/2.6_gold_star_icon.png', title: 'Earn XP & Climb the Ranks', desc: 'Correct findings earn XP and stars. Rise from Graduate Trainee to Partner on the global leaderboard.' },
]

const FEATURES = [
  { icon: '/assets/effects/9.2_fraud_alert_flash.png', title: 'Real Fraud Cases', desc: 'Scenarios based on actual audit findings across six financial disciplines. Not textbook hypotheticals.' },
  { icon: '/assets/hud/2.6_gold_star_icon.png', title: 'CPE-Style Learning', desc: 'Tied to ISA and IIA standards. Study mode included. Build your professional knowledge as you play.' },
  { icon: '/assets/ui/4.5_leaderboard_panel.png', title: 'Global Leaderboard', desc: 'Compete with auditors and accounting students worldwide. Firm leagues, weekly challenges, monthly rankings.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const tagline = useTypewriter([
    'Rise Through the Audit.',
    'Detect the Fraud.',
    'Climb to Partner.',
    'Master the Standards.',
  ])

  const [liveStats, setLiveStats] = useState({ players: '—', sessionsToday: '—', fraudDetected: '—' })
  const [topPlayers, setTopPlayers] = useState([])
  const [topFirms, setTopFirms] = useState([])
  const [statsLoaded, setStatsLoaded] = useState(false)

  // Parallax
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const handleScroll = () => {
      const scrollY = window.scrollY
      hero.style.transform = `translateY(${scrollY * 0.4}px)`
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch live data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [globalRes, firmRes] = await Promise.allSettled([
          axiosClient.get('/leaderboard/global?limit=5'),
          axiosClient.get('/leaderboard/firm?limit=3'),
        ])
        if (globalRes.status === 'fulfilled') {
          const data = globalRes.value.data
          setTopPlayers(data.rankings || data || [])
          setLiveStats((s) => ({ ...s, players: (data.total || 0).toLocaleString() }))
        }
        if (firmRes.status === 'fulfilled') {
          const data = firmRes.value.data
          setTopFirms(data.rankings || data || [])
        }
      } catch {
        // silent fail — show placeholders
      } finally {
        setStatsLoaded(true)
      }
    }
    fetchData()
  }, [])

  const scrollTicker = [
    `Players Worldwide: ${liveStats.players}`,
    'Worlds: 6',
    'Standards Covered: ISA + CIA',
    'Sessions Played Today: 1,247',
    'Fraud Cases Solved: 48,312',
    'Top Title: Partner',
  ]

  return (
    <div className="bg-game-dark min-h-screen overflow-x-hidden">

      {/* ── 1. HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Parallax background */}
        <div ref={heroRef} className="absolute inset-0 z-0">
          <img
            src="/assets/backgrounds/3.7_main_menu_background.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.35)' }}
          />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-game-dark/30 to-game-dark" />

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 pt-16 pb-24">
          <img
            src="/assets/logo/10.1_ledgerfall_main_logo.png"
            alt="LEDGERFALL"
            className="w-64 sm:w-80 md:w-96 object-contain mb-6 drop-shadow-2xl"
          />
          <div className="h-12 flex items-center justify-center mb-2">
            <h1 className="font-pixel text-game-gold text-sm sm:text-base md:text-lg tracking-widest">
              {tagline}
              <span className="animate-pulse">|</span>
            </h1>
          </div>
          <p className="text-gray-300 text-sm sm:text-base max-w-xl mb-8 leading-relaxed">
            The professional audit simulation game. Investigate fraud across six financial worlds.
            Earn XP, climb the global leaderboard, and rise from Graduate Trainee to Partner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/auth"
              className="bg-game-crimson hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg text-base transition-all hover:scale-105 shadow-lg hover:shadow-red-900/50"
            >
              Play Free
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="border border-game-gold/60 hover:border-game-gold text-game-gold hover:bg-game-gold/10 font-bold px-8 py-4 rounded-lg text-base transition-all"
            >
              How It Works
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Ticker */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/70 border-t border-game-crimson/40 py-2 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...scrollTicker, ...scrollTicker].map((item, i) => (
              <span key={i} className="font-pixel text-game-gold text-xs mx-8 opacity-80">
                ◆ {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. WHAT IS LEDGERFALL ── */}
      <section className="py-20 px-4">
        <AnimatedSection className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-game-gold text-lg sm:text-xl mb-4 leading-relaxed">
              WHAT IS LEDGERFALL?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
              LEDGERFALL is a free professional audit simulation game built on real ISA and CIA standards.
              Designed for ACCA, CIA, CPA, and accounting students. No paywalls. No fluff. Just real audit skills.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/3 border border-gray-700/50 hover:border-game-crimson/50 rounded-xl p-6 text-center transition-all hover:bg-white/5 group"
              >
                <img src={f.icon} alt="" className="h-12 w-12 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── 3. WORLDS PREVIEW ── */}
      <section className="py-20 bg-black/20">
        <AnimatedSection className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-pixel text-game-gold text-lg sm:text-xl mb-3 leading-relaxed">
              6 WORLDS. 6 AUDIT AREAS.
            </h2>
            <p className="text-gray-400 text-sm">Swipe to explore all worlds</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {WORLDS.map((world) => (
              <div
                key={world.id}
                className="shrink-0 w-64 sm:w-72 snap-start rounded-xl overflow-hidden border border-gray-700/50 hover:border-white/30 transition-all cursor-pointer group"
                onClick={() => navigate('/auth')}
              >
                <div className="relative h-40">
                  <img
                    src={world.bg}
                    alt={world.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ filter: 'brightness(0.6)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-1"
                      style={{ backgroundColor: `${world.color}33`, color: world.color, border: `1px solid ${world.color}44` }}
                    >
                      World {world.id}
                    </div>
                    <h3 className="text-white font-bold">{world.name}</h3>
                    <p className="text-gray-300 text-xs">{world.subtitle}</p>
                  </div>
                </div>
                <div className="bg-gray-900 p-3">
                  <p className="text-gray-400 text-xs leading-relaxed">{world.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-4">
        <AnimatedSection className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-game-gold text-lg sm:text-xl leading-relaxed">
              HOW IT WORKS
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-6 h-px bg-game-gold/20 z-10" />
                )}
                <div className="bg-white/3 border border-gray-700/50 rounded-xl p-5 text-center hover:border-game-gold/30 transition-colors">
                  <div className="font-pixel text-game-crimson text-xs mb-3 opacity-60">{step.step}</div>
                  <img src={step.icon} alt="" className="h-10 w-10 object-contain mx-auto mb-3" />
                  <h3 className="text-white font-bold text-sm mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── 5. LEADERBOARD PREVIEW ── */}
      <section className="py-20 bg-black/20 px-4">
        <AnimatedSection className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-pixel text-game-gold text-lg sm:text-xl leading-relaxed mb-2">
              LIVE LEADERBOARD
            </h2>
            <p className="text-gray-400 text-sm">Updated in real-time as players compete globally</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Global Top 5 */}
            <div className="bg-gray-900/80 border border-game-gold/20 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-game-gold/10 border-b border-game-gold/10">
                <img src="/assets/ui/4.5_leaderboard_panel.png" alt="" className="h-5 w-5 object-contain" />
                <span className="font-pixel text-game-gold text-xs">GLOBAL TOP 5</span>
              </div>
              <div className="divide-y divide-gray-800">
                {statsLoaded && topPlayers.length > 0 ? (
                  topPlayers.slice(0, 5).map((player, i) => (
                    <div key={player.id || i} className="flex items-center gap-3 px-4 py-3">
                      <span className={`font-pixel text-xs w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{player.display_name || 'Auditor'}</p>
                        <p className="text-gray-500 text-xs truncate">{player.career_title || 'Graduate Trainee'}</p>
                      </div>
                      <span className="text-game-gold text-sm font-bold">{(player.total_xp || 0).toLocaleString()} XP</span>
                    </div>
                  ))
                ) : (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-gray-600 text-xs w-5 text-center">{i + 1}</span>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-800 rounded w-24 mb-1 animate-pulse" />
                        <div className="h-2 bg-gray-800 rounded w-16 animate-pulse" />
                      </div>
                      <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-800">
                <Link to="/leaderboard" className="text-game-blue text-xs hover:text-blue-300 transition-colors">
                  View full leaderboard →
                </Link>
              </div>
            </div>

            {/* Firm League */}
            <div className="bg-gray-900/80 border border-game-crimson/20 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-game-crimson/10 border-b border-game-crimson/10">
                <img src="/assets/props/7.7_alliance_associates_billboard.png" alt="" className="h-5 w-5 object-contain" />
                <span className="font-pixel text-game-crimson text-xs">FIRM LEAGUE TOP 3</span>
              </div>
              <div className="divide-y divide-gray-800">
                {statsLoaded && topFirms.length > 0 ? (
                  topFirms.slice(0, 3).map((firm, i) => (
                    <div key={firm.id || i} className="flex items-center gap-3 px-4 py-4">
                      <span className={`font-pixel text-sm ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                        {['🥇', '🥈', '🥉'][i]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{firm.firm_name || 'Unknown Firm'}</p>
                        <p className="text-gray-500 text-xs">{firm.member_count || 0} members</p>
                      </div>
                      <span className="text-game-crimson text-sm font-bold">{(firm.total_xp || 0).toLocaleString()} XP</span>
                    </div>
                  ))
                ) : (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-4">
                      <span className="text-gray-600 text-sm">{['🥇', '🥈', '🥉'][i]}</span>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-800 rounded w-28 mb-1 animate-pulse" />
                        <div className="h-2 bg-gray-800 rounded w-16 animate-pulse" />
                      </div>
                      <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-800">
                <Link to="/leaderboard" className="text-game-blue text-xs hover:text-blue-300 transition-colors">
                  View firm rankings →
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── 6. STUDY MODE PREVIEW ── */}
      <section className="py-20 px-4">
        <AnimatedSection className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h2 className="font-pixel text-game-gold text-base sm:text-lg leading-relaxed mb-4">
                STUDY MODE INCLUDED
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Every game level is backed by a deep-dive study mode. Browse concepts by topic, read real ISA and IIA standard references, and practice with worked examples — no login required.
              </p>
              <ul className="space-y-2 mb-6">
                {['ISA-aligned audit concepts', 'CIA IPPF references', 'Real-world fraud examples', 'Practice links to game levels', 'Searchable glossary'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-300 text-sm">
                    <span className="text-game-gold">◆</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/study"
                className="inline-block bg-game-blue hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Explore Study Mode
              </Link>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {['/assets/documents/5.1_supplier_invoice_document.png', '/assets/documents/5.3_bank_statement.png', '/assets/documents/5.4_payroll_sheet.png', '/assets/documents/5.2_goods_received_note.png'].map((src, i) => (
                <img key={i} src={src} alt="study document" className="rounded-lg border border-gray-700/50 object-cover w-full aspect-[4/3] hover:scale-102 transition-transform" />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── 7. DEVELOPER ── */}
      <section className="py-20 bg-black/20 px-4">
        <AnimatedSection className="max-w-2xl mx-auto text-center">
          <img src="/assets/hud/2.2_coffee_cup_icon.png" alt="coffee" className="h-12 w-12 object-contain mx-auto mb-4 opacity-70" />
          <h2 className="font-pixel text-game-gold text-base leading-relaxed mb-4">BUILT BY AN AUDITOR</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            LEDGERFALL was designed and built by{' '}
            <strong className="text-white">Abdul Basit Nazari, ACCA</strong> — a qualified accountant who wanted to make audit education genuinely engaging. Every scenario is grounded in real professional experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://www.linkedin.com/in/abdulbasitnazari"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              Connect on LinkedIn
            </a>
            <Link
              to="/auth"
              className="flex items-center gap-2 border border-game-gold/40 hover:border-game-gold text-game-gold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Start Playing Free
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* ── 8. FOOTER ── */}
      <footer className="bg-black/40 border-t border-gray-800 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            <div>
              <img src="/assets/logo/10.2_ledgerfall_app_icon.png" alt="LEDGERFALL" className="h-10 w-10 object-contain mb-2" />
              <p className="font-pixel text-game-gold text-xs">LEDGERFALL</p>
              <p className="text-gray-500 text-xs mt-1">Rise Through the Audit</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Game</h4>
              <ul className="space-y-1.5">
                {[['Play Free', '/auth'], ['Dashboard', '/dashboard'], ['Leaderboard', '/leaderboard']].map(([label, to]) => (
                  <li key={label}><Link to={to} className="text-gray-400 hover:text-white text-xs transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Learn</h4>
              <ul className="space-y-1.5">
                {[['Study Mode', '/study'], ['Glossary', '/glossary']].map(([label, to]) => (
                  <li key={label}><Link to={to} className="text-gray-400 hover:text-white text-xs transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Standards</h4>
              <ul className="space-y-1.5">
                {[
                  ['IAASB ISAs', 'https://www.iaasb.org'],
                  ['IIA IPPF', 'https://www.theiia.org'],
                  ['ACCA', 'https://www.accaglobal.com'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-xs transition-colors">
                      {label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500 text-xs">
            <p>© 2025 LEDGERFALL. All rights reserved.</p>
            <p>Built by Abdul Basit Nazari, ACCA | For educational purposes</p>
          </div>
        </div>
      </footer>

      {/* Tailwind marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
