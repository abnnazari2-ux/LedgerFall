import React, { useEffect } from 'react'

const APPROVED_SOURCES = [
  'ifrs.org',
  'iaasb.org',
  'theiia.org',
  'accaglobal.com',
  'fasb.org',
]

function safeLink(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (APPROVED_SOURCES.some((s) => host === s || host.endsWith('.' + s))) {
      return url
    }
  } catch {
    // invalid URL
  }
  return null
}

export default function GlossaryModal({ term, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!term) return null

  const isaLink = safeLink(term.isa_url)
  const ciaLink = safeLink(term.cia_url)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-game-crimson/60 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-game-gold font-bold text-xl">{term.term}</h2>
            {term.world && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-game-crimson/20 text-game-crimson text-xs rounded">
                {term.world}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Definition */}
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-1">Definition</h3>
            <p className="text-gray-200 text-sm leading-relaxed">{term.definition}</p>
          </div>

          {/* ISA Reference */}
          {term.isa_ref && (
            <div>
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-1">ISA Reference</h3>
              <div className="flex items-center gap-2">
                <span className="text-game-blue text-sm font-medium">{term.isa_ref}</span>
                {isaLink && (
                  <a
                    href={isaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-game-blue hover:text-blue-300 text-xs underline"
                  >
                    View standard ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* CIA Reference */}
          {term.cia_ref && (
            <div>
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-1">CIA Reference</h3>
              <div className="flex items-center gap-2">
                <span className="text-game-amber text-sm font-medium">{term.cia_ref}</span>
                {ciaLink && (
                  <a
                    href={ciaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-game-amber hover:text-yellow-300 text-xs underline"
                  >
                    View standard ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Real-world Example */}
          {term.example && (
            <div className="bg-black/30 border border-game-gold/10 rounded-lg p-4">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-1">Real-World Example</h3>
              <p className="text-gray-300 text-sm leading-relaxed italic">{term.example}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-game-crimson hover:bg-red-700 text-white text-sm px-5 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
