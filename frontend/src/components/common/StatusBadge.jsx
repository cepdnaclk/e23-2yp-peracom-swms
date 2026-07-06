export function StatusBadge({ status }) {
  const map = {
    // Application/General
    Pending:                  'badge-amber',
    Approved:                 'badge-green',
    Rejected:                 'badge-red',
    'Resubmission Requested': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700',
    // Scholarship
    Active:                   'badge-green',
    Inactive:                 'badge-grey',
    Draft:                    'badge-amber',
    // User
    pending_approval:         'badge-amber',
    approved:                 'badge-green',
    rejected:                 'badge-red',
    suspended:                'badge-red',
    // Issues
    Open:                     'badge-red',
    'In Progress':            'badge-blue',
    Resolved:                 'badge-green',
    // Donor
    'Pending Approval':       'badge-amber',
    Suspended:                'badge-red',
    // Announcements
    Published:                'badge-green',
    Scheduled:                'badge-blue',
    // Documents
    Submitted:                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-purple-700 border border-purple-300',
    Verified:                 'badge-green',
    Missing:                  'badge-red',
    Uploaded:                 'badge-blue',
    // ── New payment workflow statuses ──
    'Admin Approved':         'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700',
    'Donor Approved':         'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700',
    'Fully Approved':         'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 font-bold',
    'Payment Details Submitted': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700',
    'Pending Verification':   'badge-blue',
    'Payment Verified':       'badge-green',
    'Resubmission Required':  'badge-red',
    'Re-Submitted':           'badge-amber',
    Locked:                   'badge-grey',
    Unlocked:                 'badge-blue',
    Completed:                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-900 font-bold',
  }
  const cls = map[status] || 'badge-grey'
  return <span className={cls}>{status}</span>
}