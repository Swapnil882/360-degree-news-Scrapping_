import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { scraperAPI } from '../services/api'

export default function ScrapedReports() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(true)

  // Selected/expanded report
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContents, setFileContents] = useState({})
  const [loadingFileContents, setLoadingFileContents] = useState({})

  // Active sentiment tab per file
  const [activeTab, setActiveTab] = useState({})

  // Search, pagination, delete
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(6)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Detail panel ref for scroll
  const detailRef = useRef(null)

  useEffect(() => {
    fetchFilesList()
  }, [])

  const fetchFilesList = () => {
    setLoadingFiles(true)
    scraperAPI.exports()
      .then((res) => {
        setFiles(res.data || [])
        setLoadingFiles(false)
      })
      .catch((err) => {
        console.error('Failed to load export files list:', err)
        setLoadingFiles(false)
      })
  }

  const exportCSV = (content, domainName) => {
    if (!content || !content.articles) return;
    
    const headers = ["Title", "URL", "Sentiment", "Sentiment Score", "Harmful Alert", "Credibility Score", "Credibility Classification", "Fake Reason"];
    const rows = content.articles.map(art => [
      `"${(art.title || "").replace(/"/g, '""')}"`,
      art.url || "",
      art.sentiment || "neutral",
      art.score !== undefined ? art.score : (art.sentiment_score !== undefined ? art.sentiment_score : 0.0),
      art.is_harmful ? "Yes" : "No",
      art.trust_score !== undefined ? art.trust_score : (art.is_harmful ? 45 : 85),
      art.trust_classification || (art.is_harmful ? "Suspicious" : "Credible"),
      `"${(art.fake_reason || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const timestamp = new Date().toISOString().slice(0,10);
    link.setAttribute("download", `${domainName}_report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const selectFile = (filename) => {
    if (selectedFile === filename) {
      setSelectedFile(null)
      return
    }
    setSelectedFile(filename)

    // Fetch content if not cached
    if (!fileContents[filename]) {
      setLoadingFileContents(prev => ({ ...prev, [filename]: true }))
      scraperAPI.exportContent(filename)
        .then((res) => {
          setFileContents(prev => ({ ...prev, [filename]: res.data }))
          setLoadingFileContents(prev => ({ ...prev, [filename]: false }))
          // Default to "all" tab
          setActiveTab(prev => ({ ...prev, [filename]: 'all' }))
        })
        .catch((err) => {
          console.error(err)
          setLoadingFileContents(prev => ({ ...prev, [filename]: false }))
        })
    }

    // Scroll to detail after a brief delay
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleDelete = (filename) => {
    setDeleting(true)
    scraperAPI.deleteExport(filename)
      .then(() => {
        setFiles(prev => prev.filter(f => f.filename !== filename))
        setFileContents(prev => { const n = { ...prev }; delete n[filename]; return n })
        if (selectedFile === filename) setSelectedFile(null)
        setDeleteConfirm(null)
        setDeleting(false)
      })
      .catch(err => {
        console.error(err)
        setDeleting(false)
        setDeleteConfirm(null)
      })
  }

  // Filter & paginate
  const filteredFiles = files.filter(file =>
    file.domain.toLowerCase().includes(search.toLowerCase()) ||
    file.source_url?.toLowerCase().includes(search.toLowerCase())
  )
  const paginatedFiles = filteredFiles.slice(0, visibleCount)
  const hasMore = filteredFiles.length > visibleCount

  // Compute stats
  const totalArticles = files.reduce((sum, f) => sum + (f.total_articles || 0), 0)

  // Get sentiment distribution for a file's content
  const getSentimentData = (filename) => {
    const content = fileContents[filename]
    if (!content) return { positive: 0, negative: 0, neutral: 0, total: 0 }
    const articles = content.articles || []
    const positive = articles.filter(a => a.sentiment === 'positive').length
    const negative = articles.filter(a => a.sentiment === 'negative').length
    const neutral = articles.length - positive - negative
    return { positive, negative, neutral, total: articles.length }
  }

  // Filter articles by active tab
  const getFilteredArticles = (filename) => {
    const content = fileContents[filename]
    if (!content) return []
    const articles = content.articles || []
    const tab = activeTab[filename] || 'all'
    if (tab === 'all') return articles
    if (tab === 'positive') return articles.filter(a => a.sentiment === 'positive')
    if (tab === 'negative') return articles.filter(a => a.sentiment === 'negative')
    return articles.filter(a => a.sentiment !== 'positive' && a.sentiment !== 'negative')
  }

  // Domain initial gradient colors
  const getGradient = (idx) => {
    const gradients = [
      'from-indigo-500 to-blue-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-emerald-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-cyan-500 to-sky-600',
    ]
    return gradients[idx % gradients.length]
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // ─── Loading State ─────────────────────────────────────
  if (loadingFiles && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">folder_open</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-[#121824] border-2 border-indigo-500 flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Loading Reports</p>
          <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1">Scanning export directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">

      {/* ═══ Page Header ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#131b2e] to-[#1e2a45] p-8 border border-[#333d52]/50">
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-48 h-48 bg-rose-500/8 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-indigo-400 text-2xl">inventory_2</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80">Intelligence Archive</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">Scraped Reports</h1>
            <p className="text-sm text-[#7c839b] mt-1 max-w-lg">
              Browse, inspect, and manage all ingestion run exports. Each report contains classified articles with sentiment analysis and risk assessment data.
            </p>
          </div>
          <button
            onClick={() => navigate('/scraper')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            New Ingestion
          </button>
        </div>

        {/* Stats Bar */}
        <div className="relative z-10 flex flex-wrap gap-6 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 text-lg">description</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#7c839b] font-semibold">Total Reports</p>
              <p className="text-lg font-black text-white">{files.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-400 text-lg">article</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#7c839b] font-semibold">Total Articles</p>
              <p className="text-lg font-black text-white">{totalArticles.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-lg">trending_up</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#7c839b] font-semibold">Latest Scrape</p>
              <p className="text-lg font-black text-white">
                {files.length > 0 ? formatDate(files[0].created_at) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Search & Toolbar ═══ */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76777d] text-lg">search</span>
            <input
              type="text"
              placeholder="Search by domain or URL..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(6) }}
              className="w-full bg-white dark:bg-[#121824]/60 border border-[#c6c6cd]/60 dark:border-[#333d52]/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setVisibleCount(6) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-black dark:hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#76777d] dark:text-[#a0a5b5]">
            <span className="font-semibold">{filteredFiles.length} of {files.length} reports</span>
            <button
              onClick={fetchFilesList}
              className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* ═══ Reports Grid ═══ */}
      {files.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedFiles.map((file, idx) => {
              const isSelected = selectedFile === file.filename
              return (
                <div
                  key={file.filename}
                  onClick={() => selectFile(file.filename)}
                  className={`group relative bg-white dark:bg-[#121824]/60 border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isSelected
                      ? 'border-indigo-500/50 dark:border-indigo-500/40 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                      : 'border-[#c6c6cd]/50 dark:border-[#333d52]/50 shadow-sm hover:border-indigo-500/30'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(idx)} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                      {file.domain.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{file.domain}</h3>
                      <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] truncate mt-0.5 font-mono">
                        {file.source_url}
                      </p>
                    </div>
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center justify-between text-[10px] text-[#76777d] dark:text-[#a0a5b5] mb-4">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{formatDate(file.created_at)} · {formatTime(file.created_at)}</span>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                      {file.total_articles} articles
                    </span>
                  </div>

                  {/* Sentiment Mini Bar */}
                  {fileContents[file.filename] ? (() => {
                    const sd = getSentimentData(file.filename)
                    if (sd.total === 0) return null
                    const pPct = (sd.positive / sd.total) * 100
                    const nPct = (sd.negative / sd.total) * 100
                    const neuPct = (sd.neutral / sd.total) * 100
                    return (
                      <div className="space-y-2">
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800/60">
                          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pPct}%` }} />
                          <div className="bg-rose-500 transition-all duration-500" style={{ width: `${nPct}%` }} />
                          <div className="bg-slate-400 dark:bg-slate-600 transition-all duration-500" style={{ width: `${neuPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400">{sd.positive} pos</span>
                          <span className="text-rose-600 dark:text-rose-400">{sd.negative} neg</span>
                          <span className="text-slate-500">{sd.neutral} neu</span>
                        </div>
                      </div>
                    )
                  })() : (
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
                      <div className="h-full w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    </div>
                  )}

                  {/* Action Icons */}
                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <a
                      href={`/api/scraper/exports/${file.filename}`}
                      download={file.filename}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-500 transition-colors"
                      title="Download JSON"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(file.source_url, '_blank')
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-500 transition-colors cursor-pointer"
                      title="Open Source URL"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(file.filename)
                      }}
                      className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition-colors cursor-pointer"
                      title="Delete Report"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="bg-white dark:bg-[#121824]/60 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 text-indigo-600 dark:text-indigo-400 px-8 py-3 rounded-2xl text-xs font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">expand_more</span>
                Load More Reports ({filteredFiles.length - visibleCount} remaining)
              </button>
            </div>
          )}

          {/* No Search Results */}
          {filteredFiles.length === 0 && search && (
            <div className="bg-white dark:bg-[#121824]/60 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 rounded-2xl p-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3 block">search_off</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">No reports match "{search}"</p>
              <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1">Try a different domain name or URL</p>
            </div>
          )}
        </div>
      ) : (
        /* ═══ Empty State ═══ */
        <div className="bg-white dark:bg-[#121824]/60 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-indigo-400">folder_off</span>
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">No Reports Yet</h3>
          <p className="text-sm text-[#76777d] dark:text-[#a0a5b5] mt-2 max-w-md mx-auto">
            Start by running an ingestion in the scraper terminal. Once complete, your reports will appear here with full sentiment analysis.
          </p>
          <button
            onClick={() => navigate('/scraper')}
            className="mt-6 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            Open Scraper Terminal
          </button>
        </div>
      )}

      {/* ═══ Detail Panel ═══ */}
      {selectedFile && (
        <div ref={detailRef} className="bg-white dark:bg-[#121824]/60 border border-[#c6c6cd]/50 dark:border-[#333d52]/50 rounded-3xl overflow-hidden shadow-lg">
          {loadingFileContents[selectedFile] ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-[#76777d] dark:text-[#a0a5b5]">Loading report data...</p>
            </div>
          ) : fileContents[selectedFile] ? (() => {
            const content = fileContents[selectedFile]
            const sd = getSentimentData(selectedFile)
            const articles = getFilteredArticles(selectedFile)
            const currentTab = activeTab[selectedFile] || 'all'

            return (
              <>
                {/* Detail Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-[#0c101b]/30">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        <span className="material-symbols-outlined text-lg">analytics</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          Report: {files.find(f => f.filename === selectedFile)?.domain}
                        </h3>
                        <p className="text-[10px] text-[#76777d] dark:text-[#a0a5b5] font-mono mt-0.5">{content.source_url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportCSV(content, files.find(f => f.filename === selectedFile)?.domain)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        title="Export CSV"
                      >
                        <span className="material-symbols-outlined text-sm">table_view</span>
                        Export CSV
                      </button>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-[#76777d] hover:text-black dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  </div>

                  {/* Sentiment Overview Chips */}
                  <div className="flex flex-wrap gap-3 mt-5">
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{sd.positive} Positive</span>
                    </div>
                    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-3 py-1.5 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400">{sd.negative} Negative</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 px-3 py-1.5 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{sd.neutral} Neutral</span>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 pt-4 flex gap-1 border-b border-slate-100 dark:border-slate-800/40 overflow-x-auto">
                  {[
                    { key: 'all', label: 'All Articles', count: sd.total,
                      active: 'border-indigo-500 text-indigo-600 dark:text-indigo-400',
                      badge: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' },
                    { key: 'positive', label: 'Positive', count: sd.positive,
                      active: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
                      badge: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' },
                    { key: 'negative', label: 'Negative', count: sd.negative,
                      active: 'border-rose-500 text-rose-600 dark:text-rose-400',
                      badge: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' },
                    { key: 'neutral', label: 'Neutral', count: sd.neutral,
                      active: 'border-slate-500 text-slate-600 dark:text-slate-400',
                      badge: 'bg-slate-200 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(prev => ({ ...prev, [selectedFile]: tab.key }))}
                      className={`px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        currentTab === tab.key
                          ? tab.active
                          : 'border-transparent text-[#76777d] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${
                        currentTab === tab.key
                          ? tab.badge
                          : 'bg-slate-100 dark:bg-slate-800/40 text-[#76777d]'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Articles List */}
                <div className="p-6">
                  {articles.length > 0 ? (
                    <div className="space-y-3">
                      {articles.map((art, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-[#161c28]/30 transition-all group"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Sentiment Icon */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              art.sentiment === 'positive'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                                : art.sentiment === 'negative'
                                  ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                                  : 'bg-slate-100 dark:bg-slate-800/30 text-slate-400'
                            }`}>
                              <span className="material-symbols-outlined text-base">
                                {art.sentiment === 'positive' ? 'trending_up' : art.sentiment === 'negative' ? 'trending_down' : 'trending_flat'}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <a
                                href={art.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                              >
                                {art.title}
                              </a>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                                  art.sentiment === 'positive'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                    : art.sentiment === 'negative'
                                      ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/30'
                                }`}>
                                  {art.sentiment || 'neutral'}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                                  art.is_harmful
                                    ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                }`}>
                                  {art.is_harmful ? '⚠ Harmful' : '✓ Safe'}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                                  (art.trust_classification || '').toLowerCase() === 'credible'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                    : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                                }`}>
                                  {art.trust_score !== undefined ? `${art.trust_score}% ` : ''}{art.trust_classification || (art.is_harmful ? 'Suspicious' : 'Credible')}
                                </span>
                                {art.score !== undefined && (
                                  <span className="text-[9px] text-[#76777d] dark:text-[#a0a5b5] font-mono">
                                    Sentiment: {(art.score * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Article Actions */}
                          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                            <a
                              href={art.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-500 transition-colors text-xs font-bold flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              <span className="hidden sm:inline">Read</span>
                            </a>
                            <button
                              onClick={() => navigate(`/scraper?url=${encodeURIComponent(content.source_url)}`)}
                              className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">policy</span>
                              <span className="hidden sm:inline">Re-analyze</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2 block">filter_list_off</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">No articles in this category</p>
                      <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mt-1">Try selecting a different tab</p>
                    </div>
                  )}
                </div>
              </>
            )
          })() : null}
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-[#121824] border border-[#c6c6cd] dark:border-[#333d52] rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-rose-500 text-3xl">delete_forever</span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Delete This Report?</h3>
            <p className="text-xs text-[#76777d] dark:text-[#a0a5b5] mb-8 max-w-xs mx-auto">
              This will permanently delete the export file <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{deleteConfirm}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2.5 text-xs font-bold border border-[#c6c6cd] dark:border-[#333d52] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a2130] transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-6 py-2.5 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                {deleting ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
