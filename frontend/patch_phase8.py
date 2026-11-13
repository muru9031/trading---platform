import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. State for chartType and hoveredCandle
if "const [chartType, setChartType] = useState('candle')" not in c:
    c = c.replace("const [activeTool, setActiveTool]     = useState('cursor')",
                  "const [activeTool, setActiveTool]     = useState('cursor')\n  const [chartType, setChartType] = useState('candle')\n  const [hoveredCandle, setHoveredCandle] = useState(null)")

# 2. Add LineChart icon to lucide-react imports if missing
if "BarChart2" not in c:
    c = c.replace("import {\n  RefreshCw", "import {\n  BarChart2, RefreshCw")

# 3. Add Crosshair move logic in useEffect
crosshair_logic = """
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData || !candleRef.current) {
          setHoveredCandle(null)
          return
        }
        const data = param.seriesData.get(candleRef.current)
        if (data) {
          setHoveredCandle({
            time: param.time,
            open: data.open !== undefined ? data.open : data.value,
            high: data.high !== undefined ? data.high : data.value,
            low: data.low !== undefined ? data.low : data.value,
            close: data.close !== undefined ? data.close : data.value,
            volume: volRef.current ? param.seriesData.get(volRef.current)?.value : undefined
          })
        }
      })
"""
if 'chart.subscribeCrosshairMove' not in c:
    c = c.replace('chart.subscribeClick((param) => {', crosshair_logic + '\n      chart.subscribeClick((param) => {')


# 4. Inject value into WebSocket and Polling data for LineSeries compatibility
if 'value: parseFloat(k.c)' not in c:
    c = c.replace('close: parseFloat(k.c)\n              }', 'close: parseFloat(k.c),\n                value: parseFloat(k.c)\n              }')
if 'value: candle.close' not in c:
    c = c.replace('close: candle.close \n                }', 'close: candle.close,\n                  value: candle.close\n                }')
    c = c.replace('close: candle.close }', 'close: candle.close, value: candle.close }')
if 'c.value = c.close' not in c:
    c = c.replace('if (!candleRef.current) return\n      candleRef.current.setData(data.candles)', 'data.candles.forEach(c => c.value = c.close)\n      if (!candleRef.current) return\n      candleRef.current.setData(data.candles)')

# 5. ChartType Effect
chart_type_effect = """
  const prevChartTypeRef = useRef(chartType)
  useEffect(() => {
    if (!chartRef.current || !liveDataRef.current.fullData) return;
    if (prevChartTypeRef.current === chartType) return;
    prevChartTypeRef.current = chartType;
    
    if (candleRef.current) {
      chartRef.current.removeSeries(candleRef.current);
    }
    
    if (chartType === 'line') {
      const ls = chartRef.current.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
      });
      ls.setData(liveDataRef.current.fullData);
      candleRef.current = ls;
    } else {
      const cs = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#10b981', downColor: '#ef4444',
        borderUpColor: '#10b981', borderDownColor: '#ef4444',
        wickUpColor:   '#10b981', wickDownColor:   '#ef4444',
      });
      cs.setData(liveDataRef.current.fullData);
      candleRef.current = cs;
    }
  }, [chartType]);
"""
if 'const prevChartTypeRef' not in c:
    c = c.replace('useEffect(() => { fetchData(false) }, [fetchData])', 'useEffect(() => { fetchData(false) }, [fetchData])\n' + chart_type_effect)

# 6. UI: Chart Type Toggle Buttons
toggle_ui = """
            <div className="flex items-center gap-0.5 mr-2">
              <button onClick={() => setChartType('candle')}
                className={`p-1 rounded transition-colors ${chartType === 'candle' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`} title="Candles">
                <BarChart2 size={14} />
              </button>
              <button onClick={() => setChartType('line')}
                className={`p-1 rounded transition-colors ${chartType === 'line' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`} title="Line">
                <Activity size={14} />
              </button>
            </div>
            <div className="w-px h-4 bg-slate-800 mr-2"/>
"""
if 'onClick={() => setChartType(' not in c:
    c = c.replace('<div className="w-px h-4 bg-slate-800"/>\n\n            <div className="flex items-center gap-0.5 flex-wrap">', toggle_ui + '\n            <div className="flex items-center gap-0.5 flex-wrap">')

# 7. UI: OHLCV display
ohlcv_ui = """
            {hoveredCandle ? (
              <div className="flex items-center gap-3 text-[10px] font-mono ml-4">
                <span className="text-slate-400">O <span className="text-slate-200 font-semibold">{fmtPrice(hoveredCandle.open, currency)}</span></span>
                <span className="text-slate-400">H <span className="text-slate-200 font-semibold">{fmtPrice(hoveredCandle.high, currency)}</span></span>
                <span className="text-slate-400">L <span className="text-slate-200 font-semibold">{fmtPrice(hoveredCandle.low, currency)}</span></span>
                <span className="text-slate-400">C <span className="text-slate-200 font-semibold">{fmtPrice(hoveredCandle.close, currency)}</span></span>
                {hoveredCandle.volume !== undefined && <span className="text-slate-400">V <span className="text-slate-200 font-semibold">{hoveredCandle.volume.toLocaleString()}</span></span>}
              </div>
            ) : (lastCandle ? (
              <div className="flex items-center gap-3 text-[10px] font-mono ml-4">
                <span className="text-slate-400">O <span className="text-slate-200 font-semibold">{fmtPrice(lastCandle.open, currency)}</span></span>
                <span className="text-slate-400">H <span className="text-slate-200 font-semibold">{fmtPrice(lastCandle.high, currency)}</span></span>
                <span className="text-slate-400">L <span className="text-slate-200 font-semibold">{fmtPrice(lastCandle.low, currency)}</span></span>
                <span className="text-slate-400">C <span className="text-slate-200 font-semibold">{fmtPrice(lastCandle.close, currency)}</span></span>
                {lastCandle.volume !== undefined && <span className="text-slate-400">V <span className="text-slate-200 font-semibold">{lastCandle.volume.toLocaleString()}</span></span>}
              </div>
            ) : null)}
"""
if 'hoveredCandle ? (' not in c:
    c = c.replace('{info?.name && <span className="text-xs hidden lg:block truncate max-w-[150px] \ntext-slate-400">{info.name}</span>}\n            </div>', '{info?.name && <span className="text-xs hidden lg:block truncate max-w-[150px] text-slate-400">{info.name}</span>}\n            </div>\n' + ohlcv_ui)


with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Patch Applied Successfully')
