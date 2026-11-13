import React, { useState } from 'react'
import { X, Moon, Sun, Monitor, Check, Settings2, Image, Type, Palette } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { ColorPickerDropdown } from './ColorPalette'

export default function ChartSettingsModal({ isOpen, onClose, theme: chartTheme, onChange }) {
  const [activeTab, setActiveTab] = useState('symbol')
  const { theme: appTheme, setTheme } = useTheme()

  if (!isOpen || !chartTheme) return null

  const handleUpdate = (key, value) => {
    onChange({ ...chartTheme, [key]: value })
  }

  const applyGlobalTheme = (mode) => {
    if (appTheme !== mode) setTheme(mode)
    
    if (mode === 'dark') {
      onChange({ mode: 'dark', upColor: '#10b981', downColor: '#ef4444', upBorder: '#10b981', downBorder: '#ef4444', upWick: '#10b981', downWick: '#ef4444', bgColor: '#000000', textColor: '#d1d4dc', showGrid: true, gridColor: '#363c4e60', showCrosshair: true, crosshairColor: '#d1d4dc' })
    } else if (mode === 'normal') {
      onChange({ mode: 'normal', upColor: '#10b981', downColor: '#ef4444', upBorder: '#10b981', downBorder: '#ef4444', upWick: '#10b981', downWick: '#ef4444', bgColor: '#131722', textColor: '#d1d4dc', showGrid: true, gridColor: '#363c4e60', showCrosshair: true, crosshairColor: '#d1d4dc' })
    } else {
      onChange({ mode: 'light', upColor: '#10b981', downColor: '#ef4444', upBorder: '#10b981', downBorder: '#ef4444', upWick: '#10b981', downWick: '#ef4444', bgColor: '#ffffff', textColor: '#19181b', showGrid: true, gridColor: '#e0e3eb', showCrosshair: true, crosshairColor: '#19181b' })
    }
  }

  const handleReset = () => {
    applyGlobalTheme(appTheme);
  }


  const TABS = [
    { id: 'symbol',     label: 'Symbol',     icon: Settings2 },
    { id: 'canvas',     label: 'Canvas',     icon: Image },
    { id: 'scales',     label: 'Scales',     icon: Type },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  const ColorInput = ({ label, propUp, propDown }) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <ColorPickerDropdown color={chartTheme[propUp]} onChange={(c) => handleUpdate(propUp, c)} />
        <ColorPickerDropdown color={chartTheme[propDown]} onChange={(c) => handleUpdate(propDown, c)} />
      </div>
    </div>
  )

  const BooleanInput = ({ label, propName }) => (
    <label className="flex items-center justify-between mb-3 cursor-pointer group">
      <span className="text-sm text-gray-700 dark:text-slate-300">{label}</span>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={chartTheme[propName]} 
          onChange={(e) => handleUpdate(propName, e.target.checked)} 
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${chartTheme[propName] ? 'bg-teal-500' : 'bg-gray-300 dark:bg-slate-700'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${chartTheme[propName] ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-2xl flex overflow-hidden">
        
        {/* Sidebar Tabs */}
        <div className="w-48 bg-gray-50 dark:bg-[#131722] border-r border-gray-200 dark:border-slate-800 p-2 flex flex-col gap-1">
          <div className="text-sm font-bold text-gray-900 dark:text-slate-200 px-3 py-3 mb-2">Chart settings</div>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left
                ${activeTab === t.id ? 'bg-gray-200 dark:bg-[#2a2e39] text-gray-900 dark:text-slate-200' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-[#2a2e39]/50 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200'}`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-[400px]">
          <div className="flex justify-end p-2 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1e222d]">
            <button onClick={onClose} className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-slate-800 rounded transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-[#1e222d]">
            
            {activeTab === 'symbol' && (
              <div className="animate-fade-in max-w-sm">
                <h3 className="text-gray-900 dark:text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wider">Candles</h3>
                <ColorInput label="Body" propUp="upColor" propDown="downColor" />
                <ColorInput label="Borders" propUp="upBorder" propDown="downBorder" />
                <ColorInput label="Wick" propUp="upWick" propDown="downWick" />
              </div>
            )}

            {activeTab === 'canvas' && (
              <div className="animate-fade-in max-w-sm">
                <h3 className="text-gray-900 dark:text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wider">Background</h3>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-700 dark:text-slate-300">Solid</span>
                  <ColorPickerDropdown 
                    color={chartTheme.bgColor || '#131722'} 
                    onChange={(c) => handleUpdate('bgColor', c)} 
                  />
                </div>
                
                <h3 className="text-gray-900 dark:text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wider mt-6">Grid Lines</h3>
                <BooleanInput label="Visible" propName="showGrid" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-700 dark:text-slate-300">Color</span>
                  <ColorPickerDropdown 
                    color={chartTheme.gridColor?.slice(0, 7) || '#363c4e'} 
                    onChange={(c) => handleUpdate('gridColor', c + '60')} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'scales' && (
              <div className="animate-fade-in max-w-sm">
                <h3 className="text-gray-900 dark:text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wider">Text & Colors</h3>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-700 dark:text-slate-300">Text</span>
                  <ColorPickerDropdown 
                    color={chartTheme.textColor || '#d1d4dc'} 
                    onChange={(c) => handleUpdate('textColor', c)} 
                  />
                </div>
                
                <h3 className="text-gray-900 dark:text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wider">Crosshair</h3>
                <BooleanInput label="Visible" propName="showCrosshair" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-700 dark:text-slate-300">Color</span>
                  <ColorPickerDropdown 
                    color={chartTheme.crosshairColor || '#d1d4dc'} 
                    onChange={(c) => handleUpdate('crosshairColor', c)} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="animate-fade-in max-w-sm">
                <h3 className="text-gray-900 dark:text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wider">Global App Theme</h3>
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => applyGlobalTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-colors ${
                      appTheme === 'dark' ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-200 shadow' : 'text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-800 dark:text-slate-300'
                    }`}
                  >
                    <Moon size={16} /> Dark
                  </button>
                  <button
                    onClick={() => applyGlobalTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-colors ${
                      appTheme === 'light' ? 'bg-white shadow text-teal-600' : 'text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-gray-800 dark:text-slate-300'
                    }`}
                  >
                    <Sun size={16} /> Light
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-4">
                  Note: Toggling the theme here applies a full palette reset to the chart canvas as well as the entire terminal UI.
                </p>
              </div>
            )}

          </div>

          <div className="flex justify-between p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1e222d]">
            <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-gray-900 dark:text-slate-200 transition-colors">
              Reset Settings
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


