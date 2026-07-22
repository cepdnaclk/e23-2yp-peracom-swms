import { useState, useEffect } from 'react'
import { Megaphone } from 'lucide-react'
import api from '../../services/api'
import { format } from 'date-fns'

export default function DonorAnnouncements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/donor/announcements').catch(() => ({ data: [] })).then(r => setItems(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="page-title">Announcements</h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Megaphone size={40} className="text-slate-200 mx-auto" />
          <p className="text-slate-400">No announcements at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(a => (
            <div key={a.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h3 className="font-bold text-slate-800">{a.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="badge-purple">{a.audience}</span>
                  {a.publish_date && (
                    <span className="text-xs text-slate-400">
                      {format(new Date(a.publish_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
                {a.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
