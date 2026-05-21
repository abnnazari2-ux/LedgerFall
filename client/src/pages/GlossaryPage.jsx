import React, { useState, useMemo, useCallback } from 'react'
import GlossaryModal from '../components/GlossaryModal'
import { glossaryData, worldCategories } from '../data/glossaryData'

const APPROVED_SOURCES = ['ifrs.org', 'iaasb.org', 'theiia.org', 'accaglobal.com', 'fasb.org']

function isSafeUrl(url) {
  if (!url) return false
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return APPROVED_SOURCES.some((s) => host === s || host.endsWith('.' + s))
  } catch {
    return false
  }
}

export default function GlossaryPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [modalTerm, setModalTerm] = useState(null)

  const filtered = useMemo(() => {
    let terms = [...glossaryData]
    if (selectedCategory) {
      terms = terms.filter((t) => t.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.example && t.example.toLowerCase().includes(q))
      )
    }
    return terms.sort((a, b) => a.term.localeCompare(b.term))
  }, [search, selectedCategory])

  const handleTermClick = useCallback((term) => setModalTerm(term), [])

  return (
    <div className="min-h-screen bg-game-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/assets/props/7.2_worlds_okayest_auditor_mug.png" alt="" className="h-10 w-10 object-contain" />
            <h1 className="font-pixel text-game-gold text-base sm:text-lg leading-relaxed">
              AUDIT GLOSSARY
            </h1>
          </div>
          <p className="text-gray-400 text-sm">{glossaryData.length} terms · ISA &amp; IIA aligned</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms, definitions..."
              className="w-full bg-gray-900/80 border border-gray-700 focus:border-game-gold rounded-lg pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="bg-gray-900/80 border border-gray-700 focus:border-game-gold rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors sm:w-48"
          >
            <option value="">All Topics</option>
            {worldCategories.slice(1).map((wc) => (
              <option key={wc.category} value={wc.category}>{wc.category}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <p className="text-gray-500 text-xs mb-4">
          {filtered.length} term{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Terms list */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((term) => {
              const isaLinkSafe = isSafeUrl(term.isa_url)
              const ciaLinkSafe = isSafeUrl(term.cia_url)
              return (
                <div
                  key={term.id}
                  className="bg-gray-900/60 border border-gray-700/50 hover:border-gray-600 rounded-xl p-5 transition-all cursor-pointer group"
                  onClick={() => handleTermClick(term)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-bold text-base group-hover:text-game-gold transition-colors">
                        {term.term}
                      </h3>
                      {term.world && (
                        <span className="text-xs px-2 py-0.5 bg-game-crimson/20 text-game-crimson rounded">
                          {term.world.split(':')[0]}
                        </span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-600 shrink-0 group-hover:text-game-gold transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2">
                    {term.definition}
                  </p>

                  <div className="flex items-center gap-4 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {term.isa_ref && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-xs">ISA:</span>
                        {isaLinkSafe ? (
                          <a
                            href={term.isa_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-game-blue text-xs hover:underline"
                          >
                            {term.isa_ref}
                          </a>
                        ) : (
                          <span className="text-game-blue text-xs">{term.isa_ref}</span>
                        )}
                      </div>
                    )}
                    {term.cia_ref && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-xs">CIA:</span>
                        {ciaLinkSafe ? (
                          <a
                            href={term.cia_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-game-amber text-xs hover:underline"
                          >
                            {term.cia_ref}
                          </a>
                        ) : (
                          <span className="text-game-amber text-xs">{term.cia_ref}</span>
                        )}
                      </div>
                    )}
                    <span className="text-gray-600 text-xs ml-auto">Click for full entry</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <img src="/assets/props/7.2_worlds_okayest_auditor_mug.png" alt="" className="h-16 w-16 object-contain opacity-30 mb-3" />
            <p className="text-gray-500 text-sm">No terms found for "{search}"</p>
            <button onClick={() => { setSearch(''); setSelectedCategory(null) }} className="text-game-blue text-sm mt-2 hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Glossary modal */}
      {modalTerm && <GlossaryModal term={modalTerm} onClose={() => setModalTerm(null)} />}
    </div>
  )
}
