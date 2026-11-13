import { useState, useCallback } from 'react'
import {
  Calculator, AlertTriangle, TrendingDown, Shield,
  Target, BookOpen, CheckCircle, XCircle, AlertOctagon
} from 'lucide-react'

const INITIAL_PLAN = {
  dailyMaxLoss: 2000,
  maxTrades: 3,
  maxRiskPerTrade: 2,
}

function InputField({ label, value, onChange, prefix, suffix, id, min, max, step = '1', helperText }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 dark:text-slate-500 text-sm font-medium">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`input-dark w-full ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 dark:text-slate-500 text-xs">{suffix}</span>
        )}
      </div>
      {helperText && <p className="text-[10px] text-slate-600 mt-1">{helperText}</p>}
    </div>
  )
}

function ResultCard({ label, value, color = 'teal', sub }) {
  const cls = {
    teal:   'text-teal-400   bg-teal-500/10   border-teal-500/30',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber:  'text-amber-400  bg-amber-500/10  border-amber-500/30',
    red:    'text-red-400    bg-red-500/10    border-red-500/30',
  }[color]

  return (
    <div className={`card p-4 border ${cls}`}>
      <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${cls.split(' ')[0]}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  )
}

export default function RiskCalculator() {
  // Position Sizing
  const [capital, setCapital]   = useState(0)
  const [riskPct, setRiskPct]   = useState(2)
  const [entryPrice, setEntryPrice] = useState(1500)
  const [slPrice, setSlPrice]   = useState(1450)
  const [currency, setCurrency] = useState('INR')

  // Trading Plan
  const [plan, setPlan]         = useState(INITIAL_PLAN)
  const [todayLoss, setTodayLoss] = useState(0)
  const [todayTrades, setTodayTrades] = useState(0)

  // ── Position Calculations ──────────────────────────────────────────────
  const riskAmount      = (capital * riskPct) / 100
  const slPoints        = Math.abs(entryPrice - slPrice)
  const quantity        = slPoints > 0 ? Math.floor(riskAmount / slPoints) : 0
  const totalValue      = quantity * entryPrice
  const maxLoss         = quantity * slPoints
  const exposure        = capital > 0 ? (totalValue / capital) * 100 : 0

  // TP at 2:1 RRR
  const rrr             = 2
  const tpPrice         = entryPrice + (entryPrice > slPrice ? rrr * slPoints : -rrr * slPoints)
  const potentialProfit = quantity * rrr * slPoints

  const sym = currency === 'INR' ? '₹' : '$'
  const fmt = (v) => v.toLocaleString('en-IN', { maximumFractionDigits: 2 })

  // ── Plan Alerts ───────────────────────────────────────────────────────
  const lossBreached   = todayLoss >= plan.dailyMaxLoss
  const tradesBreached = todayTrades >= plan.maxTrades
  const riskBreached   = riskPct > plan.maxRiskPerTrade
  const anyBreach      = lossBreached || tradesBreached || riskBreached

  return (
    <div className="h-full overflow-y-auto p-6 bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calculator size={20} className="text-teal-400" />
            Risk Management Console
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
            Position sizing calculator + trading business plan enforcer
          </p>
        </div>

        {/* Breach Banner */}
        {anyBreach && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/40">
            <AlertOctagon size={20} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">⚠ Trading Plan Violation Detected</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {lossBreached   && <span className="badge-sell">Daily loss limit hit!</span>}
                {tradesBreached && <span className="badge-sell">Max trades exceeded!</span>}
                {riskBreached   && <span className="badge-sell">Risk % too high!</span>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Position Sizing ─────────────────────────────────────── */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-slate-200 flex items-center gap-2 text-sm">
                <Calculator size={15} className="text-teal-400" />
                Position Sizing Calculator
              </h3>
              <select
                id="currency-select"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="input-dark py-1 text-xs"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField
                id="capital-input"
                label="Total Capital"
                value={capital}
                onChange={setCapital}
                prefix={sym}
                min={0}
                step="1000"
                helperText="Your total trading capital"
              />
              <InputField
                id="risk-pct-input"
                label="Risk Per Trade"
                value={riskPct}
                onChange={setRiskPct}
                suffix="%"
                min={0.1}
                max={10}
                step="0.1"
                helperText="Recommended: 1–2%"
              />
              <InputField
                id="entry-price-input"
                label="Entry Price"
                value={entryPrice}
                onChange={setEntryPrice}
                prefix={sym}
                min={0}
                step="0.05"
              />
              <InputField
                id="sl-price-input"
                label="Stop-Loss Price"
                value={slPrice}
                onChange={setSlPrice}
                prefix={sym}
                min={0}
                step="0.05"
              />
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <ResultCard label="Quantity to Buy" value={quantity.toLocaleString()} color="teal" sub="Exact shares/lots" />
              <ResultCard label="Capital at Risk"  value={`${sym}${fmt(maxLoss)}`}  color="amber" sub={`${riskPct}% of capital`} />
              <ResultCard label="Total Trade Value" value={`${sym}${fmt(totalValue)}`} color="teal" sub={`${exposure.toFixed(1)}% exposure`} />
              <ResultCard label="Target (2:1 RRR)" value={`${sym}${fmt(tpPrice)}`} color="green" sub={`+${sym}${fmt(potentialProfit)} potential`} />
            </div>

            {/* SL/TP Summary */}
            <div className="bg-gray-100 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-300 dark:border-slate-700/50 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-500">Entry    </span>
                <span className="text-gray-900 dark:text-slate-200">{sym}{entryPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-500">Stop Loss</span>
                <span className="text-red-400">{sym}{slPrice} ({slPoints.toFixed(2)} pts)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500">Target   </span>
                <span className="text-emerald-400">{sym}{tpPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 dark:border-slate-700 pt-1.5">
                <span className="text-gray-500 dark:text-slate-500">Risk:Reward</span>
                <span className="text-teal-400">1 : {rrr}</span>
              </div>
            </div>
          </div>

          {/* ── Trading Business Plan ───────────────────────────────── */}
          <div className="space-y-4">
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-slate-200 flex items-center gap-2 text-sm">
                <BookOpen size={15} className="text-amber-400" />
                Trading Business Plan
              </h3>

              <div className="space-y-3">
                <InputField
                  id="daily-max-loss-input"
                  label="Daily Max Loss Limit"
                  value={plan.dailyMaxLoss}
                  onChange={v => setPlan(p => ({ ...p, dailyMaxLoss: v }))}
                  prefix={sym}
                  min={0}
                  step="500"
                />
                <InputField
                  id="max-trades-input"
                  label="Max Trades Per Day"
                  value={plan.maxTrades}
                  onChange={v => setPlan(p => ({ ...p, maxTrades: v }))}
                  min={1}
                  max={20}
                  helperText="Discipline: stop after this many trades"
                />
                <InputField
                  id="max-risk-per-trade-input"
                  label="Max Risk % Per Trade"
                  value={plan.maxRiskPerTrade}
                  onChange={v => setPlan(p => ({ ...p, maxRiskPerTrade: v }))}
                  suffix="%"
                  min={0.1}
                  max={10}
                  step="0.1"
                />
              </div>

              <div className="border-t border-gray-300 dark:border-slate-700 pt-4 space-y-3">
                <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Today's Progress (Simulation)</p>
                <InputField
                  id="today-loss-input"
                  label="Today's Loss so far"
                  value={todayLoss}
                  onChange={setTodayLoss}
                  prefix={sym}
                  min={0}
                />
                <InputField
                  id="today-trades-input"
                  label="Trades taken today"
                  value={todayTrades}
                  onChange={setTodayTrades}
                  min={0}
                />
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Loss Check',   ok: !lossBreached,   good: 'Under limit',    bad: 'Limit hit!',   icon: TrendingDown },
                { label: 'Trades Check', ok: !tradesBreached, good: 'Within plan',    bad: 'Limit hit!',   icon: Target },
                { label: 'Risk Check',   ok: !riskBreached,   good: 'Risk acceptable', bad: 'Risk too high', icon: Shield },
              ].map(({ label, ok, good, bad, icon: Icon }) => (
                <div
                  key={label}
                  className={`card p-3 border text-center ${ok
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-red-500/30 bg-red-500/5'}`}
                >
                  {ok
                    ? <CheckCircle size={20} className="text-emerald-400 mx-auto mb-1" />
                    : <XCircle    size={20} className="text-red-400 mx-auto mb-1" />
                  }
                  <p className="text-[10px] text-gray-500 dark:text-slate-500">{label}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ok ? good : bad}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
