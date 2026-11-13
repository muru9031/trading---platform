const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/TradingChart.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Combine DrawingToolbar and LabelEditor into a Floating Toolbar
const oldToolbarMatch = content.match(/function DrawingToolbar\([\s\S]*?function LabelEditor[\s\S]*?export default function TradingChart/);

const newToolbar = `
// ── TradingView-style Floating Toolbar ──────────────────────────────────────
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f8fafc', '#94a3b8'];

function FloatingToolbar({ drawing, onUpdate, onDelete, onClose, initialPos }) {
  const [pos, setPos] = useState(initialPos || { x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => setPos(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); }
  }, [dragging]);

  if (!drawing) return null;
  const col = drawing.color || '#3b82f6';
  const isText = drawing.type === 'text';
  const hasText = isText || drawing.type === 'horizontal';

  return (
    <div
      className="fixed z-[9999] flex flex-col bg-[#0f172a] border border-slate-700 rounded-md shadow-xl select-none"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Drag Handle & Main Tools */}
      <div className="flex items-center gap-0">
        <div 
          ref={dragRef}
          onMouseDown={() => setDragging(true)}
          className="w-6 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors border-r border-slate-700" title="Drag">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="7" cy="7" r="1.5"/><circle cx="3" cy="11" r="1.5"/><circle cx="7" cy="11" r="1.5"/></svg>
        </div>

        {/* Color Palette Toggle */}
        <div className="relative">
          <button onClick={() => setShowPalette(!showPalette)} className="flex items-center justify-center w-9 h-8 hover:bg-slate-800 transition-colors">
            <div className="w-5 h-5 rounded-sm border border-slate-600" style={{ backgroundColor: col }}/>
          </button>
          {showPalette && (
            <div className="absolute top-9 left-0 bg-[#1e293b] p-2 rounded border border-slate-600 shadow-2xl grid grid-cols-4 gap-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => { onUpdate({ color: c }); setShowPalette(false); }} className="w-5 h-5 rounded-sm hover:scale-110 transition-transform" style={{ backgroundColor: c }}/>
              ))}
            </div>
          )}
        </div>

        {!isText && (
          <>
            <div className="w-px h-5 bg-slate-700"/>
            {/* Line styles */}
            {['solid','dashed','dotted'].map(s => (
              <button key={s} onClick={() => onUpdate({ style: s })} title={s}
                className={\`w-9 h-8 flex items-center justify-center text-[11px] font-mono transition-colors \${(drawing.style||'solid')===s ? 'bg-blue-500/20 text-blue-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}>
                {s==='solid'?'─':s==='dashed'?'╌':'·'}
              </button>
            ))}
            <div className="w-px h-5 bg-slate-700"/>
            {/* Thickness */}
            <div className="flex items-center px-2 gap-1">
              {[1,2,3].map(w => (
                <button key={w} onClick={() => onUpdate({ width: w })} title={\`\${w}px\`}
                  className={\`flex items-center justify-center transition-colors rounded \${(drawing.width||2)===w?'text-blue-500':'text-slate-500 hover:text-slate-300'}\`}>
                  <div className="rounded-full bg-current" style={{ width: w*3+4, height: w, minWidth: 7 }}/>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="w-px h-5 bg-slate-700"/>
        <button onClick={onDelete} className="w-9 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
          <Trash2 size={14}/>
        </button>
        <button onClick={onClose} className="w-9 h-8 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors border-l border-slate-700" title="Deselect">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>

      {/* Label Editor */}
      {hasText && (
        <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-[#0f172a] border-t border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-500">{isText ? 'Text:' : 'Label:'}</span>
            <input
              type="text"
              value={isText ? (drawing.text || '') : (drawing.label || '')}
              onChange={e => onUpdate(isText ? { text: e.target.value } : { label: e.target.value })}
              placeholder={isText ? 'Enter text...' : 'Optional label...'}
              onMouseDown={e => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-200 px-1.5 py-0.5 outline-none focus:border-blue-500 w-full"
            />
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
               <span className="text-[9px] text-slate-500">Align:</span>
               {['start','middle','end'].map(a => (
                 <button key={a} onClick={() => onUpdate({ textAnchor: a })}
                   className={\`px-1.5 py-0.5 text-[9px] rounded \${(drawing.textAnchor===a||(!drawing.textAnchor && a==='middle')) ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}\`}>
                   {a==='start'?'Left':a==='middle'?'Center':'Right'}
                 </button>
               ))}
            </div>
            {!isText && (
              <div className="flex items-center gap-1">
                 {['top','middle','bottom'].map(a => (
                   <button key={a} onClick={() => onUpdate({ textVertical: a })}
                     className={\`px-1.5 py-0.5 text-[9px] rounded \${(drawing.textVertical===a||(!drawing.textVertical && a==='top')) ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}\`}>
                     {a==='top'?'Top':a==='middle'?'Mid':'Bot'}
                   </button>
                 ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TradingChart`;
content = content.replace(oldToolbarMatch[0], newToolbar);

// 2. Refactor Box to 8 handles
const oldBox = /case 'box': \{[\s\S]*?break\s*\}/;
const newBox = `case 'box': {
        const mx = Math.min(p1.x, p2.x), my = Math.min(p1.y, p2.y)
        const mw = Math.abs(p2.x - p1.x), mh = Math.abs(p2.y - p1.y)
        body = (
          <g opacity={op}>
            <rect x={mx} y={my} width={mw} height={mh} fill={col+"33"} stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
            {d.label && (
              <text 
                x={d.textAnchor === 'start' ? mx+4 : d.textAnchor === 'end' ? mx+mw-4 : mx+mw/2} 
                y={d.textVertical === 'bottom' ? my+mh-4 : d.textVertical === 'middle' ? my+mh/2 : my+14} 
                fill={col} fontSize="12" fontWeight="500" 
                textAnchor={d.textAnchor || 'middle'}>
                {d.label}
              </text>
            )}
          </g>
        )
        // Ensure handles are placed at corners and edges
        if (selectedId === d.id && !drawingWip) {
          const makeHandle = (hx, hy, cursor, pointIdx) => (
            <circle cx={hx} cy={hy} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1} style={{ cursor: isDragging ? 'grabbing' : cursor }}
              onMouseDown={e => { e.stopPropagation(); dragHandleRef.current = { drawingId: d.id, pointIdx }; setIsDragging(true); }}/>
          );
          handles = (
            <g>
              {makeHandle(mx, my, 'nwse-resize', 0)}
              {makeHandle(mx+mw, my+mh, 'nwse-resize', 1)}
              {makeHandle(mx+mw, my, 'nesw-resize', 2)}
              {makeHandle(mx, my+mh, 'nesw-resize', 3)}
              {makeHandle(mx+mw/2, my, 'ns-resize', 4)}
              {makeHandle(mx+mw/2, my+mh, 'ns-resize', 5)}
              {makeHandle(mx, my+mh/2, 'ew-resize', 6)}
              {makeHandle(mx+mw, my+mh/2, 'ew-resize', 7)}
            </g>
          )
        }
        break
      }`;
content = content.replace(oldBox, newBox);

// Handle Box drag points mapping in the mousemove
const oldMousemoveDrag = /if \(dragHandleRef.current\) \{[\s\S]*?updateDrawing\(dragHandleRef.current.drawingId, \{ coords: newCoords \}\)[\s\S]*?\}/;
const newMousemoveDrag = `if (dragHandleRef.current) {
        const { drawingId, pointIdx } = dragHandleRef.current
        const d = drawings.find(x => x.id === drawingId)
        if (d) {
          const time = chartRef.current.timeScale().coordinateToTime(x) || d.coords[0].time
          const price = chartRef.current.priceScale('right').coordinateToPrice(y)
          let newCoords = [...d.coords]
          
          if (d.type === 'box') {
            const p1 = newCoords[0], p2 = newCoords[1];
            if (pointIdx === 0) { p1.time = time; p1.price = price; }
            if (pointIdx === 1) { p2.time = time; p2.price = price; }
            if (pointIdx === 2) { p2.time = time; p1.price = price; }
            if (pointIdx === 3) { p1.time = time; p2.price = price; }
            if (pointIdx === 4) { p1.price = price; }
            if (pointIdx === 5) { p2.price = price; }
            if (pointIdx === 6) { p1.time = time; }
            if (pointIdx === 7) { p2.time = time; }
          } else {
            if (newCoords[pointIdx]) {
              newCoords[pointIdx] = { time, price }
            }
          }
          updateDrawing(drawingId, { coords: newCoords })
        }
        return
      }`;
content = content.replace(oldMousemoveDrag, newMousemoveDrag);

// 3. Horizontal Tool Text
const oldHorizontal = /case 'horizontal': \{[\s\S]*?break\s*\}/;
const newHorizontal = `case 'horizontal': {
        const yCoord = p1.y
        body = (
          <g opacity={op}>
            <line x1={0} y1={yCoord} x2={W} y2={yCoord} stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
            {d.label && (
              <text 
                x={d.textAnchor === 'start' ? 10 : d.textAnchor === 'end' ? W-10 : W/2} 
                y={d.textVertical === 'bottom' ? yCoord+14 : d.textVertical === 'middle' ? yCoord+4 : yCoord-6} 
                fill={col} fontSize="12" fontWeight="bold" 
                textAnchor={d.textAnchor || 'start'}>
                {d.label} {(p1.price||0).toFixed(5)}
              </text>
            )}
            {!d.label && (
              <rect x={W-60} y={yCoord-9} width={60} height={18} fill={col}/>
            )}
            {!d.label && (
              <text x={W-30} y={yCoord+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p1.price||0).toFixed(5)}
              </text>
            )}
          </g>
        )
        if (selectedId === d.id && !drawingWip) {
          handles = (
            <circle cx={W/2} cy={yCoord} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1} style={{ cursor: isDragging?'grabbing':'ns-resize' }}
              onMouseDown={e => { e.stopPropagation(); dragHandleRef.current = { drawingId: d.id, pointIdx: 0 }; setIsDragging(true); }}/>
          )
        }
        break
      }`;
content = content.replace(oldHorizontal, newHorizontal);

// 4. Path Arrow
const oldPath = /case 'path': \{[\s\S]*?break\s*\}/;
const newPath = `case 'path': {
        if (coords.length < 2) { body = <circle cx={p1.x} cy={p1.y} r={4} fill={col}/>; break }
        const pts = coords.map(c=>\`\${c.x},\${c.y}\`).join(' ')
        
        const last = coords[coords.length-1];
        const prev = coords[coords.length-2];
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
        const arrowLen = 12;
        const x1 = last.x - arrowLen * Math.cos(angle - Math.PI / 6);
        const y1 = last.y - arrowLen * Math.sin(angle - Math.PI / 6);
        const x2 = last.x - arrowLen * Math.cos(angle + Math.PI / 6);
        const y2 = last.y - arrowLen * Math.sin(angle + Math.PI / 6);

        body = (
          <g opacity={op}>
            <polyline points={pts} fill="none" stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
            <polygon points={\`\${last.x},\${last.y} \${x1},\${y1} \${x2},\${y2}\`} fill={col}/>
          </g>
        )
        break
      }`;
content = content.replace(oldPath, newPath);

// 5. Fib Gradient & % Text
const oldFib = /case 'fib': \{[\s\S]*?break\s*\}/;
const newFib = `case 'fib': {
        const LEVELS = [
          { v: 0, c: '#787b86' }, { v: 0.236, c: '#f44336' }, { v: 0.382, c: '#81c784' },
          { v: 0.5, c: '#4caf50' }, { v: 0.618, c: '#009688' }, { v: 0.786, c: '#64b5f6' },
          { v: 1, c: '#787b86' }, { v: 1.618, c: '#2962ff' }
        ]
        const diffY = p2.y - p1.y
        const diffP = p2.price - p1.price
        
        let zones = [];
        for(let i=0; i<LEVELS.length-1; i++) {
            const l1 = LEVELS[i]; const l2 = LEVELS[i+1];
            const y1 = p1.y + diffY * l1.v;
            const y2 = p1.y + diffY * l2.v;
            const h = Math.abs(y2 - y1);
            zones.push(<rect key={\`z\${i}\`} x={0} y={Math.min(y1, y2)} width={W} height={h} fill={l1.c} opacity={0.15}/>);
        }

        body = (
          <g opacity={op}>
            {zones}
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1}/>
            {LEVELS.map(l => {
              const y = p1.y + diffY * l.v
              const pr = p1.price + diffP * l.v
              return (
                <g key={l.v}>
                  <line x1={0} y1={y} x2={W} y2={y} stroke={l.c} strokeWidth={wid}/>
                  <text x={W - 10} y={y - 4} fill={l.c} fontSize="11" textAnchor="end" fontWeight="bold">
                    {(l.v * 100).toFixed(1)}% ({pr.toFixed(2)})
                  </text>
                </g>
              )
            })}
          </g>
        )
        break
      }`;
content = content.replace(oldFib, newFib);

// 6. Fix Toolbar rendering
const oldToolbarRender = /\{selDrawing && toolbarPixelPos && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}/;
const newToolbarRender = `{selDrawing && toolbarPixelPos && (
          <FloatingToolbar
            drawing={selDrawing}
            onUpdate={(u) => updateDrawing(selectedId, u)}
            onDelete={() => deleteDrawing(selectedId)}
            onClose={() => setSelectedId(null)}
            initialPos={toolbarPixelPos}
          />
        )}`;
content = content.replace(oldToolbarRender, newToolbarRender);

// 7. Fix localStorage loading logic
const oldLoad = `useEffect(() => {
    if (!activeTicker) return
    const saved = localStorage.getItem(\`drawings_v2_\${activeTicker}\`)
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) setDrawings(parsed);
      } catch(e){}
    }
  }, [activeTicker])

  useEffect(() => {
    if (!activeTicker || drawings.length === 0) return
    localStorage.setItem(\`drawings_v2_\${activeTicker}\`, JSON.stringify(drawings))
  }, [drawings, activeTicker])`;
  
const newLoad = `useEffect(() => {
    if (!activeTicker) return
    const saved = localStorage.getItem(\`drawings_v2_\${activeTicker}\`)
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) setDrawings(parsed);
      } catch(e){}
    } else {
      setDrawings([]);
    }
  }, [activeTicker])

  useEffect(() => {
    if (!activeTicker) return
    localStorage.setItem(\`drawings_v2_\${activeTicker}\`, JSON.stringify(drawings))
  }, [drawings, activeTicker])`;
content = content.replace(oldLoad, newLoad);

// 8. Fix ReplayMode stale state issue
const refDec = `const replayRef = useRef({ active: false, hiddenData: [], intervalId: null })
  const replayStateRef = useRef(replayState)
  useEffect(() => { replayStateRef.current = replayState }, [replayState])`;
if (!content.includes('replayStateRef')) {
  content = content.replace(/const replayRef = useRef\(\{ active: false, hiddenData: \[\], intervalId: null \}\)/, refDec);
  content = content.replace(/if \(replayState === 'selecting'\) \{/g, `if (replayStateRef.current === 'selecting') {`);
}

fs.writeFileSync(file, content);
console.log('Successfully patched TradingChart.jsx for phase 3');
