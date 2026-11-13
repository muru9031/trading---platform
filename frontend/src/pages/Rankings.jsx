import React, { useState, useEffect } from 'react'
import AssetLogo from '../components/AssetLogo.jsx'
import {
  BarChart2, TrendingUp, TrendingDown, Globe,
  DollarSign, IndianRupee, Bitcoin, ChevronRight,
  Star, Flame, ArrowUp, ArrowDown, Search
} from 'lucide-react'

const API_BASE = 'http://localhost:8000'

const CATEGORY_MAP = {
  equity: {
    label: 'Equity',
    sub: [
      { id: 'us_equity',     label: 'US Market',     icon: DollarSign,   key: 'us_equity' },
      { id: 'indian_equity', label: 'Indian Market',  icon: IndianRupee,  key: 'indian_equity' },
    ],
  },
  forex:  { label: 'Forex',  sub: [{ id: 'forex',  label: 'Forex Pairs', icon: Globe,    key: 'forex' }] },
  crypto: { label: 'Crypto', sub: [{ id: 'crypto', label: 'Crypto',      icon: Bitcoin,  key: 'crypto' }] },
}



function ChangeCell({ val }) {
  const n = parseFloat(val)
  if (isNaN(n)) return <span className="text-gray-500 dark:text-slate-500">—</span>
  return (
    <span className={`flex items-center justify-end gap-0.5 font-mono text-xs font-semibold
      ${n >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {n >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(n).toFixed(2)}%
    </span>
  )
}

export default function Rankings({ onSelectTicker }) {
  const [mainTab, setMainTab] = useState('equity')
  const [subKey, setSubKey]   = useState('us_equity')
  const [query, setQuery]     = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [marketData, setMarketData] = useState({})

  useEffect(() => {
    // Map subKey to backend category
    let category = "all"
    if (subKey === "indian_equity") category = "IN"
    else if (subKey === "us_equity") category = "US"
    else if (subKey === "crypto") category = "CRYPTO"
    else if (subKey === "forex") category = "FX"
    
    fetch(`${API_BASE}/api/markets?category=${category}&limit=100`)
      .then(res => res.json())
      .then(result => {
        const data = result.data || result // Fallback in case backend is still reloading
        if (data && data.length > 0) {
          setMarketData(prev => ({ ...prev, [subKey]: data }))
        }
      })
      .catch(err => console.error("Error fetching assets:", err))
  }, [subKey])

  const SECTORS = ['All', 'Technology', 'Banking', 'Energy', 'Consumer']

  const rows = (marketData[subKey] || []).filter(r => {
    const matchesSearch = !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.ticker.toLowerCase().includes(query.toLowerCase())
    const matchesSector = sectorFilter === 'All' || 
                          (sectorFilter === 'Technology' && (r.sector === 'Technology' || r.sector === 'IT' || r.sector === 'Communication')) ||
                          (sectorFilter === 'Banking' && (r.sector === 'Banking' || r.sector === 'Financial')) ||
                          (sectorFilter === 'Energy' && r.sector === 'Energy') ||
                          (sectorFilter === 'Consumer' && r.sector === 'Consumer')
    return matchesSearch && matchesSector
  })

  const subs = CATEGORY_MAP[mainTab]?.sub || []

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950 transition-colors">

      {/* Page Header */}
      <div className="px-6 pt-5 pb-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart2 size={20} className="text-teal-600 dark:text-teal-400" />
              Market Rankings
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">Top performers sorted by market performance</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-500" />
            <input
              id="rankings-search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter stocks…"
              className="input-dark pl-7 text-xs w-48"
            />
          </div>
        </div>

        {/* Main tabs */}
        <div className="flex items-center gap-1 mt-4">
          {Object.entries(CATEGORY_MAP).map(([key, val]) => (
            <button
              key={key}
              id={`rank-tab-${key}`}
              onClick={() => { setMainTab(key); setSubKey(CATEGORY_MAP[key].sub[0].key) }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                ${mainTab === key
                  ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/40'
                  : 'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300 hover:bg-gray-100 dark:bg-slate-800'
                }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Sub-tabs and Sector Filters */}
        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          {subs.length > 1 && (
            <div className="flex items-center gap-1">
              {subs.map(({ id, label, icon: Icon, key }) => (
                <button
                  key={id}
                  id={`rank-sub-${id}`}
                  onClick={() => setSubKey(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${subKey === key
                      ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-200'
                      : 'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300'
                    }`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Sector Pills */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 mr-1 uppercase">Sector:</span>
            {SECTORS.map(sec => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  sectorFilter === sec 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:bg-slate-700'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
            <tr>
              {['#', 'Ticker', 'Company', 'Price', 'Change', 'Mkt Cap', 'P/E', 'Sector', ''].map(h => (
                <th key={h} className={`py-3 px-4 font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider
                  ${h === '#' || h === 'P/E' ? 'text-center w-14' : h === '' ? 'w-20' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.ticker}
                className="border-b border-gray-200 dark:border-slate-800/50 hover:bg-gray-100 dark:bg-slate-800/40 transition-colors cursor-pointer group"
                onClick={() => onSelectTicker(row.ticker)}
              >
                <td className="py-3 px-4 text-center">
                  <span className={`font-mono font-bold text-xs
                    ${row.rank <= 3 ? 'text-amber-400' : 'text-slate-600'}`}>
                    {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank - 1] : row.rank}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <AssetLogo symbol={row.ticker} className="w-5 h-5 flex-shrink-0" />
                    <span className="font-mono font-bold text-teal-400 group-hover:text-teal-300">
                      {row.ticker.replace('.NS', '')}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-slate-300 max-w-[200px]">
                  <span className="truncate block">{row.name}</span>
                </td>
                <td className="py-3 px-4 font-mono text-gray-900 dark:text-slate-200 text-right">
                  {typeof row.price === 'number' ? row.price.toLocaleString('en-IN') : row.price}
                </td>
                <td className="py-3 px-4 text-right">
                  <ChangeCell val={row.change} />
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-400 text-right font-mono">{row.mktcap}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-400 text-center font-mono">
                  {typeof row.pe === 'number' ? row.pe.toFixed(1) : row.pe}
                </td>
                <td className="py-3 px-4">
                  <span className="badge-neutral text-[9px] px-1.5">{row.sector}</span>
                </td>
                <td className="py-3 px-4">
                  <button
                    id={`rank-view-${row.ticker}`}
                    className="opacity-0 group-hover:opacity-100 btn-primary text-[10px] px-2 py-1 transition-all"
                    onClick={(e) => { e.stopPropagation(); onSelectTicker(row.ticker) }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-12">
            <BarChart2 size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-500 text-sm">No results for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}