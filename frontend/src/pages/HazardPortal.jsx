import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { alertsAPI, dashboardAPI } from '../services/api'

export default function HazardPortal() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeNode, setActiveNode] = useState(null) // selected map node details

  // Map nodes representing regional offices/risk hotspots
  const mapNodes = [
    { id: 'na', label: 'Region Alpha (Americas)', x: 120, y: 75, risk: 'low', reason: 'Normal signal density. Safety threshold within baseline.' },
    { id: 'eu', label: 'Region Beta (Europe)', x: 250, y: 65, risk: 'medium', reason: 'Moderate civil unrest indicators flagged from local protests.' },
    { id: 'as', label: 'Region Gamma (Asia-Pacific)', x: 380, y: 95, risk: 'high', reason: 'High-risk incident cluster detected. Imminent violence warnings triggered.' },
    { id: 'af', label: 'Region Delta (Africa)', x: 260, y: 145, risk: 'medium', reason: 'Minor election coverage bias modifiers flagged. Low-level threats.' },
    { id: 'sa', label: 'Region Epsilon (South America)', x: 160, y: 155, risk: 'low', reason: 'Baseline signal density. Zero safety alerts.' }
  ]

  useEffect(() => {
    Promise.all([alertsAPI.list(), dashboardAPI.stats()])
      .then(([alertsRes, statsRes]) => {
        setAlerts(alertsRes.data.alerts || [])
        setStats(statsRes.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4b41e1]"></div>
      </div>
    )
  }

  // Calculate stats proportions
  const totalArticles = stats?.total_articles || 1
  const harmfulCount = stats?.harmful_count || 0
  const pendingCount = stats?.pending_alerts || 0

  // Filter high risk alerts
  const threatSignals = alerts.slice(0, 8)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="border-b border-[#c6c6cd] dark:border-[#333d52]/50 pb-4">
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-500">explore</span>
          Threat Intelligence Hazard Portal
        </h2>
        <p className="text-xs text-[#76777d] dark:text-[#a0a5b5]">
          Live operational visualizer mapping national security indicators, regional signal density, and escalated alerts
        </p>
      </div>

      {/* Grid: Map & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Vector Map visualizer */}
        <div className="lg:col-span-8 bg-[#111622] border border-[#222b3d] p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[380px]">
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[10px] font-bold text-white bg-red-600/95 border border-red-500/20 px-2 py-0.5 rounded tracking-wider uppercase flex items-center gap-1.5 shadow">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              Live Geolocation Signals
            </span>
          </div>

          {/* Map Vector Graphic (SVG representation of globe grid) */}
          <div className="w-full flex-1 flex items-center justify-center py-4 relative">
            <svg 
              viewBox="0 0 500 230" 
              className="w-full h-auto text-slate-700/20 dark:text-slate-800/40"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Grid representation */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Simplified world continent path silhouettes */}
              <path 
                d="M 50,50 Q 80,45 110,65 T 150,90 T 130,130 T 90,140 Z M 120,130 Q 130,160 145,180 T 160,210 T 150,225 Z M 220,50 Q 250,40 280,60 T 320,70 T 310,110 Z M 240,110 Q 250,130 260,165 T 285,185 Z M 350,70 Q 380,65 410,75 T 435,110 T 425,145 Z M 400,160 Q 420,180 435,210 Z" 
                fill="currentColor" 
                className="opacity-30 dark:opacity-20 text-slate-500 dark:text-slate-700" 
              />

              {/* Pulsing Target nodes representing regional threat hotspots */}
              {mapNodes.map((node) => {
                const isHigh = node.risk === 'high'
                const isMed = node.risk === 'medium'
                const color = isHigh ? 'fill-rose-500 stroke-rose-400' : isMed ? 'fill-amber-500 stroke-amber-400' : 'fill-emerald-500 stroke-emerald-400'
                const pulseColor = isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                
                return (
                  <g 
                    key={node.id} 
                    onClick={() => setActiveNode(node)}
                    className="cursor-pointer group"
                  >
                    {/* Ring animation */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r="12" 
                      className={`fill-transparent stroke-current opacity-25 animate-ping duration-1000 ${
                        isHigh ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />
                    {/* Outer glow ring */}
                    <circle cx={node.x} cy={node.y} r="6" className={`stroke-2 ${color} opacity-80 group-hover:scale-125 transition-transform`} />
                    {/* Solid node */}
                    <circle cx={node.x} cy={node.y} r="3.5" className={color} />
                  </g>
                )
              })}
            </svg>

            {/* Popup Detail overlay */}
            {activeNode && (
              <div className="absolute bottom-4 left-4 right-4 bg-[#1b2336]/95 border border-[#334469] rounded-xl p-4 text-white animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        activeNode.risk === 'high' ? 'bg-rose-500 animate-pulse' : activeNode.risk === 'medium' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`}></span>
                      {activeNode.label}
                    </h4>
                    <p className="text-[10px] text-slate-300 mt-1">{activeNode.reason}</p>
                  </div>
                  <button 
                    onClick={() => setActiveNode(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Color Indicator Legend */}
          <div className="border-t border-[#222b3d] pt-3 flex justify-between items-center text-[10px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Operational Baseline: UTC 2026</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low Threat</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Med Threat</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> High Threat</span>
            </div>
          </div>
        </div>

        {/* Live signals sidebar feed */}
        <div className="lg:col-span-4 bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] p-5 rounded-2xl shadow-sm flex flex-col justify-between h-[380px]">
          <div className="border-b border-[#c6c6cd]/30 dark:border-[#333d52]/40 pb-2.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">Escalated Incident Feed</h3>
            <p className="text-[9px] text-[#76777d] dark:text-[#a0a5b5] mt-0.5">Scraped warnings queued for investigation</p>
          </div>

          <div className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-0.5">
            {threatSignals.length === 0 ? (
              <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-1">
                <span className="material-symbols-outlined text-3xl">notifications_off</span>
                <p className="text-[10px]">No active threat signals detected.</p>
              </div>
            ) : (
              threatSignals.map((sig) => {
                const isPending = sig.status === 'pending'
                return (
                  <Link 
                    key={sig.id}
                    to={`/alerts/${sig.id}`}
                    className="block p-2.5 bg-[#fcf8fa]/40 dark:bg-[#161c28]/40 hover:bg-[#e2dfff]/20 dark:hover:bg-[#4b41e1]/10 border border-[#c6c6cd]/25 dark:border-[#333d52]/20 rounded-xl transition-all text-left"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {isPending ? 'PENDING' : 'REVIEWED'}
                      </span>
                      <span className="text-[8px] font-semibold text-[#76777d] dark:text-[#a0a5b5] font-mono">
                        {new Date(sig.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-bold text-[10px] text-slate-900 dark:text-white truncate">{sig.news_title || 'Intelligence Signal'}</p>
                    <p className="text-[9px] text-[#76777d] dark:text-[#a0a5b5] truncate mt-0.5">{sig.reason}</p>
                  </Link>
                )
              })
            )}
          </div>

          <Link 
            to="/alerts" 
            className="w-full bg-[#131b2e] dark:bg-[#1c2436] hover:bg-[#1d273f] text-white py-1.5 rounded-lg text-[10px] font-bold text-center transition-all block uppercase tracking-wider shadow active:scale-95"
          >
            Monitor Alerts Portal
          </Link>
        </div>

      </div>

      {/* CSS & SVG radial risk metrics gauges row */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#76777d] dark:text-[#888b94] mb-4">Live Threat Indicators Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Gauge 1: Violence */}
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] p-5 rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block">VIOLENCE RATIO</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">38%</span>
              <p className="text-[9px] text-[#76777d] dark:text-[#a0a5b5]">Threat signal baseline</p>
            </div>
            {/* SVG circle meter */}
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-rose-500" strokeDasharray="38, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>

          {/* Gauge 2: Civil Unrest */}
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] p-5 rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block">CIVIL UNREST</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">54%</span>
              <p className="text-[9px] text-[#76777d] dark:text-[#a0a5b5]">Elevated activity indicators</p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-amber-500" strokeDasharray="54, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>

          {/* Gauge 3: Safety Hazards */}
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] p-5 rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block">SAFETY HAZARDS</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">18%</span>
              <p className="text-[9px] text-[#76777d] dark:text-[#a0a5b5]">Low incident indicators</p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-emerald-500" strokeDasharray="18, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>

          {/* Gauge 4: Hate Speech */}
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] p-5 rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-[#4b41e1] dark:text-[#7f78ff] uppercase tracking-widest block">HATE SPEECH</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">29%</span>
              <p className="text-[9px] text-[#76777d] dark:text-[#a0a5b5]">Stable baseline compliance</p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-[#4b41e1] dark:text-[#7f78ff]" strokeDasharray="29, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
