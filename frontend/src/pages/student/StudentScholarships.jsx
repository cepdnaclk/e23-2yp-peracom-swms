import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen } from 'lucide-react'
import api from '../../services/api'

export default function StudentScholarships() {
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('')

  useEffect(() => {
    api.get('/scholarships?status=Active')
      .then(r => setScholarships(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = scholarships.filter(s => {
    const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase())
    const matchBatch = !batchFilter || s.eligible_batch?.includes(batchFilter)
    return matchSearch && matchBatch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Browse Scholarships</h1>
        <p className="text-slate-500 text-sm mt-1">Find and apply for scholarships available to you.</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search scholarships..." className="input-field pl-9" />
        </div>
        <input value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
          placeholder="Filter by batch (e.g. 20/21)" className="input-field sm:w-56" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading scholarships...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No scholarships found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(s => (
            <div key={s.id} className="card flex flex-col hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <BookOpen size={18} className="text-purple-600" />
                  </div>
                  <span className="badge-green">Active</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">{s.title}</h3>
                  {s.donor_name && (
                    <p className="text-xs text-purple-600 mt-0.5">by {s.donor_name} · {s.organization || ''}</p>
                  )}
                </div>

                {s.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-green-500">💰</span>
                    LKR {Number(s.funding_amount || 0).toLocaleString()} per student
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-amber-500">📅</span>
                    Deadline: {s.application_deadline ? new Date(s.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-blue-500">👥</span>
                    Batch: {s.eligible_batch || 'All'}
                  </div>
                </div>

                {s.eligibility_criteria && (
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-purple-700 mb-0.5">Eligibility</p>
                    <p className="text-xs text-purple-600">{s.eligibility_criteria}</p>
                  </div>
                )}
              </div>

              <div className="p-5 pt-0">
                <Link to={`/student/scholarships/${s.id}`} className="btn-primary w-full text-center text-sm py-2.5 block">
                  View Details & Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
