export function StatCard({ title, value, icon: Icon, color = 'purple', subtitle }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    grey: 'bg-slate-50 text-slate-600',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
