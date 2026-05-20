import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import CertificateCard from '../components/CertificateCard'
import axiosClient from '../lib/axiosClient'

export default function CertificatePage() {
  const { userId } = useParams()
  const [certData, setCertData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) { setError('Invalid certificate link.'); setLoading(false); return }
    axiosClient.get(`/users/certificate/${userId}`)
      .then(({ data }) => {
        setCertData(data)
        setLoading(false)
      })
      .catch((err) => {
        const msg = err.response?.status === 404
          ? 'Certificate not found. The player may not have completed all 6 worlds yet.'
          : 'Failed to load certificate. Please try again.'
        setError(msg)
        setLoading(false)
      })
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-game-gold/30 border-t-game-gold rounded-full animate-spin" />
          <p className="font-pixel text-game-gold text-xs">LOADING CERTIFICATE...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-game-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <img src="/assets/props/7.4_acca_certificate_framed.png" alt="" className="h-20 w-20 object-contain mx-auto mb-4 opacity-30" />
          <h1 className="text-white font-bold text-xl mb-2">Certificate Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="bg-game-crimson hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm transition-colors">
              Go Home
            </Link>
            <Link to="/game" className="border border-game-gold/40 text-game-gold hover:bg-game-gold/10 px-5 py-2.5 rounded-lg text-sm transition-colors">
              Play Game
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-game-dark py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 print:hidden">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 text-gray-400 hover:text-white text-sm">
            ← Back to LEDGERFALL
          </Link>
          <h1 className="font-pixel text-game-gold text-base leading-relaxed">
            CERTIFICATE OF COMPLETION
          </h1>
        </div>

        {/* Certificate */}
        <CertificateCard
          certificateData={{
            playerName: certData.display_name,
            totalXP: certData.total_xp,
            starsEarned: certData.stars_earned,
            fraudCasesSolved: certData.fraud_cases_solved,
            completedDate: certData.completed_date,
            verificationCode: certData.verification_code,
            userId,
          }}
        />

        {/* LinkedIn Share */}
        <div className="mt-6 flex justify-center print:hidden">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            Share on LinkedIn
          </a>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            body { background: white !important; }
            nav, footer, .print\\:hidden { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
