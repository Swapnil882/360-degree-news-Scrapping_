import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { dashboardAPI } from '../services/api'

export default function Dashboard() {
  const { user } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.stats()
      .then((res) => {
        setStats(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4b41e1]"></div>
      </div>
    )
  }

  // --- RENDER FIELD ANALYZE VIEW ---
  if (!user?.is_staff) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300 text-left">
        
        {/* Welcome Section Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#131b2e] to-[#252f48] text-[#dae2fd] p-8 border border-[#c6c6cd]/10 shadow-md">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4b41e1]/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#7c839b]">Analyst Control Portal</span>
              <h2 className="text-3xl font-black text-white mt-1">Workspace Hub</h2>
              <p className="text-sm text-[#7c839b] mt-1.5 max-w-2xl leading-relaxed">
                Welcome back to your workstation, {user?.username}. Access the active media intelligence scanner, query ingestion databases, view charts, and monitor flagged warnings below.
              </p>
            </div>
            <div className="flex gap-2.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-full shadow-sm text-nowrap items-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>WORKSTATION READY</span>
            </div>
          </div>
        </div>

        {/* Modular Grid Panel */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76777d] dark:text-[#888b94] mb-5">Workspace Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Module 1: Scraper Terminal */}
            <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 p-6 rounded-2xl flex flex-col justify-between hover:border-[#4b41e1]/40 hover:shadow-lg transition-all duration-300 relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#4b41e1]/5 rounded-bl-full group-hover:bg-[#4b41e1]/10 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 bg-[#4b41e1]/10 text-[#4b41e1] dark:text-[#7f78ff] rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300">
                  <span className="material-symbols-outlined text-2xl">language</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Domain Ingestion Scraper</h4>
                <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1.5 leading-relaxed">
                  Submit news site URLs to crawl text blocks, complete rotating residential proxy handshakes, and run real-time sentiment scans.
                </p>
              </div>
              <div className="mt-6">
                <Link to="/scraper" className="inline-flex items-center gap-1 bg-[#4b41e1] hover:bg-[#4b41e1]/95 text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95">
                  Open Terminal
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Module 2: Ingested Reports */}
            <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 p-6 rounded-2xl flex flex-col justify-between hover:border-amber-500/40 hover:shadow-lg transition-all duration-300 relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300">
                  <span className="material-symbols-outlined text-2xl">folder_open</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Scraped Reports Archive</h4>
                <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1.5 leading-relaxed">
                  Browse historical runs, filter items by sentiment polarity or threat levels, and query article records with text search.
                </p>
              </div>
              <div className="mt-6">
                <Link to="/scraped-reports" className="inline-flex items-center gap-1 bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] text-[#1b1b1d] dark:text-[#dae2fd] hover:bg-[#f6f3f5] dark:hover:bg-[#222b3d] px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95">
                  Browse Archive
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Module 3: Operational Dashboard */}
            <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full group-hover:bg-indigo-500/10 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300">
                  <span className="material-symbols-outlined text-2xl">dashboard</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">System Analytics Charts</h4>
                <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1.5 leading-relaxed">
                  Monitor statistical layouts showing overall polarity distributions, proxy workloads, weekly trends, and threat alerts.
                </p>
              </div>
              <div className="mt-6">
                <Link to="/analytics-dashboard" className="inline-flex items-center gap-1 bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] text-[#1b1b1d] dark:text-[#dae2fd] hover:bg-[#f6f3f5] dark:hover:bg-[#222b3d] px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95">
                  View Analytics
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Module 4: Incident Feed */}
            <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 p-6 rounded-2xl flex flex-col justify-between hover:border-rose-500/40 hover:shadow-lg transition-all duration-300 relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full group-hover:bg-rose-500/10 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300">
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Incidents Escalation Feed</h4>
                <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1.5 leading-relaxed">
                  Track active threat indicators, inspect safety flags matching violence or unrest parameters, and monitor escalations.
                </p>
              </div>
              <div className="mt-6">
                <Link to="/alerts" className="inline-flex items-center gap-1 bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] text-[#1b1b1d] dark:text-[#dae2fd] hover:bg-[#f6f3f5] dark:hover:bg-[#222b3d] px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95">
                  Monitor Alerts
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    )
  }

  // --- RENDER ADMIN / STAFF VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Critical Alerts Summary Banner */}
      {stats?.pending_alerts > 0 && (
        <div className="p-4 bg-[#ffdad6] dark:bg-rose-950/20 border border-[#ba1a1a]/20 dark:border-rose-900/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="bg-[#ba1a1a] text-white p-2 rounded-full flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-lg">warning</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#93000a] dark:text-rose-400">{stats.pending_alerts} Critical Alerts Pending Review</h2>
              <p className="text-xs text-[#93000a] dark:text-rose-400/80 opacity-90 mt-0.5">Immediate administrative review is required for flagged safety incidents in the queue.</p>
            </div>
          </div>
          <Link to="/alerts" className="bg-[#93000a] hover:bg-[#ba1a1a] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm text-nowrap">
            View Alerts Queue
          </Link>
        </div>
      )}

      {/* Grid: Administration Overview & System Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Administrator Guidelines & Review Policy */}
        <section className="lg:col-span-8 bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 p-6 rounded-2xl shadow-sm text-left space-y-4">
          <div className="border-b border-[#c6c6cd]/50 dark:border-[#333d52]/50 pb-3">
            <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4b41e1] dark:text-[#7f78ff] text-lg">gavel</span>
              Administrative Review & Compliance Protocol
            </h3>
            <p className="text-[11px] text-[#76777d] dark:text-[#a0a5b5] mt-0.5">Operations manual for reviewing media polarization warnings and compliance</p>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-[#a0a5b5]">
            <div className="p-3.5 bg-slate-50 dark:bg-[#161c28] border border-slate-100 dark:border-[#222b3d] rounded-xl">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Incident Verification Audit</h4>
              <p>
                Admins must inspect the raw HTML parsed content segments of all escalated articles. Ensure that automated polarity highlights accurately reflect emotional bias modifiers before taking actions.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#161c28] border border-slate-100 dark:border-[#222b3d] rounded-xl">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. Escalation and Dismissal Framework</h4>
              <p>
                Articles containing clear, verified incitements to violence or safety compromises must remain flagged. Trivial or wrongly highlighted polarity phrases can be marked as Reviewed with analyst audit notes appended.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#161c28] border border-slate-100 dark:border-[#222b3d] rounded-xl">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. ISO-902 Database Audits</h4>
              <p>
                Every week, compliance records must be cross-matched against SQLite archives. Ensure that direct proxy handshakes and verified articles remain securely locked under data-retention rules.
              </p>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Trends & Health */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* General Stats summary for admins */}
          <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 p-6 rounded-2xl shadow-sm text-left">
            <h4 className="text-[11px] font-bold text-black dark:text-white uppercase tracking-wider mb-4">SYSTEM STATS OVERVIEW</h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#76777d] dark:text-[#a0a5b5]">Global Articles Scraped</span>
                <span className="font-black text-black dark:text-white font-mono">{stats?.total_articles || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#76777d] dark:text-[#a0a5b5]">Escalated Threat Signals</span>
                <span className="font-black text-rose-500 font-mono">{stats?.harmful_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#76777d] dark:text-[#a0a5b5]">Pending Review Queue</span>
                <span className="font-black text-amber-500 font-mono">{stats?.pending_alerts || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#76777d] dark:text-[#a0a5b5]">Registered Analyst Officers</span>
                <span className="font-black text-black dark:text-white font-mono">{stats?.total_users || 0}</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 p-6 rounded-2xl shadow-sm text-left">
            <h4 className="text-[11px] font-bold text-black dark:text-white uppercase tracking-wider mb-4">INTELLIGENCE INFRASTRUCTURE</h4>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-black dark:text-white">NLP Analysis Core</p>
                  <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5]">Lat: 38ms / Q: 1.2k</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600">ONLINE</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
              <div className="h-[1px] bg-[#c6c6cd]/30 dark:bg-[#333d52]/30"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-black dark:text-white">Feed Aggregator</p>
                  <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5]">Active Sources: 482</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600">ONLINE</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
              <div className="h-[1px] bg-[#c6c6cd]/30 dark:bg-[#333d52]/30"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-black dark:text-white">Scraper Proxy Node</p>
                  <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5]">Residential Sync: 99%</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-600">SYNCING</span>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Geolocation Card */}
          <div className="relative bg-white dark:bg-[#121824]/50 border border-[#c6c6cd] dark:border-[#333d52]/50 rounded-2xl overflow-hidden h-64 shadow-sm group">
            <img 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuADmAGoUONCmsH3lI15IqkKQDQkXyIHhEZ2YwbqcXM9tysWD7Ps8WxxcTOrS8sHwsmcpR4U7RZ1nKdH_judzZQsPbSU6Lt78YMz-69iGtoF4sXfKUkIbFRQ3il2MTG1zn7hVUMOlbhSN66E2AyDSgjSF4dseKT51p9TtGEuGuUfSxA0CrL6oM0yn0egc98ExuWRJSwXYSlm744qPxc24i73NV3W_RTCRdIBwIf7vHlTH_60DRRFGCfe-pPNmhmrVvT55fIpjlduUg2D" 
              alt="Global Shipping Routes"
            />
            <div className="absolute inset-0 bg-[#131b2e]/20 pointer-events-none"></div>
            <div className="absolute top-3 left-3 bg-[#131b2e]/90 text-white px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide">
              LIVE SIGNAL GEOLOCATION
            </div>
            <div className="absolute bottom-3 right-3 flex gap-1 items-center bg-[#1b1b1d]/85 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
              <span>CORRIDOR ACTIVE</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
