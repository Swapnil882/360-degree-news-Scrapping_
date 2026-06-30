import { useEffect, useState } from 'react'
import { sourcesAPI } from '../services/api'

export default function Sources() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('general')
  const [frequency, setFrequency] = useState('daily')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Scrape running state (sourceId -> boolean)
  const [scrapingStates, setScrapingStates] = useState({})

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = () => {
    setLoading(true)
    sourcesAPI.list()
      .then((res) => {
        setSources(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError('Failed to fetch media sources.')
        setLoading(false)
      })
  }

  const handleAddSource = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name.trim() || !url.trim()) return

    setIsSubmitting(true)
    sourcesAPI.create({ name, url, category, frequency, is_active: true })
      .then((res) => {
        setSources(prev => [res.data, ...prev])
        setName('')
        setUrl('')
        setCategory('general')
        setFrequency('daily')
        setSuccess('Target source added successfully!')
        setIsSubmitting(false)
        setTimeout(() => setSuccess(''), 3000)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to add source configuration.')
        setIsSubmitting(false)
      })
  }

  const handleToggleActive = (id, currentVal) => {
    setError('')
    setSuccess('')
    sourcesAPI.update(id, { is_active: !currentVal })
      .then((res) => {
        setSources(prev => prev.map(s => s.id === id ? res.data : s))
      })
      .catch(() => {
        setError('Failed to update active state.')
      })
  }

  const handleDeleteSource = (id) => {
    setError('')
    setSuccess('')
    if (!window.confirm('Are you sure you want to delete this source target?')) return

    sourcesAPI.delete(id)
      .then(() => {
        setSources(prev => prev.filter(s => s.id !== id))
        setSuccess('Source target deleted.')
        setTimeout(() => setSuccess(''), 3000)
      })
      .catch(() => {
        setError('Failed to delete source.')
      })
  }

  const handleRunScraper = (id) => {
    setError('')
    setSuccess('')
    setScrapingStates(prev => ({ ...prev, [id]: true }))

    sourcesAPI.scrapeSource(id)
      .then((res) => {
        setScrapingStates(prev => ({ ...prev, [id]: false }))
        setSuccess(`Ingested successfully! Found ${res.data.scraped_count} articles.`)
        fetchSources() // refresh last_scraped_at
        setTimeout(() => setSuccess(''), 5000)
      })
      .catch((err) => {
        setScrapingStates(prev => ({ ...prev, [id]: false }))
        setError(err.response?.data?.detail || 'Scraping run encountered an error.')
      })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      
      {/* Header section */}
      <div className="border-b border-[#c6c6cd] dark:border-[#333d52]/50 pb-4">
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4b41e1] dark:text-[#7f78ff]">rss_feed</span>
          Target Ingestion Sources
        </h2>
        <p className="text-xs text-[#76777d] dark:text-[#a0a5b5]">
          Manage and configure scheduled media crawler endpoints and RSS feeds for security assessments
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: Add Ingestion Target */}
        <div className="lg:col-span-4 bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] p-6 rounded-2xl shadow-sm self-start space-y-5">
          <div className="border-b border-[#c6c6cd]/30 dark:border-[#333d52]/40 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Add Ingestion Source</h3>
            <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] mt-0.5">Define target website/crawling domain rules</p>
          </div>

          <form onSubmit={handleAddSource} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">Source Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Daily Herald Security"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-lg px-3 py-2 text-xs text-black dark:text-white focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">Target Ingestion URL</label>
              <input 
                type="url" 
                required
                placeholder="https://news.ycombinator.com"
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-lg px-3 py-2 text-xs text-black dark:text-white focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">Scrape Focus</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-lg px-2.5 py-2 text-xs text-black dark:text-white focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] outline-none transition-all"
                >
                  <option value="general">General</option>
                  <option value="violence">Violence</option>
                  <option value="unrest">Civil Unrest</option>
                  <option value="safety">Public Safety</option>
                  <option value="hate">Hate Speech</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#76777d] dark:text-[#a0a5b5]">Crawl Frequency</label>
                <select 
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-white dark:bg-[#161c28] border border-[#c6c6cd] dark:border-[#333d52] rounded-lg px-2.5 py-2 text-xs text-black dark:text-white focus:ring-2 focus:ring-[#4b41e1]/20 focus:border-[#4b41e1] outline-none transition-all"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#4b41e1] hover:bg-[#3f34cc] text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {isSubmitting ? 'Registering...' : 'Register Source'}
            </button>
          </form>
        </div>

        {/* Right List: Sources Table */}
        <div className="lg:col-span-8 bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-[#c6c6cd]/30 dark:border-[#333d52]/40 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Targets Directory</h3>
              <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] mt-0.5">Crawl endpoints listed in the system</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e2dfff]/60 text-[#4b41e1] dark:bg-[#4b41e1]/10 dark:text-[#7f78ff]">
              {sources.length} Total Targets
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4b41e1]"></div>
            </div>
          ) : sources.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-4xl block">settings_input_antenna</span>
              <p className="text-xs">No media target sources registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#c6c6cd]/30 dark:border-[#333d52]/30 text-[#76777d] uppercase tracking-wider text-[9px] font-bold bg-[#fcf8fa] dark:bg-[#151c2a]/40">
                    <th className="py-3 px-4">Source Detail</th>
                    <th className="py-3 px-3">Crawl Focus</th>
                    <th className="py-3 px-3">Interval</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Last Crawled</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/20 dark:divide-[#333d52]/20">
                  {sources.map((src) => {
                    const isScraping = scrapingStates[src.id]
                    return (
                      <tr key={src.id} className="hover:bg-slate-50/50 dark:hover:bg-[#161c28]/25 transition-colors">
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="font-bold text-slate-900 dark:text-white truncate" title={src.name}>{src.name}</p>
                          <a 
                            href={src.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#76777d] dark:text-[#8c91a0] truncate hover:text-[#4b41e1] hover:underline flex items-center gap-0.5 mt-0.5 max-w-[180px]"
                          >
                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                            <span className="truncate">{src.url}</span>
                          </a>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            src.category === 'violence' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' :
                            src.category === 'unrest' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' :
                            src.category === 'safety' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                            src.category === 'hate' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {src.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300 capitalize">{src.frequency}</td>
                        <td className="py-3.5 px-3">
                          <button 
                            onClick={() => handleToggleActive(src.id, src.is_active)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                              src.is_active ? 'bg-[#4b41e1]' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span 
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                src.is_active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-[#76777d] dark:text-[#a0a5b5] font-mono text-[10px]">
                          {src.last_scraped_at ? new Date(src.last_scraped_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3.5 px-4 text-right flex justify-end gap-1.5 items-center">
                          <button
                            onClick={() => handleRunScraper(src.id)}
                            disabled={!src.is_active || isScraping}
                            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                              isScraping 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-500 animate-pulse' 
                                : 'bg-[#e2dfff]/20 border-[#4b41e1]/20 hover:bg-[#4b41e1] text-[#4b41e1] dark:text-[#7f78ff] hover:text-white'
                            } disabled:opacity-30`}
                            title="Ingest / Scrape Now"
                          >
                            <span className="material-symbols-outlined text-base">
                              {isScraping ? 'rotate_right' : 'play_arrow'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteSource(src.id)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
