import { useState, useEffect } from 'react'
import {
  Building2, RefreshCw, AlertCircle, TrendingUp,
  TrendingDown, ExternalLink, Users, DollarSign,
  BarChart2, Shield, Layers, PieChart
} from 'lucide-react'

const API_BASE = 'http://localhost:8000'

const SUB_TABS = [
  { id: 'overview',       label: 'Overview',            icon: Building2 },
  { id: 'yearly_pnl',    label: 'Yearly P&L',          icon: TrendingUp },
  { id: 'quarterly_pnl', label: 'Quarterly P&L',        icon: BarChart2 },
  { id: 'balance',       label: 'Balance Sheet',        icon: Layers },
  { id: 'shareholding',  label: 'Shareholding',         icon: PieChart },
]

function fmtNum(v, decimals = 2) {
  if (v == null) return '—'
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(1)}T`
  if (Math.abs(v) >= 1e9)  return `${(v / 1e9).toFixed(1)}B`
  if (Math.abs(v) >= 1e6)  return `${(v / 1e6).toFixed(1)}M`
  if (Math.abs(v) >= 1e3)  return `${(v / 1e3).toFixed(1)}K`
  return (+v).toFixed(decimals)
}

function fmtPct(v) {
  if (v == null) return '—'
  return `${(v * 100).toFixed(2)}%`
}

function MetricRow({ label, value, subtext, positive, negative }) {
  const colorClass = positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-gray-900 dark:text-slate-200'
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-200 dark:border-slate-800/60 hover:bg-gray-100 dark:bg-slate-800/30 px-1 rounded transition-colors">
      <span className="text-xs text-gray-600 dark:text-slate-400">{label}</span>
      <div className="text-right">
        <span className={`text-xs font-semibold font-mono ${colorClass}`}>{value}</span>
        {subtext && <p className="text-[10px] text-slate-600">{subtext}</p>}
      </div>
    </div>
  )
}

function FinTable({ data, label }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart2 size={28} className="text-slate-700 mx-auto mb-2" />
        <p className="text-xs text-slate-600">{label} data not available for this ticker.</p>
      </div>
    )
  }

  // Get all column headers (excluding 'label')
  const allCols = Object.keys(data[0]).filter(k => k !== 'label')

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[520px] rounded-lg border border-gray-200 dark:border-slate-800 shadow-inner">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-20 bg-gray-100 dark:bg-slate-900 border-b border-gray-300 dark:border-slate-700 shadow-sm">
          <tr className="border-b border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-900">
            <th className="sticky top-0 left-0 z-30 bg-gray-100 dark:bg-slate-900 text-left py-3 px-3 text-gray-700 dark:text-slate-300 font-semibold min-w-[200px] border-b border-gray-300 dark:border-slate-700 shadow-[1px_0_0_0_rgba(148,163,184,0.1)]">
              {label}
            </th>
            {allCols.map(col => (
              <th key={col} className="sticky top-0 z-20 bg-gray-100 dark:bg-slate-900 text-right py-3 px-3 text-gray-700 dark:text-slate-300 font-semibold whitespace-nowrap border-b border-gray-300 dark:border-slate-700">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isProfit = row.label?.toLowerCase().includes('profit') || row.label?.toLowerCase().includes('income')
            const isNeg    = row.label?.toLowerCase().includes('expense') || row.label?.toLowerCase().includes('debt')
            return (
              <tr key={i} className="border-b border-gray-200 dark:border-slate-800/50 hover:bg-gray-100 dark:bg-slate-800/30 transition-colors group">
                <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-2.5 px-3 text-gray-800 dark:text-slate-300 font-medium whitespace-nowrap border-r border-gray-100 dark:border-slate-800/30 group-hover:bg-gray-100 dark:group-hover:bg-slate-800/60 shadow-[1px_0_0_0_rgba(148,163,184,0.1)]">
                  {row.label}
                </td>
                {allCols.map(col => {
                  const val = row[col]
                  const num = typeof val === 'number' ? val : parseFloat(val)
                  const isPos = !isNaN(num) && num >= 0 && (isProfit || row.label?.includes('Revenue'))
                  const isNg  = !isNaN(num) && num < 0
                  return (
                    <td key={col}
                      className={`py-2.5 px-3 text-right font-mono
                        ${isNg ? 'text-red-400' : isPos ? 'text-emerald-400' : 'text-gray-800 dark:text-slate-300'}`}>
                      {val == null ? '—' : typeof val === 'number' ? fmtNum(val) : val}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OverviewTab({ data }) {
  const ov = data.overview
  const cr = data.credit_rating

  const isCurrencyINR = ov.currency === 'INR'
  const sym = isCurrencyINR ? '₹' : '$'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

      {/* Company Info */}
      <div className="xl:col-span-2 space-y-4">

        {/* About card */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">{ov.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="badge-neutral">{ov.sector}</span>
                <span className="badge-neutral">{ov.industry}</span>
                <span className="badge-neutral">{ov.exchange}</span>
                {ov.website && (
                  <a href={ov.website} target="_blank" rel="noopener noreferrer"
                    className="badge-neutral hover:border-teal-500/40 hover:text-teal-400 transition-colors">
                    <ExternalLink size={10} /> Website
                  </a>
                )}
              </div>
              {ov.city && ov.country && (
                <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-1.5">📍 {ov.city}, {ov.country}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold
                ${cr.label === 'Highly Safe' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : cr.label === 'Moderate' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-red-500/15 border-red-500/40 text-red-400'}`}>
                <Shield size={13} />
                {cr.label}
                <span className="opacity-60 text-[10px]">({cr.score}/{cr.max_score})</span>
              </div>
              {ov.employees && (
                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-500">
                  <Users size={11} />
                  {(+ov.employees).toLocaleString()} employees
                </div>
              )}
            </div>
          </div>

          {ov.description && (
            <p className="text-[11px] text-gray-500 dark:text-slate-500 leading-relaxed border-t border-gray-200 dark:border-slate-800 pt-3">
              {ov.description}
              {ov.description.length >= 600 && '…'}
            </p>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Market Cap',      value: ov.market_cap  ? `${sym}${fmtNum(ov.market_cap)}` : '—' },
            { label: 'Current Price',   value: ov.current_price ? `${sym}${ov.current_price.toFixed(2)}` : '—' },
            { label: '52W High',        value: ov['52w_high']  ? `${sym}${ov['52w_high'].toFixed(2)}` : '—',  positive: true },
            { label: '52W Low',         value: ov['52w_low']   ? `${sym}${ov['52w_low'].toFixed(2)}` : '—',   negative: true },
            { label: 'Book Value',      value: ov.book_value   ? `${sym}${ov.book_value.toFixed(2)}` : '—' },
            { label: 'EPS (TTM)',       value: ov.eps          ? `${sym}${ov.eps.toFixed(2)}` : '—' },
          ].map(m => (
            <div key={m.label} className="card p-4 border border-gray-300 dark:border-slate-700">
              <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-lg font-bold font-mono ${m.positive ? 'text-emerald-400' : m.negative ? 'text-red-400' : 'text-slate-100'}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right column — Valuation & Ratios */}
      <div className="space-y-4">
        <div className="card p-5">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-3">
            Valuation Ratios
          </h4>
          <div className="divide-y divide-slate-800/60">
            <MetricRow label="P/E Ratio"       value={ov.pe_ratio    ? ov.pe_ratio.toFixed(2) : '—'}
              positive={ov.pe_ratio && ov.pe_ratio < 25} negative={ov.pe_ratio && ov.pe_ratio > 50} />
            <MetricRow label="P/B Ratio"       value={ov.pb_ratio    ? ov.pb_ratio.toFixed(2) : '—'}
              positive={ov.pb_ratio && ov.pb_ratio < 3} />
            <MetricRow label="Debt/Equity"     value={ov.debt_to_equity != null ? ov.debt_to_equity.toFixed(2) : '—'}
              positive={ov.debt_to_equity != null && ov.debt_to_equity < 1}
              negative={ov.debt_to_equity != null && ov.debt_to_equity > 2} />
            <MetricRow label="ROE"             value={fmtPct(ov.roe)}
              positive={ov.roe > 0.15} negative={ov.roe < 0} />
            <MetricRow label="Profit Margin"   value={fmtPct(ov.profit_margin)}
              positive={ov.profit_margin > 0.15} negative={ov.profit_margin < 0} />
            <MetricRow label="Revenue Growth"  value={fmtPct(ov.revenue_growth)}
              positive={ov.revenue_growth > 0.1} negative={ov.revenue_growth < 0} />
            <MetricRow label="Dividend Yield"  value={ov.dividend_yield ? fmtPct(ov.dividend_yield) : '—'} />
            <MetricRow label="Face Value"      value={ov.face_value ? `${sym}${ov.face_value}` : '—'} />
          </div>
        </div>

        {/* Score bar */}
        <div className="card p-4 border border-gray-300 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 dark:text-slate-400">Health Score</span>
            <span className="font-mono text-sm font-bold text-teal-400">{cr.score}/8</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700
                ${cr.score >= 6 ? 'bg-emerald-500' : cr.score >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${(cr.score / 8) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-2">Based on D/E, ROE, Profit Margin, Revenue Growth</p>
        </div>
      </div>
    </div>
  )
}

function ShareholdingTab({ holders }) {
  const major   = holders?.major   || []
  const inst    = holders?.institutional || []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Major Holders */}
      <div className="card p-5">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <PieChart size={13} className="text-teal-400" /> Major Holders
        </h4>
        {major.length === 0 ? (
          <p className="text-xs text-slate-600">No data available</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {major.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <span className="text-xs text-gray-600 dark:text-slate-400">{h.label}</span>
                <span className="font-mono text-xs font-semibold text-gray-900 dark:text-slate-200">{h.value ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Institutional Holders */}
      <div className="card p-5">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 size={13} className="text-teal-400" /> Top Institutional Holders
        </h4>
        {inst.length === 0 ? (
          <p className="text-xs text-slate-600">No institutional data available for this ticker.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {inst.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 gap-3">
                <span className="text-xs text-gray-600 dark:text-slate-400 truncate flex-1">{h.holder}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-[10px] text-gray-500 dark:text-slate-500">{h.shares ? fmtNum(h.shares) : '—'}</span>
                  <span className="font-mono text-xs font-semibold text-teal-400">{h.pct_out ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DeepFundamentals({ activeTicker }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [subTab, setSubTab]   = useState('overview')

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/fundamentals/${activeTicker}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [activeTicker])

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-slate-900/70 border-b border-gray-200 dark:border-slate-800 flex-shrink-0 overflow-x-auto no-scrollbar">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`fund-tab-${id}`}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                        transition-all duration-150 flex-shrink-0
              ${subTab === id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                : 'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300 hover:bg-gray-100 dark:bg-slate-800'
              }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}

        <button
          onClick={fetchData}
          disabled={loading}
          className="ml-auto btn-ghost p-1.5 flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-teal-400' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-slate-950">

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="spinner" style={{ width: 28, height: 28 }} />
            <span className="text-sm text-gray-500 dark:text-slate-500">Loading fundamentals for {activeTicker}…</span>
          </div>
        )}

        {error && !loading && (
          <div className="card p-6 border border-red-500/30 flex items-center gap-4 max-w-lg mx-auto">
            <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">Failed to load fundamentals</p>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{error}</p>
            </div>
            <button onClick={fetchData} className="btn-secondary text-xs">Retry</button>
          </div>
        )}

        {data && !loading && (
          <div className="animate-fade-in">
            {subTab === 'overview' && <OverviewTab data={data} />}
            {subTab === 'yearly_pnl' && (
              <div className="card p-5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-4">Annual Profit & Loss Statement</h4>
                <FinTable data={data.yearly_pnl} label="Metric" />
              </div>
            )}
            {subTab === 'quarterly_pnl' && (
              <div className="card p-5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-4">Quarterly Profit & Loss Statement</h4>
                <FinTable data={data.quarterly_pnl} label="Metric" />
              </div>
            )}
            {subTab === 'balance' && (
              <div className="space-y-5">
                <div className="card p-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-4">Annual Balance Sheet</h4>
                  <FinTable data={data.balance_sheet} label="Item" />
                </div>
                {data.quarterly_balance?.length > 0 && (
                  <div className="card p-5">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-4">Quarterly Balance Sheet</h4>
                    <FinTable data={data.quarterly_balance} label="Item" />
                  </div>
                )}
              </div>
            )}
            {subTab === 'shareholding' && (
              <ShareholdingTab holders={data.holders} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
