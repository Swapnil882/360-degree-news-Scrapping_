import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { alertsAPI } from '../services/api'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useOutletContext()

  useEffect(() => {
    alertsAPI.list().then((res) => {
      setAlerts(res.data.alerts || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4b41e1]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-[#c6c6cd] pb-4">
        <h2 className="text-xl font-bold text-black flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4b41e1]">warning</span>
          Sensitive Alerts Feed
        </h2>
        <p className="text-xs text-[#76777d]">
          {user?.is_staff ? 'Administrative queue of flagged social safety alerts' : 'Alerts triggered by your analytical scan runs'}
        </p>
      </div>

      {alerts.length > 0 ? (
        <div className="bg-white border border-[#c6c6cd] rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f3f5] border-b border-[#c6c6cd]">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">News Article</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Flag Reason</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Reporter</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Trigger Date</th>
                  {user?.is_staff && <th className="px-6 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cd]/30 text-xs">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-[#f6f3f5]/25 transition-colors">
                    <td className="px-6 py-4 font-semibold text-black max-w-xs truncate">
                      {alert.news_title}
                    </td>
                    <td className="px-4 py-4 text-[#45464d] max-w-xs truncate">
                      {alert.reason}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        alert.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        alert.status === 'reviewed' ? 'bg-[#e2dfff] text-[#3323cc] border-[#c3c0ff]' :
                        alert.status === 'escalated' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-black font-semibold">
                      {alert.reported_by_username}
                    </td>
                    <td className="px-4 py-4 text-[#76777d] font-mono">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </td>
                    {user?.is_staff && (
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/alerts/${alert.id}`} 
                          className="bg-[#4b41e1] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4b41e1]/90 transition-all active:scale-95 inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-xs">security_update</span>
                          Review
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cd] rounded-lg shadow-sm p-16 text-center text-[#76777d]">
          <span className="material-symbols-outlined text-5xl text-emerald-500 mb-3 block">check_circle</span>
          <h4 className="text-black font-semibold text-sm">System Verified Clear</h4>
          <p className="text-xs mt-1">All scraped article records match public safety guidelines. No alerts found.</p>
        </div>
      )}
    </div>
  )
}
