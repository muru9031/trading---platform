import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Remove the old {hoveredCandle ? ... } from the header
ohlc_header_regex = re.compile(r'\{hoveredCandle \? \([\s\S]*?\) : null\)\}', re.MULTILINE)
c = ohlc_header_regex.sub('', c)

# 2. Inject the absolute positioned OHLC overlay and the Indicators Legend
overlay_ui = """
          {/* OHLCV Overlay (TradingView Style) */}
          <div className="absolute top-2 left-2 z-10 flex flex-col pointer-events-none">
            <div className="flex items-center gap-2 text-[11px] font-mono mb-1">
              {hoveredCandle || lastCandle ? (
                <>
                  <span className="text-slate-500">O <span className="text-slate-300">{(hoveredCandle || lastCandle).open.toFixed(2)}</span></span>
                  <span className="text-slate-500">H <span className="text-slate-300">{(hoveredCandle || lastCandle).high.toFixed(2)}</span></span>
                  <span className="text-slate-500">L <span className="text-slate-300">{(hoveredCandle || lastCandle).low.toFixed(2)}</span></span>
                  <span className="text-slate-500">C <span className="text-slate-300">{(hoveredCandle || lastCandle).close.toFixed(2)}</span></span>
                  {(hoveredCandle || lastCandle).volume !== undefined && (
                    <span className="text-slate-500">Vol <span className="text-slate-300">{(hoveredCandle || lastCandle).volume.toLocaleString()}</span></span>
                  )}
                </>
              ) : null}
            </div>
            
            {/* Indicators Legend */}
            {activeIndicators.map(ind => (
              <div key={ind.uid} className="group flex items-center gap-2 text-[11px] pointer-events-auto rounded hover:bg-slate-900/40 px-1 py-0.5 w-fit">
                <span className="font-semibold" style={{ color: ind.color }}>{ind.shortName} {ind.length}</span>
                <span className="text-slate-400 hidden group-hover:inline-block truncate max-w-[80px]">{ind.name}</span>
                
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity ml-1">
                  <button className="text-slate-400 hover:text-white" onClick={() => setActiveIndicators(prev => prev.map(i => i.uid === ind.uid ? {...i, visible: !i.visible} : i))}>
                    {ind.visible ? <Eye size={12}/> : <EyeOff size={12}/>}
                  </button>
                  <button className="text-slate-400 hover:text-white"><Settings2 size={12}/></button>
                  <button className="text-slate-400 hover:text-red-400" onClick={() => setActiveIndicators(prev => prev.filter(i => i.uid !== ind.uid))}><X size={12}/></button>
                </div>
              </div>
            ))}
          </div>
"""

# The container is: <div ref={containerRef} className="absolute inset-0"
# We'll inject right before it for safety, or right after it since they are both absolute siblings.
# Let's put it right after it.
if "OHLCV Overlay" not in c:
    # Use re.sub to inject after the div that has containerRef and absolute inset-0
    c = re.sub(r'(<div ref=\{containerRef\} className="absolute inset-0"[^>]*/>)', r'\1' + overlay_ui, c)

with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Applied strict layout fixes")
