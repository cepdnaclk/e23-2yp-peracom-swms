export function StatusBadge({ status }) {
  const map = {
    // Application/General
    Pending: 'badge-amber',
    Approved: 'badge-green',
    Rejected: 'badge-red',
    'Resubmission Requested': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700',
    // Scholarship
    Active: 'badge-green',
    Inactive: 'badge-grey',
    Draft: 'badge-amber',
    // User
    pending_approval: 'badge-amber',
    approved: 'badge-green',
    rejected: 'badge-red',
    suspended: 'badge-red',
    // Issues
    Open: 'badge-red',
    'In Progress': 'badge-blue',
    Resolved: 'badge-green',
    // Donor
    'Pending Approval': 'badge-amber',
    Suspended: 'badge-red',
    // Announcements
    Published: 'badge-green',
    Scheduled: 'badge-blue',
    // Documents
    Submitted: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-purple-700 border border-purple-300',
    Verified: 'badge-purple',
    Missing: 'badge-red',
    Uploaded: 'badge-blue',
  }
  const cls = map[status] || 'badge-grey'
  return <span className={cls}>{status}</span>
}
