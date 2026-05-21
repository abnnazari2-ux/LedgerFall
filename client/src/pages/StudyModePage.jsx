import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import GlossaryModal from '../components/GlossaryModal'
import studySubjects from '../data/studyData'
import { glossaryData } from '../data/glossaryData'

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

// Parse **bold** markers and make glossary terms clickable
function RichText({ text, onTermClick }) {
  // Split on **bold** and [term] patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2)
          const glossaryTerm = glossaryData.find((g) =>
            g.term.toLowerCase() === inner.toLowerCase()
          )
          if (glossaryTerm) {
            return (
              <button
                key={i}
                onClick={() => onTermClick(glossaryTerm)}
                className="font-bold text-game-gold hover:underline cursor-pointer"
              >
                {inner}
              </button>
            )
          }
          return <strong key={i} className="font-bold text-white">{inner}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

function TopicCard({ topic, subjectWorldId, onTermClick }) {
  const [expanded, setExpanded] = useState(false)
  const isaLinkSafe = isSafeUrl(topic.isaUrl)
  const ciaLinkSafe = isSafeUrl(topic.ciaUrl)

  return (
    <div className="bg-gray-900/60 border border-gray-700/50 hover:border-gray-600/70 rounded-xl overflow-hidden transition-all">
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div>
          <h3 className="text-white font-bold text-base">{topic.name}</h3>
          <p className="text-gray-500 text-xs mt-0.5">Level {topic.level}</p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-700/50 p-5 space-y-4">
          {/* Definition */}
          <div>
            <h4 className="text-gray-400 text-xs uppercase tracking-widest mb-2">Concept</h4>
            <p className="text-gray-200 text-sm leading-relaxed">
              <RichText text={topic.definition} onTermClick={onTermClick} />
            </p>
          </div>

          {/* Audit Objective */}
          <div className="bg-black/20 border border-game-blue/20 rounded-lg p-4">
            <h4 className="text-game-blue text-xs uppercase tracking-widest mb-2">Audit Objective</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{topic.auditObjective}</p>
          </div>

          {/* References */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topic.isaRef && (
              <div className="bg-black/20 border border-gray-700/50 rounded-lg p-3">
                <h4 className="text-gray-500 text-xs uppercase tracking-widest mb-1">ISA Standard</h4>
                <div className="flex items-center gap-2">
                  <span className="text-game-blue text-sm font-medium">{topic.isaRef}</span>
                  {isaLinkSafe && (
                    <a
                      href={topic.isaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-game-blue/60 hover:text-game-blue text-xs underline ml-auto"
                    >
                      View ↗
                    </a>
                  )}
                </div>
              </div>
            )}
            {topic.ciaRef && (
              <div className="bg-black/20 border border-gray-700/50 rounded-lg p-3">
                <h4 className="text-gray-500 text-xs uppercase tracking-widest mb-1">IIA Reference</h4>
                <div className="flex items-center gap-2">
                  <span className="text-game-amber text-sm font-medium">{topic.ciaRef}</span>
                  {ciaLinkSafe && (
                    <a
                      href={topic.ciaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-game-amber/60 hover:text-game-amber text-xs underline ml-auto"
                    >
                      View ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Real-world example */}
          {topic.example && (
            <div className="bg-game-crimson/5 border border-game-crimson/20 rounded-lg p-4">
              <h4 className="text-game-crimson text-xs uppercase tracking-widest mb-2">Real-World Example</h4>
              <p className="text-gray-300 text-sm leading-relaxed italic">{topic.example}</p>
            </div>
          )}

          {/* Practice link */}
          <div className="flex justify-end">
            <Link
              to="/game"
              className="flex items-center gap-2 bg-game-crimson/20 hover:bg-game-crimson/40 text-game-crimson text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <img src="/assets/hud/2.7_red_heart_icon.png" alt="" className="h-4 w-4 object-contain" />
              Practice in World {subjectWorldId}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudyModePage() {
  const [activeSubjectId, setActiveSubjectId] = useState('ap')
  const [modalTerm, setModalTerm] = useState(null)

  const handleTermClick = useCallback((term) => setModalTerm(term), [])
  const activeSubject = studySubjects.find((s) => s.id === activeSubjectId)

  return (
    <div className="min-h-screen bg-game-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/assets/props/7.1_stacked_acca_textbooks.png" alt="" className="h-10 w-10 object-contain" />
            <h1 className="font-pixel text-game-gold text-base sm:text-lg leading-relaxed">
              STUDY MODE
            </h1>
          </div>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Deep-dive into audit concepts. Aligned with ISA and IIA standards.
            No XP. No timer. No lives. Just learning.
          </p>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {studySubjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setActiveSubjectId(subject.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                activeSubjectId === subject.id
                  ? `bg-gray-800 border-gray-600 text-white`
                  : 'bg-transparent border-gray-800/50 text-gray-500 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              <img src={subject.icon} alt="" className="h-5 w-5 object-contain" />
              <span className="hidden sm:inline">{subject.name}</span>
              <span className="sm:hidden">W{subject.world}</span>
            </button>
          ))}
        </div>

        {/* Active subject */}
        {activeSubject && (
          <div>
            {/* Subject header */}
            <div
              className="relative rounded-xl overflow-hidden mb-6 p-6"
              style={{
                backgroundImage: `url(${activeSubject.icon})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/75" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${activeSubject.borderColor} ${activeSubject.bgColor} ${activeSubject.color}`}>
                    {activeSubject.worldName}
                  </span>
                </div>
                <h2 className="text-white font-bold text-2xl">{activeSubject.name}</h2>
                <p className="text-gray-300 text-sm mt-1">{activeSubject.topics.length} topics</p>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-3">
              {activeSubject.topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  subjectWorldId={activeSubject.world}
                  onTermClick={handleTermClick}
                />
              ))}
            </div>

            {/* Footer: Glossary link */}
            <div className="mt-8 p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-center">
              <p className="text-gray-400 text-sm mb-3">
                Click any <strong className="text-game-gold">highlighted term</strong> in the definitions above to see its glossary entry.
              </p>
              <Link
                to="/glossary"
                className="inline-flex items-center gap-2 text-game-blue hover:text-blue-300 text-sm transition-colors"
              >
                Browse full glossary →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Glossary modal */}
      {modalTerm && (
        <GlossaryModal term={modalTerm} onClose={() => setModalTerm(null)} />
      )}
    </div>
  )
}
