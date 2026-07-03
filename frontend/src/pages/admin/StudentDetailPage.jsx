import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Eye } from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'
import { format } from 'date-fns'

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [apps, setApps] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/admin/students/${id}`),
      api.get(`/admin/students/${id}/applications`).catch(() => ({ data: [] })),
      api.get(`/admin/students/${id}/documents`).catch(() => ({ data: [] })),
    ]).then(([s, a, d]) => {
      setStudent(s.data)
      setApps(a.data)
      setDocs(d.data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>
  if (!student) return <div className="p-8 text-center text-slate-400">Student not found.</div>

  const rowBg = (status) => {
    if (status === 'Approved') return 'bg-green-50/40'
    if (status === 'Rejected') return 'bg-red-50/40'
    if (status === 'Resubmission Requested') return 'bg-orange-50/40'
    return ''
  }

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={[{ label: 'Students', href: '/students' }, { label: student.name }]} />

      <div className="flex items-center justify-between">
        <h1 className="page-title">{student.name}</h1>
        <button onClick={() => navigate('/students')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={15} /> Back to Students
        </button>
      </div>

      {/* Basic Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Full Name" value={student.name} />
          <Field label="Registration Number" value={student.registration_number} />
          <Field label="Batch" value={student.batch} />
          <Field label="Email" value={student.email} />
          <Field label="Phone" value={student.phone} />
          <Field label="Department" value={student.department} />
          <Field label="Current Year / Level" value={student.current_year} />
          <Field label="GPA" value={student.gpa} />
          <Field label="Monthly Family Income" value={student.monthly_income ? `LKR ${Number(student.monthly_income).toLocaleString()}` : null} />
          <Field label="Number of Dependents" value={student.num_dependents} />
        </div>
      </div>

      {/* Applications */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Scholarship Applications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Scholarship', 'Application Date', 'Status', 'Assigned Donor'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {apps.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No applications.</td></tr>
              ) : apps.map(a => (
                <tr key={a.id} className={`transition-colors ${rowBg(a.status)}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.scholarship_title}</td>
                  <td className="px-4 py-3 text-slate-500">{a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{a.status === 'Approved' ? (a.donor_name || '—') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Uploaded Documents</h2>
        </div>
        <div className="mx-6 my-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
          ℹ️ Only the latest uploaded document is shown for each document type.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Document Name', 'File Name', 'Upload Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {docs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No documents.</td></tr>
              ) : docs.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 flex items-center gap-2 font-medium text-slate-800">
                    <span className="text-slate-400">📄</span>{d.document_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[140px] truncate">{d.file_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{d.created_at ? format(new Date(d.created_at), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status || 'Uploaded'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {d.file_url && <>
                        <button onClick={() => viewDocument(d.file_url)} className="flex items-center gap-1 text-xs text-purple-600 hover:underline"><Eye size={12} />View</button>
                        <span className="text-slate-200">|</span>
                        <a href={d.file_url} download className="flex items-center gap-1 text-xs text-slate-500 hover:underline"><Download size={12} />Download</a>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}