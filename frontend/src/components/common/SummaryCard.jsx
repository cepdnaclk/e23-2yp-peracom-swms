// src/components/common/SummaryCard.jsx
export function SummaryCard({ title, value, icon: Icon, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600',
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{title}</p>
      </div>
    </div>
  );
}
