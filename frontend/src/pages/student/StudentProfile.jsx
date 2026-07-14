import { useState, useEffect } from 'react'
import { Pencil, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { format } from 'date-fns'

export default function StudentProfile() {
  const { updateUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [apps, setApps] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/student/profile'),
      api.get('/student/applications').catch(() => ({ data: [] })),
    ])
      .then(([profileResponse, applicationsResponse]) => {
        setProfile(profileResponse.data)

        setForm({
          name: profileResponse.data.name || '',
          phone: profileResponse.data.phone || '',
        })

        setApps(applicationsResponse.data)
      })
      .catch((error) => {
        toast.error(
          error.response?.data?.message || 'Failed to load profile'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleFieldChange = (field, value) => {
    let newValue = value

    if (field === 'phone') {
      newValue = value.replace(/\D/g, '').slice(0, 10)
    }

    setForm((previousForm) => ({
      ...previousForm,
      [field]: newValue,
    }))
  }

  const handleCancel = () => {
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
    })

    setEditing(false)
  }

  const handleSave = async () => {
    const cleanedName = form.name.trim()
    const cleanedPhone = form.phone.trim()

    if (!cleanedName) {
      toast.error('Full name is required')
      return
    }

    if (!/^07\d{8}$/.test(cleanedPhone)) {
      toast.error(
        'Phone number must start with 07 and contain exactly 10 digits'
      )
      return
    }

    try {
      setSaving(true)

      const response = await api.put('/student/profile', {
        name: cleanedName,
        phone: cleanedPhone,
      })

      setProfile((previousProfile) => ({
        ...previousProfile,
        ...response.data,
      }))

      setForm({
        name: response.data.name || '',
        phone: response.data.phone || '',
      })

      updateUser({
        name: response.data.name,
      })

      toast.success('Profile updated successfully')
      setEditing(false)
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update profile'
      )
    } finally {
      setSaving(false)
    }
  }

  const Field = ({
    label,
    value,
    editable = false,
    field,
  }) => (
    <div>
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      {editing && editable ? (
        <input
          type={field === 'phone' ? 'tel' : 'text'}
          value={form[field] || ''}
          onChange={(event) =>
            handleFieldChange(field, event.target.value)
          }
          maxLength={field === 'phone' ? 10 : undefined}
          placeholder={
            field === 'phone'
              ? '07XXXXXXXX'
              : `Enter ${label.toLowerCase()}`
          }
          className="input-field mt-1 text-sm"
        />
      ) : (
        <p className="text-sm font-semibold text-slate-800 mt-0.5">
          {value || '—'}
        </p>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-400">
        Profile not found.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Profile</h1>

        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Avatar card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {profile.name?.[0]?.toUpperCase() || 'S'}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {profile.name}
          </h2>

          <p className="text-sm text-slate-500">
            {profile.email}
          </p>

          <span className="badge-purple mt-1">
            Student
          </span>
        </div>
      </div>

      {/* Personal Details */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-700 mb-4">
          Personal Details
        </h2>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Full Name"
            value={profile.name}
            editable
            field="name"
          />

          <Field
            label="Email"
            value={profile.email}
          />

          <Field
            label="Phone"
            value={profile.phone}
            editable
            field="phone"
          />

          <Field
            label="Department"
            value={profile.department}
          />

          <Field
            label="Batch"
            value={profile.batch}
          />

          <Field
            label="Registration Number"
            value={profile.registration_number}
          />

          
        </div>
      </div>

      {/* Scholarship History */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">
            Scholarship History
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {[
                'Scholarship',
                'Applied Date',
                'Status',
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {apps.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No scholarship applications yet.
                </td>
              </tr>
            ) : (
              apps.map((application) => (
                <tr
                  key={application.id}
                  className="hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {application.scholarship_title}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {application.created_at
                      ? format(
                          new Date(application.created_at),
                          'MMM d, yyyy'
                        )
                      : '—'}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={application.status}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}