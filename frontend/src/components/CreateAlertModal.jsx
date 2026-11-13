import React, { useState } from 'react'
import { X, BellRing } from 'lucide-react'

export default function CreateAlertModal({ isOpen, onClose, ticker, currentPrice, onSave }) {
  const [condition, setCondition] = useState('crossing_up')
  const [targetPrice, setTargetPrice] = useState(currentPrice || 0)
  const [note, setNote] = useState('')

  if (!isOpen) return null

  const handleSave = () => {
    onSave({
      id: `alert_${Date.now()}`,
      ticker,
      condition,
      targetPrice: Number(targetPrice),
      note,
      active: true
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <BellRing size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-200">Create Alert for {ticker}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-600 dark:text-slate-400 hover:text-white hover:bg-gray-100 dark:bg-slate-800">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Condition</label>
            <select 
              value={condition} 
              onChange={e => setCondition(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded p-2 text-sm text-gray-900 dark:text-slate-200 focus:border-amber-500 outline-none"
            >
              <option value="crossing_up">Crossing Up</option>
              <option value="crossing_down">Crossing Down</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Target Price</label>
            <input 
              type="number" 
              value={targetPrice} 
              onChange={e => setTargetPrice(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded p-2 text-sm text-gray-900 dark:text-slate-200 focus:border-amber-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Note (Optional)</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)}
              placeholder="e.g., Take profit level reached"
              rows={2}
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded p-2 text-sm text-gray-900 dark:text-slate-200 focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded text-sm text-gray-600 dark:text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors">Create Alert</button>
        </div>
      </div>
    </div>
  )
}
