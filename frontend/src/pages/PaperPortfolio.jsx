import AssetLogo from '../components/AssetLogo.jsx'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Briefcase, Wallet, CheckCircle, BarChart2, TrendingUp, Activity, PieChart,
  ArrowUpCircle, ArrowDownCircle, Edit2, X, ChevronLeft, ChevronRight,
  DollarSign, IndianRupee, RefreshCw
} from 'lucide-react'
import { usePortfolio, isINRTicker, calcBrokerage } from '../contexts/PortfolioContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import DetailedAnalysis from '../components/DetailedAnalysis.jsx'

const API_BASE = 'http://localhost:8000'
const USD_TO_INR = 84.5 // Fallback rate; we try to fetch live

function OrderBadge({ type }) {
  return type === 'BUY'
    ? <span className="badge-buy flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><ArrowUpCircle size={9}/> BUY</span>
    : <span className="badge-sell flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border bg-red-500/15 text-red-400 border-red-500/30"><ArrowDownCircle size={9}/> SELL</span>
}

const getOrderSym = (ticker) => isINRTicker(ticker) ? '₹' : '$'

const MARKETS = ['All', 'Indian Market', 'US Market', 'Forex', 'Crypto', 'Commodity']

function matchesMarket(o, tab) {
  const t = o.ticker || ''
  if (tab === 'All')           return true
  if (tab === 'Indian Market') return isINRTicker(t)
  if (tab === 'US Market')     return !isINRTicker(t) && !t.includes('=X') && !t.includes('-USD') && !t.endsWith('=F')
  if (tab === 'Forex')         return t.includes('=X')
  if (tab === 'Crypto')        return t.includes('-USD')
  if (tab === 'Commodity')     return t.endsWith('=F')
  return true
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PaperPortfolio({ activeTicker, user }) {
  const { capitalINR, capitalUSD, setCapitalINR, setCapitalUSD, addCapital, orders, closeOrder, editOrder, resetAll } = usePortfolio()
  const { showToast } = useToast()

  const [paperTab, setPaperTab]     = useState('book')
  const [activeMarket, setActiveMarket] = useState(() => localStorage.getItem('st_paper_market_tab') || 'All')
  const [livePrices, setLivePrices] = useState({})
  const [liveUsdInr, setLiveUsdInr] = useState(USD_TO_INR)
  const [modalCurrency, setModalCurrency] = useState('INR')

  // Capital edit
  const [isEditingCapital, setIsEditingCapital] = useState(false)
  const [newCapital, setNewCapital] = useState('')

  // All-tab INR/USD view toggle
  const [allTabCurrency, setAllTabCurrency] = useState('INR')

  // Edit order modal
  const [editingOrder, setEditingOrder] = useState(null)
  const [editSl, setEditSl] = useState('')
  const [editTp, setEditTp] = useState('')

  // Calendar State (needed for Performance by Day etc)
  const now = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  // Monthly Capital Injection State
  const [monthlyDeposits, setMonthlyDeposits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('st_paper_deposits') || '{}') }
    catch { return {} }
  })

  // Modals state
  const [showCapitalModal, setShowCapitalModal] = useState(false)
  const [capitalInput, setCapitalInput] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)

  // Derive currency from active market tab
  const isINRMarket = activeMarket === 'Indian Market' || activeMarket === 'Commodity'
  const isAllTab    = activeMarket === 'All'
  // On All tab, toggle between INR and USD. On specific tabs, use their currency.
  const sym     = isAllTab ? (allTabCurrency === 'INR' ? '₹' : '$') : (isINRMarket ? '₹' : '$')
  const capital = isINRMarket ? capitalINR : capitalUSD

  // Fetch live USD/INR rate on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/latest-price/USDINR%3DX`)
      .then(r => r.json())
      .then(d => { if (d?.close) setLiveUsdInr(d.close) })
      .catch(() => {})
  }, [])

  useEffect(() => { localStorage.setItem('st_paper_deposits', JSON.stringify(monthlyDeposits)) }, [monthlyDeposits])

  // Market-filtered orders
  const marketOrders = useMemo(() => orders.filter(o => matchesMarket(o, activeMarket)), [orders, activeMarket])
  const openOrders   = useMemo(() => marketOrders.filter(o => o.status === 'OPEN'), [marketOrders])
  const closedOrders = useMemo(() => marketOrders.filter(o => o.status === 'CLOSED'), [marketOrders])
  const activeOrders = useMemo(() => openOrders.filter(o => o.execType !== 'LIMIT'), [openOrders])
  const limitOrders  = useMemo(() => openOrders.filter(o => o.execType === 'LIMIT'), [openOrders])

  // ── Live Price Polling ────────────────────────────────────────────────────
  useEffect(() => {
    if (openOrders.length === 0) { setLivePrices({}); return }
    const tickers = [...new Set(openOrders.map(o => o.ticker))]
    
    const cryptoTickers = tickers.filter(t => t.endsWith('-USD') || t.endsWith('-USDT'))
    const restTickers = tickers.filter(t => !t.endsWith('-USD') && !t.endsWith('-USDT'))
    
    let ws = null
    if (cryptoTickers.length > 0) {
      const streams = cryptoTickers.map(t => {
        const sym = t.replace('-', '').replace('USD', 'USDT').toLowerCase()
        return `${sym}@miniTicker`
      }).join('/')
      
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`)
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.s && msg.c) {
            let base = msg.s.toUpperCase()
            if (base.endsWith('USDT')) base = base.replace('USDT', '')
            const ticker = `${base}-USD`
            setLivePrices(prev => ({ ...prev, [ticker]: parseFloat(msg.c) }))
          }
        } catch {}
      }
    }

    let pollId = null
    if (restTickers.length > 0) {
      const fetchRest = async () => {
        const results = {}
        await Promise.all(restTickers.map(async t => {
          try {
            const r = await fetch(`${API_BASE}/api/latest-price/${encodeURIComponent(t)}`)
            if (r.ok) { const d = await r.json(); if (d?.close) results[t] = d.close }
          } catch {}
        }))
        setLivePrices(prev => ({ ...prev, ...results }))
      }
      fetchRest()
      pollId = setInterval(fetchRest, 2000)
    }

    return () => {
      if (ws) ws.close()
      if (pollId) clearInterval(pollId)
    }
  }, [openOrders])

  // ── Convert value for "All" tab ──────────────────────────────────────────
  const convertForAllTab = useCallback((value, ticker) => {
    if (!isAllTab) return value
    const tickerIsINR = isINRTicker(ticker)
    if (allTabCurrency === 'INR' && !tickerIsINR) return value * liveUsdInr
    if (allTabCurrency === 'USD' && tickerIsINR)  return value / liveUsdInr
    return value
  }, [isAllTab, allTabCurrency, liveUsdInr])

  // ── Analytics (throttled — useMemo, not computed per render) ─────────────
  const analytics = useMemo(() => {
    // For All tab, include everything; otherwise filter by market
    const allForAnalytics = isAllTab ? orders.filter(o => o.status === 'CLOSED') : closedOrders
    const realizedPnL   = allForAnalytics.reduce((s, o) => s + (o.pnl||0), 0)
    const totalBrokerage= allForAnalytics.reduce((s, o) => s + (o.brokerage||0), 0)

    // Unrealized P&L for open orders
    const unrealizedPnL = (isAllTab ? orders.filter(o=>o.status==='OPEN') : openOrders).reduce((s, o) => {
      const lp = livePrices[o.ticker] || o.entryPrice
      return s + (o.type==='BUY' ? (lp-o.entryPrice) : (o.entryPrice-lp)) * o.qty
    }, 0)

    return { realizedPnL, totalBrokerage, unrealizedPnL }
  }, [closedOrders, openOrders, orders, isAllTab, livePrices])

  // ── Calendar ─────────────────────────────────────────────────────────────
  const calDaysInMonth = new Date(calYear, calMonth+1, 0).getDate()
  const calFirstDay    = new Date(calYear, calMonth, 1).getDay()
  const calOffset      = calFirstDay === 0 ? 6 : calFirstDay - 1

  const dailyData = useMemo(() => {
    const dd = {}
    closedOrders.forEach(o => {
      const d = new Date(o.closedAt || o.timestamp)
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate()
        if (!dd[day]) dd[day] = { pnl: 0, count: 0, brokerage: 0 }
        dd[day].pnl       += (o.pnl||0)
        dd[day].count     += 1
        dd[day].brokerage += (o.brokerage||0)
      }
    })
    return dd
  }, [closedOrders, calYear, calMonth])

  const handleAddMonthlyCapital = () => {
    setModalCurrency(isINRMarket ? 'INR' : (isAllTab ? allTabCurrency : 'USD'));
    setShowCapitalModal(true);
  }

  const submitCapital = async () => {
    const val = parseFloat(capitalInput)
    if (!isNaN(val) && val > 0) {
      const currency = isAllTab ? modalCurrency : (isINRMarket ? 'INR' : 'USD');
      const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      setMonthlyDeposits(prev => {
        const existing = prev[currentMonthKey] || { INR: 0, USD: 0 };
        const next = {
          ...prev,
          [currentMonthKey]: {
            ...existing,
            ...(currency === 'INR' ? { INR: existing.INR + val } : { USD: existing.USD + val })
          }
        };
        localStorage.setItem('st_paper_deposits', JSON.stringify(next));
        return next;
      });

      if (addCapital) {
        await addCapital(val, currency);
      } else {
        if (currency === 'INR') setCapitalINR(c => c + val);
        else setCapitalUSD(c => c + val);
      }
      
      showToast(`Added ${currency === 'INR' ? '₹' : '$'}${val.toLocaleString()} to Virtual Capital!`, 'success');
    }
    setShowCapitalModal(false);
    setCapitalInput('');
  }

  // ── Overall capital for "All" tab ─────────────────────────────────────────
  const displayCapital = isAllTab 
    ? (allTabCurrency === 'INR' ? capitalINR + capitalUSD * liveUsdInr : capitalINR / liveUsdInr + capitalUSD)
    : capital

  const handleConfirmReset = () => {
    resetAll()
    setMonthlyDeposits({})
    setShowResetModal(false)
    showToast('All P-Trade data has been reset to zero.', 'success')
  }

  // Dashboard Data Prep for Detailed Analysis
  const dashboardTrades = useMemo(() => {
    return closedOrders.map(o => {
      let val = o.pnl || 0
      if (isAllTab) {
        const tickerIsINR = isINRTicker(o.ticker)
        if (allTabCurrency === 'INR' && !tickerIsINR) val = val * liveUsdInr
        if (allTabCurrency === 'USD' && tickerIsINR)  val = val / liveUsdInr
      }
      return { ...o, netPnl: val, timestamp: o.closedAt || o.timestamp }
    })
  }, [closedOrders, isAllTab, allTabCurrency, liveUsdInr])

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">

      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity size={18} className="text-teal-400"/> P-Trade (Virtual Brokerage)
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">Zerodha-style brokerage simulation. Live P&L per open order.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowResetModal(true)}
            className="text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1">
            <RefreshCw size={11}/> Reset All
          </button>
        </div>
      </div>

      {/* Market Tabs */}
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto flex-shrink-0">
        {MARKETS.map(m => (
          <button key={m} onClick={() => { setActiveMarket(m); localStorage.setItem('st_paper_market_tab', m); }}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all border ${activeMarket===m ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-200 border-slate-500' : 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:bg-slate-800'}`}>
            {m}
          </button>
        ))}
        {/* All-tab INR/USD toggle */}
        {isAllTab && (
          <div className="flex items-center gap-1 ml-auto border border-gray-300 dark:border-slate-700 rounded-full overflow-hidden">
            <button onClick={() => setAllTabCurrency('INR')} className={`px-2.5 py-1 text-[10px] font-bold flex items-center gap-0.5 transition-all ${allTabCurrency==='INR'?'bg-orange-500/20 text-orange-400':'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300'}`}>
              <IndianRupee size={9}/> INR
            </button>
            <button onClick={() => setAllTabCurrency('USD')} className={`px-2.5 py-1 text-[10px] font-bold flex items-center gap-0.5 transition-all ${allTabCurrency==='USD'?'bg-blue-500/20 text-blue-400':'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300'}`}>
              <DollarSign size={9}/> USD
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Top 4 Metrics (GLOBAL) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Wallet size={13} className="text-teal-400"/><span className="text-[10px] text-teal-500 dark:text-teal-400 uppercase tracking-wider font-bold">Global Virtual Capital</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-teal-400 mt-1">
              {sym}{displayCapital.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
            {isAllTab && <div className="text-[9px] text-slate-600 mt-0.5">Combined across all markets</div>}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-1.5 mb-2"><CheckCircle size={13} className="text-emerald-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Realized P&L</span></div>
            <div className={`text-lg font-bold font-mono mt-1 ${analytics.realizedPnL>=0?'text-emerald-400':'text-red-400'}`}>
              {analytics.realizedPnL>=0?'+':''}{sym}{Math.abs(analytics.realizedPnL).toFixed(2)}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-1.5 mb-2"><Activity size={13} className={analytics.unrealizedPnL>=0?'text-emerald-400':'text-red-400'}/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Unrealized P&L</span></div>
            <div className={`text-lg font-bold font-mono mt-1 ${analytics.unrealizedPnL>=0?'text-emerald-400':'text-red-400'}`}>
              {analytics.unrealizedPnL>=0?'+':''}{sym}{Math.abs(analytics.unrealizedPnL).toFixed(2)}
            </div>
            {openOrders.length>0 && Object.keys(livePrices).length===0 && <div className="text-[9px] text-gray-500 dark:text-slate-500 mt-0.5 animate-pulse">Fetching live prices…</div>}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-1.5 mb-2"><PieChart size={13} className="text-amber-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Brokerage Paid</span></div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {sym}{analytics.totalBrokerage.toFixed(2)}
            </div>
          </div>
        </div>

        {/* ── Monthly Capital Header ── */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1">Monthly Deposited</div>
              <div className="text-sm font-bold font-mono text-blue-400">
                {(() => {
                  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                  const currentMonthDepositsObj = monthlyDeposits[currentMonthKey] || { INR: 0, USD: 0 }
                  const currentMonthDeposited = isAllTab 
                    ? (allTabCurrency === 'INR' ? currentMonthDepositsObj.INR + currentMonthDepositsObj.USD * liveUsdInr : currentMonthDepositsObj.INR / liveUsdInr + currentMonthDepositsObj.USD)
                    : (isINRMarket ? currentMonthDepositsObj.INR : currentMonthDepositsObj.USD)
                  return `${sym}${currentMonthDeposited.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}`
                })()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1">Monthly Realized P&L</div>
              <div className="text-sm font-bold font-mono">
                {(() => {
                   let mpnl = 0
                   const prefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                   closedOrders.forEach(o => {
                     const dateStr = new Date(o.closedAt || o.timestamp).toISOString()
                     if (dateStr.startsWith(prefix)) {
                       let val = o.pnl || 0
                       if (isAllTab) {
                         const tickerIsINR = isINRTicker(o.ticker)
                         if (allTabCurrency === 'INR' && !tickerIsINR) val *= liveUsdInr
                         if (allTabCurrency === 'USD' && tickerIsINR)  val /= liveUsdInr
                       }
                       mpnl += val
                     }
                   })
                   return <span className={mpnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{mpnl >= 0 ? '+' : ''}{sym}{Math.abs(mpnl).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                })()}
              </div>
            </div>
          </div>
          <button onClick={handleAddMonthlyCapital} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all">
            <DollarSign size={14} /> Add Capital
          </button>
        </div>

        {/* ── CALENDAR COMPONENT (Always visible below tabs) ──────────────── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={()=>{const d=new Date(calYear,calMonth-1);setCalYear(d.getFullYear());setCalMonth(d.getMonth())}} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200"><ChevronLeft size={16}/></button>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-200">{MONTH_NAMES[calMonth]} {calYear}</h2>
            <button onClick={()=>{const d=new Date(calYear,calMonth+1);setCalYear(d.getFullYear());setCalMonth(d.getMonth())}} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200"><ChevronRight size={16}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
              <div key={d} className="text-center text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase pb-2">{d}</div>
            ))}
            {Array.from({length:calOffset}).map((_,i)=>(
              <div key={`e${i}`} className="min-h-[64px] rounded-lg bg-gray-50 dark:bg-slate-900/20 border border-gray-200 dark:border-slate-800/30"/>
            ))}
            {Array.from({length:calDaysInMonth}).map((_,i)=>{
              const day=i+1; const data=dailyData[day]
              const isToday=calYear===now.getFullYear()&&calMonth===now.getMonth()&&day===now.getDate()
              return (
                <div key={day} className={`min-h-[64px] p-2 rounded-lg border transition-colors ${isToday?'border-teal-500/50 bg-teal-500/5':'border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800/40 hover:border-slate-600'} ${data?(data.pnl>=0?'border-emerald-500/30 bg-emerald-500/5':'border-red-500/30 bg-red-500/5'):''}`}>
                  <span className={`text-xs font-bold ${isToday?'text-teal-400':'text-gray-600 dark:text-slate-400'}`}>{day}</span>
                  {data&&(
                    <div className="mt-1 space-y-0.5">
                      <div className={`text-[9px] px-1 py-0.5 rounded font-mono font-bold ${data.pnl>=0?'bg-emerald-500/15 text-emerald-400':'bg-red-500/15 text-red-400'}`}>
                        {data.pnl>=0?'+':''}{sym}{Math.abs(data.pnl).toFixed(0)}
                      </div>
                      <div className="text-[8px] text-gray-500 dark:text-slate-500">{data.count} trade{data.count>1?'s':''}</div>
                      {data.brokerage>0&&<div className="text-[8px] text-amber-600">fee:{sym}{data.brokerage.toFixed(0)}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Detailed Analytics */}
        <DetailedAnalysis trades={dashboardTrades} sym={sym} isAllTab={isAllTab} monthlyDeposits={monthlyDeposits} liveUsdInr={liveUsdInr} />
      </div>

      {/* ── Edit Order Modal ─────────────────────────────────────────────── */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">Edit — <span className="font-mono text-teal-400">{editingOrder.ticker}</span></h3>
              <button onClick={()=>setEditingOrder(null)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 p-1"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs text-red-400 mb-1">Stop Loss</label><input type="number" value={editSl} onChange={e=>setEditSl(e.target.value)} placeholder={editingOrder.sl?.toString()||'Not set'} className="input-dark w-full"/></div>
              <div><label className="block text-xs text-emerald-400 mb-1">Take Profit</label><input type="number" value={editTp} onChange={e=>setEditTp(e.target.value)} placeholder={editingOrder.tp?.toString()||'Not set'} className="input-dark w-full"/></div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>{editOrder(editingOrder.id,{sl:parseFloat(editSl)||editingOrder.sl,tp:parseFloat(editTp)||editingOrder.tp});setEditingOrder(null)}} className="btn-primary flex-1 py-2 text-sm">Save</button>
                <button onClick={()=>setEditingOrder(null)} className="flex-1 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:bg-slate-800">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Add Capital Modal ───────────────────────────────────────────── */}
      {showCapitalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
              <h3 className="text-gray-900 dark:text-slate-200 font-bold text-sm flex items-center gap-2">
                {(isAllTab ? modalCurrency === 'INR' : isINRMarket) ? <IndianRupee size={16} className="text-blue-400"/> : <DollarSign size={16} className="text-blue-400"/>} 
                Deposit Virtual Funds
              </h3>
              <button onClick={() => setShowCapitalModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 dark:text-slate-400">
                Enter the amount you wish to deposit to your <strong className="text-gray-900 dark:text-slate-200">{isAllTab ? `${modalCurrency} Capital` : `${activeMarket} Capital`}</strong>.
              </p>

              {isAllTab && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Currency:</span>
                  <button 
                    type="button" 
                    onClick={() => setModalCurrency('INR')}
                    className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all ${modalCurrency==='INR'?'bg-orange-500/20 text-orange-400 border-orange-500 shadow-sm':'border-gray-300 dark:border-slate-700 text-gray-500 hover:text-gray-800 dark:text-slate-400'}`}>
                    ₹ INR
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setModalCurrency('USD')}
                    className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all ${modalCurrency==='USD'?'bg-blue-500/20 text-blue-400 border-blue-500 shadow-sm':'border-gray-300 dark:border-slate-700 text-gray-500 hover:text-gray-800 dark:text-slate-400'}`}>
                    $ USD
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-gray-500 dark:text-slate-500 uppercase font-bold mb-1">
                  Amount ({(isAllTab ? modalCurrency === 'INR' : isINRMarket) ? '₹' : '$'})
                </label>
                <input 
                  type="number" 
                  value={capitalInput} 
                  onChange={(e) => setCapitalInput(e.target.value)} 
                  placeholder="e.g. 10000" 
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && submitCapital()}
                  className="input-dark w-full py-2.5 text-sm font-mono" 
                />
              </div>
              <button onClick={submitCapital} className="w-full btn-primary py-2.5 text-sm">
                Add Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Confirmation Modal ─────────────────────────────────────── */}
      {showResetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-gray-900 dark:text-slate-200 font-bold text-lg">Reset All Data?</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Are you sure you want to reset all P-Trade history and virtual capital to zero? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowResetModal(false)} className="flex-1 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmReset} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
