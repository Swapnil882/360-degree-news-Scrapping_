import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom'
import { alertsAPI } from '../services/api'

export default function AlertDetail() {
  const { id } = useParams()
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const { user } = useOutletContext()
  const navigate = useNavigate()

  useEffect(() => {
    alertsAPI.get(id).then((res) => {
      setAlert(res.data)
      setStatus(res.data.status)
      setNotes(res.data.admin_notes || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await alertsAPI.update(id, { status, admin_notes: notes })
      navigate('/alerts')
    } catch (err) {
      alert('Failed to update alert. Try again.')
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4b41e1]"></div>
      </div>
    )
  }
  
  if (!alert) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="p-4 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] rounded-lg">
          Alert not found or access denied.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <Link to="/alerts" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4b41e1] hover:underline mb-4">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Alerts Feed
        </Link>
        <h2 className="text-xl font-bold text-black flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600">report</span>
          Alert Investigation Protocol
        </h2>
        <p className="text-xs text-[#76777d]">Case review details and action logs for alert Case #{alert.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        {/* Left Column: News Information & Alert Reason */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#c6c6cd] rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-[#c6c6cd] bg-[#f6f3f5]/55">
              <h5 className="text-xs font-bold uppercase tracking-wider text-black">Flagged Article Metadata</h5>
            </div>
            <div className="p-6 space-y-4">
              <h4 className="text-base font-bold text-black leading-snug">{alert.news_title}</h4>
              <div className="text-xs text-[#76777d]">
                <p><strong>Database News ID Reference:</strong> {alert.news_id}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#c6c6cd] rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-[#c6c6cd] bg-[#f6f3f5]/55">
              <h5 className="text-xs font-bold uppercase tracking-wider text-black">Automated Audit Reason</h5>
            </div>
            <div className="p-6">
              <div className="p-4 bg-[#ffdad6]/20 border-l-4 border-[#ba1a1a] text-sm text-[#93000a] rounded-r-lg font-mono">
                {alert.reason}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Case status info & admin form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#c6c6cd] p-6 rounded-lg shadow-sm space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-black border-b border-[#c6c6cd]/50 pb-2">Case Assessment Info</h5>
            <div className="space-y-3 text-xs">
              <p className="flex justify-between">
                <span className="text-[#76777d]">Current Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  alert.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  alert.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                  alert.status === 'escalated' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>{alert.status}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#76777d]">Reporter User:</span>
                <span className="font-semibold text-black">{alert.reported_by_username}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#76777d]">Trigger Date:</span>
                <span className="font-mono text-black">{new Date(alert.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {user?.is_staff && (
            <div className="bg-white border border-[#c6c6cd] p-6 rounded-lg shadow-sm">
              <h5 className="text-xs font-bold uppercase tracking-wider text-black border-b border-[#c6c6cd]/50 pb-2 mb-4">Admin Action Log</h5>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#45464d] uppercase mb-1.5">Action Status Override</label>
                  <select 
                    className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg p-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] outline-none"
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">Pending Review</option>
                    <option value="reviewed">Mark Reviewed</option>
                    <option value="escalated">Escalate Case</option>
                    <option value="resolved">Mark Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#45464d] uppercase mb-1.5">Administrative Notes</label>
                  <textarea 
                    className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] outline-none placeholder-[#76777d]" 
                    rows="4" 
                    placeholder="Provide evaluation notes, risk reports, or next steps..."
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={updating}
                  className="w-full bg-[#4b41e1] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-[#4b41e1]/95 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">security_update</span>
                  {updating ? 'Updating Case...' : 'Update Investigation'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
