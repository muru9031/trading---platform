import AssetLogo from './AssetLogo.jsx'
import { getFriendlyName } from '../utils/tickerMap'
import { useState, useEffect, useRef } from 'react'
import {
  Search, X, TrendingUp, ChevronRight, ChevronDown,
  Plus, Edit2, Trash, Check, RotateCcw, GripVertical,
  PanelLeftClose, AlertCircle
} from 'lucide-react'

const DEFAULT_SECTIONS = ['Major Equities', 'Forex & Crypto']

const DEFAULT_WATCHLIST = [
  { ticker: 'AAPL',        name: 'Apple Inc.',             region: 'US',        section: 'Major Equities' },
  { ticker: 'TSLA',        name: 'Tesla Inc.',             region: 'US',        section: 'Major Equities' },
  { ticker: 'NVDA',        name: 'NVIDIA Corporation',     region: 'US',        section: 'Major Equities' },
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd',region: 'IN',        section: 'Major Equities' },
  { ticker: 'TCS.NS',      name: 'Tata Consultancy Serv',  region: 'IN',        section: 'Major Equities' },
  { ticker: 'EURUSD=X',    name: 'Euro / US Dollar',       region: 'FX',        section: 'Forex & Crypto' },
  { ticker: 'USDINR=X',    name: 'US Dollar / Indian Rupee',region: 'FX',       section: 'Forex & Crypto' },
  { ticker: 'BTC-USD',     name: 'Bitcoin (USD)',          region: 'CRYPTO',    section: 'Forex & Crypto' },
  { ticker: 'ETH-USD',     name: 'Ethereum (USD)',         region: 'CRYPTO',    section: 'Forex & Crypto' },
  { ticker: 'GC=F',        name: 'Gold Futures (COMEX)',   region: 'COMMODITY', section: 'Forex & Crypto' },
]

const MAX_SECTIONS = 10
const MAX_ASSETS = 50

function inferRegion(ticker) {
  if (!ticker) return 'US'
  if (ticker.endsWith('.NS') || ticker.endsWith('.BO') || ticker.endsWith('.MC')) return 'IN'
  if (ticker.includes('-USD') || ticker.includes('-BTC') || ticker.includes('-USDT')) return 'CRYPTO'
  if (ticker.includes('=X')) return 'FX'
  if (ticker.includes('=F')) return 'COMMODITY'
  return 'US'
}

export function isInWatchlist(ticker) {
  try {
    const wl = JSON.parse(localStorage.getItem('st_watchlist') || '[]')
    return wl.some(w => w.ticker === ticker)
  } catch { return false }
}

export default function Sidebar({ activeTicker, onSelectTicker, isOpen, setIsOpen }) {
  // ── Sections State ────────────────────────────────────────────────────────
  const [sections, setSections] = useState(() => {
    try {
      const stored = localStorage.getItem('st_watchlist_sections')
      return stored ? JSON.parse(stored) : DEFAULT_SECTIONS
    } catch { return DEFAULT_SECTIONS }
  })

  // ── Watchlist State ───────────────────────────────────────────────────────
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem('st_watchlist')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
      return DEFAULT_WATCHLIST
    } catch { return DEFAULT_WATCHLIST }
  })

  const [collapsedSections, setCollapsedSections] = useState({})
  const [query, setQuery] = useState('')
  const [notification, setNotification] = useState(null)

  // Drag and Drop tracking
  const [draggedTicker, setDraggedTicker] = useState(null)
  const [dragOverSection, setDragOverSection] = useState(null)
  const [dragOverTicker, setDragOverTicker] = useState(null)

  // Section Creation & Renaming
  const [showNewSection, setShowNewSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [editingSection, setEditingSection] = useState(null)
  const [editingName, setEditingName] = useState('')

  // Search Modal
  const [isModalOpen, setIsModalOpen]   = useState(false)
  const [modalQuery, setModalQuery]     = useState('')
  const [modalResults, setModalResults] = useState([])
  const [isSearching, setIsSearching]   = useState(false)
  const [modalFilter, setModalFilter]   = useState('All')
  const [targetAddSection, setTargetAddSection] = useState('Major Equities')

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('st_watchlist_sections', JSON.stringify(sections))
  }, [sections])

  useEffect(() => {
    localStorage.setItem('st_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Custom Event Listener for adding from other tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.ticker) addToWatchlist(e.detail)
    }
    window.addEventListener('add-to-watchlist', handler)
    return () => window.removeEventListener('add-to-watchlist', handler)
  }, [watchlist, sections])

  // Helper notification toast
  const showNotice = (msg, isError = false) => {
    setNotification({ msg, isError })
    setTimeout(() => setNotification(null), 3000)
  }

  // ── Search & Fetch Logic ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isModalOpen) return
    setIsSearching(true)
    const t = setTimeout(() => {
      fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(modalQuery)}`)
        .then(r => r.json())
        .then(data => {
          const mapped = data.map(item => ({
            ticker: item.ticker || item.fetch_symbol || item.symbol,
            symbol: item.symbol || item.ticker,
            name: item.name || item.ticker,
            region: item.region || inferRegion(item.ticker),
            category: item.category || 'Equity'
          }))
          setModalResults(mapped)
          setIsSearching(false)
        })
        .catch(err => {
          console.error("Search error:", err)
          setIsSearching(false)
        })
    }, modalQuery ? 250 : 0)
    return () => clearTimeout(t)
  }, [modalQuery, isModalOpen])

  // ── Add to Watchlist ──────────────────────────────────────────────────────
  const addToWatchlist = (itemOrStr, specificSection = null) => {
    if (watchlist.length >= MAX_ASSETS) {
      showNotice(`Watchlist limit reached (Max ${MAX_ASSETS} assets).`, true)
      return
    }

    let t, name, reg
    if (typeof itemOrStr === 'string') {
      t = itemOrStr.trim().toUpperCase()
      name = getFriendlyName(t) || t
      reg = inferRegion(t)
    } else {
      t = itemOrStr.ticker || itemOrStr.symbol
      name = itemOrStr.name || t
      reg = itemOrStr.region || inferRegion(t)
    }

    if (!t) return

    // If already in list, select it and notify
    const existing = watchlist.find(w => w.ticker === t)
    if (existing) {
      onSelectTicker(t)
      showNotice(`${t} is already in Watchlist (${existing.section || 'Default'})`)
      return
    }

    const sec = specificSection || (sections.includes(targetAddSection) ? targetAddSection : sections[0] || 'Major Equities')
    const newItem = { ticker: t, name, region: reg, section: sec }

    setWatchlist(prev => [newItem, ...prev])
    onSelectTicker(t)
    showNotice(`Added ${t} to ${sec}`)
  }

  const removeFromWatchlist = (ticker) => {
    setWatchlist(prev => prev.filter(w => w.ticker !== ticker))
    showNotice(`Removed ${ticker}`)
  }

  // ── Section Management ────────────────────────────────────────────────────
  const toggleSectionCollapse = (sec) => {
    setCollapsedSections(prev => ({ ...prev, [sec]: !prev[sec] }))
  }

  const createSection = () => {
    const trimmed = newSectionName.trim()
    if (!trimmed) {
      setShowNewSection(false)
      return
    }
    if (sections.length >= MAX_SECTIONS) {
      showNotice(`Section limit reached (Max ${MAX_SECTIONS} sections).`, true)
      setShowNewSection(false)
      return
    }
    if (sections.includes(trimmed)) {
      showNotice(`Section "${trimmed}" already exists.`, true)
      return
    }

    setSections(prev => [...prev, trimmed])
    setNewSectionName('')
    setShowNewSection(false)
    showNotice(`Created section "${trimmed}"`)
  }

  const renameSection = (oldName, newName) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) {
      setEditingSection(null)
      return
    }
    setSections(prev => prev.map(s => s === oldName ? trimmed : s))
    setWatchlist(prev => prev.map(w => w.section === oldName ? { ...w, section: trimmed } : w))
    setEditingSection(null)
  }

  const deleteSection = (secToDelete) => {
    if (sections.length <= 1) {
      showNotice("Cannot delete the only remaining section.", true)
      return
    }
    const fallbackSection = sections.find(s => s !== secToDelete) || 'Major Equities'
    setSections(prev => prev.filter(s => s !== secToDelete))
    // Move assets of deleted section to fallback
    setWatchlist(prev => prev.map(w => w.section === secToDelete ? { ...w, section: fallbackSection } : w))
    showNotice(`Deleted "${secToDelete}". Assets moved to "${fallbackSection}".`)
  }

  const resetWatchlist = () => {
    if (window.confirm("Reset Watchlist to default sections & assets?")) {
      setSections(DEFAULT_SECTIONS)
      setWatchlist(DEFAULT_WATCHLIST)
      setCollapsedSections({})
      localStorage.removeItem('st_watchlist')
      localStorage.removeItem('st_watchlist_sections')
      showNotice("Watchlist reset to TradingView defaults.")
    }
  }

  // ── Drag and Drop Handlers (HTML5 Native) ──────────────────────────────────
  const handleDragStart = (e, ticker, sourceSection) => {
    e.dataTransfer.setData('text/plain', ticker)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedTicker(ticker)
  }

  const handleDragOverSection = (e, sec) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverSection !== sec) setDragOverSection(sec)
  }

  const handleDropOnSection = (e, targetSection) => {
    e.preventDefault()
    e.stopPropagation()
    const ticker = e.dataTransfer.getData('text/plain') || draggedTicker
    if (!ticker) return

    setWatchlist(prev => prev.map(item => item.ticker === ticker ? { ...item, section: targetSection } : item))
    setDraggedTicker(null)
    setDragOverSection(null)
    setDragOverTicker(null)
  }

  const handleDropOnAsset = (e, targetTicker, targetSection) => {
    e.preventDefault()
    e.stopPropagation()
    const movingTicker = e.dataTransfer.getData('text/plain') || draggedTicker
    if (!movingTicker || movingTicker === targetTicker) return

    setWatchlist(prev => {
      const itemToMove = prev.find(i => i.ticker === movingTicker)
      if (!itemToMove) return prev

      const withoutMoving = prev.filter(i => i.ticker !== movingTicker)
      const targetIndex = withoutMoving.findIndex(i => i.ticker === targetTicker)

      const updatedItem = { ...itemToMove, section: targetSection }

      if (targetIndex === -1) {
        return [...withoutMoving, updatedItem]
      }

      const newArr = [...withoutMoving]
      newArr.splice(targetIndex, 0, updatedItem)
      return newArr
    })

    setDraggedTicker(null)
    setDragOverSection(null)
    setDragOverTicker(null)
  }

  // Filtered Watchlist for in-sidebar search box
  const filteredWatchlist = watchlist.filter(w =>
    w.ticker.toLowerCase().includes(query.toLowerCase()) ||
    (w.name && w.name.toLowerCase().includes(query.toLowerCase()))
  )

  const MODAL_FILTERS = [
    { id: 'All',        label: 'All Markets' },
    { id: 'Indian',     label: '🇮🇳 India' },
    { id: 'US',         label: '🇺🇸 US' },
    { id: 'Forex',      label: '💱 Forex' },
    { id: 'Crypto',     label: '₿ Crypto' },
    { id: 'Commodity',  label: '🏭 Commodity' },
  ]

  const filteredModal = modalResults.filter(item => {
    if (modalFilter === 'All')        return true
    if (modalFilter === 'Indian')     return item.ticker?.endsWith('.NS') || item.ticker?.endsWith('.BO') || item.region === 'IN'
    if (modalFilter === 'US')         return item.region === 'US' || (!item.ticker?.endsWith('.NS') && !item.ticker?.includes('=') && !item.ticker?.includes('-'))
    if (modalFilter === 'Forex')      return item.ticker?.includes('=X') || item.region === 'FX'
    if (modalFilter === 'Crypto')     return item.ticker?.includes('-USD') || item.region === 'CRYPTO'
    if (modalFilter === 'Commodity')  return item.ticker?.includes('=F') || item.region === 'COMMODITY' || item.category === 'Commodity'
    return true
  })

  return (
    <aside className="h-full flex flex-col bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 overflow-hidden w-72 transition-colors select-none relative">

      {/* Floating Notice Alert */}
      {notification && (
        <div className={`absolute top-2 left-2 right-2 z-30 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg flex items-center justify-between animate-fade-in ${notification.isError ? 'bg-red-500 text-white' : 'bg-teal-600 text-white'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white ml-2"><X size={12} /></button>
        </div>
      )}

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={15} className="text-teal-500" />
            <span className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">Watchlist</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold">
              {watchlist.length}/{MAX_ASSETS}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setTargetAddSection(sections[0] || 'Major Equities'); setIsModalOpen(true); }}
              className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold shadow-sm"
              title="Search & Add Asset"
            >
              <Plus size={13} /> Add
            </button>
            <button
              onClick={resetWatchlist}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset Watchlist to Defaults"
            >
              <RotateCcw size={13} />
            </button>
            {setIsOpen && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            id="watchlist-filter-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter current list..."
            className="w-full pl-7 pr-3 text-xs py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* ── Section Management Action Bar ───────────────────────────────────── */}
      <div className="px-3 py-1.5 bg-gray-100/60 dark:bg-slate-950/60 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-[10px] text-gray-500 dark:text-slate-500 font-medium">
          {sections.length}/{MAX_SECTIONS} Sections
        </span>
        <button
          onClick={() => {
            if (sections.length >= MAX_SECTIONS) {
              showNotice(`Maximum of ${MAX_SECTIONS} sections reached.`, true)
            } else {
              setShowNewSection(true)
            }
          }}
          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus size={11} /> New Section
        </button>
      </div>

      {/* New Section Inline Creator */}
      {showNewSection && (
        <div className="p-2 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-800/40 flex items-center gap-1">
          <input
            type="text"
            autoFocus
            placeholder="Section Name (e.g. Bluechips)"
            value={newSectionName}
            onChange={e => setNewSectionName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') createSection()
              if (e.key === 'Escape') setShowNewSection(false)
            }}
            className="flex-1 text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
          />
          <button onClick={createSection} className="p-1 bg-teal-600 text-white rounded hover:bg-teal-700"><Check size={12} /></button>
          <button onClick={() => setShowNewSection(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
        </div>
      )}

      {/* ── Scrollable Watchlist Sections ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {sections.map(section => {
          const sectionItems = filteredWatchlist.filter(w => (w.section || sections[0]) === section)
          const isCollapsed = collapsedSections[section]
          const isDragOver = dragOverSection === section

          return (
            <div
              key={section}
              onDragOver={(e) => handleDragOverSection(e, section)}
              onDragLeave={() => setDragOverSection(null)}
              onDrop={(e) => handleDropOnSection(e, section)}
              className={`rounded-xl border transition-all ${isDragOver ? 'border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20' : 'border-gray-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60'}`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between px-2.5 py-2 group/header cursor-pointer rounded-t-xl hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors">
                <div 
                  className="flex items-center gap-1.5 flex-1 min-w-0"
                  onClick={() => toggleSectionCollapse(section)}
                >
                  <span className="text-gray-400 dark:text-slate-500">
                    {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </span>

                  {editingSection === section ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => renameSection(section, editingName)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') renameSection(section, editingName)
                        if (e.key === 'Escape') setEditingSection(null)
                      }}
                      onClick={e => e.stopPropagation()}
                      className="text-xs font-bold text-teal-600 bg-transparent border-b border-teal-500 outline-none w-28"
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider truncate">
                      {section}
                    </span>
                  )}

                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold">
                    {sectionItems.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setTargetAddSection(section)
                      setIsModalOpen(true)
                    }}
                    title={`Add ticker to ${section}`}
                    className="p-1 text-gray-400 hover:text-teal-600 rounded"
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingSection(section)
                      setEditingName(section)
                    }}
                    title="Rename Section"
                    className="p-1 text-gray-400 hover:text-teal-600 rounded"
                  >
                    <Edit2 size={11} />
                  </button>
                  {sections.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSection(section)
                      }}
                      title="Delete Section"
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Section Items (Collapsible & Draggable) */}
              {!isCollapsed && (
                <div className="p-1 space-y-1 min-h-[32px]">
                  {sectionItems.length === 0 ? (
                    <div className="text-[10px] text-center text-gray-400 dark:text-slate-600 italic py-3 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                      Drop assets here or click +
                    </div>
                  ) : (
                    sectionItems.map((item, idx) => {
                      const isActive = activeTicker === item.ticker
                      const isTarget = dragOverTicker === item.ticker

                      return (
                        <div
                          key={`${item.ticker}-${idx}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.ticker, section)}
                          onDragOver={(e) => {
                            e.preventDefault()
                            if (dragOverTicker !== item.ticker) setDragOverTicker(item.ticker)
                          }}
                          onDragLeave={() => setDragOverTicker(null)}
                          onDrop={(e) => handleDropOnAsset(e, item.ticker, section)}
                          onClick={() => onSelectTicker(item.ticker)}
                          className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500/40 shadow-sm'
                              : isTarget
                              ? 'border-t-2 border-teal-500 bg-gray-100 dark:bg-slate-800'
                              : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Drag handle */}
                            <span className="opacity-0 group-hover:opacity-60 cursor-grab text-gray-400 hover:text-gray-600">
                              <GripVertical size={11} />
                            </span>
                            <AssetLogo symbol={item.ticker} className="w-6 h-6 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className={`text-xs font-mono font-bold truncate ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-slate-100'}`}>
                                {item.ticker}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate max-w-[120px]">
                                {item.name || getFriendlyName(item.ticker)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isActive && <ChevronRight size={13} className="text-teal-600 dark:text-teal-400" />}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromWatchlist(item.ticker)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity rounded"
                              title="Remove from Watchlist"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Search & Add to Watchlist Modal ─────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Plus size={16} className="text-teal-500" />
                  Add to Watchlist
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Adding to Section: <span className="font-semibold text-teal-600 dark:text-teal-400 font-mono">{targetAddSection}</span> ({watchlist.length}/{MAX_ASSETS} assets)
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setModalQuery(''); }}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1 min-h-0">
              {/* Search input with Intelligent Suggestion */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  autoFocus
                  value={modalQuery}
                  onChange={e => setModalQuery(e.target.value)}
                  placeholder="Search by company or ticker: Google, Reliance, Tata, Apple, Bitcoin..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                />
              </div>

              {/* Target Section Picker */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-slate-400 text-[11px]">Add into:</span>
                <select
                  value={targetAddSection}
                  onChange={e => setTargetAddSection(e.target.value)}
                  className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200 text-xs border border-gray-300 dark:border-slate-700 focus:outline-none font-medium"
                >
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Market Filter pills */}
              <div className="flex flex-wrap gap-1.5">
                {MODAL_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setModalFilter(f.id)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all font-medium ${
                      modalFilter === f.id
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-400 font-semibold'
                        : 'border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-950/60 p-2 space-y-1 min-h-0">
                {isSearching ? (
                  <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-12 flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span>Searching global assets...</span>
                  </div>
                ) : filteredModal.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-12 flex flex-col items-center gap-2">
                    <AlertCircle size={24} className="text-gray-300 dark:text-slate-700" />
                    <span>No assets match "{modalQuery}" in {modalFilter}.</span>
                    <button
                      onClick={() => { setModalFilter('All'); setModalQuery(''); }}
                      className="text-teal-600 dark:text-teal-400 underline text-xs mt-1"
                    >
                      Show all popular assets
                    </button>
                  </div>
                ) : (
                  filteredModal.map((item, idx) => {
                    const alreadyAdded = watchlist.some(w => w.ticker === item.ticker)

                    return (
                      <div
                        key={`${item.ticker}-${idx}`}
                        onClick={() => {
                          if (!alreadyAdded) {
                            addToWatchlist(item, targetAddSection)
                          } else {
                            onSelectTicker(item.ticker)
                            showNotice(`${item.ticker} selected.`)
                          }
                          setIsModalOpen(false)
                          setModalQuery('')
                        }}
                        className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all border ${
                          alreadyAdded
                            ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/20'
                            : 'hover:bg-white dark:hover:bg-slate-800 border-transparent hover:border-gray-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AssetLogo symbol={item.ticker} className="w-8 h-8 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-gray-900 dark:text-slate-100">
                                {item.ticker}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                                {item.region}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[240px]">
                              {item.name || getFriendlyName(item.ticker)}
                            </div>
                          </div>
                        </div>

                        <button
                          className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1 ${
                            alreadyAdded
                              ? 'bg-gray-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'
                              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                          }`}
                        >
                          {alreadyAdded ? (
                            <>
                              <Check size={12} /> In List
                            </>
                          ) : (
                            <>
                              <Plus size={12} /> Add
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}