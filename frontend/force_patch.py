import re
import sys

try:
    with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Inject OHLCV UI
    # Target:
    # {info?.name && <span className="text-xs hidden lg:block truncate max-w-[150px] text-slate-400">{info.name}</span>}
    # </div>
    ohlcv_target = re.compile(r'(\{info\?\.name && <span className="text-xs hidden lg:block truncate max-w-\[150px\]\s*text-slate-400">\{info\.name\}</span>\}\s*</div>)')
    
    ohlcv_ui = """\\1
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
            ) : null)}"""
            
    if 'hoveredCandle ? (' not in c:
        c, count = ohlcv_target.subn(ohlcv_ui, c)
        print(f"Injected OHLCV UI: {count} matches")

    # 2. Inject Toggle Buttons
    # Target:
    # <div className="w-px h-4 bg-slate-800"/>
    # <div className="flex items-center gap-0.5 flex-wrap">
    # {INTERVALS.map
    toggle_target = re.compile(r'(<div className="w-px h-4 bg-slate-800"/>\s*<div className="flex items-center gap-0\.5 flex-wrap">)')
    
    toggle_ui = """<div className="w-px h-4 bg-slate-800 mr-2"/>
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
            \\1"""
            
    if 'onClick={() => setChartType(' not in c:
        c, count = toggle_target.subn(toggle_ui, c)
        print(f"Injected Toggle UI: {count} matches")

    with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
        
except Exception as e:
    print(f"Error: {e}")
