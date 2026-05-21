import React, { useState, useEffect, useCallback } from 'react'
import axiosClient from '../lib/axiosClient'

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = 'text-game-gold' }) {
  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4">
      {icon && <img src={icon} alt="" className="h-8 w-8 object-contain opacity-70" />}
      <div>
        <p className={`font-bold text-2xl ${color}`}>{value ?? '—'}</p>
        <p className="text-gray-500 text-xs">{label}</p>
      </div>
    </div>
  )
}

function Badge({ children, color = 'bg-gray-700 text-gray-300' }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>
}

// ── Users Table ───────────────────────────────────────────────────────────────

function UsersTable() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/admin/users', {
        params: { page, limit: 20, search, sortBy, sortDir },
      })
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, sortBy, sortDir])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
    setPage(1)
  }

  const performAction = async (userId, action) => {
    try {
      setActionMsg('')
      await axiosClient.post(`/admin/users/${userId}/${action}`)
      setActionMsg(`Action "${action}" completed.`)
      fetchUsers()
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Action failed.')
    }
  }

  const SortIcon = ({ col }) => (
    <span className="ml-1 text-gray-500">
      {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, firm..."
            className="flex-1 bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-3 py-2 text-white text-sm outline-none"
          />
          <button type="submit" className="bg-game-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">Search</button>
        </form>
        {search && (
          <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} className="text-gray-400 hover:text-white text-sm">
            Clear
          </button>
        )}
      </div>

      {actionMsg && (
        <div className="mb-3 bg-green-900/30 border border-green-700/50 text-green-300 text-sm rounded-lg px-4 py-2">
          {actionMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-700/50">
        <table className="w-full text-sm">
          <thead className="bg-black/20 border-b border-gray-700/50">
            <tr>
              {[
                ['ID', 'id'], ['Name', 'display_name'], ['Email', 'email'],
                ['Firm', 'firm_name'], ['Type', 'user_type'], ['XP', 'total_xp'],
                ['Title', null], ['Joined', 'created_at'], ['Last Active', 'last_active'],
                ['Admin', null], ['Actions', null]
              ].map(([label, col]) => (
                <th
                  key={label}
                  onClick={col ? () => handleSort(col) : undefined}
                  className={`px-3 py-3 text-left text-gray-400 text-xs uppercase tracking-wider whitespace-nowrap ${col ? 'cursor-pointer hover:text-white' : ''}`}
                >
                  {label}{col && <SortIcon col={col} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} className="hover:bg-white/3 transition-colors">
                <td className="px-3 py-2 text-gray-500 text-xs font-mono">{u.id?.slice(0, 8)}...</td>
                <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{u.display_name}</td>
                <td className="px-3 py-2 text-gray-300 whitespace-nowrap">{u.email}</td>
                <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{u.firm_name || '—'}</td>
                <td className="px-3 py-2">
                  <Badge color={u.user_type === 'professional' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}>
                    {u.user_type}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-game-gold font-bold">{(u.total_xp || 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-gray-300 whitespace-nowrap text-xs">{u.career_title || '—'}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                  {u.last_active ? new Date(u.last_active).toLocaleDateString() : '—'}
                </td>
                <td className="px-3 py-2">
                  <Badge color={u.is_admin ? 'bg-game-crimson/30 text-game-crimson' : 'bg-gray-800 text-gray-500'}>
                    {u.is_admin ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => performAction(u.id, u.is_suspended ? 'reactivate' : 'suspend')}
                      className={`text-xs px-2 py-1 rounded transition-colors ${u.is_suspended ? 'bg-green-900/30 text-green-400 hover:bg-green-900/60' : 'bg-red-900/30 text-red-400 hover:bg-red-900/60'}`}
                    >
                      {u.is_suspended ? 'Reactivate' : 'Suspend'}
                    </button>
                    <button
                      onClick={() => performAction(u.id, 'reset-password')}
                      className="text-xs px-2 py-1 rounded bg-gray-700/50 text-gray-300 hover:bg-gray-600 transition-colors"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => performAction(u.id, u.is_admin ? 'revoke-admin' : 'grant-admin')}
                      className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/60 transition-colors"
                    >
                      {u.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Analytics Panel ───────────────────────────────────────────────────────────

function AnalyticsPanel() {
  const [data, setData] = useState(null)

  useEffect(() => {
    axiosClient.get('/admin/analytics').then(({ data }) => setData(data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-bold mb-3">Most Failed Levels</h3>
        <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/20 border-b border-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-400 text-xs">World</th>
                <th className="px-4 py-2 text-left text-gray-400 text-xs">Level</th>
                <th className="px-4 py-2 text-left text-gray-400 text-xs">Fail Rate</th>
                <th className="px-4 py-2 text-left text-gray-400 text-xs">Avg Completion Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data?.mostFailedLevels?.map((l, i) => (
                <tr key={i} className="hover:bg-white/3">
                  <td className="px-4 py-2 text-gray-300">W{l.world}</td>
                  <td className="px-4 py-2 text-gray-300">L{l.level}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-game-crimson rounded-full" style={{ width: `${l.fail_rate || 0}%` }} />
                      </div>
                      <span className="text-red-400 text-xs">{l.fail_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{l.avg_time || '—'}s</td>
                </tr>
              )) || (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No analytics data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Avg Completion Time</p>
          <p className="text-white font-bold text-xl">{data?.avgCompletionTime || '—'}s</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Fraud Detection Rate</p>
          <p className="text-game-crimson font-bold text-xl">{data?.fraudDetectionRate || '—'}%</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Hint Usage Rate</p>
          <p className="text-game-amber font-bold text-xl">{data?.hintUsageRate || '—'}%</p>
        </div>
      </div>
    </div>
  )
}

// ── Glossary Manager ──────────────────────────────────────────────────────────

function GlossaryManager() {
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingTerm, setEditingTerm] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ term: '', definition: '', isa_ref: '', cia_ref: '', example: '', world: '', category: '' })
  const [msg, setMsg] = useState('')

  const fetchTerms = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/admin/glossary')
      setTerms(data.terms || data || [])
    } catch { setTerms([]) }
    setLoading(false)
  }

  useEffect(() => { fetchTerms() }, [])

  const handleOpenNew = () => { setForm({ term: '', definition: '', isa_ref: '', cia_ref: '', example: '', world: '', category: '' }); setEditingTerm(null); setShowForm(true) }
  const handleEdit = (t) => { setForm(t); setEditingTerm(t.id); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingTerm) {
        await axiosClient.put(`/admin/glossary/${editingTerm}`, form)
        setMsg('Term updated.')
      } else {
        await axiosClient.post('/admin/glossary', form)
        setMsg('Term added.')
      }
      setShowForm(false)
      fetchTerms()
    } catch (err) { setMsg(err.response?.data?.message || 'Save failed.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this term?')) return
    try { await axiosClient.delete(`/admin/glossary/${id}`); fetchTerms(); setMsg('Term deleted.') }
    catch { setMsg('Delete failed.') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">{terms.length} Terms</h3>
        <button onClick={handleOpenNew} className="bg-game-blue hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + Add Term
        </button>
      </div>
      {msg && <div className="mb-3 bg-green-900/30 border border-green-700/50 text-green-300 text-sm rounded-lg px-3 py-2">{msg}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-900/80 border border-game-gold/20 rounded-xl p-5 mb-5 space-y-3">
          <h4 className="text-game-gold font-bold text-sm">{editingTerm ? 'Edit Term' : 'Add New Term'}</h4>
          {[
            { name: 'term', label: 'Term', required: true },
            { name: 'definition', label: 'Definition', required: true, textarea: true },
            { name: 'isa_ref', label: 'ISA Reference' },
            { name: 'cia_ref', label: 'CIA Reference' },
            { name: 'example', label: 'Example', textarea: true },
            { name: 'world', label: 'World (e.g. World 1: Procurement)' },
            { name: 'category', label: 'Category (e.g. Accounts Payable)' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-gray-400 text-xs mb-1">{field.label}{field.required && ' *'}</label>
              {field.textarea ? (
                <textarea
                  name={field.name}
                  value={form[field.name]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-3 py-2 text-white text-sm outline-none resize-y min-h-[80px]"
                  required={field.required}
                />
              ) : (
                <input
                  type="text"
                  name={field.name}
                  value={form[field.name]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                  className="w-full bg-black/30 border border-gray-700 focus:border-game-gold rounded-lg px-3 py-2 text-white text-sm outline-none"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2">Cancel</button>
            <button type="submit" className="bg-game-gold hover:bg-yellow-500 text-black font-bold text-sm px-5 py-2 rounded-lg transition-colors">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {loading && <p className="text-gray-500 text-sm text-center py-4">Loading...</p>}
        {!loading && terms.map((t) => (
          <div key={t.id} className="flex items-start gap-3 bg-gray-900/60 border border-gray-700/50 rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{t.term}</p>
              <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{t.definition}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleEdit(t)} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">Edit</button>
              <button onClick={() => handleDelete(t.id)} className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/60 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Admin Log ─────────────────────────────────────────────────────────────────

function AdminLog() {
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    axiosClient.get('/admin/logs', { params: { page, limit: 20 } })
      .then(({ data }) => { setLogs(data.logs || []); setTotalPages(data.totalPages || 1) })
      .catch(() => {})
  }, [page])

  return (
    <div>
      <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/20 border-b border-gray-700/50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-400 text-xs">Time</th>
              <th className="px-4 py-2 text-left text-gray-400 text-xs">Admin</th>
              <th className="px-4 py-2 text-left text-gray-400 text-xs">Action</th>
              <th className="px-4 py-2 text-left text-gray-400 text-xs">Target</th>
              <th className="px-4 py-2 text-left text-gray-400 text-xs">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No log entries</td></tr>
            )}
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-white/3">
                <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-gray-300 text-xs">{log.admin_name || log.admin_id}</td>
                <td className="px-4 py-2">
                  <Badge color="bg-game-crimson/20 text-game-crimson">{log.action}</Badge>
                </td>
                <td className="px-4 py-2 text-gray-400 text-xs">{log.target_id || '—'}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{log.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-gray-500">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 disabled:opacity-30">Prev</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 disabled:opacity-30">Next</button>
        </div>
      </div>
    </div>
  )
}

// ── Daily Challenge Scheduler ─────────────────────────────────────────────────

function DailyChallengeScheduler() {
  const [upcoming, setUpcoming] = useState([])
  const [override, setOverride] = useState({ world: 1, level: 1, date: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    axiosClient.get('/admin/daily-challenge/upcoming').then(({ data }) => setUpcoming(data.challenges || [])).catch(() => {})
  }, [])

  const handleOverride = async (e) => {
    e.preventDefault()
    try {
      await axiosClient.post('/admin/daily-challenge/override', override)
      setMsg('Daily challenge overridden successfully.')
    } catch (err) {
      setMsg(err.response?.data?.message || 'Override failed.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-white font-bold mb-3">Upcoming Challenges</h3>
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming challenges scheduled</p>
          ) : upcoming.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-900/60 border border-gray-700/50 rounded-lg p-3">
              <div>
                <p className="text-white text-sm font-medium">{new Date(c.date).toLocaleDateString()}</p>
                <p className="text-gray-400 text-xs">World {c.world} · Level {c.level}</p>
              </div>
              <Badge color="bg-game-amber/20 text-game-amber">Scheduled</Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold mb-3">Override Challenge</h3>
        {msg && <div className="mb-3 bg-green-900/30 border border-green-700/50 text-green-300 text-sm rounded px-3 py-2">{msg}</div>}
        <form onSubmit={handleOverride} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Date</label>
              <input type="date" value={override.date} onChange={(e) => setOverride((o) => ({ ...o, date: e.target.value }))} className="w-full bg-black/30 border border-gray-700 rounded px-3 py-2 text-white text-sm outline-none" required />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">World</label>
              <select value={override.world} onChange={(e) => setOverride((o) => ({ ...o, world: Number(e.target.value) }))} className="w-full bg-black/30 border border-gray-700 rounded px-3 py-2 text-white text-sm outline-none">
                {[1, 2, 3, 4, 5, 6].map((w) => <option key={w} value={w}>World {w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Level</label>
              <input type="number" min="1" max="20" value={override.level} onChange={(e) => setOverride((o) => ({ ...o, level: Number(e.target.value) }))} className="w-full bg-black/30 border border-gray-700 rounded px-3 py-2 text-white text-sm outline-none" />
            </div>
          </div>
          <button type="submit" className="bg-game-crimson hover:bg-red-700 text-white text-sm px-5 py-2 rounded-lg transition-colors">
            Override Challenge
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'analytics', label: 'Game Analytics' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'challenge', label: 'Daily Challenge' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'logs', label: 'Admin Log' },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [lbMsg, setLbMsg] = useState('')

  useEffect(() => {
    axiosClient.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const handleLeaderboardReset = async (type) => {
    try {
      await axiosClient.post(`/admin/leaderboard/reset`, { type })
      setLbMsg(`${type} leaderboard reset successfully.`)
    } catch (err) {
      setLbMsg(err.response?.data?.message || 'Reset failed.')
    }
  }

  return (
    <div className="min-h-screen bg-game-dark py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/assets/effects/9.2_fraud_alert_flash.png" alt="" className="h-8 w-8 object-contain" />
          <h1 className="font-pixel text-game-crimson text-base sm:text-lg leading-relaxed">
            ADMIN PANEL
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-game-crimson text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total Users" value={stats?.total_users?.toLocaleString()} icon="/assets/hud/1.8_male_avatar_face_portrait.png" />
            <StatCard label="Active Today" value={stats?.active_today?.toLocaleString()} icon="/assets/hud/2.2_coffee_cup_icon.png" color="text-green-400" />
            <StatCard label="Sessions Today" value={stats?.sessions_today?.toLocaleString()} icon="/assets/ui/4.3_mission_accomplished_checklist.png" color="text-game-blue" />
            <StatCard label="Avg XP" value={stats?.avg_xp?.toLocaleString()} icon="/assets/hud/2.5_gold_coin_icon.png" />
            <StatCard label="Lives Depleted" value={stats?.lives_depleted?.toLocaleString()} icon="/assets/hud/2.7_red_heart_icon.png" color="text-game-crimson" />
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && <UsersTable />}

        {/* ── Analytics ── */}
        {activeTab === 'analytics' && <AnalyticsPanel />}

        {/* ── Leaderboard Management ── */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <h3 className="text-white font-bold">Leaderboard Management</h3>
            {lbMsg && <div className="bg-green-900/30 border border-green-700/50 text-green-300 text-sm rounded px-4 py-2">{lbMsg}</div>}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleLeaderboardReset('weekly')}
                className="bg-game-amber/20 hover:bg-game-amber/40 text-game-amber border border-game-amber/30 px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Reset Weekly Rankings
              </button>
              <button
                onClick={() => handleLeaderboardReset('monthly')}
                className="bg-game-blue/20 hover:bg-game-blue/40 text-game-blue border border-game-blue/30 px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Reset Monthly Rankings
              </button>
              <button
                onClick={() => handleLeaderboardReset('daily')}
                className="bg-game-crimson/20 hover:bg-game-crimson/40 text-game-crimson border border-game-crimson/30 px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Reset Daily Challenge Rankings
              </button>
            </div>
          </div>
        )}

        {/* ── Daily Challenge ── */}
        {activeTab === 'challenge' && <DailyChallengeScheduler />}

        {/* ── Glossary ── */}
        {activeTab === 'glossary' && <GlossaryManager />}

        {/* ── Admin Log ── */}
        {activeTab === 'logs' && (
          <div>
            <h3 className="text-white font-bold mb-4">Admin Action Log</h3>
            <AdminLog />
          </div>
        )}
      </div>
    </div>
  )
}
