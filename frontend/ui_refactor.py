import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Imports
if "import IndicatorsModal from './IndicatorsModal.jsx'" not in c:
    c = c.replace("import SettingsModal from './SettingsModal.jsx'",
                  "import SettingsModal from './SettingsModal.jsx'\nimport IndicatorsModal from './IndicatorsModal.jsx'")
    
if "Settings2" not in c:
    c = c.replace("LayoutTemplate, Save, Check", "LayoutTemplate, Save, Check, Settings2, X, ChevronDown, FunctionSquare")
else:
    c = c.replace("LayoutTemplate, Save, Check, Settings2", "LayoutTemplate, Save, Check, Settings2, X, ChevronDown, FunctionSquare")

# 2. Add New States (Indicators, Modals, Dropdowns)
if "const [activeIndicators, setActiveIndicators] = useState([])" not in c:
    c = c.replace("const [hoveredCandle, setHoveredCandle] = useState(null)",
                  "const [hoveredCandle, setHoveredCandle] = useState(null)\n  const [activeIndicators, setActiveIndicators] = useState([])\n  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false)\n  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)")

# 3. Replace the broken crosshair logic with the robust array search
old_crosshair = """    chart.subscribeCrosshairMove((param) => {
      const wip = drawingWipRef.current
      if (!param.point) {"""
new_crosshair = """    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !liveDataRef.current.fullData) {
        setHoveredCandle(null)
      } else {
        const dataPoint = liveDataRef.current.fullData.find(d => d.time === param.time);
        if (dataPoint) setHoveredCandle(dataPoint);
      }
      
      const wip = drawingWipRef.current
      if (!param.point) {"""
if "const dataPoint = liveDataRef.current.fullData.find(" not in c:
    c = c.replace(old_crosshair, new_crosshair)

# 4. Refactor Header UI: Flex-nowrap, Chart Selection Dropdown, and Indicators Button
# We will target the entire header flex container
header_start = c.find('<div className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0 flex-wrap z-20 border-b bg-slate-950 border-slate-800">')
if header_start != -1:
    # Let's replace the whole header container up to the PaperTradeConsole div
    # Actually, we can just replace the specific sections to be safer.
    
    # a. Fix flex-wrap to flex-nowrap overflow-hidden
    c = c.replace('flex-shrink-0 flex-wrap z-20', 'flex-shrink-0 flex-nowrap overflow-hidden z-20 w-full')
    
    # b. Replace the loose Toggle buttons with the Dropdown and Indicators button
    old_buttons = """<div className="w-px h-4 bg-slate-800 mr-2"/>
            <div className="flex items-center gap-0.5 mr-2">
              <button onClick={() => setChartType('candle')}
                className={`p-1 rounded transition-colors ${chartType === 'candle' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`} title="Candles">
                <BarChart2 size={14} />
              </button>
              <button onClick={() => setChartType('line')}
                className={`p-1 rounded transition-colors ${chartType === 'line' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`} title="Line">
                <Activity size={14} />
              </button>
            </div>"""
    new_buttons = """<div className="w-px h-4 bg-slate-800 mx-2"/>
            
            {/* Chart Type Dropdown */}
            <div className="relative">
              <button onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Chart Type">
                {chartType === 'candle' ? <BarChart2 size={14} /> : <Activity size={14} />}
                <ChevronDown size={12} className="text-slate-500" />
              </button>
              {showChartTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50">
                  <button onClick={() => { setChartType('candle'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 ${chartType === 'candle' ? 'text-blue-400' : 'text-slate-300'}`}>
                    <BarChart2 size={14}/> Candlestick
                  </button>
                  <button onClick={() => { setChartType('line'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 ${chartType === 'line' ? 'text-blue-400' : 'text-slate-300'}`}>
                    <Activity size={14}/> Line
                  </button>
                </div>
              )}
            </div>

            {/* Indicators Button */}
            <button onClick={() => setShowIndicatorsModal(true)}
              className="flex items-center gap-1.5 px-2 py-1 ml-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Indicators">
              <FunctionSquare size={14} />
              <span className="text-xs font-medium hidden md:block">Indicators</span>
            </button>"""
            
    if 'showChartTypeDropdown' not in c:
        c = c.replace(old_buttons, new_buttons)
        # If the old buttons weren't exactly matched, we can inject it before INTERVALS
        if '<FunctionSquare' not in c:
            intervals_target = '<div className="flex items-center gap-0.5 flex-wrap">'
            c = c.replace(intervals_target, new_buttons + '\n            ' + intervals_target)

# 5. Add the Indicator Legend to the chart pane overlay
legend_ui = """
          {/* Indicators Legend */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-0.5 pointer-events-none">
            {activeIndicators.map(ind => (
              <div key={ind.uid} className="group flex items-center gap-2 text-[11px] pointer-events-auto rounded hover:bg-slate-900/40 px-1 py-0.5">
                <span className="font-semibold" style={{ color: ind.color }}>{ind.shortName} {ind.length}</span>
                <span className="text-slate-400 hidden group-hover:inline-block truncate max-w-[80px]">{ind.name}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity ml-1">
                  <button className="text-slate-400 hover:text-white" onClick={() => setActiveIndicators(prev => prev.map(i => i.uid === ind.uid ? {...i, visible: !i.visible} : i))}>
                    {ind.visible ? <Eye size={12}/> : <EyeOff size={12}/>}
                  </button>
                  <button className="text-slate-400 hover:text-white" onClick={() => {}}><Settings2 size={12}/></button>
                  <button className="text-slate-400 hover:text-red-400" onClick={() => setActiveIndicators(prev => prev.filter(i => i.uid !== ind.uid))}><X size={12}/></button>
                </div>
              </div>
            ))}
          </div>
"""
if 'activeIndicators.map' not in c:
    c = c.replace('<div ref={containerRef} className="w-full h-full" />', '<div ref={containerRef} className="w-full h-full" />\n' + legend_ui)

# 6. Add IndicatorsModal component rendering at the end
modal_ui = """
      <IndicatorsModal 
        isOpen={showIndicatorsModal} 
        onClose={() => setShowIndicatorsModal(false)}
        onAddIndicator={(ind) => setActiveIndicators(prev => [...prev, ind])}
      />
"""
if '<IndicatorsModal' not in c:
    c = c.replace('<SettingsModal\n                isOpen={isSettingsModalOpen}', modal_ui + '\n              <SettingsModal\n                isOpen={isSettingsModalOpen}')

with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
    
print("Refactor Complete")
