import os
import re

# 1. Patch SettingsModal.jsx (Remove extend left/right for Horizontal and Ray)
sm_path = 'src/components/SettingsModal.jsx'
with open(sm_path, 'r', encoding='utf-8') as f:
    sm_content = f.read()

sm_target = """    if (config.type === 'trendline' || config.type === 'ray' || config.type === 'horizontal') {"""
sm_repl = """    if (config.type === 'trendline') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Extend Left</span>
            <input type="checkbox" checked={config.extendLeft || false} 
              onChange={(e) => handleChange('extendLeft', e.target.checked)}
              className="w-4 h-4 bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Extend Right</span>
            <input type="checkbox" checked={config.extendRight || false} 
              onChange={(e) => handleChange('extendRight', e.target.checked)}
              className="w-4 h-4 bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Show Price Label on Y-Axis</span>
            <input type="checkbox" checked={config.showPriceLabel !== false} 
              onChange={(e) => handleChange('showPriceLabel', e.target.checked)}
              className="w-4 h-4 bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
        </div>
      )
    }
    if (config.type === 'ray' || config.type === 'horizontal') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Show Price Label on Y-Axis</span>
            <input type="checkbox" checked={config.showPriceLabel !== false} 
              onChange={(e) => handleChange('showPriceLabel', e.target.checked)}
              className="w-4 h-4 bg-slate-800 border-slate-600 rounded focus:ring-blue-500" />
          </div>
        </div>
      )
    }"""
sm_content = sm_content.replace(sm_target, sm_repl)
with open(sm_path, 'w', encoding='utf-8') as f:
    f.write(sm_content)


# 2. Patch TradingChart.jsx
tc_path = 'src/components/TradingChart.jsx'
with open(tc_path, 'r', encoding='utf-8') as f:
    tc = f.read()

# a) Fix getMarketStatus time bug. Make sure it spans proper hours regardless of server offset, or just use 3.75 - 10.0 for IST. 
# Also, US market logic. Since user is in India, let's just make getMarketStatus more robust or log it.
# The user wants "time > 3.75 && time < 10.0" which works. I'll just change the text or make it globally available.
tc = tc.replace("""    if (['NSE', 'BSE', 'MCX'].includes(exchange)) return time >= 3.75 && time <= 10.0;""",
"""    if (['NSE', 'BSE', 'MCX', 'BOM'].includes(exchange) || (exchange && exchange.includes('.NS'))) return time >= 3.75 && time <= 10.0;""")


# b) Fix Settings Live Preview in TradingChart.jsx 
# The issue is `updateDrawing` only sets local state and doesn't persist properly, OR
# `commitDrawings` does both. Wait, `updateDrawing` using `setDrawings` is correct for live updates.
# BUT we need to ensure the onSave uses `commitDrawings`.
# We already did this? Let's check `updateDrawing`.
# We need to change the `<SettingsModal>` props.
old_modal = """<SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                selectedDrawing={selDrawing}
                onSave={updateDrawing}
                onUpdate={updateDrawing}
              />"""
new_modal = """<SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                selectedDrawing={selDrawing}
                onSave={(id, updates) => commitDrawings(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))}
                onUpdate={(id, updates) => setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))}
              />"""
tc = tc.replace(old_modal, new_modal)
# If it wasn't replaced by previous patch, do this:
old_modal_2 = """<SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                selectedDrawing={selDrawing}
                onSave={updateDrawing}
              />"""
tc = tc.replace(old_modal_2, new_modal)


# c) Fix Horizontal and Ray Default Drawing Behavior
# For `horizontal`, draw full width across the chart regardless of extend settings.
# For `ray`, extend right from `p1`.
horizontal_target = """        case 'horizontal': {
          const yCoord = p1.y
          const W = chartRef.current?.timeScale().width() || 2000
          const ex1 = d.extendLeft ? 0 : p1.x
          const ex2 = d.extendRight ? W : (coords.length > 1 ? p2.x : W)"""

horizontal_repl = """        case 'horizontal': {
          const yCoord = p1.y
          const W = chartRef.current?.timeScale().width() || 2000
          const ex1 = 0; // Always extend left
          const ex2 = W; // Always extend right"""
tc = tc.replace(horizontal_target, horizontal_repl)

ray_target = """        case 'ray': {
          if (coords.length < 2) { body = <circle cx={p1.x} cy={p1.y} r={4} fill={col}/>; break }
          const m = (p2.y - p1.y) / (p2.x - p1.x)
          const W = chartRef.current?.timeScale().width() || 2000
          const ex = d.extendRight ? (p2.x > p1.x ? W : 0) : p2.x
          const ey = p1.y + m * (ex - p1.x)
          body = (
            <g opacity={op}>
              <line x1={p1.x} y1={p1.y} x2={ex} y2={ey} stroke={col} strokeWidth={wid} strokeDasharray={dash}/>"""

ray_repl = """        case 'ray': {
          if (coords.length < 2) { body = <circle cx={p1.x} cy={p1.y} r={4} fill={col}/>; break }
          const m = (p2.y - p1.y) / (p2.x - p1.x)
          const W = chartRef.current?.timeScale().width() || 2000
          const ex = (p2.x > p1.x ? W : 0); // Always extend right
          const ey = p1.y + m * (ex - p1.x)
          body = (
            <g opacity={op}>
              <line x1={p1.x} y1={p1.y} x2={ex} y2={ey} stroke={col} strokeWidth={wid} strokeDasharray={dash}/>"""
tc = tc.replace(ray_target, ray_repl)

# d) Fix Long/Short Tools Handles and Dragging
ls_render_target = """        case 'short': {
          if (coords.length < 3) { body = <circle cx={p1.x} cy={p1.y} r={5} fill={col}/>; break }
          const p3 = coords[2]
          const isLong = d.type === 'long'
          const eY = p1.y, tY = p2.y, sY = p3.y
          const eP = p1.price, tP = p2.price, sP = p3.price
          const rr = Math.abs(eP - sP) > 0 ? (Math.abs(tP-eP)/Math.abs(eP-sP)).toFixed(2) : '∞'
          const W  = Math.max(p2.x - p1.x, 50)
          const chartW = chartRef.current?.timeScale().width() || 2000
          
          const tpDragArea = isSel ? (
            <rect x={p1.x} y={tY - 5} width={W} height={10} fill="transparent" style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 1)}/>
          ) : null
          const slDragArea = isSel ? (
            <rect x={p1.x} y={sY - 5} width={W} height={10} fill="transparent" style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 2)}/>
          ) : null
          
          const durationHandle = isSel ? (
            <g style={{pointerEvents:'all',cursor:'ew-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 3)}>
               <circle cx={p1.x + W} cy={eY} r={4} fill="#fff" stroke={col} strokeWidth={2}/>
               <path d={`M${p1.x + W} ${Math.min(eY, tY)} L${p1.x + W} ${Math.max(eY, sY)}`} stroke={col} strokeWidth={1} strokeDasharray="3 3" />
            </g>
          ) : null"""

ls_render_repl = """        case 'short': {
          if (coords.length < 3) { body = <circle cx={p1.x} cy={p1.y} r={5} fill={col}/>; break }
          const p3 = coords[2]
          const isLong = d.type === 'long'
          const eY = p1.y, tY = p2.y, sY = p3.y
          const eP = p1.price, tP = p2.price, sP = p3.price
          const rr = Math.abs(eP - sP) > 0 ? (Math.abs(tP-eP)/Math.abs(eP-sP)).toFixed(2) : '∞'
          const W  = Math.max(p2.x - p1.x, 50)
          
          // --- HORIZONTAL AND VERTICAL DRAG HANDLES ---
          
          // Entry price adjustment (Central vertical drag)
          const entryDragArea = isSel ? (
             <g style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'entryLine')}>
                 <rect x={p1.x} y={eY - 10} width={W} height={20} fill="transparent" />
                 <circle cx={p1.x + W/2} cy={eY} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
             </g>
          ) : null
          
          // TP & SL vertical adjustment handles
          const tpDragArea = isSel ? (
             <g style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 1)}>
                <rect x={p1.x} y={tY - 5} width={W} height={10} fill="transparent" />
             </g>
          ) : null
          const slDragArea = isSel ? (
             <g style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 2)}>
                <rect x={p1.x} y={sY - 5} width={W} height={10} fill="transparent" />
             </g>
          ) : null
          
          // Time/Duration horizontal stretch handles (Left and Right edges)
          const leftDurationHandle = isSel ? (
            <g style={{pointerEvents:'all',cursor:'ew-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 0)}>
               <circle cx={p1.x} cy={eY} r={4} fill="#fff" stroke={col} strokeWidth={2}/>
            </g>
          ) : null
          const rightDurationHandle = isSel ? (
            <g style={{pointerEvents:'all',cursor:'ew-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'rightEdge')}>
               <circle cx={p1.x + W} cy={eY} r={4} fill="#fff" stroke={col} strokeWidth={2}/>
               <path d={`M${p1.x + W} ${Math.min(eY, tY)} L${p1.x + W} ${Math.max(eY, sY)}`} stroke={col} strokeWidth={1} strokeDasharray="3 3" />
            </g>
          ) : null"""
tc = tc.replace(ls_render_target, ls_render_repl)


ls_handle_target = """          } else if (d.type === 'long' || d.type === 'short') {
            if (pi === 3) {
              if (pts.length > 1) pts[1].time = time;
              if (pts.length > 2) pts[2].time = time;
            } else {
              if (pts[pi]) pts[pi] = { time, price }
              if (pi === 1 && pts.length > 2) pts[2].time = time;
              if (pi === 2 && pts.length > 1) pts[1].time = time;
            }
          }"""

ls_handle_repl = """          } else if (d.type === 'long' || d.type === 'short') {
            if (pi === 'rightEdge') {
              // Right Edge: Adjust time for P2 and P3
              if (pts.length > 1) pts[1].time = time;
              if (pts.length > 2) pts[2].time = time;
            } else if (pi === 'entryLine') {
              // Center Entry: Adjust all prices vertically, maintaining absolute time 
              // Wait, Lightweight charts price drag logic: we want to keep TP/SL offset.
              // So calculate offset from previous entry and apply to new entry price.
              const oldEntry = originalPoints[0].price;
              const tpDiff = originalPoints[1].price - oldEntry;
              const slDiff = originalPoints[2].price - oldEntry;
              
              if (pts[0]) pts[0].price = price;
              if (pts[1]) pts[1].price = price + tpDiff;
              if (pts[2]) pts[2].price = price + slDiff;
            } else if (pi === 0) {
              // Left Edge: Adjust time for P1
              if (pts[0]) pts[0].time = time;
            } else {
              if (pts[pi]) pts[pi] = { time, price }
              // Ensure TP/SL align horizontally with Entry's time
              if (pi === 1 && pts.length > 2) pts[2].time = time;
              if (pi === 2 && pts.length > 1) pts[1].time = time;
            }
          }"""
tc = tc.replace(ls_handle_target, ls_handle_repl)

# e) Make Long/Short UI better (thicker lines, better text scaling)
# Wait, this might be too much CSS tweaking, let's just make sure handles work first.
# "athu evalo chinnama iruku nu paru"
# This might be because the default SL/TP is 2% and 1% of the price. 
# For penny stocks or extremely large stocks, 2% could look weird.
# Actually, the user's screenshot shows an Apple stock (AAPL) at $326. The R:R is 2.00, meaning TP is 2x the SL distance. But the box looks tiny on a 1D chart.
# Why? Because maybe 2% of $326 is $6.5, which might be tiny on a zoomed-out 10-year chart.
# To make it dynamically sized, we can use ATR or just a fixed percentage. It is already 1.02 and 0.98. That's fine. The issue is they want to be able to drag it to make it bigger, and my dragging fix for horizontal scaling + entry scaling solves this.

# f) Countdown timer only when market is open
countdown_target = """      const countdownId = setInterval(() => {
        const nowSec = Math.floor(Date.now() / 1000)
        const remain = ivSecs - (nowSec % ivSecs)
        const mm = Math.floor(remain / 60).toString().padStart(2, '0')
        const ss = (remain % 60).toString().padStart(2, '0')
        setCountdownStr(ivSecs >= 3600 ? '' : `${mm}:${ss}`)
        candleCountdownRef.current = ivSecs >= 3600 ? '' : `${mm}:${ss}`
      }, 1000)"""

countdown_repl = """      const countdownId = setInterval(() => {
        const isOpen = getMarketStatus(EXCHANGE_MAP[infoRef.current?.exchange] || infoRef.current?.exchange);
        if (!isOpen) {
           setCountdownStr('');
           candleCountdownRef.current = '';
           return;
        }
        
        const nowSec = Math.floor(Date.now() / 1000)
        const remain = ivSecs - (nowSec % ivSecs)
        const mm = Math.floor(remain / 60).toString().padStart(2, '0')
        const ss = (remain % 60).toString().padStart(2, '0')
        setCountdownStr(ivSecs >= 3600 ? '' : `${mm}:${ss}`)
        candleCountdownRef.current = ivSecs >= 3600 ? '' : `${mm}:${ss}`
      }, 1000)"""
tc = tc.replace(countdown_target, countdown_repl)

# Inject infoRef to access info inside useEffect
if "const infoRef = useRef(info)" not in tc:
    tc = tc.replace("const stateRef = useRef(state)", "const stateRef = useRef(state)\n    const infoRef = useRef(state.info)\n    useEffect(() => { infoRef.current = state.info }, [state.info])")


with open(tc_path, 'w', encoding='utf-8') as f:
    f.write(tc)

