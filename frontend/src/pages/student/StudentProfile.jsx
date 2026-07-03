import { useState, useEffect } from 'react'
import { Pencil, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { format } from 'date-fns'

export default function StudentProfile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [apps, setApps] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/student/profile'),
      api.get('/student/applications').catch(() => ({ data: [] })),
    ]).then(([p, a]) => {
      setProfile(p.data)
      setForm({ name: p.data.name, phone: p.data.phone, address: p.data.address })
      setApps(a.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    await api.put('/student/profile', form)
    toast.success('Profile updated')
    setProfile({ ...profile, ...form })
    updateUser({ name: form.name })
    setEditing(false)
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>
  if (!profile) return null

  const Field = ({ label, value, edit, field }) => (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {editing && edit ? (
        <input value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })}
          className="input-field mt-1 text-sm" />
      ) : (
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Profile</h1>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost flex items-center gap-2 text-sm">
              <X size={14} /> Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Pencil size={14} /> Edit Profile
          </button>
        )}
      </div>

      {/* Avatar card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {profile.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{profile.name}</h2>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <span className="badge-purple mt-1">Student</span>
        </div>
      </div>

      {/* Personal Details */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Personal Details</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Full Name" value={profile.name} edit field="name" />
          <Field label="Email" value={profile.email} />
          <Field label="Phone" value={profile.phone} edit field="phone" />
          <Field label="Department" value={profile.department} />
          <Field label="Batch" value={profile.batch} />
          <Field label="Registration Number" value={profile.registration_number} />
          <Field label="Address" value={profile.address} edit field="address" />
          <Field label="GPA" value={profile.gpa} />
        </div>
      </div>

      {/* Scholarship History */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Scholarship History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Scholarship', 'Applied Date', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {apps.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No scholarship applications yet.</td></tr>
            ) : apps.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">{a.scholarship_title}</td>
                <td className="px-4 py-3 text-slate-500">{a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
