import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Mail, XCircle, Eye, Send, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Modal } from '../../components/common/Modal'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { format } from 'date-fns'

export default function ScholarshipCommunicationPage() {
  const [options, setOptions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [optionsRes, notificationsRes] = await Promise.all([
        api.get('/admin/scholarship-notification-options'),
        api.get('/admin/scholarship-notifications')
      ])
      setOptions(optionsRes.data || [])
      setNotifications(notificationsRes.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreateModal = (item) => {
    const message = `Dear ${item.student_name} and ${item.donor_name},\n\nThis scholarship communication has been reviewed and approved by the admin team.\n\nScholarship: ${item.scholarship_title}\nStudent: ${item.student_name}\nDonor: ${item.donor_name}\nFunding Amount: LKR ${Number(item.funding_amount || 0).toLocaleString()}\n\nPlease contact the student welfare office for further updates.\n\nRegards,\nUniversity of Peradeniya\nStudent Welfare Management System`

    setSelected({
      scholarshipId: item.scholarship_id,
      studentId: item.student_id,
      donorId: item.donor_id,
      subject: `Scholarship Award Notification - ${item.scholarship_title}`,
      message,
      student_name: item.student_name,
      donor_name: item.donor_name,
      scholarship_title: item.scholarship_title,
    })
    setModalOpen(true)
  }

  const submitNotification = async () => {
    if (!selected) return

    try {
      await api.post('/admin/scholarship-notifications', {
        scholarshipId: selected.scholarshipId,
        studentId: selected.studentId,
        donorId: selected.donorId,
        subject: selected.subject,
        message: selected.message,
      })

      toast.success('Communication created for admin approval')
      setModalOpen(false)
      setSelected(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create notification')
    }
  }

  const sendNotification = async (notificationId) => {
    try {
      await api.post(`/admin/scholarship-notifications/${notificationId}/send`)
      toast.success('Notification sent to student and donor')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification')
    }
  }

  const rejectNotification = async (notificationId) => {
    try {
      await api.post(`/admin/scholarship-notifications/${notificationId}/reject`, {
        reason: rejectReason || 'No reason provided' 
      })
      toast.success('Notification rejected')
      setRejectOpen(false)
      setRejectReason('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject notification')
    }
  }

  const stats = useMemo(() => ({
    total: notifications.length,
    pending: notifications.filter(n => n.status === 'pending').length,
    approved: notifications.filter(n => n.status === 'approved').length,
    sent: notifications.filter(n => n.status === 'sent').length,
    rejected: notifications.filter(n => n.status === 'rejected').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  }), [notifications])

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Communication Approvals' }]} />
      <div className="flex items-center justify-between">
        <h1 className="page-title">Scholarship Communication Approvals</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">Approved</p>
          <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">Sent</p>
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">Failed</p>
          <p className="text-2xl font-bold text-rose-600">{stats.failed}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-4 py-3 text-left">Scholarship</th>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Donor</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : notifications.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No communication requests yet.</td></tr>
            ) : notifications.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{item.scholarship_title}</td>
                <td className="px-4 py-3 text-slate-600">{item.student_name}</td>
                <td className="px-4 py-3 text-slate-600">{item.donor_name}</td>
                <td className="px-4 py-3 text-slate-600">{item.subject}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'pending' && (
                      <>
                        <button onClick={() => sendNotification(item.id)} className="p-2 rounded-lg text-green-600 hover:bg-green-50" title="Approve and send">
                          <Send size={15} />
                        </button>
                        <button onClick={() => { setRejectOpen(true); setSelected(item) }} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Reject">
                          <Ban size={15} />
                        </button>
                      </>
                    )}
                    {item.status === 'sent' && (
                      <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                        <CheckCircle2 size={14} /> Sent
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium">
                        <XCircle size={14} /> Rejected
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-medium">
                        <Mail size={14} /> Failed
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700">Ready-to-send Scholarship Notifications</h2>
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-slate-500">No approved scholarship awards are available for communication.</p>
        ) : (
          <div className="grid gap-3">
            {options.map(item => (
              <div key={`${item.scholarship_id}-${item.student_id}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/40">
                <div>
                  <p className="font-semibold text-slate-800">{item.scholarship_title}</p>
                  <p className="text-sm text-slate-600">Student: {item.student_name} · Donor: {item.donor_name}</p>
                </div>
                <button onClick={() => openCreateModal(item)} className="btn-primary inline-flex items-center gap-2">
                  <Eye size={15} /> Review & Create
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null) }} title="Review Scholarship Notification" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Scholarship</label>
                <div className="input-field bg-slate-50">{selected.scholarship_title}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Student / Donor</label>
                <div className="input-field bg-slate-50">{selected.student_name} / {selected.donor_name}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
              <input
                className="input-field"
                value={selected.subject}
                onChange={(e) => setSelected({ ...selected, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
              <textarea
                rows={8}
                className="input-field resize-none"
                value={selected.message}
                onChange={(e) => setSelected({ ...selected, message: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={submitNotification} className="btn-primary flex-1">Create for Approval</button>
              <button onClick={() => { setModalOpen(false); setSelected(null) }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => { setRejectOpen(false); setSelected(null) }} title="Reject Notification" size="md">
        <div className="space-y-4">
          <textarea
            rows={5}
            className="input-field resize-none"
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <button onClick={() => { if (selected) rejectNotification(selected.id) }} className="btn-danger flex-1">Reject</button>
            <button onClick={() => { setRejectOpen(false); setRejectReason('') }} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
