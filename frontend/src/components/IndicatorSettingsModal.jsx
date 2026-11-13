import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import ColorPalette from './ColorPalette'

export default function IndicatorSettingsModal({ isOpen, onClose, indicator, onSave }) {
  const [activeTab, setActiveTab] = useState('inputs')
  const [fvgEnabled, setFvgEnabled] = useState(true)
  const [hhhlEnabled, setHhhlEnabled] = useState(true)
  const [obColor, setObColor] = useState('#3b82f6')
  const [length, setLength] = useState(14)
  const [source, setSource] = useState('close')
  const [color, setColor] = useState('#3b82f6')
  
  // Visibility State (mocking standard TV visibility settings)
  const [visMinutes, setVisMinutes] = useState(true)
  const [visHours, setVisHours] = useState(true)
  const [visDays, setVisDays] = useState(true)
  const [visWeeks, setVisWeeks] = useState(true)
  const [visMonths, setVisMonths] = useState(true)

  // Sync state when indicator changes
  useEffect(() => {
    if (indicator) {
      setLength(indicator.length || 14)
      setSource(indicator.source || 'close')
      setColor(indicator.color || '#3b82f6')
      if (indicator.settings) {
        setFvgEnabled(indicator.settings.fvg !== false)
        setHhhlEnabled(indicator.settings.hhhl !== false)
        setObColor(indicator.settings.obColor || '#3b82f6')
      }
      setActiveTab('inputs')
    }
  }, [indicator])

  if (!isOpen || !indicator) return null

  const handleSave = () => {
    const updated = {
      ...indicator,
      length,
      source,
      color,
      settings: indicator.hasSettings ? {
        fvg: fvgEnabled,
        hhhl: hhhlEnabled,
        obColor
      } : undefined
    }
    onSave(updated)
    onClose()
  }

  const isSMC = indicator.id === 'smc' || indicator.hasSettings

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[450px] bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
        
        {/* Header */}
        <div className="flex flex-col border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-[#131722]">
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{indicator.name}</h2>
            <button onClick={onClose} className="p-1 rounded-md text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-gray-100 dark:bg-slate-800 transition-colors">
              <X size={20} />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex items-center px-4 gap-6">
            <button onClick={() => setActiveTab('inputs')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'inputs' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}>Inputs</button>
            <button onClick={() => setActiveTab('style')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'style' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}>Style</button>
            <button onClick={() => setActiveTab('visibility')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'visibility' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}>Visibility</button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50 dark:bg-[#1e222d]">
          {activeTab === 'inputs' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Length</label>
                <input 
                  type="number" 
                  value={length}
                  onChange={e => setLength(Number(e.target.value))}
                  className="w-24 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-1.5 text-sm text-center text-gray-900 dark:text-slate-200 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Source</label>
                <select 
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-24 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-1.5 text-sm text-gray-900 dark:text-slate-200 focus:border-teal-500 outline-none"
                >
                  <option value="close">Close</option>
                  <option value="open">Open</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="hl2">HL2</option>
                  <option value="hlc3">HLC3</option>
                  <option value="ohlc4">OHLC4</option>
                </select>
              </div>

              {isSMC && (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={fvgEnabled} onChange={e => setFvgEnabled(e.target.checked)} className="peer sr-only" />
                    <div className="w-5 h-5 rounded border border-gray-300 dark:border-slate-600 peer-checked:bg-teal-600 peer-checked:border-teal-600 flex items-center justify-center transition-colors">
                      {fvgEnabled && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 transition-colors">Show Fair Value Gaps (FVG)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={hhhlEnabled} onChange={e => setHhhlEnabled(e.target.checked)} className="peer sr-only" />
                    <div className="w-5 h-5 rounded border border-gray-300 dark:border-slate-600 peer-checked:bg-teal-600 peer-checked:border-teal-600 flex items-center justify-center transition-colors">
                      {hhhlEnabled && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 transition-colors">Show HH / HL Structure</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-slate-500 mb-3 tracking-wider">Main Plot</h4>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
                  <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: color}}/>
                    Line Color
                  </label>
                  <ColorPalette selectedColor={color} onSelect={setColor} />
                </div>
              </div>

              {isSMC && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-slate-500 mb-3 tracking-wider">Order Blocks</h4>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: obColor}}/>
                      Block Fill Color
                    </label>
                    <ColorPalette selectedColor={obColor} onSelect={setObColor} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Select the timeframes where this indicator should be visible.</p>
              
              {[
                { label: 'Minutes', state: visMinutes, setter: setVisMinutes },
                { label: 'Hours', state: visHours, setter: setVisHours },
                { label: 'Days', state: visDays, setter: setVisDays },
                { label: 'Weeks', state: visWeeks, setter: setVisWeeks },
                { label: 'Months', state: visMonths, setter: setVisMonths }
              ].map(tf => (
                <label key={tf.label} className="flex items-center justify-between cursor-pointer group bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800 hover:border-teal-500/50 transition-colors">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{tf.label}</span>
                  <div className="relative">
                    <input type="checkbox" checked={tf.state} onChange={e => tf.setter(e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-5 bg-gray-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-teal-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-[#131722] flex gap-3 justify-end items-center">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors shadow-md flex items-center gap-2">
            <Check size={16}/> OK
          </button>
        </div>
      </div>
    </div>
  )
}

