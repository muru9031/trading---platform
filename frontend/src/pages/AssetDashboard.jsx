import { useState, useRef, useCallback } from 'react'
import TradingChart from '../components/TradingChart.jsx'
import AIPredictionPanel from '../components/AIPredictionPanel.jsx'
import DeepFundamentals from '../components/DeepFundamentals.jsx'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Zap } from 'lucide-react'

const MIN_HEIGHT = 150 // Minimum height for panels in px

export default function AssetDashboard({ activeTicker, signalsOn, onToggleSignals, user }) {
  const [fullScreenPanel, setFullScreenPanel] = useState(null) // null | 'chart' | 'fundamentals'
  const [activeBottomTab, setActiveBottomTab] = useState('fundamentals') // fundamentals | ai
  
  // Resizable pane state (default 55% chart height)
  const [chartHeightPct, setChartHeightPct] = useState(55)
  const dashboardRef = useRef(null)

  const handleDrag = useCallback((e) => {
    if (!dashboardRef.current) return
    const containerHeight = dashboardRef.current.getBoundingClientRect().height
    const newPct = (e.clientY / containerHeight) * 100
    // constrain between 20% and 80%
    setChartHeightPct(Math.min(Math.max(newPct, 20), 80))
  }, [])

  const startDrag = useCallback((e) => {
    e.preventDefault()
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleDrag)
    }, { once: true })
  }, [handleDrag])

  const [aiModeData, setAiModeData] = useState({ active: false, data: null, interval: null })

  const showChart = fullScreenPanel === null || fullScreenPanel === 'chart'
  const showBottom = fullScreenPanel === null || fullScreenPanel === 'fundamentals'

  return (
    <div ref={dashboardRef} className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">

      {/* ── Chart Section ─────────────────────────────────────────── */}
      {showChart && (
        <div 
          className="relative flex-shrink-0"
          style={{ height: fullScreenPanel === 'chart' ? '100%' : `${chartHeightPct}%` }}
        >
          <TradingChart 
            activeTicker={activeTicker} 
            signalsOn={signalsOn} 
            onToggleSignals={onToggleSignals}
            user={user} 
            isFullscreen={fullScreenPanel === 'chart'}
            onToggleFullscreen={() => setFullScreenPanel(fullScreenPanel === 'chart' ? null : 'chart')}
            onAiStateChange={(active, data, interval) => setAiModeData({ active, data, interval })}
          />
        </div>
      )}

      {/* ── Resizer ───────────────────────────────────────────────── */}
      {showChart && showBottom && (
        <div 
          onMouseDown={startDrag}
          className="h-1 bg-gray-100 dark:bg-slate-800 hover:bg-teal-500/50 cursor-row-resize z-10 transition-colors flex items-center justify-center group"
        >
          <div className="w-8 h-0.5 bg-slate-600 rounded-full group-hover:bg-teal-400" />
        </div>
      )}

      {/* ── Bottom Panel ──────────────────────────────────────────── */}
      {showBottom && (
        <div className="flex flex-col flex-1 overflow-hidden border-t border-gray-200 dark:border-slate-800">

          {/* Bottom Tab Bar */}
          <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
            <button
              id="bottom-tab-fundamentals"
              onClick={() => setActiveBottomTab('fundamentals')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all
                ${activeBottomTab === 'fundamentals'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800'
                }`}
            >
              Deep Fundamentals
            </button>
            <button
              id="bottom-tab-ai"
              onClick={() => setActiveBottomTab('ai')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all
                ${activeBottomTab === 'ai'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800'
                }`}
            >
              <Zap size={11} />
              AI Prediction Mode
            </button>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-[10px] font-bold font-mono text-gray-500 dark:text-slate-500 border border-gray-300 dark:border-slate-700 px-2 py-1 rounded">
                {activeTicker}
              </div>
              <button
                onClick={() => setFullScreenPanel(fullScreenPanel === 'fundamentals' ? null : 'fundamentals')}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 hover:bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-700 transition-all"
                title={fullScreenPanel === 'fundamentals' ? 'Minimize' : 'Fullscreen'}
              >
                {fullScreenPanel === 'fundamentals' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeBottomTab === 'fundamentals' && (
              <DeepFundamentals activeTicker={activeTicker} />
            )}
            {activeBottomTab === 'ai' && (
              <AIPredictionPanel activeTicker={activeTicker} aiModeData={aiModeData} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
