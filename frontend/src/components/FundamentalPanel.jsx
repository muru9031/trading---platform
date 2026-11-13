import { useState, useEffect } from 'react'
import {
  Shield, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, BarChart2, DollarSign, Building2,
  Globe, RefreshCw, AlertCircle
} from 'lucide-react'

const API_BASE = 'http://localhost:8000'

function MetricCard({ label, value, sub, color = 'neutral', icon: Icon }) {
  const colors = {
    green:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    red:     'text-red-400     bg-red-500/10     border-red-500/30',
    yellow:  'text-amber-400   bg-amber-500/10   border-amber-500/30',
    neutral: 'text-gray-600 dark:text-slate-400   bg-gray-100 dark:bg-slate-800      border-gray-300 dark:border-slate-700',
  }

  return (
    <div className={`card p-4 flex items-center gap-3 border ${colors[color]}`}>
      {Icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon size={16} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-bold font-mono ${colors[color].split(' ')[0]}`}>{value ?? '—'}</p>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function RatingBadge({ rating }) {
  if (!rating) return null
  const map = {
    'Highly Safe': { cls: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', icon: CheckCircle },
    'Moderate':    { cls: 'bg-amber-500/20   border-amber-500/50   text-amber-400',   icon: AlertTriangle },
    'Risky':       { cls: 'bg-red-500/20     border-red-500/50     text-red-400',     icon: XCircle },
  }
  const cfg = map[rating.label] || map['Moderate']
  const Icon = cfg.icon

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${cfg.cls}`}>
      <Icon size={16} />
      {rating.label}
      <span className="text-xs opacity-70">({rating.score}/{rating.max_score})</span>
    </div>
  )
}

function ScoreBar({ value, max, color }) {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0
  const cls = {
    green: 'bg-emerald-500',
    red:   'bg-red-500',
    amber: 'bg-amber-500',
  }[color] || 'bg-slate-500'

  return (
    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${cls}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function FundamentalPanel({ activeTicker }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const fetchFundamentals = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/fundamentals/${activeTicker}`)
      if (!res.ok) throw new Error((await res.json()).detail || `HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFundamentals() }, [activeTicker])

  const fmt = (v, isPercent = false, decimals = 2) => {
    if (v == null) return '—'
    const n = isPercent ? (v * 100).toFixed(decimals) + '%' : v.toFixed(decimals)
    return n
  }

  const fmtCap = (v) => {
    if (!v) return '—'
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`
    if (v >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`
    return `$${v}`
  }

  const m = data?.metrics || {}

  const deColor = m.debt_to_equity != null
    ? (m.debt_to_equity < 1 ? 'green' : m.debt_to_equity < 2 ? 'yellow' : 'red')
    : 'neutral'

  const roeColor = m.roe != null
    ? (m.roe > 0.15 ? 'green' : m.roe > 0.05 ? 'yellow' : 'red')
    : 'neutral'

  const pmColor = m.profit_margin != null
    ? (m.profit_margin > 0.15 ? 'green' : m.profit_margin > 0.05 ? 'yellow' : 'red')
    : 'neutral'

  const revColor = m.revenue_growth != null
    ? (m.revenue_growth > 0.1 ? 'green' : m.revenue_growth > 0 ? 'yellow' : 'red')
    : 'neutral'

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 size={20} className="text-teal-400" />
            Fundamental Intelligence
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
            Algorithmic credit rating for <span className="font-mono text-teal-400">{activeTicker}</span>
          </p>
        </div>
        <button
          id="fundamentals-refresh-btn"
          onClick={fetchFundamentals}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 text-xs"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <span className="text-xs text-gray-500 dark:text-slate-500">Analyzing fundamentals…</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="card p-6 border border-red-500/30 flex items-center gap-4">
          <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Failed to load fundamentals</p>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{error}</p>
          </div>
          <button onClick={fetchFundamentals} className="btn-secondary text-xs ml-auto">Retry</button>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Company Header */}
          <div className="card p-5 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">{data.name}</h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="badge-neutral">{data.sector || 'N/A'}</span>
                <span className="badge-neutral">{data.industry || 'N/A'}</span>
                <span className="badge-neutral">{data.currency}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">Market Cap: <span className="text-gray-800 dark:text-slate-300 font-semibold">{fmtCap(data.market_cap)}</span></p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Algorithmic Credit Rating</p>
              <RatingBadge rating={data.credit_rating} />
              <ScoreBar
                value={data.credit_rating?.score}
                max={data.credit_rating?.max_score || 8}
                color={data.credit_rating?.label === 'Highly Safe' ? 'green' : data.credit_rating?.label === 'Moderate' ? 'amber' : 'red'}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <MetricCard
              label="P/E Ratio"
              value={fmt(m.pe_ratio)}
              sub="Price to Earnings"
              color={m.pe_ratio != null ? (m.pe_ratio < 25 ? 'green' : m.pe_ratio < 50 ? 'yellow' : 'red') : 'neutral'}
              icon={BarChart2}
            />
            <MetricCard
              label="P/B Ratio"
              value={fmt(m.pb_ratio)}
              sub="Price to Book"
              color={m.pb_ratio != null ? (m.pb_ratio < 3 ? 'green' : m.pb_ratio < 6 ? 'yellow' : 'red') : 'neutral'}
              icon={DollarSign}
            />
            <MetricCard
              label="Debt / Equity"
              value={fmt(m.debt_to_equity)}
              sub={m.debt_to_equity < 1 ? '✓ Low leverage' : 'High leverage risk'}
              color={deColor}
              icon={Shield}
            />
            <MetricCard
              label="Return on Equity"
              value={fmt(m.roe, true)}
              sub={m.roe > 0.15 ? '✓ Strong returns' : 'Below benchmark'}
              color={roeColor}
              icon={TrendingUp}
            />
            <MetricCard
              label="Profit Margin"
              value={fmt(m.profit_margin, true)}
              sub="Net profit margin"
              color={pmColor}
              icon={CheckCircle}
            />
            <MetricCard
              label="Revenue Growth"
              value={fmt(m.revenue_growth, true)}
              sub="YoY growth rate"
              color={revColor}
              icon={m.revenue_growth >= 0 ? TrendingUp : TrendingDown}
            />
          </div>

          {/* Rating Explanation */}
          <div className="card p-5 border border-gray-300 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Shield size={14} className="text-teal-400" /> Rating Methodology
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500 dark:text-slate-500">
              {[
                ['Debt/Equity < 1',      '+2 pts — Low leverage'],
                ['Debt/Equity 1–2',      '+1 pt  — Moderate leverage'],
                ['ROE > 15%',            '+2 pts — Strong returns'],
                ['ROE 8–15%',            '+1 pt  — Acceptable returns'],
                ['Profit Margin > 15%',  '+2 pts — High profitability'],
                ['Revenue Growth > 10%', '+2 pts — Strong growth'],
              ].map(([cond, pts]) => (
                <div key={cond} className="flex items-baseline justify-between gap-2 py-1 border-b border-gray-200 dark:border-slate-800">
                  <span className="text-gray-600 dark:text-slate-400">{cond}</span>
                  <span className="text-slate-600 font-mono text-[10px]">{pts}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-3">
              Score ≥ 6 → <span className="text-emerald-600">Highly Safe</span> &nbsp;|&nbsp;
              Score 3–5 → <span className="text-amber-600">Moderate</span> &nbsp;|&nbsp;
              Score &lt; 3 → <span className="text-red-600">Risky</span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
