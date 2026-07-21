import { useState, useEffect } from 'react'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'

export default function DonorProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/donor/profile').then(r => setProfile(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>
  if (!profile) return <div className="p-8 text-center text-slate-400">Profile not found.</div>

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="page-title">My Profile</h1>

      {/* Avatar card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {profile.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{profile.name}</h2>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-purple">Doner</span>
            {profile.organization && <span className="text-xs text-slate-400">{profile.organization}</span>}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Profile Details</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Full Name" value={profile.name} />
          <Field label="Email" value={profile.email} />
          <Field label="Phone" value={profile.phone} />
          <Field label="Organization" value={profile.organization} />
          <Field label="Address" value={profile.address} />
          <div>
            <p className="text-xs font-medium text-slate-500">Account Status</p>
            <div className="mt-0.5"><StatusBadge status={profile.status} /></div>
          </div>
          <Field label="Available Fund (LKR)" value={profile.available_fund ? Number(profile.available_fund).toLocaleString() : '0'} />
          <Field label="Total Contribution (LKR)" value={profile.total_contribution ? Number(profile.total_contribution).toLocaleString() : '0'} />
        </div>
      </div>
    </div>
  )
}
