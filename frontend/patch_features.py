import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add state imports and components if necessary
if 'IndicatorSettingsModal' not in c:
    c = c.replace("import IndicatorsModal from './IndicatorsModal.jsx'",
                  "import IndicatorsModal from './IndicatorsModal.jsx'\nimport IndicatorSettingsModal from './IndicatorSettingsModal.jsx'")

# 2. Add State variables
state_vars = """    const [favoriteTimeframes, setFavoriteTimeframes] = useState(['1m', '5m', '15m', '1H', '4H', '1D'])
    const [favoriteIndicators, setFavoriteIndicators] = useState([])
    const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false)
    const [isIndicatorSettingsOpen, setIsIndicatorSettingsOpen] = useState(false)
    const [settingsIndicator, setSettingsIndicator] = useState(null)"""

if 'favoriteTimeframes' not in c:
    c = c.replace("const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)",
                  "const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)\n" + state_vars)

# 3. Replace INTERVALS mapping with Dropdown + Favorites
old_intervals = """            <div className="flex items-center gap-0.5 flex-wrap">
              {INTERVALS.map(iv => (
                <button key={iv.label} onClick={() => setSelectedInterval(iv)}
                  className="text-xs px-2 py-0.5 rounded font-medium transition-all"
                  style={{
                    background: selectedInterval.label===iv.label ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: selectedInterval.label===iv.label ? '#3b82f6' : '#94a3b8',
                    border: selectedInterval.label===iv.label ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                  }}>
                  {iv.label}
                </button>
              ))}"""

new_intervals = """            <div className="flex items-center gap-0.5 flex-wrap">
              {/* Favorite Timeframes */}
              {INTERVALS.filter(iv => favoriteTimeframes.includes(iv.label)).map(iv => (
                <button key={iv.label} onClick={() => setSelectedInterval(iv)}
                  className="text-xs px-2 py-0.5 rounded font-medium transition-all"
                  style={{
                    background: selectedInterval.label===iv.label ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: selectedInterval.label===iv.label ? '#3b82f6' : '#94a3b8',
                    border: selectedInterval.label===iv.label ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                  }}>
                  {iv.label}
                </button>
              ))}

              <div className="w-px h-4 bg-slate-800 mx-1"/>

              {/* Timeframe Dropdown */}
              <div className="relative">
                <button onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="All Timeframes">
                  <span className="text-xs font-medium">{selectedInterval.label}</span>
                  <ChevronDown size={12} className="text-slate-500" />
                </button>
                {showTimeframeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Timeframes</div>
                    {INTERVALS.map(iv => {
                      const isFav = favoriteTimeframes.includes(iv.label);
                      return (
                        <div key={iv.label} className={`w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-800 group ${selectedInterval.label === iv.label ? 'text-blue-400' : 'text-slate-300'}`}>
                          <button className="flex-1 text-left" onClick={() => { setSelectedInterval(iv); setShowTimeframeDropdown(false) }}>{iv.label}</button>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-yellow-400"
                            style={{ opacity: isFav ? 1 : undefined, color: isFav ? '#facc15' : undefined }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavoriteTimeframes(prev => isFav ? prev.filter(f => f !== iv.label) : [...prev, iv.label]);
                            }}>
                            ★
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>"""

if target := old_intervals in c:
    c = c.replace(old_intervals, new_intervals)
else:
    # try fuzzy match
    import re
    c = re.sub(r'<div className="flex items-center gap-0\.5 flex-wrap">[\s\S]*?\{INTERVALS\.map\(iv => \([\s\S]*?\}\)[\s\S]*?</button>\s*\}\)\}', new_intervals, c)

# 4. Add Favorite Indicators to Header
# The target is right after {/* Indicators Button */}
target_ind_btn = """              {/* Indicators Button */}
              <button onClick={() => setShowIndicatorsModal(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Indicators">
                <FunctionSquare size={14} />
                <span className="text-xs font-medium hidden md:block">Indicators</span>
              </button>
            </div>"""

new_ind_btn = """              {/* Indicators Button */}
              <button onClick={() => setShowIndicatorsModal(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Indicators">
                <FunctionSquare size={14} />
                <span className="text-xs font-medium hidden md:block">Indicators</span>
              </button>
              
              {/* Favorite Indicators Quick Add */}
              {favoriteIndicators.length > 0 && (
                <>
                  <div className="w-px h-4 bg-slate-800 mx-1"/>
                  {favoriteIndicators.map(ind => (
                    <button key={ind.uid} onClick={() => setActiveIndicators(prev => [...prev, {...ind, uid: Date.now().toString()}])}
                      className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors truncate max-w-[100px]"
                      title={ind.name}>
                      {ind.shortName}
                    </button>
                  ))}
                </>
              )}
            </div>"""

if target_ind_btn in c:
    c = c.replace(target_ind_btn, new_ind_btn)


# 5. Extract Modals outside selDrawing
# Find where `<IndicatorsModal` is and remove it.
# It's currently in:
#       <IndicatorsModal 
#         isOpen={showIndicatorsModal} 
#         onClose={() => setShowIndicatorsModal(false)}
#         onAddIndicator={(ind) => setActiveIndicators(prev => [...prev, ind])}
#       />
modals_regex = re.compile(r'\s*<IndicatorsModal[\s\S]*?/>\s*<SettingsModal[\s\S]*?/>')
match = modals_regex.search(c)
if match:
    modals_str = match.group(0)
    c = modals_regex.sub('', c)
    # Inject it before chart container
    c = c.replace('{/* chart container */}', f"{modals_str}\n\n            {{/* chart container */}}")

# 6. Setup the Settings click in the legend
c = c.replace('<button className="text-slate-400 hover:text-white"><Settings2 size={12}/></button>',
              '<button className="text-slate-400 hover:text-white" onClick={() => { setSettingsIndicator(ind); setIsIndicatorSettingsOpen(true); }}><Settings2 size={12}/></button>')

# 7. Add IndicatorSettingsModal to the render tree
if 'IndicatorSettingsModal isOpen=' not in c:
    c = c.replace('{/* chart container */}', 
                  "{/* chart container */}\n            <IndicatorSettingsModal isOpen={isIndicatorSettingsOpen} onClose={() => setIsIndicatorSettingsOpen(false)} indicator={settingsIndicator} onSave={(updated) => setActiveIndicators(prev => prev.map(i => i.uid === updated.uid ? updated : i))} />\n")

with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("Patched TradingChart.jsx")
