import { useState } from 'react'
import {
  Shield, Plus, Trash2, Edit3, Save, X,
  CheckCircle, XCircle, AlertOctagon, TrendingDown,
  Target, BookOpen, Info, BarChart2
} from 'lucide-react'

const MAX_RISK_PCT = 2 // Strictly enforced maximum

function calcPlan(capital, riskPct) {
  const safeRisk = Math.min(riskPct, MAX_RISK_PCT)
  const dailyMaxLoss  = +(capital * safeRisk / 100).toFixed(2)
  const dailyTarget   = +(dailyMaxLoss * 1.5).toFixed(2)  // 1.5× risk
  const maxTrades     = safeRisk <= 1 ? 5 : safeRisk <= 1.5 ? 4 : 3
  const perTradeRisk  = +(dailyMaxLoss / maxTrades).toFixed(2)
  return { safeRisk, dailyMaxLoss, dailyTarget, maxTrades, perTradeRisk }
}

let planCounter = 3

const DEFAULT_PLANS = [
  { id: 1, name: 'Conservative (1%)', capital: 0, riskPct: 1,   currency: 'INR', active: true  },
  { id: 2, name: 'Standard (2%)',     capital: 0, riskPct: 2,   currency: 'INR', active: false },
]

function PlanCard({ plan, onEdit, onDelete, onActivate }) {
  const calc = calcPlan(plan.capital, plan.riskPct)
  const sym  = plan.currency === 'INR' ? '₹' : '$'
  const fmt  = v => v.toLocaleString('en-IN')

  return (
    <div className={`card p-5 border transition-all
      ${plan.active ? 'border-teal-500/50 bg-teal-500/5' : 'border-gray-300 dark:border-slate-700'}`}>

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-200">{plan.name}</h3>
            {plan.active && (
              <span className="text-[9px] bg-teal-500/20 text-teal-400 border border-teal-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                ACTIVE
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">
            Capital: <span className="font-mono text-gray-800 dark:text-slate-300">{sym}{fmt(plan.capital)}</span>
            {' · '}Risk: <span className={`font-mono font-semibold ${calc.safeRisk >= 2 ? 'text-amber-400' : 'text-teal-400'}`}>
              {calc.safeRisk}%
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!plan.active && (
            <button onClick={() => onActivate(plan.id)}
              className="btn-primary text-[10px] px-2 py-1">Activate</button>
          )}
          <button onClick={() => onEdit(plan)} className="btn-ghost p-1.5"><Edit3 size={13} /></button>
          <button onClick={() => onDelete(plan.id)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Daily Max Loss',    value: `${sym}${fmt(calc.dailyMaxLoss)}`,  color: 'text-red-400',     icon: TrendingDown },
          { label: 'Daily Target',      value: `${sym}${fmt(calc.dailyTarget)}`,   color: 'text-emerald-400', icon: Target },
          { label: 'Max Trades / Day',  value: calc.maxTrades,                      color: 'text-amber-400',   icon: BarChart2 },
          { label: 'Risk Per Trade',    value: `${sym}${fmt(calc.perTradeRisk)}`,  color: 'text-blue-400',    icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-gray-100 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-300 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={11} className={color} />
              <span className="text-[9px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`font-mono font-bold text-base ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Rules summary */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-800 space-y-1">
        {[
          `Stop trading if loss exceeds ${sym}${fmt(calc.dailyMaxLoss)}`,
          `Take profits at ${sym}${fmt(calc.dailyTarget)} (1.5× risk)`,
          `Maximum ${calc.maxTrades} trades per day`,
          `Never risk more than ${sym}${fmt(calc.perTradeRisk)} per trade`,
        ].map((rule, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-500">
            <CheckCircle size={10} className="text-teal-500 flex-shrink-0" />
            {rule}
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanForm({ initial, onSave, onCancel }) {
  const [name, setName]         = useState(initial?.name || '')
  const [capital, setCapital]   = useState(initial?.capital || 0)
  const [riskPct, setRiskPct]   = useState(initial?.riskPct || 1)
  const [currency, setCurrency] = useState(initial?.currency || 'INR')

  const clampedRisk = Math.min(riskPct, MAX_RISK_PCT)
  const calc        = calcPlan(capital, clampedRisk)
  const sym         = currency === 'INR' ? '₹' : '$'
  const fmt         = v => v.toLocaleString('en-IN')
  const exceedsMax  = riskPct > MAX_RISK_PCT

  const handleSave = () => {
    if (!name.trim() || capital <= 0) return
    onSave({ name: name.trim(), capital, riskPct: clampedRisk, currency })
  }

  return (
    <div className="card p-6 border border-teal-500/30 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-200">
          {initial ? 'Edit Plan' : 'Create New Trading Plan'}
        </h3>
        <button onClick={onCancel} className="btn-ghost p-1.5"><X size={15} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Plan Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g., My Conservative Plan"
            className="input-dark w-full" />
        </div>

        <div>
          <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Total Capital</label>
          <div className="flex gap-2">
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="input-dark w-20">
              <option value="INR">₹</option>
              <option value="USD">$</option>
            </select>
            <input type="number" value={capital} min={1000} step={5000}
              onChange={e => setCapital(+e.target.value || 0)}
              className="input-dark flex-1" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">
            Risk Per Trade (%)
            <span className="ml-2 text-amber-500 text-[10px]">Max: {MAX_RISK_PCT}%</span>
          </label>
          <input type="number" value={riskPct} min={0.1} max={MAX_RISK_PCT} step={0.1}
            onChange={e => setRiskPct(+e.target.value || 0)}
            className={`input-dark w-full ${exceedsMax ? 'border-red-500/60' : ''}`} />
          {exceedsMax && (
            <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
              <AlertOctagon size={10} /> Capped at {MAX_RISK_PCT}% for risk discipline.
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-100 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-300 dark:border-slate-700/50">
        <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-3">Auto-Calculated Rules</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-300 dark:border-slate-700/50">
            <span className="text-gray-500 dark:text-slate-500">Daily Max Loss</span>
            <span className="font-mono text-red-400 font-semibold">{sym}{fmt(calc.dailyMaxLoss)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-300 dark:border-slate-700/50">
            <span className="text-gray-500 dark:text-slate-500">Daily Target</span>
            <span className="font-mono text-emerald-400 font-semibold">{sym}{fmt(calc.dailyTarget)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-300 dark:border-slate-700/50">
            <span className="text-gray-500 dark:text-slate-500">Max Trades</span>
            <span className="font-mono text-amber-400 font-semibold">{calc.maxTrades}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-300 dark:border-slate-700/50">
            <span className="text-gray-500 dark:text-slate-500">Risk/Trade</span>
            <span className="font-mono text-blue-400 font-semibold">{sym}{fmt(calc.perTradeRisk)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
        <button onClick={handleSave} disabled={!name.trim()}
          className="btn-primary text-sm flex items-center gap-2">
          <Save size={14} /> Save Plan
        </button>
      </div>
    </div>
  )
}

export default function RiskManagement() {
  const [plans, setPlans]       = useState(DEFAULT_PLANS)
  const [editing, setEditing]   = useState(null)   // plan object | null
  const [creating, setCreating] = useState(false)

  const handleSave = (formData) => {
    if (editing) {
      setPlans(p => p.map(x => x.id === editing.id ? { ...x, ...formData } : x))
      setEditing(null)
    } else {
      setPlans(p => [...p, { id: ++planCounter, active: false, ...formData }])
      setCreating(false)
    }
  }

  const deletePlan = id => setPlans(p => p.filter(x => x.id !== id))
  const activatePlan = id => setPlans(p => p.map(x => ({ ...x, active: x.id === id })))

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Shield size={20} className="text-teal-400" />
              Risk Management Plans
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
              Create and manage your trading business plans. Risk is strictly capped at {MAX_RISK_PCT}% per trade.
            </p>
          </div>
          {!creating && !editing && (
            <button id="create-plan-btn" onClick={() => setCreating(true)}
              className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> New Plan
            </button>
          )}
        </div>

        {/* 2% Warning Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Risk Discipline Enforced</p>
            <p className="text-xs text-amber-700 mt-0.5">
              DemoTrade enforces a maximum risk of <strong>{MAX_RISK_PCT}%</strong> of capital per trade.
              Professional traders risk 0.5–2% per trade. Risking more leads to account blowups.
              Your plans are auto-calculated for safety and discipline.
            </p>
          </div>
        </div>

        {/* Create / Edit Form */}
        {(creating || editing) && (
          <PlanForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setCreating(false); setEditing(null) }}
          />
        )}

        {/* Plans List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={p => { setEditing(p); setCreating(false) }}
              onDelete={deletePlan}
              onActivate={activatePlan}
            />
          ))}
        </div>

        {plans.length === 0 && !creating && (
          <div className="text-center py-12">
            <Shield size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-500">No plans yet. Create your first trading plan!</p>
            <button onClick={() => setCreating(true)} className="btn-primary mt-4">
              <Plus size={14} className="inline mr-1" /> Create Plan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
