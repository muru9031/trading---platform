import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target_overlay = """            {/* OHLCV Overlay (TradingView Style) */}
            <div className="absolute top-2 left-2 z-10 flex flex-col pointer-events-none">
              <div className="flex items-center gap-3 text-[11px] font-mono mb-1">"""

new_overlay = """            {/* OHLCV Overlay (TradingView Style) */}
            <div className="absolute top-2 left-2 z-10 flex flex-col pointer-events-none">
              <div className="flex items-center gap-3 text-[11px] font-mono mb-1">
                <div className="flex items-center gap-1.5 mr-2">
                  <img src={getLogoUrl(activeTicker)} alt={activeTicker} className="w-4 h-4 rounded-full bg-slate-800 object-contain p-[1px] border border-slate-700" />
                  <span className="font-bold text-slate-200">{activeTicker}</span>
                </div>"""

if target_overlay in c:
    c = c.replace(target_overlay, new_overlay)
    with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Patched OHLCV Overlay with Logo")
else:
    print("Could not find target_overlay string!")
