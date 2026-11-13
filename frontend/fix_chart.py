import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# The incorrect injection that happened previously:
bad_injection = """          <div className="w-px h-4 bg-slate-800 mr-2"/>
              <div className="flex items-center gap-1 mr-2">
                {/* Chart Type Dropdown */}
                <div className="relative">
                  <button onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Chart Type">
                    {chartType === 'candle' ? <BarChart2 size={14} /> : <Activity size={14} />}
                    <ChevronDown size={12} className="text-slate-500" />
                  </button>
                  {showChartTypeDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50">
                      <button onClick={() => { setChartType('candle'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 ${chartType === 'candle' ? 'text-blue-400' : 'text-slate-300'}`}>
                        <BarChart2 size={14}/> Candles
                      </button>
                      <button onClick={() => { setChartType('line'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 ${chartType === 'line' ? 'text-blue-400' : 'text-slate-300'}`}>
                        <Activity size={14}/> Line
                      </button>
                    </div>
                  )}
                </div>

                {/* Indicators Button */}
                <button onClick={() => setShowIndicatorsModal(true)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Indicators">
                  <FunctionSquare size={14} />
                  <span className="text-xs font-medium hidden md:block">Indicators</span>
                </button>
              </div>    <div className="w-px h-5 bg-slate-700/50 mx-1 hidden sm:block"/>"""

# Remove bad injection
if 'className="w-px h-5 bg-slate-700/50 mx-1 hidden sm:block"/>' in bad_injection:
    c = c.replace(bad_injection, '          <div className="w-px h-5 bg-slate-700/50 mx-1 hidden sm:block"/>')
    print('Removed bad injection')

# The target old buttons to replace:
target_old = """          <div className="w-px h-4 bg-slate-800 mr-2"/>
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

correct_injection = """          <div className="w-px h-4 bg-slate-800 mr-2"/>
            <div className="flex items-center gap-1 mr-2">
              {/* Chart Type Dropdown */}
              <div className="relative">
                <button onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Chart Type">
                  {chartType === 'candle' ? <BarChart2 size={14} /> : <Activity size={14} />}
                  <ChevronDown size={12} className="text-slate-500" />
                </button>
                {showChartTypeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50">
                    <button onClick={() => { setChartType('candle'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 ${chartType === 'candle' ? 'text-blue-400' : 'text-slate-300'}`}>
                      <BarChart2 size={14}/> Candles
                    </button>
                    <button onClick={() => { setChartType('line'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 ${chartType === 'line' ? 'text-blue-400' : 'text-slate-300'}`}>
                      <Activity size={14}/> Line
                    </button>
                  </div>
                )}
              </div>

              {/* Indicators Button */}
              <button onClick={() => setShowIndicatorsModal(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="Indicators">
                <FunctionSquare size={14} />
                <span className="text-xs font-medium hidden md:block">Indicators</span>
              </button>
            </div>"""

if target_old in c:
    c = c.replace(target_old, correct_injection)
    print('Injected Correct Dropdown')
else:
    print('Failed to find target_old')

with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
