import { useState } from 'react'
import {
  Zap, TrendingUp, TrendingDown, Target, Clock,
  AlertTriangle, CheckCircle, ChevronRight, BarChart2, Sparkles, Brain, BookOpen, MessageSquare, ArrowRight
} from 'lucide-react'
import PredictionExplanationModal from './PredictionExplanationModal.jsx'

export default function AIPredictionPanel({ activeTicker, aiModeData }) {
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false)
  const { active, data, interval } = aiModeData || {}

  if (!active || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-950">
        <Zap size={48} className="text-gray-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200 mb-2">AI Mode Inactive</h3>
        <p className="text-sm text-gray-500 dark:text-slate-500 max-w-sm">
          Activate AI Mode from the chart toolbar to see real-time algorithmic price predictions and targets for this timeframe.
        </p>
      </div>
    )
  }

  const isBull = data.trend === 'BULLISH'
  const entryVal = data.entry || 100
  const slVal = data.stop_loss || 95
  const tpVal = data.take_profit || 110
  const atrVal = typeof data.atr === 'number' ? data.atr.toFixed(2) : (data.atr || '0.72')
  const rrVal = `1 : ${(Math.abs(tpVal - entryVal) / Math.max(0.01, Math.abs(entryVal - slVal))).toFixed(1)}`

  const handleOpenAiAssistant = () => {
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'AI Assistant' }))
  }

  return (
    <div className="h-full overflow-y-auto p-4 bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-200 flex items-center gap-2">
              <Zap size={15} className="text-violet-400" />
              AI Prediction Mode
              <span className="text-[10px] bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">LIVE</span>
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">
              Algorithmic trend analysis for <span className="font-mono text-teal-400 font-bold">{activeTicker}</span>
              <span className="ml-2 text-amber-600">⚠ Educational only — not financial advice</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="ai-panel-explain-btn"
              onClick={() => setIsExplainModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-500/20 active:scale-95 transition-all"
            >
              <Sparkles size={13} className="text-violet-200" />
              <span>Explain Prediction</span>
            </button>

            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Timeframe:</span>
            <span className="px-3 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200 text-xs font-bold font-mono border border-gray-200 dark:border-slate-700">
              {interval?.label || '15m'}
            </span>
          </div>
        </div>

        {/* ── Core Metric Cards ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Trend & Confidence Card */}
          <div className="card p-5 border border-gray-300 dark:border-slate-700 flex flex-col justify-between h-full bg-white dark:bg-slate-900 shadow-sm rounded-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-bold">Major Trend</p>
                <span className="text-[10px] text-violet-500 font-mono font-semibold">Random Forest ML</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                {isBull ? <TrendingUp size={32} className="text-emerald-400" /> : <TrendingDown size={32} className="text-red-400" />}
                <div>
                  <p className={`text-2xl font-black ${isBull ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.trend}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">Hold: {data.hold_duration || (isBull ? '2-5 Days' : '1-3 Days')}</p>
                </div>
              </div>
            </div>
            {/* Confidence bar */}
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-500 mb-1">
                <span>Confidence Score</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{data.confidence}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isBull ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: data.confidence }}
                />
              </div>
            </div>
          </div>

          {/* Target & SL Card */}
          <div className="card p-5 border border-gray-300 dark:border-slate-700 space-y-4 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-bold">{data.ui_target || 'Price Targets'}</p>
              <span className="text-[10px] text-teal-500 font-mono font-semibold">14-Period ATR</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-emerald-400" />
                  <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">Est. Target (TP)</span>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-400">{tpVal.toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-600">{isBull ? '+' : ''}{(((tpVal - entryVal) / entryVal) * 100).toFixed(2)}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">Stop Loss (SL)</span>
                </div>
                <p className="font-mono font-bold text-red-400">{slVal.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-slate-500 font-medium">Risk : Reward Ratio</span>
                <span className="font-mono text-sm font-bold text-teal-400">{rrVal}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Why Did the AI Predict This Setup? (Detailed Text Explanation) ── */}
        <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-violet-500" />
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Why Did the AI Predict This Setup for {activeTicker}?
              </h4>
            </div>
            <button
              onClick={() => setIsExplainModalOpen(true)}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Full Breakdown Modal</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Trend logic */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <TrendingUp size={14} />
                <span>1. ML Trend ({data.trend})</span>
              </div>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-[11px]">
                Predicted by DemoTrade's <strong>Scikit-Learn Random Forest model</strong> ({data.confidence} confidence) analyzing historical SMA20 momentum distance and 14-period RSI velocity.
              </p>
            </div>

            {/* SL logic */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-500 font-bold">
                <AlertTriangle size={14} />
                <span>2. Stop Loss ({slVal.toFixed(2)})</span>
              </div>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-[11px]">
                Dynamically calculated at <strong>1.5 × ATR</strong> ({atrVal}) away from entry ({entryVal.toFixed(2)}) to prevent whipsaws from standard market noise.
              </p>
            </div>

            {/* 1:2.1 R:R */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold">
                <Target size={14} />
                <span>3. Mathematical 1:2.1 Edge</span>
              </div>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-[11px]">
                Take-Profit at <strong>3.2 × ATR</strong> maintains a <strong>{rrVal}</strong> ratio. Even with a 40% win rate, your mathematical expectancy is +0.24R profit per trade.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-gray-500 dark:text-slate-400">
              Need deeper analysis or position sizing calculations?
            </span>
            <button
              onClick={handleOpenAiAssistant}
              className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 hover:underline"
            >
              <MessageSquare size={13} />
              <span>Ask Quantitative AI Mentor</span>
            </button>
          </div>
        </div>

        {/* ── Disclaimer ──────────────────────────────────────── */}
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-[10px] text-amber-700 dark:text-amber-400">
            <strong>Disclaimer:</strong> AI Prediction Mode uses Machine Learning (Random Forest) trained on historical ATR, RSI, and SMA features for educational purposes only.
            Predictions are NOT guaranteed and should not be used as the sole basis for trading decisions.
            Always perform your own due diligence and manage risk appropriately.
          </p>
        </div>
      </div>

      {/* ── Detailed Explanation Modal ───────────────────────── */}
      <PredictionExplanationModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        ticker={activeTicker}
        prediction={data}
      />
    </div>
  )
}
