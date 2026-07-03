import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'

export default function AssignStudentsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scholarship, setScholarship] = useState(null)
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [finalStudents, setFinalStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get(`/scholarships/${id}`),
      api.get(`/scholarships/${id}/approved-students`).catch(() => ({ data: [] })),
      api.get(`/scholarships/${id}/final-students`).catch(() => ({ data: [] })),
    ]).then(([s, st, fs]) => {
      setScholarship(s.data)
      setStudents(st.data)
      setFinalStudents(fs.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const toggleSelect = (sid) => {
    setSelected(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])
  }

  const filteredStudents = students.filter(s =>
    !search || s.student_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAssign = async () => {
    if (!selected.length) return
    await api.post(`/scholarships/${id}/assign`, { student_ids: selected })
    toast.success(`${selected.length} student(s) assigned`)
    setSelected([])
    load()
  }

  const donorDecisionBadge = (d) => {
    const map = {
      'Not Reviewed': <span className="badge-grey">Not Reviewed</span>,
      'Pending': <span className="badge-amber">Pending ⏳</span>,
      'Approved': <span className="badge-green">Approved ✅</span>,
      'Rejected': <span className="badge-red">Rejected ❌</span>,
    }
    return map[d] || <span className="badge-grey">—</span>
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Scholarships', href: '/scholarships' }, { label: 'Approved Students' }, { label: 'Assign to Donor' }]} />
      <h1 className="page-title">Assign Students to Donor</h1>

      {/* Scholarship Details */}
      {scholarship && (
        <div className="card p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            {[
              ['Scholarship Title', scholarship.title],
              ['Donor Name', scholarship.donor_name || '—'],
              ['Funding Amount', scholarship.funding_amount ? `LKR ${Number(scholarship.funding_amount).toLocaleString()}` : '—'],
              ['Approved Students', students.length],
              ['Already Assigned', students.filter(s => s.assignment_status === 'Assigned').length],
              ['Eligible Batch', scholarship.eligible_batch || '—'],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-slate-500 font-medium">{l}</p>
                <p className="font-semibold text-slate-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Students */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-700">Approved Students</h2>
            <span className="badge-purple">{students.length}</span>
            <span className="text-xs text-slate-500">{selected.length} of {students.length} selected</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search students..." className="input-field pl-8 text-xs h-9" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox"
                    checked={selected.length === filteredStudents.filter(s => s.assignment_status !== 'Assigned').length && filteredStudents.length > 0}
                    onChange={e => {
                      if (e.target.checked) setSelected(filteredStudents.filter(s => s.assignment_status !== 'Assigned').map(s => s.student_id))
                      else setSelected([])
                    }}
                    className="rounded border-slate-300 text-purple-600" />
                </th>
                {['Student Name', 'Reg. Number', 'Batch', 'GPA', 'Department', 'Assignment Status', 'Donor Decision'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map(s => (
                <tr key={s.student_id}
                  className={`transition-colors cursor-pointer ${s.assignment_status === 'Assigned' ? 'opacity-60' : 'hover:bg-slate-50/60'} ${selected.includes(s.student_id) ? 'bg-purple-50/40' : ''}`}
                  onClick={() => s.assignment_status !== 'Assigned' && toggleSelect(s.student_id)}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(s.student_id)} readOnly
                      disabled={s.assignment_status === 'Assigned'}
                      className="rounded border-slate-300 text-purple-600" />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.student_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.registration_number}</td>
                  <td className="px-4 py-3 text-slate-600">{s.batch}</td>
                  <td className="px-4 py-3">
                    <span className={s.gpa >= 3.5 ? 'text-green-600 font-semibold' : 'text-slate-600'}>{s.gpa}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{s.department}</td>
                  <td className="px-4 py-3">
                    {s.assignment_status === 'Assigned'
                      ? <span className="badge-purple">Assigned</span>
                      : <span className="badge-grey">Not Assigned</span>}
                  </td>
                  <td className="px-4 py-3">{donorDecisionBadge(s.donor_decision || 'Not Reviewed')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confirmation bar */}
        {selected.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Selected Students</span>
              <span className="text-3xl font-bold text-slate-800 ml-3">{selected.length}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAssign} className="btn-primary">Assign Selected Students</button>
              <button onClick={() => setSelected([])} className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Final Students */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="font-semibold text-slate-700">Scholarship Selected Students</h2>
          <span className="badge-green">{finalStudents.length}</span>
          <button onClick={load} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Student Name', 'Reg. Number', 'Donor', 'Donor Approved Date', 'Final Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {finalStudents.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm">No final selections yet.</td></tr>
              ) : finalStudents.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.student_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.registration_number}</td>
                  <td className="px-4 py-3 text-slate-600">{s.donor_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.approved_at ? new Date(s.approved_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><span className="badge-green">🟢 Selected</span></td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800">
                      <Eye size={13} /> View Application
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        ℹ️ Only approved students can be assigned to donors. Donors will be able to review and approve/reject assigned students.
      </div>
    </div>
  )
}
