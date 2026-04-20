// src/components/common/PageHeader.jsx
export function PageHeader({ title, breadcrumb, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        {breadcrumb && <p className="text-xs text-slate-400 mb-1">{breadcrumb}</p>}
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// src/components/common/LoadingSpinner.jsx
export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// src/components/common/EmptyState.jsx
export function EmptyState({ message = 'No records found.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// src/components/common/Modal.jsx
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
