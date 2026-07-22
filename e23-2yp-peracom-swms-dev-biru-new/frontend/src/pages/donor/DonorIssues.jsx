import { useState, useEffect } from 'react'
import { Plus, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Modal } from '../../components/common/Modal'
import api from '../../services/api'
import { format } from 'date-fns'

export default function DonorIssues() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Scholarship Issue')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadIssues = () => {
    api.get('/donor/issues')
      .then(res => setIssues(res.data))
      .catch(() => toast.error('Failed to load issues'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadIssues() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/donor/issues', { title, category, description })
      toast.success('Issue reported successfully!')
      setIsModalOpen(false)
      setTitle(''); setDescription(''); setCategory('Scholarship Issue');
      loadIssues()
    } catch (error) {
      toast.error('Failed to report issue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'My Support Issues' }]} />
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Support & Issues</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Plus size={18} /> Report Issue
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> : 
             issues.length === 0 ? <tr><td colSpan={4} className="p-4 text-center">No issues reported.</td></tr> :
             issues.map(issue => (
              <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{issue.title}</td>
                <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{issue.category}</span></td>
                <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedIssue(issue)} className="text-purple-600 hover:bg-purple-50 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <MessageSquare size={14}/> View Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <Modal open={!!selectedIssue} onClose={() => setSelectedIssue(null)} title="Issue Details" size="md">
        {selectedIssue && (
          <div className="space-y-4">
            <div><h3 className="font-semibold text-slate-800">{selectedIssue.title}</h3><p className="text-sm text-slate-500 mt-1">{selectedIssue.description}</p></div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <h4 className="text-xs font-semibold text-blue-800 uppercase mb-2">Admin Reply</h4>
              {selectedIssue.admin_reply ? <p className="text-sm text-blue-900">{selectedIssue.admin_reply}</p> : <p className="text-sm text-blue-400 italic">No reply yet from the admin.</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report a New Issue" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Title</label><input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full border rounded-lg p-2" /></div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded-lg p-2">
              <option>Scholarship Issue</option><option>Document Issue</option><option>System Issue</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full border rounded-lg p-2 resize-none"></textarea></div>
          <button type="submit" disabled={submitting} className="w-full bg-purple-600 text-white rounded-lg py-2 mt-2">{submitting ? 'Submitting...' : 'Submit Issue'}</button>
        </form>
      </Modal>
    </div>
  )
}