const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/TradingChart.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  /ArrowUp, ArrowDown, Activity, Lock, Play, Square/g,
  'ArrowUp, ArrowDown, Activity, Scissors, Play, Square, Clock'
);

// 2. Market Status Helper
const helperCode = `
function getMarketStatus(exchange) {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const time = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (exchange === 'CRYPTO' || exchange === 'FOREX') return true;
  if (utcDay === 0 || utcDay === 6) return false;
  if (['NSE', 'BSE', 'MCX'].includes(exchange)) return time >= 3.75 && time <= 10.0;
  if (['NASDAQ', 'NYSE', 'AMEX', 'NYSE Arca'].includes(exchange)) return time >= 13.5 && time <= 21.0;
  return false;
}

class ErrorBoundary`;
content = content.replace(/class ErrorBoundary/g, helperCode);

// 3. LabelEditor
const newLabelEditor = `function LabelEditor({ drawing, onUpdate }) {
  if (!drawing) return null
  const isText = drawing.type === 'text'
  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-[#0f172a] border-t border-slate-700">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-slate-500">{isText ? 'Text:' : 'Label:'}</span>
        <input
          type="text"
          value={isText ? (drawing.text || '') : (drawing.label || '')}
          onChange={e => onUpdate(isText ? { text: e.target.value } : { label: e.target.value })}
          placeholder={isText ? 'Enter text...' : 'Optional label...'}
          onMouseDown={e => e.stopPropagation()}
          className="bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-200 px-1.5 py-0.5 outline-none focus:border-blue-500 w-32"
        />
      </div>
      <div className="flex items-center gap-1">
         <span className="text-[9px] text-slate-500">Align:</span>
         {['start','middle','end'].map(a => (
           <button key={a} onClick={() => onUpdate({ textAnchor: a })}
             className={\`px-1.5 py-0.5 text-[9px] rounded \${drawing.textAnchor===a||(!drawing.textAnchor && a==='middle') ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}\`}>
             {a==='start'?'Left':a==='middle'?'Center':'Right'}
           </button>
         ))}
      </div>
    </div>
  )
}`;
content = content.replace(/function LabelEditor[\s\S]*?export default function/, newLabelEditor + '\n\nexport default function');

// 4. State updates (Replay and Dragging)
content = content.replace(
  /const \[replayMode, setReplayMode\]     = useState\(false\)/,
  `const [replayMode, setReplayMode]     = useState(false)
  const [replayState, setReplayState]   = useState('none') // 'none', 'selecting', 'playing'
  const [isDragging, setIsDragging]     = useState(false)`
);

// 5. Click handler for Scissors mode
const oldClick = `if (tool === 'cursor') {`;
const newClick = `if (replayState === 'selecting') {
        const idx = liveDataRef.current.fullData.findIndex(c => Math.abs(c.time - time) < 2);
        if (idx !== -1) {
          const allData = [...liveDataRef.current.fullData];
          const visibleData = allData.slice(0, idx);
          const hiddenData  = allData.slice(idx);
          replayRef.current.hiddenData = hiddenData;
          replayRef.current.active     = true;
          if (candleRef.current) {
            candleRef.current.setData(visibleData);
            chart.timeScale().fitContent();
          }
          const iid = setInterval(() => {
            if (!replayRef.current.active || !replayRef.current.hiddenData.length) {
              clearInterval(iid); replayRef.current.intervalId = null; return;
            }
            const next = replayRef.current.hiddenData.shift();
            candleRef.current?.update(next);
          }, 500);
          replayRef.current.intervalId = iid;
          setReplayState('playing');
        }
        return;
      }
      
      if (tool === 'cursor') {`;
content = content.replace(oldClick, newClick);

// 6. Fix Live Polling Gap Logic & Latency
content = content.replace(/}, 2000\)/, '}, 1000)');

const oldWhileLoop = `let t = cur.time + ivSecs
            while (t < flooredTime) {
              const g = { time: t, open: cur.close, high: cur.close, low: cur.close, close: cur.close }
              candleRef.current?.update(g)
              volRef.current?.update({ time: t, value: 0, color: 'rgba(99,102,241,0.1)' })
              liveDataRef.current.fullData.push(g)
              t += ivSecs
            }
            updated = { time: flooredTime, open: candle.open||cur.close, high: candle.high||candle.close, low: candle.low||candle.close, close: candle.close }
            liveDataRef.current.fullData.push(updated)`;

const newGapLogic = `// Fix gap issue: Only inject dummy candles if the gap is very small (e.g., < 3 intervals)
            // Otherwise, we skip injection and let lightweight-charts skip the time natively.
            if (flooredTime - cur.time <= ivSecs * 3) {
              let t = cur.time + ivSecs
              while (t < flooredTime) {
                const g = { time: t, open: cur.close, high: cur.close, low: cur.close, close: cur.close }
                candleRef.current?.update(g)
                volRef.current?.update({ time: t, value: 0, color: 'rgba(99,102,241,0.1)' })
                liveDataRef.current.fullData.push(g)
                t += ivSecs
              }
            }
            updated = { time: flooredTime, open: candle.open||cur.close, high: candle.high||candle.close, low: candle.low||candle.close, close: candle.close }
            liveDataRef.current.fullData.push(updated)`;
content = content.replace(oldWhileLoop, newGapLogic);

// 7. Replay Button Logic
const oldToggleReplay = `const toggleReplay = () => {
    if (!replayMode) {
      const allData = [...liveDataRef.current.fullData]
      if (allData.length < 10) return
      const cutPoint = Math.floor(allData.length * 0.7)
      const visibleData = allData.slice(0, cutPoint)
      const hiddenData  = allData.slice(cutPoint)
      replayRef.current.hiddenData = hiddenData
      replayRef.current.active     = true
      if (candleRef.current) {
        candleRef.current.setData(visibleData)
        chartRef.current?.timeScale().fitContent()
      }
      const iid = setInterval(() => {
        if (!replayRef.current.active || !replayRef.current.hiddenData.length) {
          clearInterval(iid); replayRef.current.intervalId = null; return
        }
        const next = replayRef.current.hiddenData.shift()
        candleRef.current?.update(next)
      }, 500)
      replayRef.current.intervalId = iid
      setReplayMode(true)
    } else {
      replayRef.current.active = false
      if (replayRef.current.intervalId) { clearInterval(replayRef.current.intervalId); replayRef.current.intervalId = null }
      if (candleRef.current) {
        candleRef.current.setData(liveDataRef.current.fullData)
        chartRef.current?.timeScale().fitContent()
      }
      setReplayMode(false)
    }
  }`;

const newToggleReplay = `const toggleReplay = () => {
    if (!replayMode) {
      setReplayMode(true);
      setReplayState('selecting');
    } else {
      replayRef.current.active = false
      if (replayRef.current.intervalId) { clearInterval(replayRef.current.intervalId); replayRef.current.intervalId = null }
      if (candleRef.current) {
        candleRef.current.setData(liveDataRef.current.fullData)
        chartRef.current?.timeScale().fitContent()
      }
      setReplayMode(false)
      setReplayState('none')
    }
  }`;
content = content.replace(oldToggleReplay, newToggleReplay);

// 8. Drag Handle States
content = content.replace(/dragHandleRef.current = { drawingId, pointIdx }/g, "dragHandleRef.current = { drawingId, pointIdx }; setIsDragging(true)");
content = content.replace(/dragHandleRef.current = null/g, "dragHandleRef.current = null; setIsDragging(false)");
content = content.replace(/cursor: 'crosshair'/g, "cursor: isDragging ? 'grabbing' : 'grab'");
content = content.replace(/cursor: 'ns-resize'/g, "cursor: isDragging ? 'grabbing' : 'grab'");
content = content.replace(/<svg ref={svgRef} className="absolute inset-0 z-20"\n              style={{ width:'100%', height:'100%', display: showDrawings\?'block':'none', pointerEvents:'none' }}/,
`<svg ref={svgRef} className="absolute inset-0 z-20"
              style={{ width:'100%', height:'100%', display: showDrawings?'block':'none', pointerEvents:'none', userSelect: isDragging ? 'none' : 'auto' }}`);

// 9. Text alignment mapping
content = content.replace(/textAnchor="middle"/g, 'textAnchor={d.textAnchor || "middle"}');

// 10. Replay Button UI and Market Status Badge
content = content.replace(/<button onClick={toggleReplay}[\s\S]*?Replay'}[\s\S]*?<\/button>/,
`<button onClick={toggleReplay}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
              style={{
                background: replayMode ? 'rgba(245,158,11,0.15)' : '#1e293b',
                color: replayMode ? '#f59e0b' : '#94a3b8',
                border: replayMode ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
              }}>
              {replayState === 'selecting' ? <Scissors size={12}/> : replayState === 'playing' ? <Square size={12}/> : <Play size={12}/>} 
              {replayState === 'selecting' ? 'Cancel Cut' : replayState === 'playing' ? 'Stop Replay' : 'Replay'}
            </button>`);

content = content.replace(/\{displayExchange && \([\s\S]*?<\/span>[\s\S]*?\)\}/,
`{displayExchange && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase bg-slate-800 text-slate-400 border-slate-700">
                {displayExchange}
              </span>
            )}
            {info && (
              <span className={\`flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold \${getMarketStatus(EXCHANGE_MAP[info?.exchange] || info?.exchange) ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}\`}>
                <Clock size={10}/> {getMarketStatus(EXCHANGE_MAP[info?.exchange] || info?.exchange) ? 'Open' : 'Closed'}
              </span>
            )}`);
            
// 11. Scissors cursor over chart
content = content.replace(/style={{ cursor: activeTool !== 'cursor' \? 'crosshair' : 'default' }}/,
`style={{ cursor: replayState === 'selecting' ? 'url("data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><circle cx=\\'6\\' cy=\\'6\\' r=\\'3\\'/><circle cx=\\'6\\' cy=\\'18\\' r=\\'3\\'/><line x1=\\'20\\' y1=\\'4\\' x2=\\'8.12\\' y2=\\'15.88\\'/><line x1=\\'14.47\\' y1=\\'14.48\\' x2=\\'20\\' y2=\\'20\\'/><line x1=\\'8.12\\' y1=\\'8.12\\' x2=\\'12\\' y2=\\'12\\'/></svg>") 12 12, crosshair' : activeTool !== 'cursor' ? 'crosshair' : 'default' }}`);

// Add replay state to dependency array of live polling so it doesn't clash
content = content.replace(/replayMode\]\)/g, 'replayMode, replayState])');
content = content.replace(/if \(!activeTicker \|\| replayMode\) return/g, "if (!activeTicker || replayMode || replayState !== 'none') return");

fs.writeFileSync(file, content);
console.log('Successfully updated TradingChart.jsx');
