// src/components/common/StatusBadge.jsx
export function StatusBadge({ status }) {
  const map = {
    'Active':                 'bg-green-100 text-green-700',
    'Approved':               'bg-green-100 text-green-700',
    'Resolved':               'bg-green-100 text-green-700',
    'Published':              'bg-green-100 text-green-700',
    'Pending':                'bg-amber-100 text-amber-700',
    'Pending Approval':       'bg-amber-100 text-amber-700',
    'In Progress':            'bg-blue-100 text-blue-700',
    'Draft':                  'bg-slate-100 text-slate-600',
    'Resubmission Requested': 'bg-orange-100 text-orange-700',
    'Rejected':               'bg-red-100 text-red-700',
    'Suspended':              'bg-red-100 text-red-700',
    'Inactive':               'bg-slate-100 text-slate-500',
    'Open':                   'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
