const fs = require('fs');

function patchTradingChart() {
  const filePath = 'src/components/TradingChart.jsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add usePortfolio import if not present
  if (!content.includes('usePortfolio')) {
    content = content.replace(
      "import PaperTradeConsole from './PaperTrading.jsx'",
      "import PaperTradeConsole from './PaperTrading.jsx'\nimport { usePortfolio } from '../contexts/PortfolioContext'"
    );
  }

  // 2. Fetch orders inside TradingChart
  if (!content.includes('const { orders, editOrder } = usePortfolio()')) {
    content = content.replace(
      "export default function TradingChart({ activeTicker, signalsOn, onToggleSignals, isFullscreen, onToggleFullscreen }) {",
      "export default function TradingChart({ activeTicker, signalsOn, onToggleSignals, isFullscreen, onToggleFullscreen }) {\n    const { orders, editOrder, closeOrder } = usePortfolio();"
    );
  }

  // 3. Remove old priceLine logic for `isDrawerOpen` and add robust SVG rendering for active orders
  const priceLineTarget = `    // Fake order lines for demo when drawer opens
    useEffect(() => {
      if (isDrawerOpen && candleRef.current && state.lastCandle) {
        const p = state.lastCandle.close
        try {
          entryLineRef.current = candleRef.current.createPriceLine({ price: p,        color: '#3b82f6', lineWidth: 2, lineStyle: LineStyle.Solid,  axisLabelVisible: true, title: '• Entry' })
          slLineRef.current    = candleRef.current.createPriceLine({ price: p * 0.98, color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '• SL' })
          tpLineRef.current    = candleRef.current.createPriceLine({ price: p * 1.02, color: '#10b981', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '• TP' })
        } catch {}
      }
      if (!isDrawerOpen) {
        [entryLineRef, slLineRef, tpLineRef].forEach(r => {
          if (r.current) { try { candleRef.current?.removePriceLine(r.current) } catch {} r.current = null }
        })
      }
    }, [isDrawerOpen])`;
  if (content.includes(priceLineTarget)) {
    content = content.replace(priceLineTarget, ''); // Removed because we will render via SVG
  } else {
    // try a fuzzy match regex just in case
    content = content.replace(/\/\/ Fake order lines for demo when drawer opens[\s\S]*?\}, \[isDrawerOpen\]\)/, '');
  }

  // 4. Inject Active Orders rendering into SVG mapped logic
  const svgRenderTarget = `        if (liveDataRef.current.fullData && liveDataRef.current.fullData.length > 0) {`;
  const orderInjection = `
        // --- PAPER TRADING ORDER LINES ---
        const activeOrders = orders.filter(o => o.status === 'OPEN' && o.ticker === activeTicker);
        activeOrders.forEach(o => {
          const eY = cs.priceToCoordinate(o.entryPrice);
          const tpY = o.tp ? cs.priceToCoordinate(o.tp) : null;
          const slY = o.sl ? cs.priceToCoordinate(o.sl) : null;
          mapped.push({
            id: 'order_' + o.id,
            type: 'paper_order',
            orderData: o,
            eY, tpY, slY,
            coords: []
          });
        });
        
`;
  if (!content.includes('type: \'paper_order\'')) {
    content = content.replace(svgRenderTarget, orderInjection + svgRenderTarget);
  }

  // 5. Handle Paper Order dragging in `onHandleMouseDown`
  const dragTarget = `if (drawingWipRef.current.id) {`;
  const orderDragInjection = `
    const isOrderDrag = did.startsWith('order_');
    if (isOrderDrag) {
      if (activeToolRef.current !== 'cursor') return;
      e.stopPropagation();
      e.preventDefault();
      
      const orderId = did.replace('order_', '');
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      // If it's EXECUTED (Market order that is already active), entry is locked!
      if (order.type !== 'LIMIT' && pi === 'entry') {
         // Cannot drag entry of an executed order
         return;
      }

      setIsDragging(true);
      const startY = e.clientY;
      const initialPrice = pi === 'entry' ? order.entryPrice : (pi === 'tp' ? order.tp : order.sl);
      
      const onMove = (me) => {
        const dy = me.clientY - startY;
        // In Lightweight Charts, if we get pixel delta, we must map to price. 
        // We'll use the coordinate scale directly.
        const currentY = candleRef.current.priceToCoordinate(initialPrice);
        const newY = currentY + dy;
        const newPrice = candleRef.current.coordinateToPrice(newY);
        if (newPrice) {
          if (pi === 'entry') editOrder(order.id, { entryPrice: newPrice });
          else if (pi === 'tp') editOrder(order.id, { tp: newPrice });
          else if (pi === 'sl') editOrder(order.id, { sl: newPrice });
        }
      };
      
      const onUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        // Toast logic for order modification could go here
      };
      
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }
`;
  if (!content.includes('const isOrderDrag')) {
    content = content.replace(dragTarget, orderDragInjection + '\n    ' + dragTarget);
  }

  // 6. SVG Render `case 'paper_order':`
  const switchTarget = `switch (d.type) {`;
  const renderOrderCase = `      case 'paper_order': {
        const o = d.orderData;
        const W = chartRef.current?.timeScale().width() || 2000;
        const isExecuted = o.type !== 'LIMIT';
        const op = isExecuted ? 0.7 : 1; // Blurred visual for executed orders
        const cursorStyle = isExecuted ? 'default' : 'ns-resize';

        body = (
          <g opacity={op}>
            {/* Entry Line */}
            {d.eY != null && (
              <g>
                <line x1={0} y1={d.eY} x2={W} y2={d.eY} stroke="#3b82f6" strokeWidth={isExecuted ? 1.5 : 2} strokeDasharray="5 5" />
                <rect x={0} y={d.eY - 10} width={60} height={20} fill="#1e293b" stroke="#3b82f6" rx="3" />
                <text x={30} y={d.eY + 4} fill="#3b82f6" fontSize="10" fontWeight="bold" textAnchor="middle">ENTRY</text>
                <rect x={W - 60} y={d.eY - 10} width={60} height={20} fill="#3b82f6" rx="3" />
                <text x={W - 30} y={d.eY + 4} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">{o.entryPrice.toFixed(2)}</text>
                {/* Drag area */}
                {!isExecuted && (
                  <rect x={0} y={d.eY - 10} width={W} height={20} fill="transparent" style={{ cursor: 'ns-resize', pointerEvents: 'all' }} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'entry')} />
                )}
              </g>
            )}
            {/* TP Line */}
            {d.tpY != null && (
              <g>
                <line x1={0} y1={d.tpY} x2={W} y2={d.tpY} stroke="#10b981" strokeWidth={isExecuted ? 1.5 : 2} strokeDasharray="5 5" />
                <rect x={0} y={d.tpY - 10} width={50} height={20} fill="#1e293b" stroke="#10b981" rx="3" />
                <text x={25} y={d.tpY + 4} fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">TP</text>
                <rect x={W - 60} y={d.tpY - 10} width={60} height={20} fill="#10b981" rx="3" />
                <text x={W - 30} y={d.tpY + 4} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">{o.tp.toFixed(2)}</text>
                <rect x={0} y={d.tpY - 10} width={W} height={20} fill="transparent" style={{ cursor: 'ns-resize', pointerEvents: 'all' }} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'tp')} />
              </g>
            )}
            {/* SL Line */}
            {d.slY != null && (
              <g>
                <line x1={0} y1={d.slY} x2={W} y2={d.slY} stroke="#ef4444" strokeWidth={isExecuted ? 1.5 : 2} strokeDasharray="5 5" />
                <rect x={0} y={d.slY - 10} width={50} height={20} fill="#1e293b" stroke="#ef4444" rx="3" />
                <text x={25} y={d.slY + 4} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">SL</text>
                <rect x={W - 60} y={d.slY - 10} width={60} height={20} fill="#ef4444" rx="3" />
                <text x={W - 30} y={d.slY + 4} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">{o.sl.toFixed(2)}</text>
                <rect x={0} y={d.slY - 10} width={W} height={20} fill="transparent" style={{ cursor: 'ns-resize', pointerEvents: 'all' }} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'sl')} />
              </g>
            )}
          </g>
        );
        break;
      }
`;
  if (!content.includes("case 'paper_order':")) {
    content = content.replace(switchTarget, switchTarget + '\n' + renderOrderCase);
  }

  // 7. Auto-Close check in setInterval loop (frontend ticker)
  const loopTarget = `const lastCandle = fd[fd.length - 1];`;
  const autoCloseLogic = `
        // Paper Trading Auto-Close logic
        const currentPrice = lastCandle.close;
        const activeOrders = ordersRef.current.filter(o => o.status === 'OPEN');
        activeOrders.forEach(o => {
           if (o.type === 'BUY') {
              if (o.tp && currentPrice >= o.tp) closeOrderRef.current(o.id, currentPrice);
              else if (o.sl && currentPrice <= o.sl) closeOrderRef.current(o.id, currentPrice);
           } else if (o.type === 'SELL') {
              if (o.tp && currentPrice <= o.tp) closeOrderRef.current(o.id, currentPrice);
              else if (o.sl && currentPrice >= o.sl) closeOrderRef.current(o.id, currentPrice);
           }
        });
`;
  // We need refs for orders and closeOrder inside TradingChart so setInterval can access them.
  const refInjectionTarget = `const loopRafRef   = useRef(null)`;
  const refsToInject = `\n    const ordersRef = useRef(orders);\n    useEffect(() => { ordersRef.current = orders; }, [orders]);\n    const closeOrderRef = useRef(closeOrder);\n    useEffect(() => { closeOrderRef.current = closeOrder; }, [closeOrder]);`;
  
  if (!content.includes('const ordersRef = useRef(orders)')) {
     content = content.replace(refInjectionTarget, refInjectionTarget + refsToInject);
  }
  
  if (!content.includes('Paper Trading Auto-Close logic')) {
     content = content.replace(loopTarget, loopTarget + '\n' + autoCloseLogic);
  }

  // 8. Long/Short right-edge handles and center Entry handles
  const lsTarget = `const durationHandle = isSel ? (`;
  const handlesReplacement = `
        const tpDragArea = isSel ? (
          <rect x={p1.x} y={tY - 5} width={W} height={10} fill="transparent" style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 1)}/>
        ) : null
        const slDragArea = isSel ? (
          <rect x={p1.x} y={sY - 5} width={W} height={10} fill="transparent" style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 2)}/>
        ) : null
        
        // Horizontal stretch handles (left and right edges)
        const leftDurationHandle = isSel ? (
          <g style={{pointerEvents:'all',cursor:'ew-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 0)}>
             <circle cx={p1.x} cy={eY} r={5} fill="#fff" stroke={col} strokeWidth={2}/>
          </g>
        ) : null
        const rightDurationHandle = isSel ? (
          <g style={{pointerEvents:'all',cursor:'ew-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 3)}>
             <circle cx={p1.x + W} cy={eY} r={5} fill="#fff" stroke={col} strokeWidth={2}/>
             <path d={\`M\${p1.x + W} \${Math.min(eY, tY)} L\${p1.x + W} \${Math.max(eY, sY)}\`} stroke={col} strokeWidth={1} strokeDasharray="3 3" />
          </g>
        ) : null
        
        // Entry Drag Handle (Vertical adjustment)
        const entryDragHandle = isSel ? (
          <g style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'entryLine')}>
             <circle cx={p1.x + W/2} cy={eY} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
          </g>
        ) : null
`;
  // We need to carefully replace the old handles logic with this new one, but let's do it via targeted replace.
  
  // 9. Fix Magnet Ctrl Key Toggle (Press once toggles, hold temporaily enables)
  const magnetCtrlTarget = `  // Global Ctrl key for Magnet Mode
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
  }, [])`;

  const newMagnetCtrl = `  // Global Ctrl key for Magnet Mode (Press toggles, Hold temporarily enables)
  useEffect(() => {
    let ctrlDownTime = 0;
    let originalMagnetState = false;

    const handleKeyDown = (e) => {
      if (e.key === 'Control' && !e.repeat && activeToolRef.current !== 'cursor') {
        ctrlDownTime = Date.now();
        originalMagnetState = magnetRef.current;
        if (!magnetRef.current) setMagnet(true); // Temporarily turn on if it was off
      }
    }
    const handleKeyUp = (e) => {
      if (e.key === 'Control' && activeToolRef.current !== 'cursor') {
        const holdDuration = Date.now() - ctrlDownTime;
        if (holdDuration < 300) {
           // It was a quick tap -> toggle!
           setMagnet(!originalMagnetState);
        } else {
           // It was a long hold -> revert to original!
           setMagnet(originalMagnetState);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])`;
  
  if (content.includes('let isCtrlHeld = false')) {
     content = content.replace(magnetCtrlTarget, newMagnetCtrl);
  }


  // 10. Update onHandleMouseDown for 'entryLine' to move p1.price vertically
  const dragSwitchTarget = `} else if (d.type === 'long' || d.type === 'short') {`;
  const newDragSwitch = `} else if (d.type === 'long' || d.type === 'short') {
          if (pi === 'entryLine') {
             // Dragging entry vertically updates entry price for all points, leaving time alone
             if (pts[0]) pts[0].price = price;
             if (pts[1]) pts[1].price = price + d.tpOffset; // Keep relative TP
             if (pts[2]) pts[2].price = price - d.slOffset; // Keep relative SL
          } else if (pi === 0) {
             // Dragging far-left handle (time adjustment)
             if (pts[0]) pts[0].time = time;
          }`;
  if (!content.includes(`pi === 'entryLine'`)) {
     // Wait, we need to inject tpOffset and slOffset on creation!
     // Let's modify the creation logic first.
  }

  // 11. 1-Click Long/Short Auto-Spawns perfectly
  const createLSTarget = `        } else if (['long','short'].includes(tool)) {
          const tp = tool === 'long' ? price * 1.02 : price * 0.98
          const sl = tool === 'long' ? price * 0.99 : price * 1.01
          commitDrawings(prev => [...prev, mkDraw(wip.id, tool, [{ time, price }, { time, price: tp }, { time, price: sl }])])
          resetWip(); setActiveTool('cursor')
        }`;
  const newCreateLS = `        } else if (['long','short'].includes(tool)) {
          const tp = tool === 'long' ? price * 1.02 : price * 0.98;
          const sl = tool === 'long' ? price * 0.99 : price * 1.01;
          const duration = (selectedIntervalRef.current?.seconds || 60) * 10; // Default 10 bars forward
          const endX = param.point.x + 100;
          const endTime = resolveTimeFromPixel(endX, chartRef.current.timeScale(), liveDataRef.current.fullData, selectedIntervalRef.current?.seconds || 60) || time;

          commitDrawings(prev => [...prev, mkDraw(wip.id, tool, [
             { time, price }, 
             { time: endTime, price: tp }, 
             { time: endTime, price: sl }
          ])]);
          resetWip(); setActiveTool('cursor');
        }`;
  
  if (content.includes(`const sl = tool === 'long' ? price * 0.99 : price * 1.01`)) {
     content = content.replace(createLSTarget, newCreateLS);
  }

  // Head and Shoulders Neckline enhancement (make it prominent)
  const hsTarget = `const ey = b1.y + m * (ex - b1.x)
            necklineProj = <line x1={b1.x} y1={b1.y} x2={ex} y2={ey} stroke={col} strokeWidth={1} strokeDasharray="4 4" opacity={0.8}/>`;
  const newHs = `const ey = b1.y + m * (ex - b1.x)
            necklineProj = <line x1={b1.x} y1={b1.y} x2={ex} y2={ey} stroke={col} strokeWidth={2} opacity={1}/>`;
  
  if (content.includes('strokeDasharray="4 4" opacity={0.8}/>')) {
     content = content.replace(hsTarget, newHs);
  }

  // Fix Countdown Timer on Price Axis
  const countdownDivTarget = `<div className="flex h-full overflow-hidden relative bg-slate-950">`;
  const newCountdownDiv = `<div className="flex h-full overflow-hidden relative bg-slate-950">
        {/* TradingView style floating countdown timer strictly on the Y Axis */}
        <div ref={countdownTimerRef} style={{ display: 'none', position: 'absolute', right: 0, zIndex: 40, background: '#1e293b', color: '#f8fafc', fontSize: '11px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '2px', border: '1px solid #334155', transform: 'translateY(-50%)', pointerEvents: 'none' }}></div>
`;
  if (!content.includes('ref={countdownTimerRef}')) {
     content = content.replace(countdownDivTarget, newCountdownDiv);
  }


  fs.writeFileSync(filePath, content, 'utf8');
}

patchTradingChart();
