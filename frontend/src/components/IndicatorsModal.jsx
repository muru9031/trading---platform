import React, { useState } from 'react'
import { Search, X, Star, FileCode2, Upload, Check, Store, Wallet, Users, Lock } from 'lucide-react'

// Hardcoded indicators
const TECHNICALS = [
  { id: 'sma', name: 'Simple Moving Average (SMA)', defaultColor: '#3b82f6' },
  { id: 'ema', name: 'Exponential Moving Average (EMA)', defaultColor: '#f59e0b' },
  { id: 'rsi', name: 'Relative Strength Index (RSI)', defaultColor: '#8b5cf6' },
  { id: 'macd', name: 'Moving Average Convergence Divergence (MACD)', defaultColor: '#ec4899' },
  { id: 'bb', name: 'Bollinger Bands', defaultColor: '#14b8a6' },
]

export default function IndicatorsModal({ isOpen, onClose, onAddIndicator, favoriteIndicators = [], onToggleFavorite }) {
  const [activeTab, setActiveTab] = useState('technicals') // technicals, community, store, myscripts, upload
  const [search, setSearch] = useState('')
  const [scriptName, setScriptName] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [scriptCode, setScriptCode] = useState('')
  const [price, setPrice] = useState('')
  const [publishTo, setPublishTo] = useState('private') // private, community, store

  const [myScripts, setMyScripts] = useState([
    { id: 'my-1', name: 'My Super Scalper', creator: 'Me', private: true }
  ])

  const [communityScripts, setCommunityScripts] = useState([
    { id: 'com-1', name: 'GodMode Scalper V2', creator: 'ICT_Trader', users: 12450 },
    { id: 'com-2', name: 'Smart Money Concepts', creator: 'LuxAlgo', users: 8900 },
    { id: 'com-3', name: 'My Super Scalper', creator: 'Me', users: 15, isOwner: true }
  ])

  const handleDeletePublic = (id) => {
    setCommunityScripts(prev => prev.filter(s => s.id !== id))
  }

  const [storeScripts, setStoreScripts] = useState([
    { id: 'store-1', name: 'Pro Trend Catcher', creator: 'EliteTrader', price: 49.99, sales: 340, rating: 4.8 },
    { id: 'store-2', name: 'AI Reversal Engine', creator: 'QuantMaster', price: 99.00, sales: 120, rating: 4.9 }
  ])

  if (!isOpen) return null

  const handleUpload = () => {
    const newScript = {
      id: Math.random().toString(36).substr(2, 9),
      name: scriptName,
      creator: creatorName || 'Me',
      price: price ? parseFloat(price) : 0,
      code: scriptCode
    }

    if (publishTo === 'store') {
      newScript.sales = 0;
      setStoreScripts([newScript, ...storeScripts])
      setActiveTab('store')
    } else if (publishTo === 'community') {
      newScript.users = 0;
      setCommunityScripts([newScript, ...communityScripts])
      setActiveTab('community')
    } else {
      newScript.private = true;
      setMyScripts([newScript, ...myScripts])
      setActiveTab('myscripts')
    }
    
    setScriptName(''); setCreatorName(''); setScriptCode(''); setPrice('');
  }

  const renderTechnicals = () => {
    const filtered = TECHNICALS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    return (
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filtered.map(ind => {
          const isFav = favoriteIndicators.some(f => f.id === ind.id);
          return (
            <div key={ind.id} className="group flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                 onClick={() => {
                   onAddIndicator({ ...ind, uid: Math.random().toString(36).substr(2, 9), visible: true, length: 14, source: 'close', color: ind.defaultColor })
                   onClose()
                 }}>
              <span className="text-sm font-medium text-gray-900 dark:text-slate-200">{ind.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(ind) }}
                className={`p-1 transition-colors ${isFav ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-slate-600 hover:text-yellow-500 dark:hover:text-yellow-400 opacity-0 group-hover:opacity-100'}`}
              >
                <Star size={16} fill={isFav ? "currentColor" : "none"} />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  const renderCommunity = () => (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-200">Public Uploads</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">Indicators shared by the community.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {communityScripts.map(ind => (
          <div key={ind.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 flex flex-col transition-all hover:border-teal-500/50 hover:shadow-lg dark:hover:shadow-teal-900/20">
            <div>
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">{ind.name}</h3>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-gray-600 dark:text-slate-400 font-semibold">
                  <Users size={10} /> {ind.users.toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">by <span className="font-semibold text-teal-600 dark:text-teal-400">@{ind.creator}</span></p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {ind.isOwner ? (
                <button onClick={() => handleDeletePublic(ind.id)} className="text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors border border-red-500/30 bg-red-500/10">
                  Delete
                </button>
              ) : (
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">FREE</span>
              )}
              <button onClick={() => {
                onAddIndicator({ ...ind, uid: Math.random().toString(36).substr(2, 9), visible: true, length: 14, source: 'close', color: '#14b8a6' })
                onClose()
              }} className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 px-3 py-1.5 rounded-lg transition-colors">
                Add to Chart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStore = () => (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/20">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Store size={16} className="text-indigo-600 dark:text-indigo-400"/> Creator Dashboard</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-colors shadow">
            <Wallet size={14} /> Withdraw Funds
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
             <p className="text-[10px] text-gray-500 uppercase font-bold">Total Sales</p>
             <p className="text-lg font-bold text-gray-900 dark:text-white">1,245</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
             <p className="text-[10px] text-gray-500 uppercase font-bold">Active Subs</p>
             <p className="text-lg font-bold text-gray-900 dark:text-white">892</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
             <p className="text-[10px] text-gray-500 uppercase font-bold">Total Earnings</p>
             <p className="text-lg font-bold text-green-600 dark:text-green-400">$34,500</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
             <p className="text-[10px] text-gray-500 uppercase font-bold">Avail. Balance</p>
             <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">$4,250</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-200 mb-3">Featured Store Scripts</h3>
        <div className="grid grid-cols-2 gap-4">
          {storeScripts.map(ind => (
            <div key={ind.id} className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">{ind.name}</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1">by <span className="font-medium text-gray-700 dark:text-slate-400">{ind.creator}</span></p>
                <div className="mt-2 text-[11px] text-gray-600 dark:text-slate-400">
                  Sales: <span className="font-bold text-gray-900 dark:text-slate-200">{ind.sales}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">${ind.price}</span>
                <button className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors">
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderMyScripts = () => (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="grid grid-cols-2 gap-4">
        {myScripts.map(ind => (
          <div key={ind.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 flex items-center gap-2"><Lock size={12} className="text-gray-400"/> {ind.name}</h4>
              <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1">Private Script</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => {
                  onAddIndicator({ ...ind, uid: Math.random().toString(36).substr(2, 9), visible: true, length: 14, source: 'close', color: '#ec4899' })
                  onClose()
                }} className="text-xs font-semibold text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors">
                Add to Chart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUpload = () => (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50 dark:bg-slate-900">
      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Indicator Name</label>
          <input type="text" value={scriptName} onChange={e => setScriptName(e.target.value)} placeholder="e.g., GodMode Scalper" className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-slate-200 focus:border-teal-500 outline-none" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Publish Destination</label>
          <div className="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1">
            <button onClick={() => setPublishTo('private')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${publishTo === 'private' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-slate-400'}`}>Private</button>
            <button onClick={() => setPublishTo('community')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${publishTo === 'community' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-slate-400'}`}>Community</button>
            <button onClick={() => setPublishTo('store')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${publishTo === 'store' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-slate-400'}`}>Store</button>
          </div>
        </div>

        {publishTo === 'store' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Price (USD)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="49.99" className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-slate-200 focus:border-indigo-500 outline-none" />
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">A 15% platform commission will be deducted from sales.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">PineScript / Source Code</label>
          <textarea value={scriptCode} onChange={e => setScriptCode(e.target.value)} placeholder="// Paste your script code here..." rows={6} className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-slate-200 focus:border-teal-500 outline-none font-mono text-[10px]" />
        </div>

        <button onClick={handleUpload} disabled={!scriptName.trim()} className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md">
          <Upload size={16} /> {publishTo === 'private' ? 'Save to My Scripts' : 'Publish Script'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[85vh]">
        <div className="flex flex-col border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-[#131722]">
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2"><FileCode2 size={20} className="text-teal-600 dark:text-teal-400"/> Indicators & Strategies</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveTab('upload')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-md text-xs font-bold transition-colors shadow">
                <Upload size={14} /> Upload
              </button>
              <button onClick={onClose} className="p-1 rounded-md text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-gray-100 dark:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex items-center px-4 gap-6">
            <button onClick={() => setActiveTab('technicals')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'technicals' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}>Technicals</button>
            <button onClick={() => setActiveTab('community')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'community' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}>Public Upload</button>
            <button onClick={() => setActiveTab('store')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'store' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}><Store size={14}/> Store</button>
            <button onClick={() => setActiveTab('myscripts')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'myscripts' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}>My Scripts</button>
          </div>
        </div>
        
        {activeTab === 'technicals' && (
          <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1e222d]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" size={16} />
              <input 
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search indicators..."
                className="w-full bg-gray-100 dark:bg-[#131722] border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'technicals' && renderTechnicals()}
        {activeTab === 'community' && renderCommunity()}
        {activeTab === 'store' && renderStore()}
        {activeTab === 'myscripts' && renderMyScripts()}
        {activeTab === 'upload' && renderUpload()}
      </div>
    </div>
  )
}
