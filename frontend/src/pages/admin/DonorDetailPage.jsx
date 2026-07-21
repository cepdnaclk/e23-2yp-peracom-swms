import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { Modal } from '../../components/common/Modal'
import api from '../../services/api'

export default function DonorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [donor, setDonor] = useState(null)
  const [scholarships, setScholarships] = useState([])
  const [assignedStudents, setAssignedStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})

  const load = () => {
    Promise.all([
      api.get(`/admin/donors/${id}`),
      api.get(`/admin/donors/${id}/scholarships`).catch(() => ({ data: [] })),
      api.get(`/admin/donors/${id}/students`).catch(() => ({ data: [] })),
    ]).then(([d, s, st]) => {
      setDonor(d.data)
      setScholarships(s.data)
      setAssignedStudents(st.data)
      setEditForm(d.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const handleAction = async (action) => {
    await api.post(`/admin/donors/${id}/${action}`)
    toast.success(`Donor ${action}d`)
    load()
  }

  const handleEditSave = async () => {
    await api.put(`/admin/donors/${id}`, editForm)
    toast.success('Donor updated')
    setEditOpen(false)
    load()
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>
  if (!donor) return <div className="p-8 text-center text-slate-400">Donor not found.</div>

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Donors', href: '/donors' }, { label: donor.name }]} />

      <div className="flex items-center justify-between">
        <h1 className="page-title">{donor.name}</h1>
        <StatusBadge status={donor.status} />
      </div>

      {/* Info */}
      <div className="card p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          <Field label="Donor Name" value={donor.name} />
          <Field label="Organization" value={donor.organization} />
          <Field label="Email" value={donor.email} />
          <Field label="Phone" value={donor.phone} />
          <Field label="Address" value={donor.address} />
          <Field label="Account Status" value={<StatusBadge status={donor.status} />} />
          <Field label="Total Contribution (LKR)" value={donor.total_contribution ? Number(donor.total_contribution).toLocaleString() : '0'} />
          <Field label="Available Fund (LKR)" value={donor.available_fund ? Number(donor.available_fund).toLocaleString() : '0'} />
          <Field label="Students Supported" value={assignedStudents.length} />
          <Field label="Registration Date" value={donor.created_at ? new Date(donor.created_at).toLocaleDateString() : null} />
        </div>
        {donor.notes && (
          <div className="mt-4 bg-slate-50 rounded-xl p-4 text-sm text-slate-600">{donor.notes}</div>
        )}
      </div>

      {/* Scholarships */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Supported Scholarships</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Scholarship Name', 'Funding Amount', 'Status', 'Students Assigned'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {scholarships.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">{s.title}</td>
                <td className="px-4 py-3 text-slate-600">LKR {Number(s.funding_amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-slate-600">{s.students_assigned ?? 0}</td>
              </tr>
            ))}
            {scholarships.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No scholarships.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assigned Students */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Assigned Students</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Student Name', 'Reg. Number', 'Scholarship', 'Batch', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assignedStudents.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">{s.student_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.registration_number}</td>
                <td className="px-4 py-3 text-slate-600">{s.scholarship_title}</td>
                <td className="px-4 py-3 text-slate-600">{s.batch}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
            {assignedStudents.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No students assigned.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-2">
          <Pencil size={15} /> Edit Donor Details
        </button>
        {donor.status === 'Pending Approval' && (
          <button onClick={() => handleAction('approve')} className="bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 transition-all">
            ✓ Approve Donor
          </button>
        )}
        {donor.status === 'Active' && (
          <button onClick={() => handleAction('suspend')} className="btn-danger">⛔ Suspend Donor</button>
        )}
        {donor.status === 'Suspended' && (
          <button onClick={() => handleAction('activate')} className="btn-primary">✓ Activate Donor</button>
        )}
        <button onClick={() => navigate('/donors')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={15} /> Back to Donor List
        </button>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Donor Details" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[['name', 'Name'], ['organization', 'Organization'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['available_fund', 'Available Fund (LKR)']].map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <input value={editForm[field] || ''} onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                className="input-field" type={field === 'available_fund' ? 'number' : 'text'} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleEditSave} className="btn-primary flex-1">Save Changes</button>
          <button onClick={() => setEditOpen(false)} className="btn-ghost">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
