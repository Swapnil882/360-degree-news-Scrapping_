import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { alertsAPI, dashboardAPI } from '../services/api'

export default function Home() {
  const { user } = useOutletContext() || {}
  const [recentAlerts, setRecentAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [stats, setStats] = useState({ total_articles: 0, harmful_count: 0, pending_alerts: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      alertsAPI.list()
        .then((res) => {
          setRecentAlerts(res.data.alerts?.slice(0, 3) || [])
          setAlertsLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setAlertsLoading(false)
        })
      dashboardAPI.stats()
        .then((res) => {
          setStats(res.data)
          setStatsLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setStatsLoading(false)
        })
    }
  }, [user])

  if (user) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#131b2e] to-[#252f48] text-[#dae2fd] p-8 border border-[#c6c6cd]/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4b41e1]/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#7c839b]">Analyst Control Portal</span>
              <h2 className="text-3xl font-black text-white mt-1">Welcome Back, {user.username}</h2>
              <p className="text-sm text-[#7c839b] mt-1 max-w-xl">
                Securing information integrity. Standardized bias scoring protocol compliant with Global Insight ISO-902.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/scraper" className="bg-[#4b41e1] hover:bg-[#4b41e1]/95 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">analytics</span>
                Analyze URL
              </Link>
              <Link to="/alerts" className="bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase border border-white/10 transition-all active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">notifications</span>
                Alerts Feed
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 p-6 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-[#4b41e1] dark:text-[#7f78ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">database</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7c839b] dark:text-[#888b94] uppercase tracking-wider">Content Database</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {statsLoading ? <span className="inline-block w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /> : `${stats.total_articles.toLocaleString()} Items`}
              </h4>
            </div>
          </div>
          <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 p-6 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">gpp_maybe</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7c839b] dark:text-[#888b94] uppercase tracking-wider">Flagged Threats</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {statsLoading ? <span className="inline-block w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /> : `${stats.harmful_count} Active`}
              </h4>
            </div>
          </div>
          <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 p-6 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7c839b] dark:text-[#888b94] uppercase tracking-wider">Pending Alerts</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {statsLoading ? <span className="inline-block w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /> : `${stats.pending_alerts} Pending`}
              </h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick Actions Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Analyst Operations Quick Links</h3>
              <div className="divide-y divide-[#c6c6cd]/25 dark:divide-[#333d52]/30">
                <Link to="/scraper" className="flex items-center justify-between py-4 group hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#4b41e1] dark:text-[#7f78ff] text-xl">language</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Domain Ingestion Scraper</h4>
                      <p className="text-xs text-[#7c839b] dark:text-[#888b94] mt-0.5">Scrape news articles from target URLs using residential proxy handshake</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7c839b] group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                </Link>
                <Link to="/alerts" className="flex items-center justify-between py-4 group hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-rose-500 text-xl">warning</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Incidents Escalation Desk</h4>
                      <p className="text-xs text-[#7c839b] dark:text-[#888b94] mt-0.5">Audit flagged polarity articles and enforce compliance protocols</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7c839b] group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                </Link>
                <Link to="/scraped-reports" className="flex items-center justify-between py-4 group hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-xl">folder_open</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ingestion Run Archives</h4>
                      <p className="text-xs text-[#7c839b] dark:text-[#888b94] mt-0.5">Browse historical datasets, sentiment scores, and article text blocks</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7c839b] group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Alerts Feed summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#121824]/50 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Recent Security Flags</h3>
                <Link to="/alerts" className="text-xs font-semibold text-[#4b41e1] dark:text-[#7f78ff] hover:underline">View All</Link>
              </div>
              
              {alertsLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : recentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {recentAlerts.map(alert => (
                    <Link key={alert.id} to={`/alerts/${alert.id}`} className="block p-3 rounded-xl bg-slate-50 dark:bg-[#161c28] border border-slate-100 dark:border-[#222b3d] hover:border-indigo-500/20 hover:shadow-sm transition-all text-left">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          alert.status === 'escalated' 
                            ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                        }`}>
                          {alert.status}
                        </span>
                        <span className="text-[9px] text-[#7c839b]">{new Date(alert.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-1.5">{alert.news_title}</p>
                      <p className="text-[10px] text-[#7c839b] truncate mt-0.5">{alert.reason}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[#7c839b]">
                  <span className="material-symbols-outlined text-emerald-500 text-3xl mb-1 block">check_circle</span>
                  <p className="text-xs">No active alerts flagged</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="text-[#1f2128] dark:text-[#f1f3f7] transition-colors duration-300 overflow-x-hidden">
      
      {/* Decorative Blur Ambient Background Glows (talk2site style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[5%] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] md:w-[700px] md:h-[700px] bg-indigo-500/10 dark:bg-[#4b41e1]/8 rounded-full blur-[100px] sm:blur-[150px]"></div>
        <div className="absolute top-[30%] left-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[100px] sm:blur-[140px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-amber-500/8 dark:bg-amber-500/4 rounded-full blur-[90px] sm:blur-[120px]"></div>
        
        {/* Animated Background Particles */}
        <div className="absolute top-24 left-[15%] w-3 h-3 rounded-full bg-indigo-500/30 animate-float"></div>
        <div className="absolute top-[45%] right-[20%] w-4 h-4 rounded-full bg-rose-500/30 animate-float-delayed"></div>
        <div className="absolute bottom-[35%] left-[25%] w-2.5 h-2.5 rounded-full bg-amber-500/40 animate-float"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 sm:py-32 flex items-center justify-center border-b border-slate-200/50 dark:border-slate-800/40 z-10">
        
        {/* Grid Overlay Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b41e1 0.75px, transparent 0.75px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Copy Column */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              
              {/* Premium Glow Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-[#121723] border border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-100/50 dark:shadow-none animate-[fadeIn_0.5s_ease-out] mx-auto lg:mx-0">
                <span className="material-symbols-outlined text-[#4b41e1] dark:text-[#7f78ff] text-sm animate-pulse">sparkles</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">
                  Smart AI-Powered Media Scraper & Sentiment Analyzer
                </span>
              </div>
              
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-[3.25rem] font-black leading-[1.08] tracking-tight">
                Civic Intelligence That Turns <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4b41e1] via-[#645efb] to-[#c3c0ff] text-glow">
                  Raw News into Audits
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Elevate media analysis into an automated intelligence pipeline. Securely scrape news sites, parse emotional polarity scores, verify narratives, and query logs across languages instantly.
              </p>

              {/* Bullet Features list */}
              <div className="pt-2 flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow"></span>
                  <span>Residential Sandbox Handshake</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow"></span>
                  <span>Polarity & Narrative Bias Classification</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow"></span>
                  <span>Multilingual DB Search Widget</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 w-full sm:w-auto">
                {user ? (
                  <>
                    <Link 
                      to="/scraper" 
                      className="bg-[#4b41e1] hover:bg-[#3f34cc] text-white px-7 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#4b41e1]/20 dark:shadow-none w-full sm:w-auto text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">terminal</span>
                      Open Analysis Panel
                    </Link>
                    <Link 
                      to="/scraped-reports" 
                      className="bg-white dark:bg-[#121824] hover:bg-slate-50 dark:hover:bg-[#1a2130] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-7 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">folder_open</span>
                      Explore Archives
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/register" 
                      className="bg-[#4b41e1] hover:bg-[#3f34cc] text-white px-8 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#4b41e1]/20 w-full sm:w-auto text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Get Started Free
                    </Link>
                    <Link 
                      to="/login" 
                      className="bg-white dark:bg-[#121824] hover:bg-slate-50 dark:hover:bg-[#1a2130] text-[#4b41e1] dark:text-[#7f78ff] border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                    >
                      Log In
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Widget Column (Dashboard Mockup Image) */}
            <div className="lg:col-span-5 relative w-full flex justify-center">
              
              {/* Outer Glowing frame */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#4b41e1] to-[#c3c0ff] rounded-[2rem] blur-2xl opacity-15 dark:opacity-20 z-0"></div>
              
              {/* Wrapper for Image and Floating Badges */}
              <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center animate-float">
                
                {/* Visual Screenshot Frame */}
                <div className="relative bg-white dark:bg-[#121824] p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden aspect-[4/3] w-full">
                  <div className="rounded-[1.5rem] overflow-hidden border border-slate-100 dark:border-slate-800/50 h-full w-full">
                    <img 
                      src="/dashboard_mockup.png" 
                      alt="Civic Intelligence Scraper Dashboard" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('bg-gradient-to-br', 'from-indigo-500/20', 'to-rose-500/10', 'flex', 'items-center', 'justify-center')
                        const icon = document.createElement('span')
                        icon.className = 'material-symbols-outlined text-6xl text-indigo-400/50'
                        icon.textContent = 'analytics'
                        e.target.parentElement.appendChild(icon)
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Platform Capabilities / Sleek Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="mb-20 text-center max-w-2xl mx-auto space-y-3">
          <span className="mb-2 inline-flex cursor-default items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4b41e1] dark:text-[#7f78ff]">
            Platform Capabilities
          </span>
          <h3 className="text-3xl sm:text-4xl font-black leading-tight text-slate-900 dark:text-white">
            End-to-End Media Intelligence
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Input news domains, train sentiment classification models, and deploy smart conversational assistants instantly.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Domain Ingestion */}
          <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-[#111622]/80 dark:to-[#0c0e16]/80 border border-slate-200/80 dark:border-slate-800/85 p-8 rounded-[2rem] relative overflow-hidden group hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-300 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5">
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
            
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center mb-6 text-[#4b41e1] dark:text-[#7f78ff] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">captive_portal</span>
            </div>
            
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">Domain Ingestion</h4>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Scrape raw text blocks and metadata from target news domains. Routes requests through residential sandbox proxy handshakes to preserve security.
            </p>
            
            {/* Visual Mini Mockup inside Card */}
            <div className="mt-6 p-4 bg-white dark:bg-[#0c0e14]/60 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-2 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800/40">
                <span>Domain Connection</span>
                <span className="text-emerald-500 font-bold">● Active</span>
              </div>
              <div className="truncate">GET https://chroniclepost.net/politics</div>
              <div className="text-indigo-400">➜ Handshake success (200 OK)</div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-[#4b41e1] dark:text-[#7f78ff] font-bold">
              <span>STATUS: PROXY ISOLATED</span>
              <span className="material-symbols-outlined text-base">vpn_lock</span>
            </div>
          </div>

          {/* Card 2: AI Polarity Parsing */}
          <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-[#111622]/80 dark:to-[#0c0e16]/80 border border-slate-200/80 dark:border-slate-800/85 p-8 rounded-[2rem] relative overflow-hidden group hover:border-rose-500/50 dark:hover:border-rose-500/40 transition-all duration-300 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5">
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
            
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center mb-6 text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">Polarity Parsing</h4>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Analyze emotional biases and narrative polarity. Checks for safety issues (incitement, safety alerts) using language model audits.
            </p>
            
            {/* Visual Mini Mockup inside Card */}
            <div className="mt-6 p-4 bg-white dark:bg-[#0c0e14]/60 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-2 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800/40">
                <span>NLP Classification</span>
                <span className="text-rose-500 font-bold">Polarized</span>
              </div>
              <div className="flex justify-between">
                <span>Polarity Ratio:</span>
                <span className="text-white font-bold">84% Negative</span>
              </div>
              <div className="text-rose-400">⚠️ Incident Warning Flagged</div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-rose-500 font-bold">
              <span>SLA: REAL-TIME AUDITING</span>
              <span className="material-symbols-outlined text-base">gpp_maybe</span>
            </div>
          </div>

          {/* Card 3: Multilingual Embedding */}
          <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-[#111622]/80 dark:to-[#0c0e16]/80 border border-slate-200/80 dark:border-slate-800/85 p-8 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/50 dark:hover:border-amber-500/40 transition-all duration-300 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5">
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
            
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mb-6 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">forum</span>
            </div>
            
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">Chatbot Search</h4>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Deploy our multilingual conversational search assistant on your archives. Searches database records dynamically in English, Hindi, Marathi, and Spanish.
            </p>
            
            {/* Visual Mini Mockup inside Card */}
            <div className="mt-6 p-4 bg-white dark:bg-[#0c0e14]/60 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-2 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800/40">
                <span>AI Search Widget</span>
                <span className="text-indigo-400">Multilingual</span>
              </div>
              <div className="truncate">User: "हिंसा" (Violence)</div>
              <div className="text-emerald-400">Bot: Found 3 matching reports</div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-amber-500 font-bold">
              <span>STORAGE: SQLITE3 ISOLATED</span>
              <span className="material-symbols-outlined text-base">database</span>
            </div>
          </div>

        </div>
      </section>

      {/* Operations Pipeline Workflow Section */}
      <section className="bg-slate-50/50 dark:bg-slate-900/10 border-y border-slate-200/50 dark:border-slate-800/40 py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="mb-2 inline-flex cursor-default items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4b41e1] dark:text-[#7f78ff]">
              Ingestion Workflow
            </span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">Platform Ingestion Pipeline</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              How our system processes target domains and embeds database records into the search chatbot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Step 1 */}
            <div className="bg-white dark:bg-[#0c0e14] border border-slate-200/70 dark:border-slate-800/70 p-8 rounded-3xl relative flex flex-col items-center text-center space-y-4 group hover:shadow-xl hover:border-indigo-500/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-md border border-white dark:border-slate-800 group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-xl">link</span>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">1. Ingest Domain URL</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect target URLs. The scraper automatically traverses DOM nodes in residential sandbox environments.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-[#0c0e14] border border-slate-200/70 dark:border-slate-800/70 p-8 rounded-3xl relative flex flex-col items-center text-center space-y-4 group hover:shadow-xl hover:border-indigo-500/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-md border border-white dark:border-slate-800 group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-xl">model_training</span>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">2. Train AI Polarity</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The NLP parser processes text metrics, calculating narrative polarity ratios and flagging safety alert criteria.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-[#0c0e14] border border-slate-200/70 dark:border-slate-800/70 p-8 rounded-3xl relative flex flex-col items-center text-center space-y-4 group hover:shadow-xl hover:border-indigo-500/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-md border border-white dark:border-slate-800 group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-xl">chat_bubble</span>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">3. Deploy Search Chatbot</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Audited data is saved to SQLite3. The floating chatbot uses this database to answer query searches in multiple languages.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-6 z-10 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#4b41e1]/8 dark:bg-[#4b41e1]/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4b41e1] dark:text-[#7f78ff]">
            Get Started Today
          </span>
          <h3 className="text-3xl sm:text-4xl font-black leading-tight text-slate-900 dark:text-white">
            Ready to Secure Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4b41e1] via-[#645efb] to-[#c3c0ff]">Information Integrity?</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Join intelligence analysts worldwide who use Civic Intelligence to monitor, audit, and verify news media with AI-powered sentiment and bias analysis.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            {user ? (
              <Link
                to="/scraper"
                className="bg-[#4b41e1] hover:bg-[#3f34cc] text-white px-8 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#4b41e1]/20 text-xs uppercase tracking-wider cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">terminal</span>
                Open Analysis Panel
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-[#4b41e1] hover:bg-[#3f34cc] text-white px-8 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#4b41e1]/20 text-xs uppercase tracking-wider cursor-pointer"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="bg-white dark:bg-[#121824] hover:bg-slate-50 dark:hover:bg-[#1a2130] text-[#4b41e1] dark:text-[#7f78ff] border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-emerald-500">verified</span>
              <span>ISO 902 Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-emerald-500">lock</span>
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-emerald-500">shield</span>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
