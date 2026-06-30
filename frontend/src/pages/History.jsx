import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { scraperAPI } from '../services/api'

export default function History() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scraperAPI.history().then((res) => {
      setItems(res.data.items || [])
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
      <div className="flex justify-between items-center border-b border-[#c6c6cd] pb-4">
        <div>
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4b41e1]">history</span>
            Scrape History Log
          </h2>
          <p className="text-xs text-[#76777d]">All previously processed articles and narrational scores</p>
        </div>
        <Link to="/scraper" className="bg-[#4b41e1] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#4b41e1]/95 transition-all">
          New Scrape
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="bg-white border border-[#c6c6cd] rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f3f5] border-b border-[#c6c6cd]">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Sentiment</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Sentiment Score</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Veracity Verdict</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider">Scrape Date</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-[#45464d] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cd]/30 text-xs">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f6f3f5]/25 transition-colors">
                    <td className="px-6 py-4 font-semibold text-black max-w-xs sm:max-w-md truncate">
                      <a href={item.article_url} target="_blank" rel="noreferrer" className="hover:text-[#4b41e1] hover:underline">
                        {item.title}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        item.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' : 
                        item.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-semibold text-black">{item.sentiment_score}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        item.is_harmful ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.is_harmful ? 'Harmful' : 'Verified Safe'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#76777d] font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/scraper?url=${encodeURIComponent(item.source_url)}`)}
                        className="text-[#4b41e1] hover:underline font-bold"
                      >
                        Inspect Analysis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cd] rounded-lg shadow-sm p-16 text-center text-[#76777d]">
          <span className="material-symbols-outlined text-5xl text-[#c6c6cd] mb-3 block">folder_open</span>
          <h4 className="text-black font-semibold text-sm">No Scraped Records</h4>
          <p className="text-xs mt-1 mb-6">You have not scraped any articles yet.</p>
          <Link to="/scraper" className="bg-[#4b41e1] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#4b41e1]/95 transition-all">
            Scrape First URL
          </Link>
        </div>
      )}
    </div>
  )
}
