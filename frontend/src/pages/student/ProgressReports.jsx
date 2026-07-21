import { useState, useEffect } from 'react'
import { Plus, BarChart2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'
import { format } from 'date-fns'

export default function ProgressReports() {
  const [reports, setReports] = useState([])
  const [approvedApps, setApprovedApps] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ application_id: '', semester: '', gpa: '', achievements: '', activities: '', comments: '' })

  const load = () => {
    Promise.all([
      api.get('/student/progress-reports').catch(() => ({ data: [] })),
      api.get('/student/applications?status=Approved').catch(() => ({ data: [] })),
    ]).then(([r, a]) => {
      setReports(r.data)
      setApprovedApps(a.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.application_id) return toast.error('Please select a scholarship')
    try {
      await api.post('/student/progress-reports', form)
      toast.success('Progress report submitted!')
      setShowForm(false)
      setForm({ application_id: '', semester: '', gpa: '', achievements: '', activities: '', comments: '' })
      load()
    } catch (err) {
      toast.error('Failed to submit report')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Progress Reports</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Report</>}
        </button>
      </div>

      {/* New Report Form */}
      {showForm && (
        <div className="card p-6">
          {approvedApps.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              ⚠️ You need an approved scholarship application to submit a progress report.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-semibold text-slate-700">New Progress Report</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Scholarship *</label>
                <select value={form.application_id} onChange={e => setForm({ ...form, application_id: e.target.value })} className="input-field">
                  <option value="">Select scholarship...</option>
                  {approvedApps.map(a => <option key={a.id} value={a.id}>{a.scholarship_title}</option>)}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Semester</label>
                  <input value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}
                    placeholder="e.g. Semester 5" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current GPA</label>
                  <input type="number" step="0.01" value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })}
                    placeholder="e.g. 3.75" className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Achievements</label>
                <textarea value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value })}
                  rows={3} placeholder="List your academic achievements..." className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Activities</label>
                <textarea value={form.activities} onChange={e => setForm({ ...form, activities: e.target.value })}
                  rows={3} placeholder="Extracurricular activities, projects..." className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Comments</label>
                <textarea value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })}
                  rows={2} placeholder="Any additional comments or messages to the donor..." className="input-field resize-none" />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Submit Report</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <BarChart2 size={40} className="text-slate-200 mx-auto" />
          <p className="text-slate-400">No progress reports submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold text-slate-800">{r.scholarship_title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.semester} · Submitted {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.gpa && <span className="text-sm font-semibold text-green-600">GPA: {r.gpa}</span>}
                  <StatusBadge status={r.status || 'Submitted'} />
                </div>
              </div>

              {r.achievements && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Achievements: </span>
                  {r.achievements}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
