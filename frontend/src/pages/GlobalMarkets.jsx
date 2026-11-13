import AssetLogo from '../components/AssetLogo.jsx'
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Search, Globe, ArrowUp, ArrowDown,
  DollarSign, IndianRupee, TrendingUp,
  Star
} from 'lucide-react'

const MARKET_FILTERS = [
  { id: 'all', label: 'All Markets' },
  { id: 'us',  label: '🇺🇸 US' },
  { id: 'indian',  label: '🇮🇳 India' },
  { id: 'forex',  label: '💱 Forex' },
  { id: 'crypto', label: '₿ Crypto' },
  { id: 'commodity',   label: '🏭 Commodities' },
]

export default function GlobalMarkets({ onSelectTicker, onAddToWatchlist }) {
  const [query, setQuery]     = useState('')
  const [marketF, setMarketF] = useState('all')
  const [catF, setCatF]       = useState('All')
  
  const [marketAssets, setMarketAssets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalAssets, setTotalAssets] = useState(0)

  // Reset pagination when filters change
  useEffect(() => {
    setMarketAssets([])
    setPage(1)
    setHasMore(true)
  }, [marketF, catF, query])

  // Fetch logic with debounce for query
  useEffect(() => {
    if (!hasMore) return;
    
    let isMounted = true;
    
    const fetchMarkets = async () => {
      if (page === 1) setIsLoading(true)
      setIsFetching(true)
      
      try {
        const res = await fetch(`http://localhost:8000/api/markets?category=${marketF}&type=${catF}&q=${encodeURIComponent(query)}&page=${page}&limit=50`)
        const data = await res.json()
        
        if (!isMounted) return;
        
        const newAssets = data.data || data // fallback
        
        if (!Array.isArray(newAssets)) {
          console.error("API returned non-array data:", data);
          setHasMore(false);
          return;
        }
        
        setMarketAssets(prev => {
          if (page === 1) return newAssets;
          const existing = new Set(prev.map(a => a.ticker))
          return [...prev, ...newAssets.filter(a => !existing.has(a.ticker))]
        })
        
        setTotalAssets(data.total || newAssets.length)
        if (data.page >= data.total_pages || newAssets.length === 0) {
          setHasMore(false)
        }
      } catch (err) {
        console.error("Error fetching markets", err)
        if (isMounted) setHasMore(false)
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setIsFetching(false)
        }
      }
    }
    
    // Debounce search slightly
    const timeout = setTimeout(() => {
      fetchMarkets()
    }, query ? 300 : 0)
    
    return () => {
      isMounted = false;
      clearTimeout(timeout)
    }
  }, [marketF, catF, query, page, hasMore])

  // Infinite Scroll Observer
  const observer = useRef()
  const lastElementRef = useCallback(node => {
    if (isLoading || isFetching) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        setPage(prev => prev + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [isLoading, isFetching, hasMore])

  // Mirror watchlist from localStorage so Star fills correctly
  const [watchlist, setWatchlistState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('st_watchlist') || '[]') }
    catch { return [] }
  })

  const isStarred = useCallback((ticker) => watchlist.some(w => w.ticker === ticker), [watchlist])

  const handleStar = useCallback((e, asset) => {
    e.stopPropagation()
    const event = new CustomEvent('add-to-watchlist', { detail: asset })
    window.dispatchEvent(event)
    // Optimistically update local star state
    setWatchlistState(prev => {
      if (prev.some(w => w.ticker === asset.ticker)) {
        return prev.filter(w => w.ticker !== asset.ticker)
      }
      return [{ ticker: asset.ticker, name: asset.name, region: asset.market }, ...prev]
    })
    if (onAddToWatchlist) onAddToWatchlist(asset)
  }, [onAddToWatchlist])

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950 transition-colors">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0 space-y-3 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe size={20} className="text-teal-400" />
            Global Markets
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">Search and explore stocks, forex, crypto, commodities worldwide</p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-500" />
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any ticker or name (AAPL, Reliance, Bitcoin…)"
            className="input-dark w-full pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-slate-600 mr-1">Market:</span>
            {MARKET_FILTERS.map(f => (
              <button key={f.id} id={`market-filter-${f.id}`}
                onClick={() => setMarketF(f.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-all font-medium
                  ${marketF === f.id
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                    : 'border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-500 hover:border-slate-600'
                  }`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-slate-600 mr-1">Type:</span>
            {['All', 'Equity', 'Index'].map(c => {
              if ((marketF === 'forex' || marketF === 'crypto' || marketF === 'commodity') && c !== 'All') return null;
              return (
              <button key={c} id={`cat-filter-${c}`}
                onClick={() => setCatF(c)}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-all font-medium
                  ${catF === c
                    ? 'bg-gray-200 dark:bg-slate-700 border-slate-600 text-gray-900 dark:text-slate-200'
                    : 'border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-500 hover:border-slate-600'
                  }`}>
                {c}
              </button>
            )})}
          </div>
          <span className="text-[10px] text-slate-600 ml-auto">{totalAssets} assets</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {marketAssets.length === 0 && isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-slate-500 mt-4 animate-pulse">Loading global assets...</p>
          </div>
        ) : marketAssets.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <Search size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-500">No assets match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {marketAssets.map((a, index) => {
              const isLast = index === marketAssets.length - 1
              return (
                <div
                  ref={isLast ? lastElementRef : null}
                  key={`${a.ticker}-${index}`}
                  id={`asset-card-${a.ticker}`}
                  onClick={() => onSelectTicker(a.ticker)}
                  className="card p-4 border border-gray-200 dark:border-slate-800 hover:border-teal-500/40
                             hover:bg-gray-50 dark:hover:bg-gray-100 dark:bg-slate-800/50 text-left transition-all group cursor-pointer relative"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={a.ticker} className="w-8 h-8 flex-shrink-0" />
                      <div>
                        <p className="font-mono font-bold text-sm text-teal-600 dark:text-teal-400 group-hover:text-teal-600">
                          {a.ui_symbol || a.ticker.replace(/\.(NS|BO)$/, '')}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-500 truncate max-w-[120px]">{a.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`text-[9px] px-1.5 py-0.5 rounded font-semibold
                        ${a.market === 'US' ? 'bg-blue-500/15 text-blue-400'
                          : a.market === 'IN' ? 'bg-orange-500/15 text-orange-400'
                          : a.market === 'CRYPTO' ? 'bg-yellow-500/15 text-yellow-400'
                          : a.market === 'FX' ? 'bg-purple-500/15 text-purple-400'
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                        }`}>
                        {a.market}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-slate-200">
                      {a.price.toLocaleString('en-IN')}
                    </span>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold
                      ${a.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {a.change >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                      {Math.abs(a.change).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[9px] text-slate-600 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{a.category}</span>
                    <span className="text-[9px] text-slate-600 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{a.sector}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {isFetching && marketAssets.length > 0 && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  )
}