import AssetLogo from '../components/AssetLogo.jsx'
import { useState, useEffect, useMemo } from 'react'
import {
  Briefcase, Wallet, TrendingUp, DollarSign, PieChart, Calendar,
  X, Trash2, Edit2, IndianRupee, RefreshCw, ChevronLeft, ChevronRight, PlusCircle, Link as LinkIcon, Activity, UploadCloud, Image
} from 'lucide-react'
import DetailedAnalysis from '../components/DetailedAnalysis.jsx'
import BrokerConnectModal from '../components/BrokerConnectModal.jsx'
import LivePositionsTable from '../components/LivePositionsTable.jsx'
import LogTradesModal from '../components/LogTradesModal.jsx'
import TradeHistoryTable from '../components/TradeHistoryTable.jsx'
import OverviewTab from '../components/OverviewTab.jsx'
import MonthlyAnalysisTab from '../components/MonthlyAnalysisTab.jsx'
import Papa from 'papaparse'
import { TICKER_MAP, TICKER_DETAILS } from '../utils/tickerMap.js'
import { isINRTicker, usePortfolio } from '../contexts/PortfolioContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'

const API_BASE = 'http://localhost:8000'
const CATEGORIES = ['All', 'Indian Market', 'US Market', 'Forex', 'Crypto', 'Commodity']
const USD_TO_INR = 84.5 // Fallback rate

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function matchesMarket(ticker, tab) {
  const t = ticker || ''
  if (tab === 'All')           return true
  if (tab === 'Indian Market') return isINRTicker(t)
  if (tab === 'US Market')     return !isINRTicker(t) && !t.includes('=X') && !t.includes('-USD') && !t.endsWith('=F')
  if (tab === 'Forex')         return t.includes('=X')
  if (tab === 'Crypto')        return t.includes('-USD')
  if (tab === 'Commodity')     return t.endsWith('=F')
  return true
}

export default function PortfolioPage() {
  const { showToast } = useToast()
  const [category, setCategory] = useState('All')
  const [liveUsdInr, setLiveUsdInr] = useState(USD_TO_INR)
  
  // User Capital State (Global)
  const [capitalINR, setCapitalINR] = useState(() => parseFloat(localStorage.getItem('st_real_cap_inr') || '0'))
  const [capitalUSD, setCapitalUSD] = useState(() => parseFloat(localStorage.getItem('st_real_cap_usd') || '0'))

  // Monthly Capital Injection State: { "YYYY-MM": { INR: 10000, USD: 2000 } }
  const [monthlyDeposits, setMonthlyDeposits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('st_monthly_deposits') || '{}') }
    catch { return {} }
  })

  // All-tab INR/USD view toggle
  const [allTabCurrency, setAllTabCurrency] = useState('INR')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDateStr, setSelectedDateStr] = useState(null)
  const [dayTrades, setDayTrades] = useState([])

  // Modals State
  const [showCapitalModal, setShowCapitalModal] = useState(false)
  const [capitalInput, setCapitalInput] = useState('')
  const [showZeroCapitalModal, setShowZeroCapitalModal] = useState(false)

  // Calendar State
  const now = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  // Broker Sync State
  const { livePositions, syncBrokers, journalEntries, saveJournalTrades, bulkImportTrades, connectedBrokers } = usePortfolio()
  const isBrokerConnected = Object.values(connectedBrokers || {}).some(b => b.connected);
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { localStorage.setItem('st_real_cap_inr', capitalINR) }, [capitalINR])
  useEffect(() => { localStorage.setItem('st_real_cap_usd', capitalUSD) }, [capitalUSD])
  useEffect(() => { localStorage.setItem('st_monthly_deposits', JSON.stringify(monthlyDeposits)) }, [monthlyDeposits])

  useEffect(() => {
    fetch(`${API_BASE}/api/latest-price/USDINR%3DX`)
      .then(r => r.json())
      .then(d => { if (d?.close) setLiveUsdInr(d.close) })
      .catch(() => {})
  }, [])

  // ── Derive currency based on active tab ──────────────────────────────────
  const isINRMarket = category === 'Indian Market' || category === 'Commodity'
  const isAllTab    = category === 'All'
  const sym         = isAllTab ? (allTabCurrency === 'INR' ? '₹' : '$') : (isINRMarket ? '₹' : '$')
  const baseCapital = isINRMarket ? capitalINR : capitalUSD

  const allCapital = allTabCurrency === 'INR'
    ? capitalINR + capitalUSD * liveUsdInr
    : capitalINR / liveUsdInr + capitalUSD

  const displayCapital = isAllTab ? allCapital : baseCapital

  const resetAll = () => {
    if (window.confirm('Reset ALL Real Portfolio history, capital, and deposits?')) {
      // Note: Clearing journal via API context would be ideal
      setCapitalINR(0)
      setCapitalUSD(0)
      setMonthlyDeposits({})
    }
  }

  // ── Analytics for Top Cards ──────────────────────────────────────────────
  const analytics = useMemo(() => {
    let totalTradesCount = 0
    let netProfit = 0
    let brokeragePaid = 0

    Object.keys(journalEntries.real || {}).forEach(dateStr => {
      const trades = (journalEntries.real || {})[dateStr]
      const filtered = isAllTab ? trades : trades.filter(t => (t.market || 'Indian Market') === category)

      filtered.forEach(t => {
        let pnl = (t.netPnl !== undefined && t.netPnl !== "" && t.netPnl !== null) ? parseFloat(t.netPnl) : ((parseFloat(t.exit) || 0) - (parseFloat(t.entry) || 0)); pnl -= (parseFloat(t.brokerage) || 0)
        let tSym = t.market === 'US Market' ? '$' : '₹'
        
        // Convert to common currency if on All tab
        if (isAllTab) {
          if (allTabCurrency === 'INR' && tSym === '$') pnl *= liveUsdInr
          if (allTabCurrency === 'USD' && tSym === '₹') pnl /= liveUsdInr
        }

        if (pnl !== 0) {
          totalTradesCount++
          netProfit += pnl
        }
      })
    })

    // Brokerage calculation (approx 20 INR or 2 USD per trade depending on market)
    if (isAllTab) {
      brokeragePaid = totalTradesCount * (allTabCurrency === 'INR' ? 20 : 1.5)
    } else {
      brokeragePaid = totalTradesCount * (isINRMarket ? 20 : 1.5)
    }

    return { totalTradesCount, netProfit, brokeragePaid }
  }, [journalEntries, category, isAllTab, allTabCurrency, isINRMarket, liveUsdInr])

  const capitalBalance = displayCapital + analytics.netProfit

  // Dashboard Data Prep for Detailed Analysis
  const dashboardTrades = useMemo(() => {
    let allTrades = []
    Object.keys(journalEntries.real || {}).forEach(dateStr => {
      const trades = (journalEntries.real || {})[dateStr]
      const filtered = isAllTab ? trades : trades.filter(t => (t.market || 'Indian Market') === category)
      
      // Extract year, month, day from dateStr
      const [y, m, d] = dateStr.split('-').map(Number);

      filtered.forEach(t => {
        let pnl = (t.netPnl !== undefined && t.netPnl !== "" && t.netPnl !== null) ? parseFloat(t.netPnl) : ((parseFloat(t.exit) || 0) - (parseFloat(t.entry) || 0)); pnl -= (parseFloat(t.brokerage) || 0)
        let tSym = t.market === 'US Market' ? '$' : '₹'
        if (isAllTab) {
          if (allTabCurrency === 'INR' && tSym === '$') pnl *= liveUsdInr
          if (allTabCurrency === 'USD' && tSym === '₹') pnl /= liveUsdInr
        }
        
        // Parse time if provided, otherwise default to 15:00
        let hours = 15;
        let mins = 0;
        if (t.time) {
          const parts = t.time.split(':');
          if (parts.length === 2) {
            hours = parseInt(parts[0]);
            mins = parseInt(parts[1]);
          }
        }
        
        // month is 0-indexed in Date constructor
        const timestamp = new Date(y, m - 1, d, hours, mins, 0).toISOString()
        allTrades.push({ ...t, pnl, timestamp })
      })
    })
    return allTrades
  }, [journalEntries, category, isAllTab, allTabCurrency, liveUsdInr])

  // ── Monthly Analytics (For Calendar Header) ──────────────────────────────
  const currentMonthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
  const currentMonthDepositsObj = monthlyDeposits[currentMonthKey] || { INR: 0, USD: 0 }
  const currentMonthDeposited = isAllTab 
    ? (allTabCurrency === 'INR' ? currentMonthDepositsObj.INR + currentMonthDepositsObj.USD * liveUsdInr : currentMonthDepositsObj.INR / liveUsdInr + currentMonthDepositsObj.USD)
    : (isINRMarket ? currentMonthDepositsObj.INR : currentMonthDepositsObj.USD)

  // Calculate Monthly P&L
  const monthlyPnl = useMemo(() => {
    let pnl = 0
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
    Object.keys(journalEntries.real || {}).forEach(dateStr => {
      if (dateStr.startsWith(prefix)) {
        const trades = (journalEntries.real || {})[dateStr]
        const filtered = isAllTab ? trades : trades.filter(t => (t.market || 'Indian Market') === category)
        filtered.forEach(t => {
          let p = (t.netPnl !== undefined && t.netPnl !== "" && t.netPnl !== null) ? parseFloat(t.netPnl) : ((parseFloat(t.exit) || 0) - (parseFloat(t.entry) || 0)); p -= (parseFloat(t.brokerage) || 0)
          let tSym = t.market === 'US Market' ? '$' : '₹'
          if (isAllTab) {
            if (allTabCurrency === 'INR' && tSym === '$') p *= liveUsdInr
            if (allTabCurrency === 'USD' && tSym === '₹') p /= liveUsdInr
          }
          pnl += p
        })
      }
    })
    return pnl
  }, [journalEntries, category, isAllTab, allTabCurrency, liveUsdInr, calYear, calMonth])

  const handleAddMonthlyCapital = () => {
    if (isAllTab) {
      showToast("Please select a specific market (e.g., Indian Market or US Market) to add capital.", "error");
      return;
    }
    setShowCapitalModal(true);
  }

  const submitCapital = () => {
    const val = parseFloat(capitalInput)
    if (!isNaN(val) && val > 0) {
      setMonthlyDeposits(prev => {
        const existing = prev[currentMonthKey] || { INR: 0, USD: 0 }
        return {
          ...prev,
          [currentMonthKey]: {
            ...existing,
            ...(isINRMarket ? { INR: existing.INR + val } : { USD: existing.USD + val })
          }
        }
      })
      if (isINRMarket) setCapitalINR(prev => prev + val)
      else setCapitalUSD(prev => prev + val)
    }
    setShowCapitalModal(false)
    setCapitalInput('')
  }

  // ── Modals ───────────────────────────────────────────────────────────────
  const handleDayClick = (dateStr) => {
    if (isAllTab) return // Read-only on All tab
    setSelectedDateStr(dateStr)
    const existingEntry = (journalEntries.real || {})[dateStr]
    if (existingEntry) {
      setDayTrades(existingEntry.map(t => ({
        ...t,
        pnlType: (parseFloat(t.netPnl) || 0) < 0 ? 'Loss' : 'Profit',
        pnlAmount: Math.abs(parseFloat(t.netPnl) || 0)
      })))
    } else {
      setDayTrades([{ id: Date.now().toString(), asset: '', pnlType: 'Profit', pnlAmount: '', brokerage: '', qty: '', entryPrice: '', exitPrice: '', time: '', mistakeTag: '', strategyNotes: '' }])
    }
    setIsModalOpen(true)
  }

  const handleAddTrade = () => {
    setDayTrades([...dayTrades, { id: Date.now().toString(), asset: '', pnlType: 'Profit', pnlAmount: '', brokerage: '', qty: '', entryPrice: '', exitPrice: '', time: '', mistakeTag: '', strategyNotes: '' }])
  }

  const handleRemoveTrade = (id) => setDayTrades(dayTrades.filter(t => t.id !== id))
  const handleTradeChange = (id, field, value) => setDayTrades(dayTrades.map(t => t.id === id ? { ...t, [field]: value } : t))

  const saveEntry = async (dateStr, submittedTrades) => {
    // Zero Capital Enforcement
    if (capitalBalance <= 0) {
      setShowZeroCapitalModal(true)
      return;
    }

    const activeDate = dateStr || selectedDateStr;
    const activeTrades = submittedTrades || dayTrades;

    const valid = activeTrades.every(t => t.asset && t.pnlAmount !== undefined && t.pnlAmount !== '' && parseFloat(t.pnlAmount) >= 0)
    if (!valid) {
      showToast('Please fill out Asset and P&L Amount (must be positive) for all trades.', 'error')
      return
    }

    const cleaned = activeTrades.map(t => {
      const amt = parseFloat(t.pnlAmount) || 0
      const netPnlVal = t.pnlType === 'Loss' ? -Math.abs(amt) : Math.abs(amt)

      // Legacy ticker validation removed because AssetSearchSelect enforces database validity

      // Extract y, m, d to enforce proper ISO string parsing
      const [y, m, d] = activeDate.split('-').map(Number);
      
      let hours = 15;
      let mins = 0;
      if (t.time) {
        const parts = t.time.split(':');
        if (parts.length === 2) {
          hours = parseInt(parts[0]);
          mins = parseInt(parts[1]);
        }
      }

      return {
        ...t,
        netPnl: netPnlVal,
        brokerage: parseFloat(t.brokerage) || 0,
        qty: t.qty || '',
        entryPrice: t.entryPrice || '',
        exitPrice: t.exitPrice || '',
        mistakeTag: t.mistakeTag || '',
        strategyNotes: t.strategyNotes || '',
        source: t.source || undefined,
        timestamp: t.timestamp || new Date(y, m - 1, d, hours, mins, 0).toISOString(),
        market: category // Enforce current active tab market
      }
    }).filter(t => t !== null)

    await saveJournalTrades(activeDate, cleaned)
    setIsModalOpen(false)
  }

  const handleScreenshotUpload = (id, file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast("Please upload a valid image file.", "error");
      return;
    }
    
    // Simulate uploading state
    handleTradeChange(id, 'isUploading', true);
    
    // Mock Cloudinary Upload
    setTimeout(() => {
      const mockUrl = `https://res.cloudinary.com/demo/image/upload/v1/${Math.random().toString(36).substr(2, 9)}/${file.name}`;
      setDayTrades(prev => prev.map(t => t.id === id ? { ...t, screenshot_url: mockUrl, isUploading: false } : t));
      showToast("Screenshot attached successfully!", "success");
    }, 2000);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      showToast("Please upload a valid CSV file.", "error");
      return;
    }
    
    showToast("Parsing CSV...", "info");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const grouped = {};
          results.data.forEach(row => {
            const d = row['Date'] || row['date'] || selectedDateStr || new Date().toISOString().split('T')[0];
            if (!grouped[d]) grouped[d] = [];
            
            const pnlVal = parseFloat(row['P&L'] || row['pnl'] || row['netPnl'] || '0');
            grouped[d].push({
              id: Date.now().toString() + Math.random(),
              asset: row['Asset'] || row['asset'] || 'UNKNOWN',
              market: category,
              pnlType: pnlVal >= 0 ? 'Profit' : 'Loss',
              pnlAmount: Math.abs(pnlVal).toString(),
              brokerage: row['Brokerage'] || row['brokerage'] || '0',
              qty: row['Qty'] || row['qty'] || '',
              entryPrice: row['Entry'] || row['entry'] || '',
              exitPrice: row['Exit'] || row['exit'] || '',
              time: row['Time'] || row['time'] || '',
              mistakeTag: row['Mistake'] || row['mistake'] || '',
              strategyNotes: row['Notes'] || row['notes'] || ''
            });
          });
          
          await bulkImportTrades(grouped);
        } catch (err) {
          showToast("Failed to process CSV data: " + err.message, "error");
        }
        e.target.value = null; // reset input
      },
      error: (error) => {
        showToast("Error parsing CSV: " + error.message, "error");
      }
    });
  };

  // Calendar Logic
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const calFirstDay    = new Date(calYear, calMonth, 1).getDay()
  const calOffset      = calFirstDay === 0 ? 6 : calFirstDay - 1

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      
      {/* Header & Market Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-200 flex items-center gap-2">
            <Briefcase className="text-blue-500" /> Portfolio (Real Money Journal)
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">Manual trading journal & auto-synced broker positions.</p>
        </div>
        <button onClick={resetAll} className="text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1">
          <RefreshCw size={11}/> Reset All
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-500 mr-2">Filters:</span>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                category === cat 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}>
              {cat}
            </button>
          ))}
        </div>
        {(activeTab === 'overview' || activeTab === 'monthly') && (
          <div className="flex gap-2 relative">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg transition-colors cursor-pointer">
              <UploadCloud size={14} /> Bulk CSV Auto-Entry
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            </label>
            <button onClick={() => setShowBrokerModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors">
              <Activity size={14} /> Connect Brokers
            </button>
            {!isAllTab && !isBrokerConnected && (
              <button onClick={() => {
                  const today = new Date();
                  handleDayClick(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);
                }} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
              >
                <PlusCircle size={14} /> Add Trade
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Scrollable Content Area ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Top 4 Financial Cards (GLOBAL) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Wallet size={13} className="text-emerald-400"/><span className="text-[10px] text-emerald-500 dark:text-emerald-400 uppercase tracking-wider font-bold">Global Capital Balance</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {sym}{capitalBalance.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><DollarSign size={13} className="text-blue-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Global Base Capital</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-blue-400 mt-1">
              {sym}{displayCapital.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
            {isAllTab && <div className="text-[9px] text-slate-600 mt-0.5">Combined across all markets</div>}
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-1.5 mb-2"><TrendingUp size={13} className={analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Global Net Profit</span></div>
            <div className={`text-lg font-bold font-mono mt-1 ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {analytics.netProfit >= 0 ? '+' : ''}{sym}{Math.abs(analytics.netProfit).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-1.5 mb-2"><PieChart size={13} className="text-amber-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Brokerage Paid</span></div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {sym}{analytics.brokeragePaid.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>
        </div>

        {/* Sub Tabs Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 mb-6 mt-2">
          {['overview', 'monthly', 'detailed', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {tab === 'overview' ? 'Overview & Calendar' : tab === 'monthly' ? 'Monthly Analysis' : tab === 'detailed' ? 'Detailed Analysis' : 'Trade History'}
            </button>
          ))}
        </div>

        {/* Tab Content Areas */}
        {activeTab === 'overview' && (
          <div className="mt-4">
            <OverviewTab 
              trades={dashboardTrades} 
              sym={sym} 
              monthlyDeposits={monthlyDeposits}
              calYear={calYear}
              calMonth={calMonth}
              setCalYear={setCalYear}
              setCalMonth={setCalMonth}
              handleDayClick={handleDayClick}
              isAllTab={isAllTab}
              category={category}
              liveUsdInr={liveUsdInr}
              allTabCurrency={allTabCurrency}
              currentMonthDeposited={currentMonthDeposited}
              monthlyPnl={monthlyPnl}
              journalEntries={journalEntries}
            />
          </div>
        )}
        
                {/* Monthly Analysis Micro-Journal */}
        {activeTab === 'monthly' && (
          <div className="mt-4">
            <MonthlyAnalysisTab trades={dashboardTrades} sym={sym} monthlyDeposits={monthlyDeposits} />
          </div>
        )}


        {/* Detailed Analytics */}
        {activeTab === 'detailed' && (
          <DetailedAnalysis trades={dashboardTrades} sym={sym} isAllTab={isAllTab} monthlyDeposits={monthlyDeposits} liveUsdInr={liveUsdInr} />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <TradeHistoryTable trades={dashboardTrades} sym={sym} />
        )}
      </div>

      {/* Manual Entry Modal */}
      <LogTradesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDateStr={selectedDateStr}
        dayTrades={dayTrades}
        onTradeChange={handleTradeChange}
        onAddTrade={handleAddTrade}
        onRemoveTrade={handleRemoveTrade}
        onClearAll={() => {
            if(window.confirm('Clear all trades for this day?')) {
               saveJournalTrades(selectedDateStr, [], 'real');
               setIsModalOpen(false);
            }
        }}
        onSave={saveEntry}
        category={category}
        portfolioType="real"
      />
      {/* ── Add Capital Modal ───────────────────────────────────────────── */}
      {showCapitalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
              <h3 className="text-gray-900 dark:text-slate-200 font-bold text-sm flex items-center gap-2">
                {sym === '₹' ? <IndianRupee size={16} className="text-blue-400"/> : <DollarSign size={16} className="text-blue-400"/>} Deposit Real Funds
              </h3>
              <button onClick={() => setShowCapitalModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 dark:text-slate-400">
                Enter the amount you wish to add to your <strong className="text-gray-900 dark:text-slate-200">{category}</strong> account for {MONTH_NAMES[calMonth]} {calYear}.
              </p>
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-slate-500 uppercase font-bold mb-1">Amount ({sym})</label>
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

      {/* ── Zero Capital Alert Modal ──────────────────────────────────────── */}
      {showZeroCapitalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                <Wallet size={24} />
              </div>
              <h3 className="text-gray-900 dark:text-slate-200 font-bold text-lg">Insufficient Funds</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Your available capital is <strong className="text-gray-900 dark:text-slate-200">0</strong>. Please deposit money by clicking the "Add Capital" button before executing trades.
              </p>
              <button onClick={() => setShowZeroCapitalModal(false)} className="w-full bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broker Auto Sync Hub Modal */}
      <BrokerConnectModal 
        isOpen={showBrokerModal} 
        onClose={() => setShowBrokerModal(false)}
        onSync={() => syncBrokers()}
        activeCategory={category}
      />
    </div>
  )
}
