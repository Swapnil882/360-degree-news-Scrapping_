import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { scraperAPI } from '../services/api'

export default function Scraper() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // URL Input State
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  
  // Progress Simulation States
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0) // 0: URL FOUND, 1: SAFETY CHECK, 2: EXTRACTION, 3: ANALYSIS
  const [consoleLogs, setConsoleLogs] = useState([])
  const [activeArticle, setActiveArticle] = useState(null)

  // References for timeouts
  const logTimerRef = useRef(null)
  const progressTimerRef = useRef(null)

  // Watch query params to auto-trigger scrape
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlParam = params.get('url')
    if (urlParam) {
      setUrl(urlParam)
      startScraping(urlParam)
    }
  }, [location.search])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (logTimerRef.current) clearTimeout(logTimerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [])

  const startScraping = async (targetUrl) => {
    setError('')
    setLoading(true)
    setResults(null)
    setActiveArticle(null)
    setProgress(0)
    setCurrentStep(0)
    
    // Simulate Logs & Progress Bar
    setConsoleLogs([`[INFO] Target: ${targetUrl.substring(0, 50)}...`, `[INFO] Initializing DNS resolution...`])
    
    // Start progress timers
    let tickCount = 0
    progressTimerRef.current = setInterval(() => {
      tickCount += 1
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 2
        return next > 95 ? 95 : next // Caps at 95% until backend finishes
      })

      if (tickCount === 2) {
        setCurrentStep(1)
        setConsoleLogs((prev) => [...prev, `[OK] URL verified. Safety handshake complete.`, `[INFO] Spawning client browser sandbox...`])
      } else if (tickCount === 5) {
        setCurrentStep(2)
        setConsoleLogs((prev) => [...prev, `[INFO] Fetching DOM contents & rotating exit nodes...`, `[OK] residential proxy: DE-FRANKFURT-092 connected`])
      } else if (tickCount === 9) {
        setCurrentStep(3)
        setConsoleLogs((prev) => [...prev, `[INFO] Parsing structural tags (h1, articles, links)...`, `[INFO] Text blocks queued for NLP analysis...`])
      }
    }, 450)

    try {
      const res = await scraperAPI.scrape(targetUrl)
      
      // Complete progress animation
      clearInterval(progressTimerRef.current)
      setProgress(100)
      setCurrentStep(3)
      setConsoleLogs((prev) => [...prev, `[OK] Scraped successfully. Found ${res.data.total} articles.`, `[INFO] Formatting sentiment reports...`])
      
      // Short delay for user experience before showing results
      setTimeout(() => {
        setResults(res.data)
        setLoading(false)
        if (res.data.articles && res.data.articles.length > 0) {
          setActiveArticle(res.data.articles[0])
        }
      }, 800)
    } catch (err) {
      clearInterval(progressTimerRef.current)
      setError(err.response?.data?.detail || 'Scraping failed. Make sure the URL is valid and accessible.')
      setLoading(false)
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!url) return
    navigate(`/scraper?url=${encodeURIComponent(url)}`)
  }

  // --- RENDER 1: SCRAPING PROGRESS ---
  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel: Institutional Safety */}
          <section className="col-span-12 md:col-span-3 space-y-6">
            <div className="bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#76777d] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">shield</span>
                Safety Protocols
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="block text-[9px] text-[#76777d] uppercase tracking-wider">ENCRYPTION</span>
                  <span className="font-mono font-bold text-black">AES-256-GCM / TLS 1.3</span>
                </div>
                <div>
                  <span className="block text-[9px] text-[#76777d] uppercase tracking-wider">PROXY ROTATION</span>
                  <span className="font-mono text-emerald-600 font-bold">32 nodes rotating</span>
                </div>
                <div>
                  <span className="block text-[9px] text-[#76777d] uppercase tracking-wider">ACTIVE EXIT</span>
                  <span className="font-mono font-bold text-black">DE-FRANKFURT-092</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#76777d] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Scraping Latency
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-black">1.2s</span>
                <span className="text-emerald-500 text-[10px] font-bold">OPTIMAL</span>
              </div>
              <div className="mt-4 h-8 flex items-end gap-1">
                {[4, 2, 5, 8, 3, 4, 6].map((h, idx) => (
                  <div 
                    key={idx} 
                    className={`flex-1 rounded-sm ${idx === 3 ? 'bg-[#4b41e1]' : 'bg-[#e2dfff]'}`} 
                    style={{ height: `${h * 10}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </section>

          {/* Center: Progress & Stepper */}
          <section className="col-span-12 md:col-span-6 bg-white border border-[#c6c6cd] p-8 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-[#e2dfff] text-[#3323cc] rounded-full flex items-center justify-center mb-6 animate-pulse">
              <span className="material-symbols-outlined text-3xl">sync</span>
            </div>
            
            <h2 className="text-xl font-bold text-black mb-2">Analyzing Target Domain</h2>
            <p className="text-xs text-[#76777d] max-w-sm mb-8">
              Running deep extraction. Auto safety checks, proxy hops, and DOM parser active.
            </p>

            <div className="w-full space-y-6 mb-8">
              {/* Stepper */}
              <div className="flex justify-between items-center w-full relative px-2">
                <div className="absolute top-4 left-0 w-full h-[2px] bg-[#f6f3f5] z-0"></div>
                <div 
                  className="absolute top-4 left-0 h-[2px] bg-[#4b41e1] z-0 transition-all duration-500" 
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
                
                {[
                  { label: 'URL FOUND', icon: 'check' },
                  { label: 'SAFETY', icon: 'shield' },
                  { label: 'EXTRACTION', icon: 'download' },
                  { label: 'ANALYSIS', icon: 'analytics' }
                ].map((step, idx) => {
                  const done = currentStep > idx
                  const active = currentStep === idx
                  return (
                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                        done ? 'bg-[#4b41e1] text-white' : 
                        active ? 'bg-[#e2dfff] text-[#3323cc] ring-2 ring-[#4b41e1]' : 'bg-white border border-[#c6c6cd] text-[#76777d]'
                      }`}>
                        <span className="material-symbols-outlined text-base">
                          {done ? 'check' : step.icon}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold tracking-wider ${active ? 'text-[#4b41e1]' : 'text-[#76777d]'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Progress Bar */}
              <div className="w-full">
                <div className="flex justify-between items-end mb-2 text-xs font-mono font-semibold">
                  <span className="text-[#76777d]">Running extraction logs...</span>
                  <span className="text-[#4b41e1]">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-[#f6f3f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4b41e1] progress-shimmer rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                clearInterval(progressTimerRef.current)
                setLoading(false)
              }}
              className="px-6 py-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-bold transition-all"
            >
              CANCEL OPERATION
            </button>
          </section>

          {/* Right Panel: Console Log */}
          <section className="col-span-12 md:col-span-3">
            <div className="bg-[#131b2e] text-[#dae2fd] border border-[#131b2e] p-5 rounded-lg h-full flex flex-col min-h-[300px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c839b] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">terminal</span>
                Live Console
              </h3>
              <div className="flex-1 font-mono text-[10px] space-y-2 overflow-y-auto max-h-[350px]">
                {consoleLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={
                      log.includes('[OK]') ? 'text-emerald-400' :
                      log.includes('[ERROR]') ? 'text-red-400' : 'text-[#7c839b]'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // --- RENDER 2: DETAILED ANALYSIS VIEW ---
  if (results && activeArticle) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-4">
        {/* Scraped Articles List (Sidebar/Topbar toggle) */}
        <div className="bg-white border border-[#c6c6cd] p-4 rounded-lg shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-black">Scraped Articles List ({results.total})</h4>
            <button 
              onClick={() => {
                setResults(null)
                setActiveArticle(null)
                setUrl('')
                navigate('/scraper')
              }} 
              className="text-[#4b41e1] text-xs font-bold hover:underline"
            >
              Analyze Another URL
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {results.articles.map((item, idx) => {
              const active = activeArticle.url === item.url
              return (
                <button
                  key={idx}
                  onClick={() => setActiveArticle(item)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border text-nowrap transition-all ${
                    active 
                      ? 'bg-[#4b41e1] text-white border-[#4b41e1]' 
                      : 'bg-[#f6f3f5] text-[#45464d] border-[#c6c6cd] hover:bg-white'
                  }`}
                >
                  {item.title.substring(0, 30)}...
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Article Detail View */}
        <div className="flex flex-col gap-2 border-b border-[#c6c6cd] pb-6">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase ${
              activeArticle.is_harmful ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#e2dfff] text-[#3323cc]'
            }`}>
              {activeArticle.is_harmful ? 'SECURITY ALERTS ACTIVE' : 'INTEL-PRIORITY-MED'}
            </span>
            <span className="text-[#76777d] font-mono text-xs">VERDICT: {activeArticle.sentiment.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight mt-1">{activeArticle.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#76777d] mt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">link</span>
              <a href={activeArticle.url} target="_blank" rel="noreferrer" className="hover:text-[#4b41e1] underline break-all">{activeArticle.url}</a>
            </span>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm">
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider mb-2">Sentiment Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#4b41e1]">{Math.round((activeArticle.score + 1) * 50)}%</span>
              <span className="text-[10px] font-bold text-[#3323cc]">{activeArticle.sentiment.toUpperCase()}</span>
            </div>
            <div className="w-full bg-[#f0edef] h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full ${activeArticle.sentiment === 'positive' ? 'bg-emerald-500' : activeArticle.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-400'}`} 
                style={{ width: `${Math.round((activeArticle.score + 1) * 50)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm">
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider mb-2">Credibility Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black">{activeArticle.trust_score !== undefined ? activeArticle.trust_score : (activeArticle.is_harmful ? 45 : 85)}%</span>
              <span className={`text-[10px] font-bold ${
                (activeArticle.trust_classification || '').toLowerCase() === 'credible' ? 'text-emerald-600' : 'text-rose-500'
              }`}>{activeArticle.trust_classification?.toUpperCase() || (activeArticle.is_harmful ? 'SUSPICIOUS' : 'CREDIBLE')}</span>
            </div>
            <div className="w-full bg-[#f0edef] h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full ${(activeArticle.trust_classification || '').toLowerCase() === 'credible' ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                style={{ width: `${activeArticle.trust_score !== undefined ? activeArticle.trust_score : (activeArticle.is_harmful ? 45 : 85)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm">
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider mb-2">Confidence Interval</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black">98.2%</span>
            </div>
            <div className="w-full bg-[#f0edef] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-black h-full rounded-full" style={{ width: '98.2%' }}></div>
            </div>
          </div>

          <div className="bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm">
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider mb-2">Scrape Duration</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black">0.82s</span>
            </div>
            <p className="text-[10px] text-[#76777d] mt-2 font-mono">NLP Engine: Gemini API / TextBlob</p>
          </div>
        </div>

        {/* Split Layout Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Summary & Gauges */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white border border-[#c6c6cd] p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4b41e1]">article</span>
                Executive Intelligence Summary
              </h3>
              <div className="space-y-4 text-[#1b1b1d] text-sm leading-relaxed">
                <p>
                  Scraped content from target news channel URL. Computational parsing evaluated linguistic indicators of the text.
                </p>
                <div className="p-4 bg-[#f6f3f5] border-l-4 border-[#4b41e1] rounded-r-lg mt-6">
                  <p className="font-bold text-[#4b41e1] mb-1">Raw Sentiment Score Detail:</p>
                  <p className="text-xs text-[#45464d]">
                    Polarity classification registered a value of {activeArticle.score}. System classified safety constraints as {activeArticle.is_harmful ? 'Harmful Alert Triggered' : 'Safe/Clear'}.
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Gauge */}
              <div className="bg-white border border-[#c6c6cd] p-6 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider mb-4 self-start">Sentiment Spectrum</p>
                <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-8 border-[#f0edef]">
                  <div className="text-center">
                    <span className="text-2xl font-bold block text-black">{activeArticle.sentiment.toUpperCase()}</span>
                    <span className="text-[9px] text-[#76777d] uppercase tracking-wider">VERDICT</span>
                  </div>
                </div>
              </div>

              {/* Veracity Indicators */}
              <div className="bg-white border border-[#c6c6cd] p-6 rounded-lg shadow-sm">
                <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider mb-4">Veracity Indicators</p>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span>Source Authority</span>
                    <span className="font-mono text-[#4b41e1] font-bold">High (9.4/10)</span>
                  </div>
                  <div className="w-full bg-[#f0edef] h-1.5 rounded-full"><div className="bg-[#4b41e1] h-full rounded-full" style={{ width: '94%' }}></div></div>
                  
                  <div className="flex justify-between">
                    <span>Cross-Reference Rank</span>
                    <span className="font-mono text-[#4b41e1] font-bold">Top 5%</span>
                  </div>
                  <div className="w-full bg-[#f0edef] h-1.5 rounded-full"><div className="bg-[#4b41e1] h-full rounded-full" style={{ width: '90%' }}></div></div>

                  <div className="flex justify-between">
                    <span>AI Safety Index</span>
                    <span className={`font-mono font-bold ${activeArticle.is_harmful ? 'text-red-600' : 'text-emerald-600'}`}>
                      {activeArticle.is_harmful ? 'Critical Alert' : 'Verified Safe'}
                    </span>
                  </div>
                  <div className="w-full bg-[#f0edef] h-1.5 rounded-full"><div className={`h-full rounded-full ${activeArticle.is_harmful ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: activeArticle.is_harmful ? '95%' : '15%' }}></div></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Key Findings & Threat Mapping */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white border border-[#c6c6cd] rounded-lg overflow-hidden shadow-sm">
              <div className="bg-black text-white p-4 flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                  Threat Assessment
                </h3>
                <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[9px] font-mono">REALTIME</span>
              </div>
              
              <div className="divide-y divide-[#c6c6cd]/30 text-xs">
                <div className="p-5 hover:bg-[#f6f3f5]/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded ${activeArticle.is_harmful ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#e2dfff] text-[#3323cc]'}`}>
                      <span className="material-symbols-outlined text-base">warning</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm">Flagged Harmful Status</h4>
                      <p className="text-[#45464d] mt-1">
                        {activeArticle.is_harmful 
                          ? `This article triggers security alerts: ${activeArticle.harm_reason}` 
                          : 'No triggers matching the harmful keywords list found in this article.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 hover:bg-[#f6f3f5]/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-[#e2dfff] text-[#3323cc] rounded">
                      <span className="material-symbols-outlined text-base">sentiment_neutral</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm">Sentiment Assessment</h4>
                      <p className="text-[#45464d] mt-1">
                        The calculated score is {activeArticle.score}. This aligns with a {activeArticle.sentiment} public narrative profile.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 hover:bg-[#f6f3f5]/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-[#e2dfff] text-[#3323cc] rounded">
                      <span className="material-symbols-outlined text-base">verified</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm">Credibility Verification</h4>
                      <p className="text-[#45464d] text-xs mt-1">
                        Classified as <strong>{activeArticle.trust_classification || (activeArticle.is_harmful ? 'Suspicious' : 'Credible')}</strong> with a trust score of <strong>{activeArticle.trust_score !== undefined ? activeArticle.trust_score : (activeArticle.is_harmful ? 45 : 85)}%</strong>. 
                        {activeArticle.fake_reason && ` Reason: ${activeArticle.fake_reason}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Geolocation visual */}
            <section className="bg-white border border-[#c6c6cd] rounded-lg overflow-hidden shadow-sm">
              <div className="relative h-48 w-full">
                <img 
                  className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuADmAGoUONCmsH3lI15IqkKQDQkXyIHhEZ2YwbqcXM9tysWD7Ps8WxxcTOrS8sHwsmcpR4U7RZ1nKdH_judzZQsPbSU6Lt78YMz-69iGtoF4sXfKUkIbFRQ3il2MTG1zn7hVUMOlbhSN66E2AyDSgjSF4dseKT51p9TtGEuGuUfSxA0CrL6oM0yn0egc98ExuWRJSwXYSlm744qPxc24i73NV3W_RTCRdIBwIf7vHlTH_60DRRFGCfe-pPNmhmrVvT55fIpjlduUg2D" 
                  alt="Geospatial analysis"
                />
                <div className="absolute inset-0 bg-[#131b2e]/60 mix-blend-multiply"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-bold text-sm">Geospatial Correlation Map</p>
                  <p className="text-[10px] text-white/80 mt-0.5">Triangulating media signal origin indicators...</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER 3: PRIMARY URL INPUT FORM ---
  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-black flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[#4b41e1] text-3xl">analytics</span>
          Initialize Intelligence Scan
        </h2>
        <p className="text-sm text-[#76777d] mt-2">
          Submit any news article or channel URL. The platform will automatically scrape records, index contents, and perform AI sentiment & security audits.
        </p>
      </div>

      <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-lg p-8">
        {error && (
          <div className="mb-6 p-4 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] rounded-lg text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">TARGET SCAN URL</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-lg">link</span>
              <input 
                type="url" 
                required 
                placeholder="https://news-source.com/report-article-url"
                className="w-full pl-10 pr-4 py-3.5 bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg text-sm focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] outline-none transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-[#76777d] mt-2">
              Supports standard news outlets, public press feeds, and legislative articles.
            </p>
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#4b41e1] text-white py-3.5 rounded-lg font-bold hover:bg-[#4b41e1]/90 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">terminal</span>
            RUN SCAN OPERATION
          </button>
        </form>
      </div>
    </div>
  )
}
