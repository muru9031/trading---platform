import re

content = open('src/components/TradingChart.jsx', 'r', encoding='utf-8').read()

# 1. Fix 'pi === all' crash
target_drag = """        if (pi === 'all') {
          const dx = x - sx
          const dy = y - sy
          setDrawings(prev => prev.map(d => {
            if (d.id !== did) return d
            const pts = origPts.map(origPt => {
              const origX = safeTimeToCoordinate(origPt.time, chartRef.current.timeScale(), selectedInterval, liveDataRef)
              const origY = candleRef.current.priceToCoordinate(origPt.price)
              if (origX === null || origY === null) return origPt
  
              const newX = origX + dx
              const newY = origY + dy
              
              const newPrice = candleRef.current.coordinateToPrice(newY)
              const newTime = resolveTimeFromPixel(newX, chartRef.current.timeScale(), liveDataRef.current.fullData, selectedIntervalRef.current?.seconds || 60)
              return { time: newTime || origPt.time, price: newPrice !== null ? newPrice : origPt.price }
            })
            return { ...d, points: pts }
          }))
          return
        }"""
replacement_drag = """        if (pi === 'all') {
          const dx = x - sx
          const dy = y - sy
          setDrawings(prev => prev.map(d => {
            if (d.id !== did) return d
            const pts = origPts.map(origPt => {
              const origX = resolvePixelFromTime(origPt.time, chartRef.current.timeScale(), liveDataRef.current.fullData, selectedIntervalRef.current?.seconds || 60)
              const origY = candleRef.current.priceToCoordinate(origPt.price)
              if (origX == null || origY == null) return origPt
  
              const newX = origX + dx
              const newY = origY + dy
              
              const newPrice = candleRef.current.coordinateToPrice(newY)
              const newTime = resolveTimeFromPixel(newX, chartRef.current.timeScale(), liveDataRef.current.fullData, selectedIntervalRef.current?.seconds || 60)
              return { time: newTime || origPt.time, price: newPrice !== null ? newPrice : origPt.price }
            })
            return { ...d, points: pts }
          }))
          return
        }"""
if target_drag in content:
    content = content.replace(target_drag, replacement_drag)
    print("Fixed pi === 'all' dragging")
else:
    print("Could not find pi === 'all' dragging block")

# 2. Fix Ctrl Magnet
target_magnet = """  // Global Ctrl key for Magnet Mode
  useEffect(() => {
    let previousMagnetState = false
    const handleKeyDown = (e) => {
      if (e.key === 'Control' && activeToolRef.current !== 'cursor') {
        if (!magnetRef.current) {
          previousMagnetState = false
          setMagnet(true)
        } else {
          previousMagnetState = true
        }
      }
    }
    const handleKeyUp = (e) => {
      if (e.key === 'Control' && activeToolRef.current !== 'cursor') {
        setMagnet(previousMagnetState)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])"""
replacement_magnet = """  // Global Ctrl key for Magnet Mode
  useEffect(() => {
    let isCtrlHeld = false
    const handleKeyDown = (e) => {
      if (e.key === 'Control' && activeToolRef.current !== 'cursor' && !isCtrlHeld) {
        isCtrlHeld = true
        setMagnet(true)
      }
    }
    const handleKeyUp = (e) => {
      if (e.key === 'Control' && activeToolRef.current !== 'cursor') {
        isCtrlHeld = false
        setMagnet(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])"""
if target_magnet in content:
    content = content.replace(target_magnet, replacement_magnet)
    print("Fixed Magnet Ctrl hold")
else:
    print("Could not find Magnet Ctrl hold block")

# 3. Box fill opacity
target_box_fill = """fill={d.fillBackground !== false ? col+"33" : "transparent"}"""
replacement_box_fill = """fill={d.fillBackground !== false ? col + Math.round(((d.fillOpacity ?? 20) / 100) * 255).toString(16).padStart(2, '0') : "transparent"}"""
if target_box_fill in content:
    content = content.replace(target_box_fill, replacement_box_fill)
    print("Fixed Box fill opacity")
else:
    print("Could not find Box fill opacity")

# 4. Long/Short logic
target_ls = """        handles = coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={5} fill={col} stroke="#000" strokeWidth={1} cursor="move" onMouseDown={(e) => onHandleMouseDown(e, d.id, i)}/>)
        break
      }

      case 'long':
      case 'short': {
        if (coords.length < 3) { body = <circle cx={p1.x} cy={p1.y} r={5} fill={col}/>; break }
        const p3 = coords[2]
        const isLong = d.type === 'long'
        const eY = p1.y, tY = p2.y, sY = p3.y
        const eP = p1.price, tP = p2.price, sP = p3.price
        const rr = Math.abs(eP - sP) > 0 ? (Math.abs(tP-eP)/Math.abs(eP-sP)).toFixed(2) : '∞'
        const W  = Math.max(p2.x - p1.x, 50)
        const chartW = chartRef.current?.timeScale().width() || 2000
        const tpHandle = isSel ? (
          <circle cx={p1.x + W/2} cy={tY} r={6}
            fill="#0f172a" stroke="#10b981" strokeWidth={2}
            style={{pointerEvents:'all',cursor:'ns-resize'}}
            onMouseDown={(e) => onHandleMouseDown(e, d.id, 1)}/>
        ) : null
        const slHandle = isSel ? (
          <circle cx={p1.x + W/2} cy={sY} r={6}
            fill="#0f172a" stroke="#ef4444" strokeWidth={2}
            style={{pointerEvents:'all',cursor:'ns-resize'}}
            onMouseDown={(e) => onHandleMouseDown(e, d.id, 2)}/>
        ) : null
        const durationHandle = isSel ? (
          <circle cx={p1.x + W} cy={eY} r={6}
            fill="#0f172a" stroke={col} strokeWidth={2}
            style={{pointerEvents:'all',cursor:'ew-resize'}}
            onMouseDown={(e) => onHandleMouseDown(e, d.id, 3)}/>
        ) : null
        body = <g opacity={op}>
          {/* TP zone */}
          <rect x={p1.x} y={Math.min(eY,tY)} width={W} height={Math.abs(eY-tY)}
            fill="rgba(16,185,129,0.15)"/>
          <text x={p1.x+5} y={Math.min(eY,tY)+13} fill="#10b981" fontSize="10" fontWeight="bold">
            {isLong?'▲ TP':'▼ TP'} {tP.toFixed(5)}
          </text>
          {/* SL zone */}
          <rect x={p1.x} y={Math.min(eY,sY)} width={W} height={Math.abs(eY-sY)}
            fill="rgba(239,68,68,0.15)"/>
          <text x={p1.x+5} y={Math.max(eY,sY)-6} fill="#ef4444" fontSize="10" fontWeight="bold">
            SL {sP.toFixed(5)}
          </text>
          {/* Entry line */}
          <line x1={p1.x} y1={eY} x2={p1.x+W} y2={eY} stroke="#f8fafc" strokeWidth={2}/>
          <text x={p1.x+5} y={eY-5} fill="#f8fafc" fontSize="10" fontWeight="bold">
            Entry {eP.toFixed(5)}
          </text>
          <text x={p1.x+W-5} y={eY-5} fill="#f8fafc" fontSize="10" textAnchor="end">
            R/R {rr}
          </text>
          {/* Edge Borders */}
          <line x1={p1.x} y1={tY} x2={p1.x+W} y2={tY} stroke="#10b981" strokeWidth={1.5}/>
          <line x1={p1.x} y1={sY} x2={p1.x+W} y2={sY} stroke="#ef4444" strokeWidth={1.5}/>
          {/* TP & SL Price Labels on Right Axis */}
          <rect x={chartW-55} y={tY-10} width={55} height={20} fill="#10b981" rx="2"/>
          <text x={chartW-27.5} y={tY+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
            {tP.toFixed(2)}
          </text>
          <rect x={chartW-55} y={sY-10} width={55} height={20} fill="#ef4444" rx="2"/>
          <text x={chartW-27.5} y={sY+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
            {sP.toFixed(2)}
          </text>
          {tpHandle}
          {slHandle}
          {durationHandle}
        </g>
        break
      }"""
replacement_ls = """        handles = coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={5} fill={col} stroke="#000" strokeWidth={1} cursor="move" onMouseDown={(e) => onHandleMouseDown(e, d.id, i)}/>)
        break
      }

      case 'long':
      case 'short': {
        if (coords.length < 3) { body = <circle cx={p1.x} cy={p1.y} r={5} fill={col}/>; break }
        const p3 = coords[2]
        const isLong = d.type === 'long'
        const eY = p1.y, tY = p2.y, sY = p3.y
        const eP = p1.price, tP = p2.price, sP = p3.price
        const rr = Math.abs(eP - sP) > 0 ? (Math.abs(tP-eP)/Math.abs(eP-sP)).toFixed(2) : '∞'
        const W  = Math.max(p2.x - p1.x, 50)
        const chartW = chartRef.current?.timeScale().width() || 2000
        
        // Remove old circular handles, use invisible thick rects for edge dragging
        const tpDragArea = isSel ? (
          <rect x={p1.x} y={tY - 5} width={W} height={10} fill="transparent" style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 1)}/>
        ) : null
        const slDragArea = isSel ? (
          <rect x={p1.x} y={sY - 5} width={W} height={10} fill="transparent" style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 2)}/>
        ) : null
        
        // Distinct center-right anchor handle for duration
        const durationHandle = isSel ? (
          <g style={{pointerEvents:'all',cursor:'ew-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 3)}>
             <circle cx={p1.x + W} cy={eY} r={4} fill="#fff" stroke={col} strokeWidth={2}/>
             <path d={`M${p1.x + W} ${Math.min(eY, tY)} L${p1.x + W} ${Math.max(eY, sY)}`} stroke={col} strokeWidth={1} strokeDasharray="3 3" />
          </g>
        ) : null

        // Overwrite default handles so we don't render standard circles for Long/Short
        handles = null

        body = <g opacity={op}>
          {/* TP zone */}
          <rect x={p1.x} y={Math.min(eY,tY)} width={W} height={Math.abs(eY-tY)}
            fill="rgba(16,185,129,0.15)"/>
          <text x={p1.x+5} y={Math.min(eY,tY)+13} fill="#10b981" fontSize="10" fontWeight="bold">
            {isLong?'▲ TP':'▼ TP'} {tP.toFixed(5)}
          </text>
          {/* SL zone */}
          <rect x={p1.x} y={Math.min(eY,sY)} width={W} height={Math.abs(eY-sY)}
            fill="rgba(239,68,68,0.15)"/>
          <text x={p1.x+5} y={Math.max(eY,sY)-6} fill="#ef4444" fontSize="10" fontWeight="bold">
            SL {sP.toFixed(5)}
          </text>
          {/* Entry line */}
          <line x1={p1.x} y1={eY} x2={p1.x+W} y2={eY} stroke="#f8fafc" strokeWidth={2}/>
          <text x={p1.x+5} y={eY-5} fill="#f8fafc" fontSize="10" fontWeight="bold">
            Entry {eP.toFixed(5)}
          </text>
          <text x={p1.x+W-5} y={eY-5} fill="#f8fafc" fontSize="10" textAnchor="end">
            R/R {rr}
          </text>
          {/* Edge Borders */}
          <line x1={p1.x} y1={tY} x2={p1.x+W} y2={tY} stroke="#10b981" strokeWidth={1.5}/>
          <line x1={p1.x} y1={sY} x2={p1.x+W} y2={sY} stroke="#ef4444" strokeWidth={1.5}/>
          {/* TP & SL Price Labels on Right Axis */}
          <rect x={chartW-55} y={tY-10} width={55} height={20} fill="#10b981" rx="2"/>
          <text x={chartW-27.5} y={tY+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
            {tP.toFixed(2)}
          </text>
          <rect x={chartW-55} y={sY-10} width={55} height={20} fill="#ef4444" rx="2"/>
          <text x={chartW-27.5} y={sY+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
            {sP.toFixed(2)}
          </text>
          {tpDragArea}
          {slDragArea}
          {durationHandle}
        </g>
        break
      }"""
if target_ls in content:
    content = content.replace(target_ls, replacement_ls)
    print("Fixed Long/Short drag handles")
else:
    print("Could not find Long/Short drag handles block")

# Write back
open('src/components/TradingChart.jsx', 'w', encoding='utf-8').write(content)
print("Done patching.")
