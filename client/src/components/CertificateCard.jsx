import React from 'react'
import WhatsAppShareButton from './WhatsAppShareButton'

export default function CertificateCard({ certificateData }) {
  const {
    playerName,
    totalXP,
    starsEarned,
    fraudCasesSolved,
    completedDate,
    verificationCode,
    userId,
  } = certificateData

  const certUrl = `${window.location.origin}/certificate/${userId}`

  const handlePrint = () => window.print()

  const formattedDate = completedDate
    ? new Date(completedDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Certificate Card */}
      <div
        id="certificate-printable"
        className="relative w-full max-w-2xl bg-game-dark border-4 border-game-gold rounded-2xl p-8 shadow-2xl print:border-8"
        style={{
          background: 'linear-gradient(135deg, #0D0D2B 0%, #1a1a3e 50%, #0D0D2B 100%)',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.2), inset 0 0 80px rgba(139, 0, 0, 0.1)',
        }}
      >
        {/* Corner decorations */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-game-gold opacity-60" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-game-gold opacity-60" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-game-gold opacity-60" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-game-gold opacity-60" />

        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/assets/logo/10.1_ledgerfall_main_logo.png"
            alt="LEDGERFALL"
            className="h-16 mx-auto object-contain mb-3"
          />
          <h1 className="font-pixel text-game-gold text-lg tracking-widest leading-relaxed">
            CERTIFICATE OF
          </h1>
          <h1 className="font-pixel text-game-gold text-xl tracking-widest">
            COMPLETION
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="h-px bg-game-gold/50 flex-1" />
            <img src="/assets/hud/2.6_gold_star_icon.png" alt="star" className="h-5 w-5 object-contain" />
            <div className="h-px bg-game-gold/50 flex-1" />
          </div>
        </div>

        {/* Body */}
        <div className="text-center mb-6 space-y-2">
          <p className="text-gray-400 text-sm">This is to certify that</p>
          <h2 className="text-white text-3xl font-bold tracking-wide">{playerName}</h2>
          <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto">
            has successfully completed all six worlds of the
            <span className="text-game-gold font-semibold"> LEDGERFALL </span>
            audit simulation, demonstrating professional competency in financial auditing.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: '/assets/hud/2.5_gold_coin_icon.png', label: 'Total XP', value: totalXP?.toLocaleString() || '0' },
            { icon: '/assets/hud/2.6_gold_star_icon.png', label: 'Stars Earned', value: starsEarned || '0' },
            { icon: '/assets/effects/9.2_fraud_alert_flash.png', label: 'Fraud Cases Solved', value: fraudCasesSolved || '0' },
          ].map((stat) => (
            <div key={stat.label} className="bg-black/30 border border-game-gold/20 rounded-lg p-3 text-center">
              <img src={stat.icon} alt={stat.label} className="h-6 w-6 mx-auto object-contain mb-1" />
              <p className="text-game-gold font-bold text-lg">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between border-t border-game-gold/20 pt-4">
          <div>
            <img src="/assets/props/7.3_audit_trophy.png" alt="trophy" className="h-12 w-12 object-contain opacity-70" />
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">{formattedDate}</p>
            <p className="text-gray-600 text-xs mt-1 font-mono">
              Verify: {verificationCode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Abdul Basit Nazari, ACCA</p>
            <p className="text-game-gold text-xs">Creator, LEDGERFALL</p>
          </div>
        </div>

        {/* Stamp */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <img src="/assets/stamps/6.1_agreed_stamp.png" alt="" className="w-48 h-48 object-contain" />
        </div>
      </div>

      {/* Action buttons (hidden on print) */}
      <div className="flex flex-wrap gap-3 justify-center print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-game-amber hover:bg-yellow-600 text-black font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Certificate
        </button>
        <WhatsAppShareButton
          message={`I just completed LEDGERFALL - the professional audit simulation game! Check out my certificate:`}
          url={certUrl}
          label="Share on WhatsApp"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(certUrl)
            alert('Certificate URL copied to clipboard!')
          }}
          className="flex items-center gap-2 bg-game-blue hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy Link
        </button>
      </div>
    </div>
  )
}
