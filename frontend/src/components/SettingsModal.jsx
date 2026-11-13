import React, { useState, useEffect } from 'react'
import { X, Check, RotateCcw } from 'lucide-react'

const DEFAULT_FIB = [
  { v: 0, c: '#787b86', on: true },
  { v: 0.236, c: '#f44336', on: true },
  { v: 0.382, c: '#81c784', on: true },
  { v: 0.5, c: '#4caf50', on: true },
  { v: 0.618, c: '#009688', on: true },
  { v: 0.786, c: '#64b5f6', on: true },
  { v: 1, c: '#787b86', on: true },
  { v: 1.272, c: '#f44336', on: false },
  { v: 1.618, c: '#2962ff', on: false },
  { v: 2.618, c: '#e91e63', on: false },
  { v: 3.618, c: '#9c27b0', on: false },
  { v: 4.236, c: '#e91e63', on: false }
]

export default function SettingsModal({ isOpen, onClose, selectedDrawing, onSave, onUpdate }) {
  const [config, setConfig] = useState({})
  const [originalConfig, setOriginalConfig] = useState({})

  useEffect(() => {
    if (isOpen && selectedDrawing) {
      setConfig({ ...selectedDrawing })
      setOriginalConfig({ ...selectedDrawing })
    }
  }, [isOpen, selectedDrawing])

  if (!isOpen || !selectedDrawing) return null

  const handleChange = (key, value) => {
    const nextConfig = { ...config, [key]: value }
    setConfig(nextConfig)
    if (onUpdate) onUpdate(selectedDrawing.id, nextConfig)
  }

  const handleFibLevelChange = (idx, prop, val) => {
    const current = config.fibLevels || JSON.parse(JSON.stringify(DEFAULT_FIB))
    const next = [...current]
    if (next[idx]) {
      next[idx] = { ...next[idx], [prop]: val }
      handleChange('fibLevels', next)
    }
  }

  const resetFibDefaults = () => {
    handleChange('fibLevels', JSON.parse(JSON.stringify(DEFAULT_FIB)))
  }

  const handleSave = () => {
    if (onSave) onSave(selectedDrawing.id, config)
    onClose()
  }

  const handleCancel = () => {
    if (onUpdate) onUpdate(selectedDrawing.id, originalConfig)
    onClose()
  }

  const renderToolOptions = () => {
    if (config.type === 'trendline') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Extend Left</span>
            <input type="checkbox" checked={config.extendLeft || false} 
              onChange={(e) => handleChange('extendLeft', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Extend Right</span>
            <input type="checkbox" checked={config.extendRight || false} 
              onChange={(e) => handleChange('extendRight', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Show Price Label on Y-Axis</span>
            <input type="checkbox" checked={config.showPriceLabel !== false} 
              onChange={(e) => handleChange('showPriceLabel', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
        </div>
      )
    }
    
    if (config.type === 'ray' || config.type === 'horizontal') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Show Price Label on Y-Axis</span>
            <input type="checkbox" checked={config.showPriceLabel !== false} 
              onChange={(e) => handleChange('showPriceLabel', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
        </div>
      )
    }

    if (config.type === 'box') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Fill Background</span>
            <input type="checkbox" checked={config.fillBackground !== false} 
              onChange={(e) => handleChange('fillBackground', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 dark:text-slate-300 text-sm">Background Opacity</span>
              <span className="text-gray-600 dark:text-slate-400 text-xs">{config.fillOpacity ?? 20}%</span>
            </div>
            <input type="range" min="0" max="100" value={config.fillOpacity ?? 20}
              onChange={(e) => handleChange('fillOpacity', parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Show Border</span>
            <input type="checkbox" checked={config.showBorder !== false} 
              onChange={(e) => handleChange('showBorder', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
        </div>
      )
    }

    if (config.type === 'long' || config.type === 'short') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Compact Mode</span>
            <input type="checkbox" checked={config.compactMode || false} 
              onChange={(e) => handleChange('compactMode', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-slate-300 text-sm">Show Risk/Reward Text</span>
            <input type="checkbox" checked={config.showRRText !== false} 
              onChange={(e) => handleChange('showRRText', e.target.checked)}
              className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 dark:text-slate-300 text-sm">Fill Opacity</span>
              <span className="text-gray-600 dark:text-slate-400 text-xs">{config.fillOpacity ?? 15}%</span>
            </div>
            <input type="range" min="0" max="100" value={config.fillOpacity ?? 15}
              onChange={(e) => handleChange('fillOpacity', parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>
      )
    }

    if (config.type === 'fib' || config.type === 'fib_ext') {
      const levels = config.fibLevels || DEFAULT_FIB
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-800 dark:text-slate-300 text-sm font-semibold">Levels</span>
            <button onClick={resetFibDefaults} className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 transition-colors">
              <RotateCcw size={12}/> Defaults
            </button>
          </div>
          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
            {levels.map((lvl, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={lvl.on !== false}
                    onChange={(e) => handleFibLevelChange(idx, 'on', e.target.checked)}
                    className="w-3.5 h-3.5 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
                  <input type="color" value={lvl.c}
                    onChange={(e) => handleFibLevelChange(idx, 'c', e.target.value)}
                    className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer" />
                </div>
                <input type="number" step="0.001" value={lvl.v}
                  onChange={(e) => handleFibLevelChange(idx, 'v', parseFloat(e.target.value))}
                  className="bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs text-gray-900 dark:text-slate-200 px-1 py-1 w-16 text-right outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-300 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 dark:text-slate-300 text-sm">Reverse Levels</span>
              <input type="checkbox" checked={config.reverseLevels || false} 
                onChange={(e) => handleChange('reverseLevels', e.target.checked)}
                className="w-4 h-4 bg-gray-100 dark:bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="text-gray-600 dark:text-slate-400 text-sm italic py-4">
        No specific structural properties available for {config.type}.
      </div>
    )
  }

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700/50 rounded-xl shadow-2xl w-[320px] overflow-hidden flex flex-col pointer-events-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800/30">
        <h2 className="text-gray-900 dark:text-slate-200 font-semibold text-sm uppercase tracking-wide">
          {config.type} Properties
        </h2>
        <button onClick={handleCancel} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-5">
        {renderToolOptions()}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800/20 flex justify-end gap-2">
        <button onClick={handleCancel} 
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-colors">
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  )
}
