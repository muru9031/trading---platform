import { useEffect, useRef, useState, useCallback } from 'react'
import React from 'react'
import {
  createChart, CrosshairMode, LineStyle, PriceScaleMode,
  CandlestickSeries, HistogramSeries, LineSeries
} from 'lightweight-charts'
import {
  BarChart2, RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle,
  Maximize2, PanelRightOpen, PanelRightClose, Type, Eye, EyeOff,
  MousePointer2, Circle, Hash, MoveDiagonal, Ruler, User, Trash2,
  ArrowUp, ArrowDown, Activity, PenTool, Scissors, Play, Square, Clock,
  Undo2, Redo2, LayoutTemplate, Save, Check, Settings2, X, ChevronDown, FunctionSquare, Bell, MessageSquare, Sparkles, Calculator,
  Edit2, Plus, AlertTriangle, ExternalLink
} from 'lucide-react'
import PaperTradeConsole from './PaperTrading.jsx'
import VisualSizerPanel from './VisualSizerPanel.jsx'
import { usePortfolio } from '../contexts/PortfolioContext'
import { useTheme } from '../contexts/ThemeContext'
import SettingsModal from './SettingsModal.jsx'
import IndicatorsModal from './IndicatorsModal.jsx'
import ChartSettingsModal from './ChartSettingsModal.jsx'
import { Settings, Camera } from 'lucide-react'
import IndicatorSettingsModal from './IndicatorSettingsModal.jsx'
import AssetLogo from './AssetLogo.jsx'
import { getFriendlyName } from '../utils/tickerMap'
import CreateAlertModal from './CreateAlertModal.jsx'
import ProFeatureModal from './ProFeatureModal.jsx'
import BrokerConnectModal from './BrokerConnectModal.jsx'
import PredictionExplanationModal from './PredictionExplanationModal.jsx'

const API_BASE = 'http://localhost:8000'

const INTERVALS = [
  { label: '1s',  period: '1d',   interval: '1s',  seconds: 1, category: 'Seconds' },
  { label: '5s',  period: '1d',   interval: '5s',  seconds: 5, category: 'Seconds' },
  { label: '15s', period: '1d',   interval: '15s', seconds: 15, category: 'Seconds' },
  { label: '30s', period: '1d',   interval: '30s', seconds: 30, category: 'Seconds' },
  { label: '1m',  period: '7d',   interval: '1m',  seconds: 60, category: 'Minutes' },
  { label: '3m',  period: '7d',   interval: '3m',  seconds: 180, category: 'Minutes' },
  { label: '5m',  period: '60d',  interval: '5m',  seconds: 300, category: 'Minutes' },
  { label: '15m', period: '60d',  interval: '15m', seconds: 900, category: 'Minutes' },
  { label: '30m', period: '60d',  interval: '30m', seconds: 1800, category: 'Minutes' },
  { label: '45m', period: '60d',  interval: '45m', seconds: 2700, category: 'Minutes' },
  { label: '1H',  period: '730d', interval: '60m', seconds: 3600, category: 'Hours/Days' },
  { label: '2H',  period: '730d', interval: '120m', seconds: 7200, category: 'Hours/Days' },
  { label: '4H',  period: '730d', interval: '4h',  seconds: 14400, category: 'Hours/Days' },
  { label: '1D',  period: 'max',  interval: '1d',  seconds: 86400, category: 'Hours/Days' },
  { label: '1W',  period: 'max',  interval: '1wk', seconds: 604800, category: 'Hours/Days' },
  { label: '1M',  period: 'max',  interval: '1mo', seconds: 2592000, category: 'Hours/Days' },
]

const EXCHANGE_MAP = {
  NMS: 'NASDAQ', NMQ: 'NASDAQ', NYQ: 'NYSE', PCX: 'NYSE Arca', ASE: 'AMEX',
  NSE: 'NSE', NSI: 'NSE', BSE: 'BSE', BOM: 'BSE', CCY: 'FOREX', CCC: 'CRYPTO',
  CME: 'CME', NYB: 'NYMEX', CBT: 'CBOT', TOR: 'TSX', LSE: 'LSE',
  FRA: 'FSE', SHG: 'SSE', HKG: 'HKEX',
}

function fmtPrice(price, currency = 'USD') {
  if (price == null) return '—'
  const s = currency === 'INR' ? '₹' : '$'
  return `${s}${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Math Helpers ────────────────────────────────────────────────────────────
function getSourceValue(candle, source = 'close') {
  if (!candle) return 0;
  switch (source.toLowerCase()) {
    case 'open': return candle.open;
    case 'high': return candle.high;
    case 'low': return candle.low;
    case 'hl2': return (candle.high + candle.low) / 2;
    case 'hlc3': return (candle.high + candle.low + candle.close) / 3;
    case 'ohlc4': return (candle.open + candle.high + candle.low + candle.close) / 4;
    case 'close':
    default:
      return candle.close;
  }
}

function calculateSMA(data, period, source = 'close') {
  let result = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const val = getSourceValue(data[i], source);
    sum += val;
    if (i >= period) sum -= getSourceValue(data[i - period], source);
    if (i >= period - 1) result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

function calculateEMA(data, period, source = 'close') {
  let result = [];
  if (data.length === 0) return result;
  const k = 2 / (period + 1);
  let ema = getSourceValue(data[0], source);
  for (let i = 0; i < data.length; i++) {
    const val = getSourceValue(data[i], source);
    ema = val * k + ema * (1 - k);
    if (i >= period - 1) result.push({ time: data[i].time, value: ema });
  }
  return result;
}


function getMarketStatus(exchange) {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const time = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (exchange === 'CRYPTO' || exchange === 'FOREX') return true;
  if (utcDay === 0 || utcDay === 6) return false;
  if (['NSE', 'BSE', 'MCX'].includes(exchange) || (exchange && exchange.includes('.NS'))) return time >= 3.75 && time <= 10.0;
  if (['NASDAQ', 'NYSE', 'AMEX', 'NYSE Arca'].includes(exchange)) return time >= 13.5 && time <= 21.0;
  return false;
}

export function resolvePixelFromTime(time, timeScale, fullData, intervalSeconds) {
  if (!timeScale || !fullData || fullData.length < 2) return null;
  const cx = timeScale.timeToCoordinate(time);
  if (cx !== null) return cx;
  const lastIndex = fullData.length - 1;
  const lastTime = fullData[lastIndex].time;
  const logicalDiff = (time - lastTime) / intervalSeconds;
  return timeScale.logicalToCoordinate(lastIndex + logicalDiff);
}

export function resolveTimeFromPixel(x, timeScale, fullData, intervalSeconds) {
  if (!timeScale || !fullData || fullData.length < 2) return null;
  const time = timeScale.coordinateToTime(x);
  if (time !== null) return time;
  const logical = timeScale.coordinateToLogical(x);
  if (logical === null) return null;
  const lastIndex = fullData.length - 1;
  const lastTime = fullData[lastIndex].time;
  return Math.floor(lastTime + (logical - lastIndex) * intervalSeconds);
}

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: false } }
  static getDerivedStateFromError() { return { err: true } }
  render() {
    if (this.state.err) return <div className="p-4 text-red-400 text-xs">Error in Trade Console.</div>
    return this.props.children
  }
}

// ── TradingView-style horizontal edit toolbar ─────────────────────────────────
// Appears above the selected drawing as a compact icon bar

// ── TradingView-style Floating Toolbar ──────────────────────────────────────
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f8fafc', '#94a3b8'];

function FloatingToolbar({ drawing, onUpdate, onDelete, onClose, initialPos, onOpenSettings }) {
  const [pos, setPos] = useState(initialPos || { x: window.innerWidth/2 - 100, y: window.innerHeight/2 - 100 });
  const [dragging, setDragging] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [opacity, setOpacity] = useState(100);
  const dragRef = useRef(null);

  const getTemplates = () => JSON.parse(localStorage.getItem('drawingTemplates') || '{}');
  
  const saveTemplate = () => {
    if (!templateName) return;
    const t = getTemplates();
    if (!t[drawing.type]) t[drawing.type] = [];
    t[drawing.type] = t[drawing.type].filter(x => x.name !== templateName);
    t[drawing.type].push({
      name: templateName,
      style: {
        color: drawing.color,
        width: drawing.width,
        style: drawing.style,
        label: drawing.label,
        text: drawing.text,
        textAnchor: drawing.textAnchor,
        textVertical: drawing.textVertical,
        fibLevels: drawing.fibLevels,
      }
    });
    localStorage.setItem('drawingTemplates', JSON.stringify(t));
    setTemplateName('');
  }

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

  return (
    <div
      className="fixed z-[9999] flex flex-col bg-[#0f172a] border border-gray-300 dark:border-slate-700 rounded-md shadow-xl select-none"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Drag Handle & Main Tools */}
      <div className="flex items-center gap-0">
        <div 
          ref={dragRef}
          onMouseDown={() => setDragging(true)}
          className="w-6 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300 hover:bg-gray-100 dark:bg-slate-800 transition-colors border-r border-gray-300 dark:border-slate-700" title="Drag">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="7" cy="7" r="1.5"/><circle cx="3" cy="11" r="1.5"/><circle cx="7" cy="11" r="1.5"/></svg>
        </div>

        {/* Templates Toggle */}
        <div className="relative">
          <button onClick={() => setShowTemplates(!showTemplates)} className={`flex items-center justify-center w-9 h-8 hover:bg-gray-100 dark:bg-slate-800 transition-colors ${showTemplates?'bg-gray-100 dark:bg-slate-800 text-blue-400':'text-gray-600 dark:text-slate-400'}`}>
            <LayoutTemplate size={14}/>
          </button>
          {showTemplates && (
            <div className="absolute top-9 left-0 bg-[#1e293b] p-2 rounded-md border border-slate-600 shadow-2xl w-48 flex flex-col gap-2 z-[9999]">
              <div className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-1">Templates</div>
              {(getTemplates()[drawing.type]||[]).map(t => (
                <button key={t.name} onClick={() => { onUpdate(t.style); setShowTemplates(false); }} className="text-[11px] text-left px-2 py-1 text-gray-900 dark:text-slate-200 hover:bg-gray-200 dark:bg-slate-700 rounded transition-colors truncate">
                  {t.name}
                </button>
              ))}
              <div className="h-px bg-gray-200 dark:bg-slate-700 my-1"/>
              <div className="flex items-center gap-1">
                <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} onMouseDown={e => e.stopPropagation()} placeholder="Save As..." className="flex-1 bg-gray-100 dark:bg-slate-800 border border-slate-600 rounded px-1.5 py-1 text-[11px] text-white outline-none focus:border-blue-500" />
                <button onClick={saveTemplate} className="w-7 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"><Save size={12}/></button>
              </div>
            </div>
          )}
        </div>

        {/* Color Palette Toggle */}
        <div className="relative">
          <button onClick={() => setShowPalette(!showPalette)} className={`flex items-center justify-center w-9 h-8 hover:bg-gray-100 dark:bg-slate-800 transition-colors ${showPalette?'bg-gray-100 dark:bg-slate-800':''}`}>
            <div className="w-5 h-5 rounded-sm border border-slate-600" style={{ backgroundColor: col }}/>
          </button>
          {showPalette && (
            <div className="absolute top-9 left-0 bg-[#1e293b] p-3 rounded-md border border-slate-600 shadow-2xl flex flex-col gap-3 z-[9999]">
              <div className="grid grid-cols-6 gap-1 w-[160px]">
                {COLORS.map(c => (
                  <button key={c} onClick={() => { onUpdate({ color: c }); setShowPalette(false); }} className="w-6 h-6 rounded-sm hover:scale-110 transition-transform border border-gray-300 dark:border-slate-700/50" style={{ backgroundColor: c }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isText && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700"/>
            {/* Line styles */}
            {['solid','dashed','dotted'].map(s => (
              <button key={s} onClick={() => onUpdate({ style: s })} title={s}
                className={`w-9 h-8 flex items-center justify-center text-[11px] font-mono transition-colors ${(drawing.style||'solid')===s ? 'bg-blue-500/20 text-blue-500' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:bg-slate-800 hover:text-gray-900 dark:text-slate-200'}`}>
                {s==='solid'?'─':s==='dashed'?'╌':'·'}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700"/>
            {/* Thickness */}
            <div className="flex items-center px-2 gap-1">
              {[1,2,3].map(w => (
                <button key={w} onClick={() => onUpdate({ width: w })} title={`${w}px`}
                  className={`flex items-center justify-center transition-colors rounded ${(drawing.width||2)===w?'text-blue-500':'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300'}`}>
                  <div className="rounded-full bg-current" style={{ width: w*3+4, height: w, minWidth: 7 }}/>
                </button>
              ))}
            </div>
          </>
        )}

          {['box', 'trendline', 'horizontal', 'ray', 'fib', 'fib_ext', 'path', 'long', 'short'].includes(drawing.type) && (
            <>
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700"/>
              <button onClick={() => { if(onOpenSettings) onOpenSettings() }} className="w-9 h-8 flex items-center justify-center transition-colors text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800" title="Settings">
                <Settings2 size={14}/>
              </button>
            </>
          )}
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700"/>
          <button onClick={onDelete} className="w-9 h-8 flex items-center justify-center text-gray-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
            <Trash2 size={14}/>
          </button>
          <button onClick={onClose} className="w-9 h-8 flex items-center justify-center text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800 transition-colors border-l border-gray-300 dark:border-slate-700" title="Deselect">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>

        {/* Label Editor */}
        <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-[#0f172a] border-t border-gray-300 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-gray-500 dark:text-slate-500">{isText ? 'Text:' : 'Label:'}</span>
              <input
                type="text"
                value={isText ? (drawing.text || '') : (drawing.label || '')}
                onChange={e => onUpdate(isText ? { text: e.target.value } : { label: e.target.value })}
              placeholder={isText ? 'Enter text...' : 'Optional label...'}
              onMouseDown={e => e.stopPropagation()}
              className="bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-[11px] text-gray-900 dark:text-slate-200 px-1.5 py-0.5 outline-none focus:border-blue-500 w-full"
            />
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
               <span className="text-[9px] text-gray-500 dark:text-slate-500">Align:</span>
               {['start','middle','end'].map(a => (
                 <button key={a} onClick={() => onUpdate({ textAnchor: a })}
                   className={`px-1.5 py-0.5 text-[9px] rounded ${(drawing.textAnchor===a||(!drawing.textAnchor && a==='middle')) ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:bg-slate-800'}`}>
                   {a==='start'?'Left':a==='middle'?'Center':'Right'}
                 </button>
               ))}
            </div>
            {!isText && (
              <div className="flex items-center gap-1">
                 {['top','middle','bottom'].map(a => (
                   <button key={a} onClick={() => onUpdate({ textVertical: a })}
                     className={`px-1.5 py-0.5 text-[9px] rounded ${(drawing.textVertical===a||(!drawing.textVertical && a==='top')) ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:bg-slate-800'}`}>
                     {a==='top'?'Top':a==='middle'?'Mid':'Bot'}
                   </button>
                 ))}
              </div>
            )}
          </div>
        </div>

    </div>
  )
}

export default function TradingChart({ activeTicker, signalsOn, onToggleSignals, isFullscreen, onToggleFullscreen, onAiStateChange }) {
    const { orders, editOrder, closeOrder } = usePortfolio();
    const { theme: appTheme } = useTheme();
  // ── Chart refs ────────────────────────────────────────────────────────────
  const { processLivePrice } = usePortfolio()
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleRef    = useRef(null)
  const volRef       = useRef(null)
  const entryLineRef = useRef(null)
  const indicatorSeriesRef = useRef(new Map())
  const slLineRef    = useRef(null)
  const tpLineRef    = useRef(null)
  
  // AI specific price lines
  const aiEntryLineRef = useRef(null)
  const aiTpLineRef = useRef(null)
  const aiSlLineRef = useRef(null)
  
  const countdownRef = useRef(null)
  // Continuous RAF loop ref (for 60fps vertical sync)
  const loopRafRef   = useRef(null)
    const ordersRef = useRef(orders);
    useEffect(() => { ordersRef.current = orders; }, [orders]);
    const closeOrderRef = useRef(closeOrder);
    useEffect(() => { closeOrderRef.current = closeOrder; }, [closeOrder]);
  const activeTickerRef = useRef(activeTicker);
  useEffect(() => { activeTickerRef.current = activeTicker; }, [activeTicker]);
  const svgRef       = useRef(null)

  // ── App state ─────────────────────────────────────────────────────────────
  const [state, setState] = useState({ loading: false, error: null, info: null, lastCandle: null, changePct: null, count: 0 })
  const stateRef = useRef(state)
    const infoRef = useRef(state.info)
    useEffect(() => { infoRef.current = state.info }, [state.info])
  useEffect(() => { stateRef.current = state }, [state])
  const [isDrawerOpen, setIsDrawerOpen]         = useState(false)
  const isDrawerOpenRef = useRef(isDrawerOpen)
  useEffect(() => { isDrawerOpenRef.current = isDrawerOpen }, [isDrawerOpen])
  
  const [draftOrder, setDraftOrder] = useState({ orderType: 'BUY', execType: 'MARKET', qty: 10, limitPrice: '', sl: '', tp: '' })
  const draftOrderRef = useRef(draftOrder)
  useEffect(() => { draftOrderRef.current = draftOrder }, [draftOrder])

  const liveDataRef = useRef({ fullData: [], lastCandle: null })

  // ── Drawing UI state ──────────────────────────────────────────────────────
  const [activeTool, setActiveTool]     = useState('cursor')
  const [chartType, setChartType] = useState('candle')
  const [hoveredCandle, setHoveredCandle] = useState(null)
  const [activeIndicators, setActiveIndicators] = useState([])
  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false)
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false)
  const [selectedInterval, setSelectedInterval] = useState(INTERVALS.find(i => i.label === '15m'))
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false)
  const [favoriteTimeframes, setFavoriteTimeframes] = useState(['1m', '5m', '15m', '1H', '4H', '1D'])
  const [favoriteIndicators, setFavoriteIndicators] = useState([])
  const [isIndicatorSettingsOpen, setIsIndicatorSettingsOpen] = useState(false)
    const [isChartSettingsOpen, setIsChartSettingsOpen] = useState(false)
    const [chartTheme, setChartTheme] = useState(() => {
      const isLight = appTheme === 'light' || (!appTheme && typeof window !== 'undefined' && localStorage.getItem('app-theme') === 'light');
      const isPureBlack = appTheme === 'dark';
      return {
        mode: isLight ? 'light' : isPureBlack ? 'dark' : 'normal',
        upColor: '#10b981',
        downColor: '#ef4444',
        upBorder: '#10b981',
        downBorder: '#ef4444',
        upWick: '#10b981',
        downWick: '#ef4444',
        bgColor: isLight ? '#ffffff' : isPureBlack ? '#000000' : '#131722',
        textColor: isLight ? '#19181b' : '#d1d4dc',
        showGrid: true,
        gridColor: isLight ? '#e2e8f0' : '#363c4e60',
        showCrosshair: true,
        crosshairColor: isLight ? '#64748b' : '#d1d4dc'
      };
    })

    // Automatically sync chartTheme with global app theme
    useEffect(() => {
      if (!appTheme) return;
      if (appTheme === 'light') {
        setChartTheme(prev => ({
          ...prev,
          mode: 'light',
          bgColor: '#ffffff',
          textColor: '#19181b',
          gridColor: '#e2e8f0',
          crosshairColor: '#64748b'
        }));
      } else if (appTheme === 'dark') {
        setChartTheme(prev => ({
          ...prev,
          mode: 'dark',
          bgColor: '#000000',
          textColor: '#d1d4dc',
          gridColor: '#1e293b',
          crosshairColor: '#94a3b8'
        }));
      } else {
        setChartTheme(prev => ({
          ...prev,
          mode: 'normal',
          bgColor: '#131722',
          textColor: '#d1d4dc',
          gridColor: '#363c4e60',
          crosshairColor: '#d1d4dc'
        }));
      }
    }, [appTheme]);
    const [settingsIndicator, setSettingsIndicator] = useState(null)
  const [showDrawings, setShowDrawings] = useState(true)
  const [magnet, setMagnet]             = useState(false)
  const [drawings, setDrawings]         = useState([])
  const [selectedId, setSelectedId]     = useState(null)
  const [activeTickerLoaded, setActiveTickerLoaded] = useState(null)
  const [historyCount, setHistoryCount] = useState(0)
  
  // ── AI Trading Mode State & Freemium Mock State ─────────────────────────
  const [isAiEntryVisible, setIsAiEntryVisible] = useState(false)
  const [aiSetupData, setAiSetupData]   = useState(null)
  const [aiLoading, setAiLoading]       = useState(false)
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false)

  // ── Broker Connect State ───────────────────────────────────────────────────
  const [isBrokerConnected, setIsBrokerConnected] = useState(false)
  const [connectedBroker, setConnectedBroker] = useState(null)
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false)
  const [isProUser, setIsProUser]       = useState(true) // Default to Pro temporarily
  const [showProModal, setShowProModal] = useState(false)
  
  const [aiBoxPos, setAiBoxPos] = useState({ x: 16, y: 16 });
  const aiBoxDragRef = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0 });

  const handleAiBoxPointerDown = (e) => {
    aiBoxDragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initX: aiBoxPos.x, initY: aiBoxPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleAiBoxPointerMove = (e) => {
    if (!aiBoxDragRef.current.isDragging) return;
    const { startX, startY, initX, initY } = aiBoxDragRef.current;
    setAiBoxPos({ x: initX + (e.clientX - startX), y: initY + (e.clientY - startY) });
  };
  const handleAiBoxPointerUp = (e) => {
    aiBoxDragRef.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onAiStateChangeRef = useRef(onAiStateChange)
  useEffect(() => {
    onAiStateChangeRef.current = onAiStateChange
  }, [onAiStateChange])

  // Notify parent of AI state changes (ALWAYS notify if data exists)
  useEffect(() => {
    if (onAiStateChangeRef.current) {
      onAiStateChangeRef.current(true, aiSetupData, selectedInterval);
    }
  }, [aiSetupData, selectedInterval]);

  // Auto-off AI visuals when timeframe or ticker changes
  useEffect(() => {
    if (isAiEntryVisible) {
      setIsAiEntryVisible(false);
    }
  }, [selectedInterval.interval, activeTicker]);

  // ── Position Sizing Calculator State ──────────────────────────────────
  const [isPosCalcActive, setIsPosCalcActive] = useState(false);
  const posCalcDragRef = useRef({ draggingLine: null, mode: null }); // mode = 'poscalc' or 'ptrade'
  const posCalcLinesRef = useRef({ entryLine: null, slLine: null, tpLine: null, entryPrice: 0, slPrice: 0, tpPrice: 0 });
  const pTradeLinesRef = useRef({ entryLine: null, slLine: null, tpLine: null, entryPrice: 0, slPrice: 0, tpPrice: 0 });
  
  // MT5 Auto-Populate SL/TP
  useEffect(() => {
    if (isDrawerOpen) {
      setDraftOrder(prev => {
        const cmp = liveDataRef.current?.lastCandle?.close || 100;
        const updates = { ...prev };
        const isBuy = prev.orderType === 'BUY';

        if (prev.execType === 'STOP_LIMIT') {
          const defaultStop = isBuy ? cmp * 1.01 : cmp * 0.99;
          const defaultLimit = isBuy ? cmp * 1.015 : cmp * 0.985;
          updates.stopPrice = prev.stopPrice || defaultStop.toFixed(2);
          updates.limitPrice = prev.limitPrice || defaultLimit.toFixed(2);
          
          const baseStop = parseFloat(updates.stopPrice) || defaultStop;
          const baseLimit = parseFloat(updates.limitPrice) || defaultLimit;
          const slOffset = baseStop * 0.01;
          const tpOffset = baseLimit * 0.015;
          updates.sl = prev.sl || (isBuy ? baseStop - slOffset : baseStop + slOffset).toFixed(2);
          updates.tp = prev.tp || (isBuy ? baseLimit + tpOffset : baseLimit - tpOffset).toFixed(2);
        } else {
          let base = cmp;
          if (prev.execType === 'LIMIT') base = parseFloat(prev.limitPrice) || cmp;
          else if (prev.execType === 'STOP') base = parseFloat(prev.stopPrice) || cmp;
          
          const slOffset = base * 0.01;
          const tpOffset = base * 0.015;
          updates.sl = prev.sl || (isBuy ? base - slOffset : base + slOffset).toFixed(2);
          updates.tp = prev.tp || (isBuy ? base + tpOffset : base - tpOffset).toFixed(2);
        }
        
        return updates;
      });
    }
  }, [isDrawerOpen, draftOrder.execType, draftOrder.orderType]);

  const [posCalcInput, setPosCalcInput] = useState({ balance: 10000, risk: 1 });
  const posCalcInputRef = useRef({ balance: 10000, risk: 1 });
  useEffect(() => { posCalcInputRef.current = posCalcInput; }, [posCalcInput]);

  const updatePosCalcDOM = (entry, sl, tp) => {
    if (entry === 0 || sl === 0) return;
    const { balance, risk } = posCalcInputRef.current;
    const riskAmt = balance * (risk / 100);
    const diff = Math.abs(entry - sl);
    const isShort = sl > entry;
    let qty = 0;
    
    const isForexPair = activeTicker?.endsWith('=X');
    const isCryptoPair = activeTicker?.includes('-');

    if (diff > 0) {
      if (isForexPair) {
        const units = riskAmt / diff;
        qty = (units / 100000).toFixed(4) + ' Lots';
      } else if (isCryptoPair) {
        qty = (riskAmt / diff).toFixed(6) + ' Coins';
      } else {
        qty = (riskAmt / diff).toFixed(2) + ' Shares';
      }
    }

    const entryEl = document.getElementById('pos-calc-entry');
    const slEl = document.getElementById('pos-calc-sl');
    const tpEl = document.getElementById('pos-calc-tp');
    const qtyEl = document.getElementById('pos-calc-qty');
    const riskAmtEl = document.getElementById('pos-calc-risk-amt');

    if (entryEl) entryEl.innerText = entry.toFixed(4);
    if (slEl) slEl.innerText = sl.toFixed(4);
    if (tpEl && tp !== 0) tpEl.innerText = tp.toFixed(4);
    if (qtyEl) qtyEl.innerText = qty;
    if (riskAmtEl) riskAmtEl.innerText = '$' + riskAmt.toFixed(2);

    // Update dynamic P&L titles on the chart lines
    if (posCalcLinesRef.current.slLine) {
      // Risk is always a loss
      posCalcLinesRef.current.slLine.applyOptions({ title: `SL (-$${riskAmt.toFixed(2)})` });
    }
    
    if (posCalcLinesRef.current.tpLine && tp !== 0) {
      const tpDiff = Math.abs(tp - entry);
      const units = isForexPair ? (riskAmt / diff) : (riskAmt / diff); 
      // Approximate P&L for TP
      const tpPnl = units * tpDiff;
      posCalcLinesRef.current.tpLine.applyOptions({ title: `TP (+$${tpPnl.toFixed(2)})` });
    }
  };

  useEffect(() => {
    posCalcInputRef.current = posCalcInput;
    if (isPosCalcActive) updatePosCalcDOM(posCalcLinesRef.current.entryPrice, posCalcLinesRef.current.slPrice, posCalcLinesRef.current.tpPrice);
  }, [posCalcInput, isPosCalcActive, activeTicker]);

  const handleDownload = () => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.takeScreenshot();
    const link = document.createElement('a');
    link.download = `${activeTicker}-chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  }


    // Live Chart Theme Sync
    useEffect(() => {
      if (!chartRef.current || !candleRef.current) return;
      
      const isLight = chartTheme.mode === 'light' || chartTheme.bgColor === '#ffffff';
      const borderCol = isLight ? '#e2e8f0' : '#1e293b';

      chartRef.current.applyOptions({
        layout: { 
          background: { type: 'Solid', color: chartTheme.bgColor },
          textColor: chartTheme.textColor 
        },
        grid: { 
          vertLines: { visible: chartTheme.showGrid, color: chartTheme.gridColor }, 
          horzLines: { visible: chartTheme.showGrid, color: chartTheme.gridColor } 
        },
        rightPriceScale: {
          borderColor: borderCol,
        },
        timeScale: {
          borderColor: borderCol,
        },
        crosshair: {
          mode: chartTheme.showCrosshair ? 1 : 0,
          vertLine: { visible: chartTheme.showCrosshair, color: chartTheme.crosshairColor },
          horzLine: { visible: chartTheme.showCrosshair, color: chartTheme.crosshairColor }
        }
      });
      
      candleRef.current.applyOptions({
        upColor: chartTheme.upColor, 
        downColor: chartTheme.downColor, 
        borderUpColor: chartTheme.upBorder || chartTheme.upColor, 
        borderDownColor: chartTheme.downBorder || chartTheme.downColor, 
        wickUpColor: chartTheme.upWick || chartTheme.upColor, 
        wickDownColor: chartTheme.downWick || chartTheme.downColor
      });
    }, [chartTheme])
 // Triggers UI updates for Undo/Redo
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const candleCountdownRef = useRef('')

  useEffect(() => {
    setIsSettingsModalOpen(false)
  }, [selectedId])

  useEffect(() => {
    const interval = setInterval(() => {
      const fd = liveDataRef.current?.fullData;
      if (!fd || fd.length === 0) return;
      const lastCandle = fd[fd.length - 1];

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

      const now = Math.floor(Date.now() / 1000);
      const iv = selectedIntervalRef.current?.seconds || 60;
      const endTime = lastCandle.time + iv;
      const remaining = endTime - now;
      if (remaining <= 0) {
        candleCountdownRef.current = 'Closed';
      } else {
        const hh = Math.floor(remaining / 3600);
        const mm = Math.floor((remaining % 3600) / 60);
        const ss = remaining % 60;
        if (iv >= 3600) {
          candleCountdownRef.current = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
        } else {
          candleCountdownRef.current = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load drawings from localStorage
  useEffect(() => {
    if (!activeTicker) return
    try {
      const stored = localStorage.getItem(`st_drawings_${getFriendlyName(activeTicker)}`)
      if (stored) setDrawings(JSON.parse(stored))
      else setDrawings([])
    } catch {}
    setActiveTickerLoaded(activeTicker)
  }, [activeTicker])

  // Save drawings to localStorage
  useEffect(() => {
    if (activeTicker && activeTickerLoaded === activeTicker) {
      localStorage.setItem(`st_drawings_${getFriendlyName(activeTicker)}`, JSON.stringify(drawings))
    }
  }, [drawings, activeTicker, activeTickerLoaded])
  // svgRenders: pixel-mapped coords, rebuilt every RAF frame
  const [svgRenders, setSvgRenders]     = useState([])
  const [magnetPixel, setMagnetPixel]   = useState(null)
  const [countdownStr, setCountdownStr] = useState('')
  const countdownTimerRef               = useRef(null)
  // Replay mode
  const [replayMode, setReplayMode]     = useState(false)
  const [replayState, setReplayState]   = useState('none') // 'none' | 'selecting' | 'playing' | 'paused'
  const [replaySpeed, setReplaySpeed]   = useState(2) // 1x, 2x, 3x, 5x
  const replayStateRef  = useRef(replayState)
  useEffect(() => { replayStateRef.current = replayState }, [replayState])
  const [isDragging, setIsDragging]     = useState(false)
  const replayRef = useRef({ active: false, hiddenData: [], intervalId: null })

  // ── Refs always in sync (for closures inside event subscriptions) ─────────
  const activeToolRef   = useRef('cursor')
  const magnetRef       = useRef(false)
  const showDrawingsRef = useRef(true)
  const drawingsRef     = useRef([])
  const selectedIdRef   = useRef(null)
  const dragHandleRef   = useRef(null)
  const undoHistoryRef  = useRef([])
  const redoHistoryRef  = useRef([])
  const drawingWipRef = useRef({ id: null, type: null, points: [], previewPoint: null })
  const customCrosshairRef = useRef(null)

  const selectedIntervalRef = useRef(selectedInterval)
  useEffect(() => { selectedIntervalRef.current = selectedInterval }, [selectedInterval])


  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
  useEffect(() => { magnetRef.current = magnet }, [magnet])
  useEffect(() => { showDrawingsRef.current = showDrawings }, [showDrawings])
  useEffect(() => { drawingsRef.current = drawings }, [drawings])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  // Lock chart panning when a drawing tool is active
  useEffect(() => {
    if (!chartRef.current) return
    const isDrawing = activeTool !== 'cursor'
    const hideNative = magnet && isDrawing
    chartRef.current.applyOptions({
      handleScroll: !isDrawing,
      handleScale:  !isDrawing,
      crosshair: { mode: hideNative ? CrosshairMode.Hidden : CrosshairMode.Normal }
    })
  }, [activeTool, magnet])

  // ── Indicator Rendering Engine ────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    
    const activeMap = indicatorSeriesRef.current;
    
    // 1. Remove indicators that are no longer active or are invisible
    for (let [uid, series] of activeMap.entries()) {
      const ind = activeIndicators.find(i => i.uid === uid && i.visible !== false);
      if (!ind) {
        chartRef.current.removeSeries(series);
        activeMap.delete(uid);
      }
    }
    
    // 2. Add or update indicators
    const data = liveDataRef.current.fullData;
    if (!data || data.length === 0) return;

    activeIndicators.forEach(ind => {
      if (ind.visible === false) return;
      
      let series = activeMap.get(ind.uid);
      if (!series) {
        series = chartRef.current.addSeries(LineSeries, {
          color: ind.color || '#3b82f6',
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false
        });
        activeMap.set(ind.uid, series);
      } else {
        series.applyOptions({ color: ind.color || '#3b82f6' });
      }
      
      // Calculate math
      let calcData = [];
      const period = Number(ind.length) || 14;
        const source = ind.source || 'close';
        const type = ind.shortName?.toLowerCase() || '';
        
        if (type.includes('ema')) {
          calcData = calculateEMA(data, period, source);
        } else if (type.includes('sma') || type.includes('bb')) {
          calcData = calculateSMA(data, period, source);
        }
      
      if (calcData.length > 0) {
        series.setData(calcData);
      }
    });

  }, [activeIndicators, liveDataRef.current.fullData.length, liveDataRef.current.lastCandle?.close])

  // ── Countdown Timer Interval ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      if (!liveDataRef.current.lastCandle || !countdownRef.current) return;
      
      const exch = EXCHANGE_MAP[state.info?.exchange] || state.info?.exchange;
      if (!getMarketStatus(exch)) {
        countdownRef.current.innerText = 'Market Closed';
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const intSecs = selectedInterval.seconds || 60;
      const remaining = intSecs - (now % intSecs);
      if (remaining <= 0) return;
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      
      let text = '';
      if (intSecs >= 3600) {
        const h = Math.floor(m / 60);
        text = `${h}:${(m % 60).toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else {
        text = `${m}:${s.toString().padStart(2, '0')}`;
      }
      countdownRef.current.innerText = text;
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedInterval, state.info]);

  // ── AI Setup Fetcher (REAL QUANTITATIVE PREDICTION ENGINE) ────────────
  useEffect(() => {
    if (!activeTicker) {
      setAiSetupData(null);
      return;
    }
    
    setAiLoading(true);
    let isMounted = true;
    
    const generateQuantPrediction = async () => {
      try {
        const enc = encodeURIComponent((activeTicker || '').trim());
        const res = await fetch(`${API_BASE}/api/prediction/${enc}?interval=${selectedInterval.interval}`);
        let predData = null;
        if (res.ok) {
          predData = await res.json();
        }

        const currentPrice = predData?.entry || liveDataRef.current?.lastCandle?.close || 100;
        const trend = predData?.trend || (currentPrice >= (predData?.sma || currentPrice) ? 'BULLISH' : 'BEARISH');
        const isBullish = trend === 'BULLISH';
        const atr = predData?.atr || (currentPrice * 0.012);

        let tp = predData?.take_profit;
        let sl = predData?.stop_loss;
        if (!tp || !sl) {
          tp = isBullish ? currentPrice + (atr * 3.2) : currentPrice - (atr * 3.2);
          sl = isBullish ? currentPrice - (atr * 1.5) : currentPrice + (atr * 1.5);
        }

        const confidence = predData?.confidence || '82.5%';

        let ui_target = 'Swing Target (Next 1-2 Weeks)';
        if (['1s', '5s', '15s', '30s', '1m', '3m', '5m', '15m', '30m'].includes(selectedInterval.interval)) {
          ui_target = 'Intraday Target (Today)';
        } else if (['45m', '60m', '120m', '4h'].includes(selectedInterval.interval)) {
          ui_target = 'Short-Term Target (1-2 Days)';
        }

        const entryNum = parseFloat(Number(currentPrice).toFixed(2));
        const tpNum = parseFloat(Number(tp).toFixed(2));
        const slNum = parseFloat(Number(sl).toFixed(2));
        const riskRewardStr = predData?.risk_reward || `1 : ${((Math.abs(tpNum - entryNum) / Math.max(0.01, Math.abs(entryNum - slNum))) || 2.1).toFixed(1)}`;

        if (isMounted) {
          setAiSetupData({
            trend,
            confidence,
            entry: entryNum,
            take_profit: tpNum,
            stop_loss: slNum,
            hold_duration: isBullish ? '2-5 Days' : '1-3 Days',
            ui_target,
            riskReward: riskRewardStr,
            atr: parseFloat(Number(atr).toFixed(4)),
            sma: predData?.sma ? parseFloat(Number(predData.sma).toFixed(2)) : undefined
          });
          setAiLoading(false);
        }
      } catch (err) {
        console.error("AI Prediction fetch error:", err);
        if (isMounted) setAiLoading(false);
      }
    };
    
    generateQuantPrediction();
    
    return () => { isMounted = false; };
  }, [activeTicker, selectedInterval.interval]);

  // ── AI Visual Overlays (Controlled by isAiEntryVisible) ────────────────
  useEffect(() => {
    if (!candleRef.current) return;
    
    const clearLines = () => {
      if (aiEntryLineRef.current) { candleRef.current.removePriceLine(aiEntryLineRef.current); aiEntryLineRef.current = null; }
      if (aiSlLineRef.current) { candleRef.current.removePriceLine(aiSlLineRef.current); aiSlLineRef.current = null; }
      if (aiTpLineRef.current) { candleRef.current.removePriceLine(aiTpLineRef.current); aiTpLineRef.current = null; }
    };

    if (!isAiEntryVisible || !aiSetupData) {
      clearLines();
      return;
    }

    clearLines();
    aiEntryLineRef.current = candleRef.current.createPriceLine({
      price: aiSetupData.entry, color: '#3b82f6', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'AI Entry'
    });
    aiSlLineRef.current = candleRef.current.createPriceLine({
      price: aiSetupData.stop_loss, color: '#ef4444', lineWidth: 2, lineStyle: 1, axisLabelVisible: true, title: 'AI SL'
    });
    aiTpLineRef.current = candleRef.current.createPriceLine({
      price: aiSetupData.take_profit, color: '#10b981', lineWidth: 2, lineStyle: 1, axisLabelVisible: true, title: 'AI TP'
    });
    
    return clearLines;
  }, [isAiEntryVisible, aiSetupData]);

  // ── Position Calculator & P-Trade Drag Engine ─────────────────────
  useEffect(() => {
    if (!chartRef.current || !candleRef.current) return;
    
    const clearPosLines = () => {
      if (posCalcLinesRef.current.entryLine) { candleRef.current.removePriceLine(posCalcLinesRef.current.entryLine); posCalcLinesRef.current.entryLine = null; }
      if (posCalcLinesRef.current.slLine) { candleRef.current.removePriceLine(posCalcLinesRef.current.slLine); posCalcLinesRef.current.slLine = null; }
    };
    
    const clearPTradeLines = () => {
      if (pTradeLinesRef.current.entryLine) { candleRef.current.removePriceLine(pTradeLinesRef.current.entryLine); pTradeLinesRef.current.entryLine = null; }
      if (pTradeLinesRef.current.stopEntryLine) { candleRef.current.removePriceLine(pTradeLinesRef.current.stopEntryLine); pTradeLinesRef.current.stopEntryLine = null; }
      if (pTradeLinesRef.current.slLine) { candleRef.current.removePriceLine(pTradeLinesRef.current.slLine); pTradeLinesRef.current.slLine = null; }
      if (pTradeLinesRef.current.tpLine) { candleRef.current.removePriceLine(pTradeLinesRef.current.tpLine); pTradeLinesRef.current.tpLine = null; }
    };

    if (!isPosCalcActive) clearPosLines();
    if (!isDrawerOpen) clearPTradeLines();
    if (!isPosCalcActive && !isDrawerOpen) return;

    const currentPrice = liveDataRef.current?.lastCandle?.close || 100;

    // Initialize Pos Calc Lines (STRICTLY 2 LINES)
    if (isPosCalcActive && !posCalcLinesRef.current.entryLine) {
      const slPrice = currentPrice * 0.99;
      const entryLine = candleRef.current.createPriceLine({
        price: currentPrice, color: '#3b82f6', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'Entry'
      });
      const slLine = candleRef.current.createPriceLine({
        price: slPrice, color: '#ef4444', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'SL'
      });
      posCalcLinesRef.current = { entryLine, slLine, entryPrice: currentPrice, slPrice };
      setTimeout(() => updatePosCalcDOM(currentPrice, slPrice), 50);
    }

    // Initialize P-Trade Lines (Conditional Rendering)
    if (isDrawerOpen) {
      clearPTradeLines(); // recreate to match draftOrder state if it changes
      const dOrder = draftOrderRef.current;
      const isMarket = dOrder.execType === 'MARKET';
      const isLimit = dOrder.execType === 'LIMIT';
      const isStop = dOrder.execType === 'STOP';
      const isStopLimit = dOrder.execType === 'STOP_LIMIT';
      
      const lPrice = parseFloat(dOrder.limitPrice) || currentPrice;
      const sPrice = parseFloat(dOrder.stopPrice) || currentPrice;
      const slPrice = parseFloat(dOrder.sl) || null;
      const tpPrice = parseFloat(dOrder.tp) || null;
      
      let entryLine = null;
      let stopEntryLine = null;

      if (isLimit) {
        entryLine = candleRef.current.createPriceLine({
          price: lPrice, color: '#3b82f6', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'LIMIT'
        });
      } else if (isStop) {
        entryLine = candleRef.current.createPriceLine({
          price: sPrice, color: '#f59e0b', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'STOP'
        });
      } else if (isStopLimit) {
        entryLine = candleRef.current.createPriceLine({
          price: lPrice, color: '#3b82f6', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'LIMIT'
        });
        stopEntryLine = candleRef.current.createPriceLine({
          price: sPrice, color: '#f59e0b', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'STOP'
        });
      }

      const qty = parseFloat(dOrder.qty) || 1;
      const getPnlTitle = (type, targetPrice, baseEntry) => {
        if (!targetPrice || !baseEntry) return type;
        const diff = dOrder.orderType === 'BUY' ? targetPrice - baseEntry : baseEntry - targetPrice;
        const amt = diff * qty;
        const pct = (diff / baseEntry) * 100;
        const sign = amt >= 0 ? '+' : '-';
        return `${type}: ${sign}$${Math.abs(amt).toFixed(2)} (${sign}${Math.abs(pct).toFixed(2)}%)`;
      };

      const basePriceForPnl = isStop ? sPrice : (isLimit || isStopLimit ? lPrice : currentPrice);

      const slLine = slPrice ? candleRef.current.createPriceLine({
        price: slPrice, color: '#ef4444', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: getPnlTitle('SL', slPrice, basePriceForPnl)
      }) : null;
      const tpLine = tpPrice ? candleRef.current.createPriceLine({
        price: tpPrice, color: '#10b981', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: getPnlTitle('TP', tpPrice, basePriceForPnl)
      }) : null;
      
      pTradeLinesRef.current = { 
        entryLine, 
        stopEntryLine, 
        slLine, 
        tpLine, 
        entryPrice: isStop ? sPrice : lPrice, 
        stopPrice: sPrice,
        slPrice, 
        tpPrice 
      };
    }

    const checkDragHit = (clientY) => {
      const series = candleRef.current;
      if (!series) return null;

      const checkHit = (lineObj, priceValue) => {
        if (!lineObj || priceValue == null) return false;
        const numPrice = parseFloat(priceValue);
        if (isNaN(numPrice)) return false;
        const y = series.priceToCoordinate(numPrice);
        return y !== null && Math.abs(clientY - y) <= 6;
      };

      // Check PTrade lines first if open
      if (isDrawerOpen) {
        const { entryLine, stopEntryLine, slLine, tpLine, entryPrice, stopPrice, slPrice, tpPrice } = pTradeLinesRef.current;
        if (checkHit(entryLine, entryPrice)) return { mode: 'ptrade', line: 'entry' };
        if (checkHit(stopEntryLine, stopPrice)) return { mode: 'ptrade', line: 'stopEntry' };
        if (checkHit(slLine, slPrice)) return { mode: 'ptrade', line: 'sl' };
        if (checkHit(tpLine, tpPrice)) return { mode: 'ptrade', line: 'tp' };
      }
      
      // Check Pos Calc lines if open
      if (isPosCalcActive && !isDrawerOpen) {
        const { entryLine, slLine, entryPrice, slPrice } = posCalcLinesRef.current;
        if (checkHit(entryLine, entryPrice)) return { mode: 'poscalc', line: 'entry' };
        if (checkHit(slLine, slPrice)) return { mode: 'poscalc', line: 'sl' };
      }
      return null;
    };

    const handlePointerDown = (e) => {
      if (!chartRef.current || !candleRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientY = e.clientY - rect.top;
      const hit = checkDragHit(clientY);
      
      if (hit) {
        posCalcDragRef.current = { draggingLine: hit.line, mode: hit.mode, intendedExec: null };
        chartRef.current.applyOptions({ handleScroll: false, handleScale: false });
        document.body.style.userSelect = 'none';
      }
    };

    const handleCrosshairMove = (param) => {
      if (!chartRef.current || !candleRef.current) return;
      const drag = posCalcDragRef.current;
      if (drag && drag.draggingLine) return;

      if (!param.point) {
        if (containerRef.current) containerRef.current.style.cursor = 'crosshair';
        return;
      }
      
      const hit = checkDragHit(param.point.y);
      if (containerRef.current) {
        containerRef.current.style.cursor = hit ? 'ns-resize' : 'crosshair';
      }
    };

    const handlePointerMove = (e) => {
      if (!chartRef.current || !candleRef.current) return;
      const drag = posCalcDragRef.current;
      if (!drag.draggingLine) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const clientY = e.clientY - rect.top;
      
      containerRef.current.style.cursor = 'grabbing';
      
      const newPrice = candleRef.current.coordinateToPrice(clientY);
      if (newPrice == null) return;

      if (drag.mode === 'poscalc') {
        const refs = posCalcLinesRef.current;
        if (drag.draggingLine === 'entry') { refs.entryLine.applyOptions({ price: newPrice }); refs.entryPrice = newPrice; }
        else if (drag.draggingLine === 'sl') { refs.slLine.applyOptions({ price: newPrice }); refs.slPrice = newPrice; }
        updatePosCalcDOM(refs.entryPrice, refs.slPrice);
      } 
      else if (drag.mode === 'ptrade') {
        const refs = pTradeLinesRef.current;
        const dOrder = draftOrderRef.current;
        
        if (drag.draggingLine === 'entry' || drag.draggingLine === 'stopEntry') { 
          const isStopDrag = drag.draggingLine === 'stopEntry' || (dOrder.execType === 'STOP' && drag.draggingLine === 'entry');
          const isLimitDrag = !isStopDrag;
          
          if (isLimitDrag && refs.entryLine) {
             refs.entryLine.applyOptions({ price: newPrice }); 
             refs.entryPrice = newPrice; 
          } else if (isStopDrag) {
             const targetLine = refs.stopEntryLine || refs.entryLine;
             if (targetLine) targetLine.applyOptions({ price: newPrice });
             refs.stopPrice = newPrice;
          }
          
          // MT5 Auto-Switch LIMIT/STOP Logic (Visual Only - No State Commits Mid-Drag)
          const cmp = liveDataRef.current?.lastCandle?.close || 100;
          let currentExec = dOrder.execType;
          if (['LIMIT', 'STOP'].includes(currentExec)) {
             let newExec = currentExec;
             const evalPrice = isLimitDrag ? refs.entryPrice : refs.stopPrice;
             
             if (dOrder.orderType === 'BUY') {
                newExec = evalPrice > cmp ? 'STOP' : 'LIMIT';
             } else {
                newExec = evalPrice < cmp ? 'STOP' : 'LIMIT';
             }
             
             if (newExec !== currentExec) {
                drag.intendedExec = newExec;
                const targetLine = isLimitDrag ? refs.entryLine : (refs.stopEntryLine || refs.entryLine);
                if (targetLine) {
                   targetLine.applyOptions({ 
                      title: newExec,
                      color: newExec === 'STOP' ? '#f59e0b' : '#3b82f6'
                   });
                }
             } else {
                drag.intendedExec = null;
                const targetLine = isLimitDrag ? refs.entryLine : (refs.stopEntryLine || refs.entryLine);
                if (targetLine) {
                   targetLine.applyOptions({ 
                      title: currentExec,
                      color: currentExec === 'STOP' ? '#f59e0b' : '#3b82f6'
                   });
                }
             }
          }
          
          // Fast sync numeric input
          if (isLimitDrag) {
            const el = document.getElementById('pt-entry-input');
            if (el) el.value = newPrice.toFixed(2);
          }
          if (isStopDrag || currentExec === 'STOP' || dOrder.execType === 'STOP') {
            const el = document.getElementById('pt-stopprice-input');
            if (el) el.value = newPrice.toFixed(2);
          }
        }
        else if (drag.draggingLine === 'tp') { 
          refs.tpLine.applyOptions({ price: newPrice }); 
          refs.tpPrice = newPrice;
          const el = document.getElementById('pt-tp-input');
          if (el) el.value = newPrice.toFixed(2);
        }
        else if (drag.draggingLine === 'sl') { 
          refs.slLine.applyOptions({ price: newPrice }); 
          refs.slPrice = newPrice; 
          const el = document.getElementById('pt-sl-input');
          if (el) el.value = newPrice.toFixed(2);
        }
        
        const qty = parseFloat(dOrder.qty) || 1;
        const getPnlTitle = (type, targetPrice, baseEntry) => {
          if (!targetPrice || !baseEntry) return type;
          const diff = dOrder.orderType === 'BUY' ? targetPrice - baseEntry : baseEntry - targetPrice;
          const amt = diff * qty;
          const pct = (diff / baseEntry) * 100;
          const sign = amt >= 0 ? '+' : '-';
          return `${type}: ${sign}$${Math.abs(amt).toFixed(2)} (${sign}${Math.abs(pct).toFixed(2)}%)`;
        };

        const baseEntry = dOrder.execType === 'STOP' ? refs.stopPrice : (['LIMIT', 'STOP_LIMIT'].includes(dOrder.execType) ? refs.entryPrice : currentPrice);

        if (refs.tpLine) {
           refs.tpLine.applyOptions({ title: getPnlTitle('TP', refs.tpPrice, baseEntry) });
        }
        if (refs.slLine) {
           refs.slLine.applyOptions({ title: getPnlTitle('SL', refs.slPrice, baseEntry) });
        }
      }
    };

    const handlePointerUp = () => {
      const drag = posCalcDragRef.current;
      if (drag.draggingLine) {
        if (drag.mode === 'ptrade') {
           const refs = pTradeLinesRef.current;
           setDraftOrder(prev => {
             const updates = { ...prev };
             if (drag.intendedExec) {
                updates.execType = drag.intendedExec;
             }
             if (drag.draggingLine === 'entry') {
                if (['LIMIT', 'STOP_LIMIT'].includes(updates.execType)) updates.limitPrice = refs.entryPrice.toFixed(2);
                if (['STOP'].includes(updates.execType)) updates.stopPrice = (refs.stopPrice || refs.entryPrice).toFixed(2);
             }
             if (drag.draggingLine === 'stopEntry') {
                updates.stopPrice = refs.stopPrice.toFixed(2);
             }
             if (drag.draggingLine === 'sl') updates.sl = refs.slPrice.toFixed(2);
             if (drag.draggingLine === 'tp') updates.tp = refs.tpPrice.toFixed(2);
             return updates;
           });
        }
        
        posCalcDragRef.current = { draggingLine: null, mode: null, intendedExec: null };
        if (chartRef.current) chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
        if (containerRef.current) containerRef.current.style.cursor = 'crosshair';
        document.body.style.userSelect = 'auto';
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    if (chartRef.current) {
      chartRef.current.subscribeCrosshairMove(handleCrosshairMove);
    }

    return () => {
      clearPosLines();
      clearPTradeLines();
      if (container) {
        container.removeEventListener('pointerdown', handlePointerDown);
        container.style.cursor = 'crosshair';
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (chartRef.current) {
        chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
        chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
      }
    };
  }, [isPosCalcActive, isDrawerOpen, activeTicker, draftOrder.execType, draftOrder.orderType, draftOrder.qty, draftOrder.sl, draftOrder.tp, draftOrder.limitPrice, draftOrder.stopPrice]);

  // ─────────────────────────────────────────────────────────────────────────
  // CONTINUOUS 60FPS RAF LOOP — This is the key fix for vertical drag lag.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let frameId = null

    const loop = () => {
      frameId = requestAnimationFrame(loop)

      try {
        if (!chartRef.current || !candleRef.current || !showDrawingsRef.current) {
          setSvgRenders([])
          return
        }

        const all = [...drawingsRef.current]
        const wip = drawingWipRef.current
        if (wip && wip.id) {
          const pts = wip.previewPoint ? [...wip.points, wip.previewPoint] : [...wip.points]
          all.push({
            id: wip.id, type: wip.type, points: pts,
            color: '#3b82f6', fill: 'rgba(59,130,246,0.1)',
            width: 2, style: 'solid', label: '', text: '',
          })
        }

        const ts = chartRef.current.timeScale()
        const cs = candleRef.current
        const fullData = liveDataRef.current?.fullData || []
        const intSecs = selectedIntervalRef.current?.seconds || 60

        // Inject active locked orders
        const activeOrders = ordersRef.current ? ordersRef.current.filter(o => o.ticker === activeTickerRef.current && o.status === 'OPEN') : [];
        activeOrders.forEach(o => {
          all.push({
            id: 'order_' + o.id, type: 'paper_order', orderData: o, points: []
          });
        });

        const mapped = all.map(d => {
          if (d.type === 'paper_order') {
            const o = d.orderData;
            return {
               ...d,
               eY: o.entryPrice ? cs.priceToCoordinate(o.entryPrice) : null,
               tpY: o.tp ? cs.priceToCoordinate(o.tp) : null,
               slY: o.sl ? cs.priceToCoordinate(o.sl) : null,
            }
          }
          return {
            ...d,
            coords: (d.points || []).map(p => ({
              x:     resolvePixelFromTime(p.time, ts, fullData, intSecs),
              y:     cs.priceToCoordinate(p.price),
              time:  p.time,
              price: p.price,
            }))
          }
        })

        setSvgRenders(mapped)

        if (customCrosshairRef.current && chartRef.current && candleRef.current) {
          const cx = resolvePixelFromTime(customCrosshairRef.current.time, ts, fullData, intSecs)
          const cy = cs.priceToCoordinate(customCrosshairRef.current.price)
          if (cx != null && cy != null) {
            setMagnetPixel({ x: cx, y: cy })
          } else {
            setMagnetPixel(null)
          }
        } else {
          setMagnetPixel(null)
        }

        if (countdownTimerRef.current && candleRef.current) {
          if (liveDataRef.current && liveDataRef.current.lastCandle) {
            const cy = cs.priceToCoordinate(liveDataRef.current.lastCandle.close)
            if (cy != null && !isNaN(cy)) {
              countdownTimerRef.current.style.display = 'block'
              countdownTimerRef.current.style.top = (cy + 16) + 'px'
              if (candleCountdownRef.current) {
                countdownTimerRef.current.innerText = candleCountdownRef.current
              }
            } else {
              countdownTimerRef.current.style.display = 'none'
            }
          } else {
            countdownTimerRef.current.style.display = 'none'
          }
        }
      } catch (err) {
        console.error('Drawing RAF Loop Error:', err)
      }
    }

    frameId = requestAnimationFrame(loop)
    loopRafRef.current = frameId

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      loopRafRef.current = null
    }
  }, [showDrawings])

  // ── Replay Mode Engine ──────────────────────────────────────────────────
  useEffect(() => {
    if (replayState === 'playing') {
      replayRef.current.active = true;
      const ms = 1000 / replaySpeed;
      const iid = setInterval(() => {
        if (!replayRef.current.active || !replayRef.current.hiddenData.length) {
          clearInterval(iid);
          replayRef.current.intervalId = null;
          if (!replayRef.current.hiddenData.length) setReplayState('paused');
          return;
        }
        const next = replayRef.current.hiddenData.shift();
        candleRef.current?.update(next);
        liveDataRef.current.fullData.push(next);
        liveDataRef.current.lastCandle = next;
        setState(s => ({ ...s, lastCandle: next }));
      }, ms);
      replayRef.current.intervalId = iid;
      return () => { clearInterval(iid); replayRef.current.intervalId = null; };
    } else {
      replayRef.current.active = false;
    }
  }, [replayState, replaySpeed]);

  // Global Ctrl key for Magnet Mode
  useEffect(() => {
    let isCtrlHeld = false
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeToolRef.current !== 'cursor' || drawingWipRef.current.id) {
          resetWip()
          setActiveTool('cursor')
        }
        setSelectedId(null)
      }
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
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Chart init — runs ONCE on mount
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const isLightInitial = chartTheme.mode === 'light' || chartTheme.bgColor === '#ffffff';
    const borderColInitial = isLightInitial ? '#e2e8f0' : '#1e293b';

    const chart = createChart(containerRef.current, {
      localization: {
        timeFormatter: (t) => new Date(t * 1000).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit',
          day: '2-digit', month: 'short',
        })
      },
      layout: { background: { type: 'Solid', color: chartTheme.bgColor || '#131722' }, textColor: chartTheme.textColor || '#94a3b8', fontSize: 11 },
      grid: {
        vertLines: { color: chartTheme.gridColor || (isLightInitial ? '#e2e8f0' : '#1e293b'), style: LineStyle.Dotted },
        horzLines: { color: chartTheme.gridColor || (isLightInitial ? '#e2e8f0' : '#1e293b'), style: LineStyle.Dotted },
      },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: chartTheme.crosshairColor || '#334155' }, horzLine: { color: chartTheme.crosshairColor || '#334155' } },
      rightPriceScale: { borderColor: borderColInitial, mode: PriceScaleMode.Normal },
      timeScale: { borderColor: borderColInitial, timeVisible: true, secondsVisible: false, rightOffset: 5, barSpacing: 8 },
    })
    chartRef.current = chart

    const cs = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor:   '#10b981', wickDownColor:   '#ef4444',
    })
    candleRef.current = cs

    const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
    volRef.current = vs

    const resolveTime = (param) => {
      if (param.time) return param.time
      if (!param.point || !chartRef.current) return null
      return resolveTimeFromPixel(param.point.x, chartRef.current.timeScale(), liveDataRef.current.fullData, selectedIntervalRef.current?.seconds || 60)
    }

    chart.subscribeClick((param) => {
      if (!param.point) return
      const tool = activeToolRef.current
      let time = resolveTime(param)
      if (!time) return

      if (replayStateRef.current === 'selecting') {
        const idx = liveDataRef.current.fullData.findIndex(c => Math.abs(c.time - time) < 2);
        if (idx !== -1) {
          const allData = [...liveDataRef.current.fullData];
          const visibleData = allData.slice(0, idx);
          const hiddenData  = allData.slice(idx);
          replayRef.current.hiddenData = hiddenData;
          replayRef.current.active     = false;
          if (candleRef.current) {
            candleRef.current.setData(visibleData);
            chart.timeScale().fitContent();
          }
          setReplayState('paused');
        }
        return;
      }
      
      if (tool === 'cursor') {
        const px = param.point.x, py = param.point.y
        const ts2 = chart.timeScale()
        let bestId = null, bestDist = 18
        for (const d of drawingsRef.current) {
          if (!d.points.length) continue
          const x0 = ts2.timeToCoordinate(d.points[0].time)
          const y0 = cs.priceToCoordinate(d.points[0].price)
          if (x0 == null || y0 == null) continue
          let dist = Math.hypot(px - x0, py - y0)
          if (dist < bestDist) { bestDist = dist; bestId = d.id }
          if (d.points.length >= 2) {
            const x1 = ts2.timeToCoordinate(d.points[1].time)
            const y1 = cs.priceToCoordinate(d.points[1].price)
            if (x1 != null || y1 != null) {
              const d1   = Math.hypot(px - x1, py - y1)
              const dmid = Math.hypot(px - (x0+x1)/2, py - (y0+y1)/2)
              if (d1   < bestDist) { bestDist = d1;   bestId = d.id }
              if (dmid < bestDist) { bestDist = dmid;  bestId = d.id }
            }
          }
        }
        setSelectedId(bestId)
        return
      }

      setSelectedId(null)
      let price = cs.coordinateToPrice(param.point.y) || 0

      if (magnetRef.current && customCrosshairRef.current && activeToolRef.current !== 'cursor') {
        time = customCrosshairRef.current.time
        price = customCrosshairRef.current.price
      }

      const wip = drawingWipRef.current

      if (!wip.id) {
        wip.id = Date.now().toString()
        wip.type = tool
        wip.points = [{ time, price }]
        wip.previewPoint = null

        if (['horizontal','vertical','ray','arrow_up','arrow_down'].includes(tool)) {
          commitDrawings(prev => [...prev, mkDraw(wip.id, tool, [...wip.points])])
          resetWip(); setActiveTool('cursor')
        } else if (['long','short'].includes(tool)) {
          const tp = tool === 'long' ? price * 1.015 : price * 0.985
            const sl = tool === 'long' ? price * 0.9925 : price * 1.0075
          commitDrawings(prev => [...prev, mkDraw(wip.id, tool, [{ time, price }, { time, price: tp }, { time, price: sl }])])
          resetWip(); setActiveTool('cursor')
        } else if (tool === 'text') {
          commitDrawings(prev => [...prev, { id: wip.id, type: 'text', points: [{ time, price }], text: 'Text', color: '#f1f5f9', fill: 'none', width: 1, style: 'solid', label: '' }])
          resetWip(); setActiveTool('cursor')
        }
      } else {
        wip.points.push({ time, price })
        wip.previewPoint = null
        const needed = { trendline: 2, box: 2, circle: 2, fib: 2, fib_ext: 3, measure: 2, head_shoulders: 7 }[wip.type] || 2

        if (wip.type === 'path') {
          const pts = wip.points
          if (pts.length >= 3 &&
              Math.abs(pts.at(-1).time - pts.at(-2).time) < 2 &&
              Math.abs(pts.at(-1).price - pts.at(-2).price) < 0.0001) {
            commitDrawings(prev => [...prev, mkDraw(wip.id, 'path', pts.slice(0,-1))])
            resetWip(); setActiveTool('cursor')
          }
        } else if (wip.points.length >= needed) {
          commitDrawings(prev => [...prev, mkDraw(wip.id, wip.type, [...wip.points])])
          resetWip(); setActiveTool('cursor')
        }
      }
    })

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !liveDataRef.current.fullData) {
        setHoveredCandle(null)
      } else {
        const dataPoint = liveDataRef.current.fullData.find(d => d.time === param.time);
        if (dataPoint) setHoveredCandle(dataPoint);
      }
      const wip = drawingWipRef.current
      if (!param.point) {
        customCrosshairRef.current = null
        return
      }
      const time = resolveTime(param)
      if (!time) {
        customCrosshairRef.current = null
        return
      }
      let price = cs.coordinateToPrice(param.point.y) || 0
      
      // Update cursor based on hover over interactive lines (10px tolerance)
      if (containerRef.current) {
        let isHoveringLine = false;
        
        // P-Trade Lines
        if (pTradeLinesRef.current.entryLine) {
           const { entryPrice, slPrice, tpPrice } = pTradeLinesRef.current;
           const range = Math.abs(entryPrice - (slPrice || entryPrice)) * 0.1 || entryPrice * 0.005;
           if (Math.abs(price - entryPrice) < range) isHoveringLine = true;
           if (slPrice && Math.abs(price - slPrice) < range) isHoveringLine = true;
           if (tpPrice && Math.abs(price - tpPrice) < range) isHoveringLine = true;
        }
        
        // Pos Calc Lines
        if (posCalcLinesRef.current.entryLine) {
           const { entryPrice, slPrice, tpPrice } = posCalcLinesRef.current;
           const range = Math.abs(entryPrice - slPrice) * 0.1 || entryPrice * 0.005;
           if (Math.abs(price - entryPrice) < range) isHoveringLine = true;
           if (Math.abs(price - slPrice) < range) isHoveringLine = true;
           if (Math.abs(price - tpPrice) < range) isHoveringLine = true;
        }

        containerRef.current.style.cursor = isHoveringLine ? 'ns-resize' : (activeToolRef.current !== 'cursor' ? 'crosshair' : 'default');
      }
      
      let isSnapped = false
      if (magnetRef.current && activeToolRef.current !== 'cursor') {
        const c = liveDataRef.current.fullData.find(x => x.time === time)
        if (c) {
          const vals = [c.open, c.high, c.low, c.close]
          price = vals.reduce((a, b) => Math.abs(b - price) < Math.abs(a - price) ? b : a)
          isSnapped = true
        }
      }

      if (isSnapped) {
        customCrosshairRef.current = { time, price }
      } else {
        customCrosshairRef.current = null
      }

      if (wip.points.length > 0) {
        wip.previewPoint = { time, price }
      }
    })

    const obs = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    })
    obs.observe(containerRef.current)

    return () => {
      obs.disconnect()
      chart.remove()
      if (loopRafRef.current) cancelAnimationFrame(loopRafRef.current)
      candleRef.current = null
      chartRef.current  = null
      volRef.current    = null
    }
  }, [])

  useEffect(() => {
    if (replayMode) {
      setReplayMode(false)
      setReplayState('none')
    }
    setTimeout(() => {
      if (!chartRef.current) return
      chartRef.current.timeScale().fitContent()
      chartRef.current.priceScale('right').applyOptions({ autoScale: true })
    }, 120)
  }, [selectedInterval])

  const fetchData = useCallback(async (silent = false) => {
    if (!activeTicker || !chartRef.current || !candleRef.current) return
    if (!silent) setState(s => ({ ...s, loading: true, error: null }))
    try {
      if (isBrokerConnected) {
        // TODO: Init WebSocket with Broker Access Token
        // Currently falling back to REST for the mockup
      } else {
        // TODO: Fetch delayed REST API data (e.g., Yahoo Finance)
      }
      
      const enc = encodeURIComponent((activeTicker || '').trim())
      const res = await fetch(`${API_BASE}/api/market-data/${enc}?period=${selectedInterval.period}&interval=${selectedInterval.interval}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      if (!data.candles?.length) throw new Error('No data returned')
      data.candles.forEach(c => c.value = c.close)
      if (!candleRef.current) return
      candleRef.current.setData(data.candles)
      liveDataRef.current = { fullData: [...data.candles], lastCandle: data.candles.at(-1) }
      volRef.current?.setData(data.candles.map(c => ({
        time: c.time, value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
      })))
      const lastC = data.candles.at(-1)
      const changePct = lastC ? ((lastC.close - lastC.open) / lastC.open) * 100 : null
      setState(s => ({ ...s, loading: false, info: data.info, lastCandle: lastC, changePct, count: data.count }))
      if (!silent && chartRef.current) chartRef.current.timeScale().fitContent()
    } catch (err) {
      if (!silent) setState(s => ({ ...s, loading: false, error: err.message }))
    }
  }, [activeTicker, selectedInterval, isBrokerConnected])

  useEffect(() => { fetchData(false) }, [fetchData])

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


  useEffect(() => {
    if (!candleRef.current || typeof candleRef.current.setMarkers !== 'function') return
    if (signalsOn && liveDataRef.current.fullData.length) {
      const markers = liveDataRef.current.fullData.filter(c => c.ai_signal).map(c => ({
        time: c.time,
        position: c.ai_signal === 'BUY' ? 'belowBar' : 'aboveBar',
        color:    c.ai_signal === 'BUY' ? '#10b981'  : '#ef4444',
        shape:    c.ai_signal === 'BUY' ? 'arrowUp'  : 'arrowDown',
        text: c.ai_signal, size: 1,
      }))
      candleRef.current.setMarkers(markers)
    } else {
      if (candleRef.current && typeof candleRef.current.setMarkers === 'function') candleRef.current.setMarkers([])
    }
  }, [signalsOn, state.count])

  useEffect(() => {
    if (!activeTicker || replayMode || replayState !== 'none') return

    const ivSecs = selectedInterval.seconds
    
    const countdownId = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000)
      const remain = ivSecs - (nowSec % ivSecs)
      const mm = Math.floor(remain / 60).toString().padStart(2, '0')
      const ss = (remain % 60).toString().padStart(2, '0')
      setCountdownStr(ivSecs >= 3600 ? '' : `${mm}:${ss}`)
    }, 1000)

    const isCrypto = activeTicker.endsWith('-USD') || activeTicker.endsWith('-USDT')
    let ws = null
    let pollId = null

    if (isCrypto) {
      // ── Binance WebSocket ──────────────────────────────────────────────
      const symbol = activeTicker.replace('-', '').replace('USD', 'USDT').toLowerCase()
      let binanceIv = selectedInterval.interval
      if (binanceIv === '1wk') binanceIv = '1w'
      if (binanceIv === '1mo') binanceIv = '1M'
      
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${binanceIv}`)
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (!msg.k) return
          const k = msg.k
          const flooredTime = Math.floor(k.t / 1000)
          
          setState(s => {
            const cur = s.lastCandle
            if (!cur || !candleRef.current) return s
            
            const updated = {
              time: flooredTime,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c)
            }
            
            candleRef.current?.update(updated)
            volRef.current?.update({ time: updated.time, value: parseFloat(k.v), color: updated.close >= updated.open ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)' })
            
            // Trigger Auto-Close engine
            processLivePrice(activeTicker, updated.close)

            const fd = liveDataRef.current.fullData
            if (fd.length && fd.at(-1).time === updated.time) {
              fd[fd.length - 1] = updated
            } else if (flooredTime > cur.time) {
              fd.push(updated)
            }
            
            liveDataRef.current.lastCandle = updated
            return { ...s, lastCandle: updated }
          })
        } catch (e) {}
      }
    } else {
      // ── REST Polling & Dynamic Next Candle Formation Engine ───────────
      let candleBirthSec = Math.floor(Date.now() / 1000)
      pollId = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/latest-price/${encodeURIComponent((activeTicker || '').trim())}`)
          if (!res.ok) return
          const candle = await res.json()
          if (!candle?.close) return
          const flooredTime = Math.floor(candle.time / ivSecs) * ivSecs
          const nowSec = Math.floor(Date.now() / 1000)

          setState(s => {
            const cur = s.lastCandle
            if (!cur || !candleRef.current) return s
            let updated

            // Trigger next candle formation if delayed market data advanced OR if interval elapsed in active session
            const shouldFormNext = (flooredTime > cur.time) || ((nowSec - candleBirthSec) >= ivSecs)

            if (shouldFormNext) {
              candleBirthSec = nowSec
              const nextTime = flooredTime > cur.time ? flooredTime : (cur.time + ivSecs)
              updated = { 
                time: nextTime, 
                open: cur.close, 
                high: Math.max(cur.close, candle.high || candle.close), 
                low: Math.min(cur.close, candle.low || candle.close), 
                close: candle.close 
              }
              liveDataRef.current.fullData.push(updated)
            } else {
              // Real-time tick update within the active bar
              updated = { 
                time: cur.time, 
                open: cur.open, 
                high: Math.max(cur.high, candle.close), 
                low: Math.min(cur.low, candle.close), 
                close: candle.close, 
                value: candle.close 
              }
              const fd = liveDataRef.current.fullData
              if (fd.length && fd.at(-1).time === updated.time) fd[fd.length - 1] = updated
            }

            candleRef.current?.update(updated)
            volRef.current?.update({ 
              time: updated.time, 
              value: candle.volume || 100, 
              color: updated.close >= updated.open ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)' 
            })
            
            // Trigger Auto-Close engine
            processLivePrice(activeTicker, updated.close)
            
            liveDataRef.current.lastCandle = updated
            return { ...s, lastCandle: updated }
          })
        } catch {}
      }, 2000)
    }

    return () => {
      clearInterval(countdownId)
      if (pollId) clearInterval(pollId)
      if (ws) ws.close()
    }
  }, [activeTicker, selectedInterval.seconds, replayMode, replayState])

  const toggleReplay = () => {
    if (!replayMode) {
      setReplayMode(true);
      setReplayState('selecting');
    } else {
      if (replayState === 'selecting') {
        setReplayMode(false);
        setReplayState('none');
      } else {
        setReplayMode(false);
        setReplayState('none');
        if (candleRef.current) candleRef.current.setData([]);
        if (volRef.current) volRef.current.setData([]);
        fetchData(false);
      }
    }
  }

  function mkDraw(id, type, points) {
    const needsFill = ['box','circle','long','short'].includes(type)
    return { id, type, points, color: '#3b82f6', fill: needsFill ? 'rgba(59,130,246,0.1)' : 'none', width: 2, style: 'solid', label: '', text: '' }
  }

  function resetWip() {
    drawingWipRef.current = { id: null, type: null, points: [], previewPoint: null, isDrawing: false, isDragging: false, downX: 0, downY: 0 }
  }

  const getChartCoordinatesFromEvent = (e) => {
    if (!svgRef.current || !chartRef.current || !candleRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ts = chartRef.current.timeScale()
    const cs = candleRef.current
    const fullData = liveDataRef.current?.fullData || []
    const intSecs = selectedIntervalRef.current?.seconds || 60
    let time = resolveTimeFromPixel(x, ts, fullData, intSecs)
    let price = cs.coordinateToPrice(y) || 0
    if (magnetRef.current && fullData.length) {
      const c = fullData.find(d => Math.abs(d.time - time) < 2)
      if (c) {
        const vals = [c.open, c.high, c.low, c.close]
        price = vals.reduce((a, b) => Math.abs(b - price) < Math.abs(a - price) ? b : a)
      }
    }
    return { x, y, time, price }
  }

  const handleSvgPointerDown = (e) => {
    const tool = activeToolRef.current
    if (tool === 'cursor') return
    e.stopPropagation()
    const coords = getChartCoordinatesFromEvent(e)
    if (!coords || coords.time == null) return
    const { x, y, time, price } = coords
    const wip = drawingWipRef.current

    if (tool === 'sketch') {
      wip.id = Date.now().toString()
      wip.type = 'sketch'
      wip.points = [{ time, price }]
      wip.previewPoint = null
      wip.isDrawing = true
      return
    }

    if (!wip.id) {
      wip.id = Date.now().toString()
      wip.type = tool
      wip.points = [{ time, price }]
      wip.previewPoint = { time, price }
      wip.downX = x
      wip.downY = y
      wip.isDragging = true

      if (['horizontal', 'vertical', 'ray', 'arrow_up', 'arrow_down'].includes(tool)) {
        commitDrawings(prev => [...prev, mkDraw(wip.id, tool, [...wip.points])])
        resetWip()
        setActiveTool('cursor')
      } else if (['long', 'short'].includes(tool)) {
        const tp = tool === 'long' ? price * 1.015 : price * 0.985
        const sl = tool === 'long' ? price * 0.9925 : price * 1.0075
        commitDrawings(prev => [...prev, mkDraw(wip.id, tool, [{ time, price }, { time, price: tp }, { time, price: sl }])])
        resetWip()
        setActiveTool('cursor')
      } else if (tool === 'text') {
        commitDrawings(prev => [...prev, { id: wip.id, type: 'text', points: [{ time, price }], text: 'Text', color: '#f1f5f9', fill: 'none', width: 1, style: 'solid', label: '' }])
        resetWip()
        setActiveTool('cursor')
      }
    } else {
      wip.points.push({ time, price })
      wip.previewPoint = null
      const needed = { trendline: 2, box: 2, circle: 2, fib: 2, fib_ext: 3, measure: 2, head_shoulders: 7 }[wip.type] || 2

      if (wip.type === 'path') {
        const pts = wip.points
        if (pts.length >= 3 && Math.abs(pts.at(-1).time - pts.at(-2).time) < 2 && Math.abs(pts.at(-1).price - pts.at(-2).price) < 0.0001) {
          commitDrawings(prev => [...prev, mkDraw(wip.id, 'path', pts.slice(0, -1))])
          resetWip()
          setActiveTool('cursor')
        }
      } else if (wip.points.length >= needed) {
        commitDrawings(prev => [...prev, mkDraw(wip.id, wip.type, [...wip.points])])
        resetWip()
        setActiveTool('cursor')
      }
    }
  }

  const handleSvgPointerMove = (e) => {
    const tool = activeToolRef.current
    if (tool === 'cursor') return
    const coords = getChartCoordinatesFromEvent(e)
    if (!coords || coords.time == null) return
    const { time, price } = coords
    const wip = drawingWipRef.current

    if (tool === 'sketch' && wip.isDrawing && wip.id) {
      const pts = wip.points
      const last = pts[pts.length - 1]
      if (!last || Math.abs(time - last.time) > 0 || Math.abs(price - last.price) > 0.0001) {
        pts.push({ time, price })
      }
      return
    }

    if (wip.id && wip.points.length > 0) {
      wip.previewPoint = { time, price }
    }
  }

  const handleSvgPointerUp = (e) => {
    const tool = activeToolRef.current
    if (tool === 'cursor') return
    const wip = drawingWipRef.current

    if (tool === 'sketch' && wip.id) {
      if (wip.points.length > 1) {
        commitDrawings(prev => [...prev, { ...wip, color: '#3b82f6', width: 2 }])
      }
      resetWip()
      setActiveTool('cursor')
      return
    }

    if (wip.id && wip.isDragging && wip.points.length === 1) {
      wip.isDragging = false
      const coords = getChartCoordinatesFromEvent(e)
      if (!coords || coords.time == null) return
      const dist = Math.hypot(coords.x - (wip.downX || coords.x), coords.y - (wip.downY || coords.y))
      const needed = { trendline: 2, box: 2, circle: 2, fib: 2, fib_ext: 3, measure: 2, head_shoulders: 7 }[wip.type] || 2

      if (dist > 15 && needed === 2) {
        wip.points.push({ time: coords.time, price: coords.price })
        commitDrawings(prev => [...prev, mkDraw(wip.id, wip.type, [...wip.points])])
        resetWip()
        setActiveTool('cursor')
      }
    }
  }

  const commitDrawings = useCallback((actionFn) => {
    setDrawings(prev => {
      undoHistoryRef.current.push(JSON.parse(JSON.stringify(prev)))
      redoHistoryRef.current = []
      setHistoryCount(c => c + 1)
      return typeof actionFn === 'function' ? actionFn(prev) : actionFn
    })
  }, [])

  const handleUndo = useCallback(() => {
    if (undoHistoryRef.current.length > 0) {
      const prevState = undoHistoryRef.current.pop()
      redoHistoryRef.current.push(JSON.parse(JSON.stringify(drawingsRef.current)))
      setDrawings(prevState)
      setHistoryCount(c => c + 1)
    }
  }, [])

  const handleRedo = useCallback(() => {
    if (redoHistoryRef.current.length > 0) {
      const nextState = redoHistoryRef.current.pop()
      undoHistoryRef.current.push(JSON.parse(JSON.stringify(drawingsRef.current)))
      setDrawings(nextState)
      setHistoryCount(c => c + 1)
    }
  }, [])

  const updateDrawing = useCallback((id, updates) => {
    setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }, [])

  const deleteDrawing = useCallback((id) => {
    commitDrawings(prev => prev.filter(d => d.id !== id))
    setSelectedId(null)
  }, [commitDrawings])

  const onHandleMouseDown = useCallback((e, drawingId, pointIdx) => {
    e.stopPropagation()
    const rect = svgRef.current?.getBoundingClientRect()
    const startX = e.clientX - (rect?.left || 0)
    const startY = e.clientY - (rect?.top || 0)
    const drawing = drawingsRef.current.find(d => d.id === drawingId)
    const originalPoints = drawing ? JSON.parse(JSON.stringify(drawing.points)) : []
    const startDrawingsState = JSON.parse(JSON.stringify(drawingsRef.current))
    let hasMoved = false

    dragHandleRef.current = { drawingId, pointIdx, startX, startY, originalPoints }; setIsDragging(true)
    const onMove = (mv) => {
      if (!dragHandleRef.current || !chartRef.current || !candleRef.current) return
      hasMoved = true
      const rect2 = svgRef.current?.getBoundingClientRect()
      if (!rect2) return
      const x = mv.clientX - rect2.left
      const y = mv.clientY - rect2.top
      
      const { drawingId: did, pointIdx: pi, startX: sx, startY: sy, originalPoints: origPts } = dragHandleRef.current

      if (did === 'preview_draft') {
        const price = candleRef.current.coordinateToPrice(y);
        if (price != null) {
          setDraftOrder(prev => {
             if (pi === 'entry') return { ...prev, limitPrice: price.toFixed(2) };
             if (pi === 'tp') return { ...prev, tp: price.toFixed(2) };
             if (pi === 'sl') return { ...prev, sl: price.toFixed(2) };
             return prev;
          });
        }
        return;
      }
      
      if (pi === 'all') {
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
      }

      const price = candleRef.current.coordinateToPrice(y)
      const time = resolveTimeFromPixel(x, chartRef.current.timeScale(), liveDataRef.current.fullData, selectedIntervalRef.current?.seconds || 60)
      if (magnetRef.current) {
        const c = liveDataRef.current.fullData.find(k => k.time === time)
        if (c) {
          const vals = [c.open, c.high, c.low, c.close]
          const snapPrice = vals.reduce((a, b) => Math.abs(b - price) < Math.abs(a - price) ? b : a)
          setDrawings(prev => prev.map(d => {
            if (d.id !== did) return d
            const pts = [...(d.points || [])]
            if (d.type !== 'box') pts[pi] = { time, price: snapPrice }
            return { ...d, points: pts }
          }))
          return
        }
      }
      if (price == null || !time) return
      
      setDrawings(prev => prev.map(d => {
        if (d.id !== did) return d
        const pts = [...(d.points || [])]
        
        if (d.type === 'box') {
          if (pts.length < 2) pts.push({...pts[0]})
          const p1 = {...pts[0]}, p2 = {...pts[1]}
          
          if (pi === 0) { p1.time = time; p1.price = price; }
          if (pi === 1) { p2.time = time; p2.price = price; }
          if (pi === 2) { p2.time = time; p1.price = price; }
          if (pi === 3) { p1.time = time; p2.price = price; }
          if (pi === 4) { p1.price = price; }
          if (pi === 5) { p2.price = price; }
          if (pi === 6) { p1.time = time; }
          if (pi === 7) { p2.time = time; }

          pts[0] = p1; pts[1] = p2;
        } else if (d.type === 'long' || d.type === 'short') {
            if (pi === 1) { // TP Top Edge
              if (pts[1]) pts[1].price = price;
            } else if (pi === 2) { // SL Bottom Edge
              if (pts[2]) pts[2].price = price;
            } else if (pi === 3) { // Right Edge (Duration)
              if (pts[1]) pts[1].time = time;
              if (pts[2]) pts[2].time = time;
            } else if (pi === 'entryLine') {
              const oldEntry = originalPoints[0].price;
              const tpDiff = originalPoints[1].price - oldEntry;
              const slDiff = originalPoints[2].price - oldEntry;
              if (pts[0]) pts[0].price = price;
              if (pts[1]) pts[1].price = price + tpDiff;
              if (pts[2]) pts[2].price = price + slDiff;
            } else if (pi === 0) { // Entry Point Node
              if (pts[0]) pts[0].time = time;
            } else {
              if (pts[pi]) pts[pi] = { time, price }
            }
        } else {
          pts[pi] = { time, price }
        }
        return { ...d, points: pts }
      }))
    }
    const onUp = () => {
      dragHandleRef.current = null; setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (hasMoved) {
        undoHistoryRef.current.push(startDrawingsState)
        redoHistoryRef.current = []
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const renderSvgTool = (d) => {
    const coords = (d.coords || []).filter(c => c.x != null && c.y != null)
    if (!coords.length) return null
    const p1    = coords[0]
    const p2    = coords[1] || p1
    const isSel = selectedId === d.id
    const col   = d.color || '#3b82f6'
    const wid   = d.width || 2
      const fill  = d.fill || 'rgba(59,130,246,0.15)'
    const dash  = d.style === 'dashed' ? '8 5' : d.style === 'dotted' ? '2 5' : undefined
    const op    = isSel ? 1 : 0.9

    let handles = isSel ? coords.map((c, i) => (
      <circle key={`h${i}`} cx={c.x} cy={c.y} r={5}
        fill="#0f172a" stroke={col} strokeWidth={1.5}
        style={{ pointerEvents: 'all', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={(e) => onHandleMouseDown(e, d.id, i)}
      />
    )) : null
        
    let body = null
    switch (d.type) {
      case 'paper_order': {
        const o = d.orderData;
        const W = chartRef.current?.timeScale().width() || 2000;
        const isExecuted = !o.isDraft; // LOCKED if not draft
        const op = isExecuted ? 0.5 : 1; 

        const getPnlStr = (price) => {
           if (!o.isDraft) return '';
           const qty = parseInt(o.qty) || 1;
           const diff = o.orderType === 'BUY' ? (price - o.entryPrice) : (o.entryPrice - price);
           return ` | P&L: ${(diff * qty).toFixed(2)}`;
        }

        body = (
          <g opacity={op}>
            {/* Entry Line */}
            {d.eY != null && (
              <g>
                <line x1={0} y1={d.eY} x2={W} y2={d.eY} stroke="#3b82f6" strokeWidth={isExecuted ? 1.5 : 2} strokeDasharray={isExecuted ? "5 5" : "none"} />
                <rect x={0} y={d.eY - 10} width={50} height={20} fill="#1e293b" stroke="#3b82f6" rx="3" />
                <text x={25} y={d.eY + 4} fill="#3b82f6" fontSize="10" fontWeight="bold" textAnchor="middle">ENTRY</text>
                <rect x={W - 130} y={d.eY - 10} width={130} height={20} fill="#3b82f6" rx="3" />
                <text x={W - 65} y={d.eY + 4} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {o.entryPrice.toFixed(2)} {o.execType === 'LIMIT' && !isExecuted && '(Drag)'}
                </text>
                {!isExecuted && o.execType === 'LIMIT' && (
                  <rect x={0} y={d.eY - 10} width={W} height={20} fill="transparent" style={{ cursor: 'ns-resize', pointerEvents: 'all' }} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'entry')} />
                )}
              </g>
            )}
            {/* TP Line */}
            {d.tpY != null && (
              <g>
                <line x1={0} y1={d.tpY} x2={W} y2={d.tpY} stroke="#10b981" strokeWidth={isExecuted ? 1.5 : 2} strokeDasharray={isExecuted ? "5 5" : "none"} />
                <rect x={0} y={d.tpY - 10} width={50} height={20} fill="#1e293b" stroke="#10b981" rx="3" />
                <text x={25} y={d.tpY + 4} fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">TP</text>
                <rect x={W - 150} y={d.tpY - 10} width={150} height={20} fill="#10b981" rx="3" />
                <text x={W - 75} y={d.tpY + 4} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">{o.tp.toFixed(2)}{getPnlStr(o.tp)}</text>
                {!isExecuted && (
                   <rect x={0} y={d.tpY - 10} width={W} height={20} fill="transparent" style={{ cursor: 'ns-resize', pointerEvents: 'all' }} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'tp')} />
                )}
              </g>
            )}
            {/* SL Line */}
            {d.slY != null && (
              <g>
                <line x1={0} y1={d.slY} x2={W} y2={d.slY} stroke="#ef4444" strokeWidth={isExecuted ? 1.5 : 2} strokeDasharray={isExecuted ? "5 5" : "none"} />
                <rect x={0} y={d.slY - 10} width={50} height={20} fill="#1e293b" stroke="#ef4444" rx="3" />
                <text x={25} y={d.slY + 4} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">SL</text>
                <rect x={W - 150} y={d.slY - 10} width={150} height={20} fill="#ef4444" rx="3" />
                <text x={W - 75} y={d.slY + 4} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">{o.sl.toFixed(2)}{getPnlStr(o.sl)}</text>
                {!isExecuted && (
                   <rect x={0} y={d.slY - 10} width={W} height={20} fill="transparent" style={{ cursor: 'ns-resize', pointerEvents: 'all' }} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'sl')} />
                )}
              </g>
            )}
          </g>
        );
        break;
      }

      case 'countdown': {
        const chartW = chartRef.current?.timeScale().width() || 2000
        body = (
          <g opacity={1}>
             <text x={chartW-27.5} y={d.y+22} fill="#cbd5e1" fontSize="11" fontWeight="bold" textAnchor="middle">
               {d.text}
             </text>
          </g>
        )
        break
      }
      case 'trendline': {
          const W = chartRef.current?.timeScale().width() || 2000
          let ex1 = p1.x, ey1 = p1.y, ex2 = p2.x, ey2 = p2.y
          
          if (p1.x !== p2.x && (d.extendLeft || d.extendRight)) {
             const slope = (p2.y - p1.y) / (p2.x - p1.x)
             if (d.extendLeft) {
                const leftPoint = p1.x < p2.x ? p1 : p2
                ex1 = 0
                ey1 = leftPoint.y - slope * leftPoint.x
             }
             if (d.extendRight) {
                const rightPoint = p1.x > p2.x ? p1 : p2
                ex2 = W
                ey2 = rightPoint.y + slope * (W - rightPoint.x)
             }
          }

          const midX = (ex1 + ex2) / 2, midY = (ey1 + ey2) / 2
          let tx = d.textAnchor === 'start' ? Math.min(ex1, ex2) + 10 : d.textAnchor === 'end' ? Math.max(ex1, ex2) - 10 : midX
          let ty = d.textVertical === 'bottom' ? midY + 14 : d.textVertical === 'middle' ? midY + 4 : midY - 6
          body = <g>
            <line x1={ex1} y1={ey1} x2={ex2} y2={ey2}
              stroke={col} strokeWidth={wid} strokeDasharray={dash} opacity={op}/>
            {d.label && <text x={tx} y={ty} fill={col} fontSize="12" fontWeight="bold" textAnchor={d.textAnchor || "middle"}
              fontFamily="Inter,sans-serif">{d.label}</text>}
          </g>
          break
        }
        case 'horizontal': {
          const yCoord = p1.y
          const W = chartRef.current?.timeScale().width() || 2000
          const ex1 = 0; // Always extend left
          const ex2 = W; // Always extend right
          body = (
            <g opacity={op}>
              <line x1={ex1} y1={yCoord} x2={ex2} y2={yCoord} stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
              {d.label && (
                <text 
                  x={d.textAnchor === 'start' ? ex1+10 : d.textAnchor === 'end' ? ex2-60 : (ex1+ex2)/2} 
                  y={d.textVertical === 'bottom' ? yCoord+14 : d.textVertical === 'middle' ? yCoord+4 : yCoord-6} 
                  fill={col} fontSize="12" fontWeight="bold" 
                  textAnchor={d.textAnchor || 'start'}>
                  {d.label}
                </text>
              )}
              <rect x={W-55} y={yCoord-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={yCoord+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p1.price||0).toFixed(2)}
              </text>
            </g>
          )
          if (isSel && !drawingWipRef.current.id) {
            handles = (
              <circle cx={W/2} cy={yCoord} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1} style={{ cursor: isDragging?'grabbing':'ns-resize' }}
                onMouseDown={e => onHandleMouseDown(e, d.id, 0)}/>
            )
          }
          break
        }
        case 'box': {
          let mx = Math.min(p1.x, p2.x), my = Math.min(p1.y, p2.y)
          let mw = Math.abs(p2.x - p1.x), mh = Math.abs(p2.y - p1.y)
          const W = chartRef.current?.timeScale().width() || 2000
          
          if (d.extendLeft) {
             mw = mw + mx;
             mx = 0;
          }
          if (d.extendRight) {
             mw = W - mx;
          }

          body = (
            <g opacity={op}>
              <rect x={mx} y={my} width={mw} height={mh} fill={d.fillBackground !== false ? col + Math.round(((d.fillOpacity ?? 20) / 100) * 255).toString(16).padStart(2, '0') : "transparent"} stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
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
          if (isSel && !drawingWipRef.current.id) {
            const makeHandle = (hx, hy, cursor, pointIdx) => (
              <circle cx={hx} cy={hy} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1} style={{ cursor: isDragging ? 'grabbing' : cursor }}
                onMouseDown={e => onHandleMouseDown(e, d.id, pointIdx)}/>
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
        }
      case 'circle': {
        const cx = (p1.x+p2.x)/2, cy = (p1.y+p2.y)/2
        body = <g>
          <ellipse cx={cx} cy={cy} rx={Math.abs(p2.x-p1.x)/2} ry={Math.abs(p2.y-p1.y)/2}
            fill={fill} stroke={col} strokeWidth={wid} strokeDasharray={dash} opacity={op}/>
          {d.label && <text x={cx} y={cy+4} fill={col} fontSize="11"
            textAnchor={d.textAnchor || "middle"} fontFamily="Inter,sans-serif">{d.label}</text>}
        </g>
        break
      }

      case 'vertical':
        body = (
          <g opacity={op}>
            <line x1={p1.x} y1={0} x2={p1.x} y2="100%" stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
            {d.label && (
              <text x={p1.x+6} y={d.textVertical === 'bottom' ? '95%' : d.textVertical === 'middle' ? '50%' : 20} 
                fill={col} fontSize="12" fontWeight="bold" textAnchor="start">
                {d.label}
              </text>
            )}
          </g>
        )
        break

      case 'ray': {
        const W = chartRef.current?.timeScale().width() || 800
        body = (
          <g opacity={op}>
            <line x1={p1.x} y1={p1.y} x2="100%" y2={p1.y} stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
            {d.label && (
              <text x={p1.x+10} y={p1.y-6} fill={col} fontSize="12" fontWeight="bold" textAnchor="start">
                {d.label}
              </text>
            )}
            <rect x={W-55} y={p1.y-10} width={55} height={20} fill={col} rx="2"/>
            <text x={W-27.5} y={p1.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {(p1.price||0).toFixed(2)}
            </text>
          </g>
        )
        break
      }

      case 'fib': {
        if (coords.length < 2) { body = <circle cx={p1.x} cy={p1.y} r={4} fill={col}/>; break }
        const W = chartRef.current?.timeScale().width() || 800
        const LEVELS = (d.fibLevels || [ { v: 0, c: '#787b86', on: true }, { v: 0.236, c: '#f44336', on: true }, { v: 0.382, c: '#81c784', on: true },
              { v: 0.5, c: '#4caf50', on: true }, { v: 0.618, c: '#009688', on: true }, { v: 0.786, c: '#64b5f6', on: true }, { v: 1, c: '#787b86', on: true } ]
        ).filter(l => l.on !== false).sort((a,b) => a.v - b.v)
        
        const diffY = p2.y - p1.y
        const diffP = p2.price - p1.price
        
        let zones = [];
        const sx = Math.min(p1.x, p2.x);
        for(let i=0; i<LEVELS.length-1; i++) {
            const l1 = LEVELS[i]; const l2 = LEVELS[i+1];
            const y1 = p1.y + diffY * l1.v;
            const y2 = p1.y + diffY * l2.v;
            const h = Math.abs(y2 - y1);
            zones.push(<rect key={`z${i}`} x={sx} y={Math.min(y1, y2)} width={W - sx} height={h} fill={l1.c} opacity={0.15}/>);
        }

        body = (
          <g opacity={op}>
            {zones}
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2}/>
            {LEVELS.map(l => {
              const y = p1.y + diffY * l.v
              const pr = p1.price + diffP * l.v
              return (
                <g key={l.v}>
                  <line x1={sx} y1={y} x2={W} y2={y} stroke={l.c} strokeWidth={wid}/>
                  <text x={W - 10} y={y - 4} fill={l.c} fontSize="11" textAnchor="end" fontWeight="bold">
                    {(l.v * 100).toFixed(1)}% ({pr.toFixed(5)})
                  </text>
                </g>
              )
            })}
            <rect x={W-55} y={p1.y-10} width={55} height={20} fill={col} rx="2"/>
            <text x={W-27.5} y={p1.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {(p1.price||0).toFixed(2)}
            </text>
            <rect x={W-55} y={p2.y-10} width={55} height={20} fill={col} rx="2"/>
            <text x={W-27.5} y={p2.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {(p2.price||0).toFixed(2)}
            </text>
          </g>
        )
        break
      }
      case 'fib_ext': {
        if (coords.length < 2) { body = <circle cx={p1.x} cy={p1.y} r={4} fill={col}/>; break }
        if (coords.length < 3) {
            body = <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4,4"/>
            break
        }
        const p3 = coords[2]
        const W = chartRef.current?.timeScale().width() || 800
        const LEVELS = (d.fibLevels || [ { v: 0, c: '#787b86', on: true }, { v: 0.618, c: '#009688', on: true }, { v: 1, c: '#787b86', on: true },
              { v: 1.272, c: '#f44336', on: true }, { v: 1.618, c: '#2962ff', on: true }, { v: 2.618, c: '#e91e63', on: true } ]
        ).filter(l => l.on !== false).sort((a,b) => a.v - b.v)
        
        const diffY = p2.y - p1.y
        const diffP = p2.price - p1.price
        
        let zones = [];
        const sx = p3.x;
        for(let i=0; i<LEVELS.length-1; i++) {
            const l1 = LEVELS[i]; const l2 = LEVELS[i+1];
            const y1 = p3.y + diffY * l1.v;
            const y2 = p3.y + diffY * l2.v;
            const h = Math.abs(y2 - y1);
            zones.push(<rect key={`z${i}`} x={sx} y={Math.min(y1, y2)} width={W - sx} height={h} fill={l1.c} opacity={0.15}/>);
        }
        
        body = (
          <g opacity={op}>
            {zones}
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2}/>
            <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2}/>
            {LEVELS.map(l => {
              const y = p3.y + diffY * l.v
              const pr = p3.price + diffP * l.v
              return (
                <g key={l.v}>
                  <line x1={sx} y1={y} x2={W} y2={y} stroke={l.c} strokeWidth={wid}/>
                  <text x={W - 10} y={y - 4} fill={l.c} fontSize="11" textAnchor="end" fontWeight="bold">
                    {(l.v * 100).toFixed(1)}% ({pr.toFixed(5)})
                  </text>
                </g>
              )
            })}
            <rect x={W-55} y={p1.y-10} width={55} height={20} fill={col} rx="2"/>
            <text x={W-27.5} y={p1.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {(p1.price||0).toFixed(2)}
            </text>
            <rect x={W-55} y={p2.y-10} width={55} height={20} fill={col} rx="2"/>
            <text x={W-27.5} y={p2.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {(p2.price||0).toFixed(2)}
            </text>
            <rect x={W-55} y={p3.y-10} width={55} height={20} fill={col} rx="2"/>
            <text x={W-27.5} y={p3.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {(p3.price||0).toFixed(2)}
            </text>
          </g>
        )
        handles = coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={5} fill={col} stroke="#000" strokeWidth={1} cursor="move" onMouseDown={(e) => onHandleMouseDown(e, d.id, i)}/>)
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
        ) : null
        
        const entryDragArea = isSel ? (
           <rect x={p1.x} y={eY - 5} width={W} height={10} fill="transparent" style={{pointerEvents:'all',cursor:'ns-resize'}} onMouseDown={(e) => onHandleMouseDown(e, d.id, 'entryLine')}/>
        ) : null

        handles = (
          <g>
            {tpDragArea}
            {slDragArea}
            {durationHandle}
            {entryDragArea}
          </g>
        )

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
            ENTRY {eP.toFixed(5)}
          </text>
          {/* R:R badge */}
          <rect x={p1.x+W-58} y={Math.min(eY,tY)+4} width={54} height={18} rx="3" fill="#1e293b" stroke="#334155"/>
          <text x={p1.x+W-31} y={Math.min(eY,tY)+16} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor={d.textAnchor || "middle"}>
            R:R {rr}
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
        </g>
        break
      }

      case 'measure': {
        const mx = Math.min(p1.x,p2.x), my = Math.min(p1.y,p2.y)
        const mw = Math.abs(p2.x-p1.x), mh = Math.abs(p2.y-p1.y)
        body = <g opacity={op}>
          <rect x={mx} y={my} width={mw} height={mh} fill="rgba(99,102,241,0.1)" stroke="#818cf8" strokeDasharray="4 3"/>
          <text x={p2.x+4} y={p2.y-8} fill="#fff" fontSize="12" fontWeight="bold">
            {Math.abs(p2.price-p1.price).toFixed(5)}
          </text>
          <text x={p2.x+4} y={p2.y+6} fill="#94a3b8" fontSize="10">
            {(Math.abs(p2.price-p1.price)/Math.abs(p1.price||1)*100).toFixed(2)}%
          </text>
        </g>
        break
      }

      case 'head_shoulders': {
        if (coords.length < 2) { body = <circle cx={p1.x} cy={p1.y} r={4} fill={col}/>; break }
        
        let pathData = `M${coords[0].x},${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
            pathData += ` L${coords[i].x},${coords[i].y}`;
        }
        
        let triangles = []
        if (coords.length >= 3) triangles.push(<polygon key="ls" points={`${coords[0].x},${coords[0].y} ${coords[1].x},${coords[1].y} ${coords[2].x},${coords[2].y}`} fill={col} opacity={0.15}/>)
        if (coords.length >= 5) triangles.push(<polygon key="h" points={`${coords[2].x},${coords[2].y} ${coords[3].x},${coords[3].y} ${coords[4].x},${coords[4].y}`} fill={col} opacity={0.15}/>)
        if (coords.length >= 7) triangles.push(<polygon key="rs" points={`${coords[4].x},${coords[4].y} ${coords[5].x},${coords[5].y} ${coords[6].x},${coords[6].y}`} fill={col} opacity={0.15}/>)

        let necklineProj = null
        if (coords.length >= 3) {
          const b1 = coords[0]
          const b2 = coords.length >= 7 ? coords[6] : coords.length >= 5 ? coords[4] : coords[2]
          if (b2.x !== b1.x) {
            const m = (b2.y - b1.y) / (b2.x - b1.x)
            const ex = chartRef.current?.timeScale().width() || 2000
            const ey = b1.y + m * (ex - b1.x)
            necklineProj = <line x1={b1.x} y1={b1.y} x2={ex} y2={ey} stroke={col} strokeWidth={1} strokeDasharray="4 4" opacity={0.8}/>
          }
        }

        body = (
          <g opacity={op}>
            {triangles}
            <path d={pathData} fill="none" stroke={col} strokeWidth={wid} strokeDasharray={dash}/>
            {coords.length >= 3 && (
                <path d={`M${coords[0].x},${coords[0].y} ${coords.length>=3 ? `L${coords[2].x},${coords[2].y}` : ''} ${coords.length>=5 ? `L${coords[4].x},${coords[4].y}` : ''} ${coords.length>=7 ? `L${coords[6].x},${coords[6].y}` : ''}`} fill="none" stroke={col} strokeWidth={1} strokeDasharray="4 4"/>
            )}
            {coords.map((c, i) => (
              <text key={`t${i}`} x={c.x} y={c.y - 10} fill={col} fontSize={10} textAnchor="middle" fontWeight="bold">
                {i===0 ? 'Left' : i===1 ? 'Shoulder' : i===2 ? 'Neck' : i===3 ? 'Head' : i===4 ? 'Neck' : i===5 ? 'Right' : 'Shoulder'}
              </text>
            ))}
          </g>
        )
        handles = coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={5} fill={col} stroke="#000" strokeWidth={1} cursor="move" onMouseDown={(e) => onHandleMouseDown(e, d.id, i)}/>)
        break
      }

              case 'sketch': {
          if (coords.length < 2) break;
          const pts = coords.map(c=>`${c.x},${c.y}`).join(' ');
          body = <polyline points={pts} fill="none" stroke={col} strokeWidth={wid} strokeLinecap="round" strokeLinejoin="round" />
          break;
        }
        case 'path': {
        if (coords.length < 2) { body = <circle cx={p1.x} cy={p1.y} r={4} fill={col}/>; break }
        const pts = coords.map(c=>`${c.x},${c.y}`).join(' ')
        
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
            <polygon points={`${last.x},${last.y} ${x1},${y1} ${x2},${y2}`} fill={col}/>
          </g>
        )
        break
      }
      case 'arrow_up':
        body = <path d={`M${p1.x},${p1.y-20} L${p1.x-7},${p1.y-10} h5 v10 h4 v-10 h5 z`} fill={col} opacity={op}/>
        break

      case 'arrow_down':
        body = <path d={`M${p1.x},${p1.y+20} L${p1.x-7},${p1.y+10} h5 v-10 h4 v10 h5 z`} fill={col} opacity={op}/>
        break

      case 'text':
        body = <text x={p1.x} y={p1.y} fill={col} fontSize={d.fontSize||14}
          fontFamily="Inter,sans-serif" opacity={op} style={{userSelect:'none'}}>
          {d.text || d.label || 'Text'}
        </text>
        break

      default: return null
    }

    return (
      <g key={d.id}
        style={{ cursor: activeTool === 'cursor' ? 'pointer' : 'crosshair', pointerEvents: activeTool === 'cursor' ? 'all' : 'none' }}
        onMouseDown={(e) => {
          if (activeToolRef.current !== 'cursor') return
          e.stopPropagation()
          setSelectedId(d.id)
          onHandleMouseDown(e, d.id, 'all')
        }}
        onClick={(e) => {
          if (activeToolRef.current !== 'cursor') return
          e.stopPropagation()
          setSelectedId(d.id)
        }}
      >
        {body}
        {handles}
      </g>
    )
  }

  const selRender = svgRenders.find(r => r.id === selectedId)
  const selDrawing = drawings.find(d => d.id === selectedId) ?? null
  let toolbarPixelPos = null
  if (selRender && svgRef.current) {
    const rect = svgRef.current.getBoundingClientRect()
    const coords = (selRender.coords || []).filter(c => c.x != null && c.y != null)
    if (coords.length) {
      const midX = coords.length >= 2 ? (coords[0].x + coords[1].x) / 2 : coords[0].x
      const minY = coords.length >= 2 ? Math.min(coords[0].y, coords[1].y) : coords[0].y
      toolbarPixelPos = { x: rect.left + midX, y: rect.top + minY }
    }
  }

  const { loading, error, info, lastCandle, changePct } = state
  const isPositive      = changePct != null && changePct >= 0
  const currency        = info?.currency === 'INR' ? 'INR' : 'USD'
  const displayExchange = EXCHANGE_MAP[info?.exchange] || info?.exchange || ''

  const TOOLS = [
    { id: 'cursor',         icon: <MousePointer2 size={15}/>,                   title: 'Select' },
    { sep: true },
    { id: 'trendline',      icon: <Minus size={15} className="rotate-45"/>,     title: 'Trend Line' },
    { id: 'horizontal',     icon: <Minus size={15}/>,                            title: 'Horizontal Line' },
    { id: 'vertical',       icon: <Minus size={15} className="rotate-90"/>,      title: 'Vertical Line' },
    { id: 'ray',            icon: <Minus size={15} className="translate-x-1"/>, title: 'H. Ray' },
          { id: 'path',           icon: <Activity size={15}/>,                         title: 'Path' },
      { id: 'sketch',         icon: <PenTool size={15}/>,                          title: 'Sketch Brush' },
    { id: 'box',            icon: <svg width="15" height="15" viewBox="0 0 15 15"><rect x="2" y="2" width="11" height="11" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>, title: 'Rectangle' },
    { id: 'circle',         icon: <Circle size={15}/>,                           title: 'Ellipse' },
    { sep: true },
    { id: 'arrow_up',       icon: <ArrowUp size={15}/>,                          title: 'Arrow Up' },
    { id: 'arrow_down',     icon: <ArrowDown size={15}/>,                        title: 'Arrow Down' },
    { sep: true },
    { id: 'fib',            icon: <Hash size={15}/>,                             title: 'Fibonacci' },
    { id: 'fib_ext',        icon: <MoveDiagonal size={15}/>,                     title: 'Fib Extension' },
    { id: 'measure',        icon: <Ruler size={15}/>,                            title: 'Measure' },
    { id: 'head_shoulders', icon: <User size={15}/>,                             title: 'H&S' },
    { sep: true },
    { id: 'long',           icon: <TrendingUp size={15}/>,                       title: 'Long Position', accent: 'emerald' },
    { id: 'short',          icon: <TrendingDown size={15}/>,                     title: 'Short Position', accent: 'red' },
    { id: 'text',           icon: <Type size={15}/>,                             title: 'Text' },
  ]

  return (
    <div className="flex h-full overflow-hidden relative bg-white dark:bg-slate-950">

      {/* ── TradingView-style Drawing Toolbar ─────────────────────────────── */}
      <div className="flex flex-col items-center py-2 gap-0.5 z-30 flex-shrink-0 overflow-y-auto border-r bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
           style={{ width: 44 }}>
        {TOOLS.map((t, i) => {
          if (t.sep) return <div key={i} className="w-6 h-px my-1 bg-gray-100 dark:bg-slate-800"/>
          const isActive = activeTool === t.id
          const ac = t.accent === 'emerald' ? { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
                   : t.accent === 'red'     ? { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' }
                   :                          { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' }
          return (
            <button key={t.id} onClick={() => {
              if (activeTool === t.id) {
                setActiveTool('cursor')
                resetWip()
              } else {
                setActiveTool(t.id)
                resetWip()
              }
            }} title={t.title}
              className="flex items-center justify-center rounded transition-colors"
              style={{
                width: 36, height: 30,
                background: isActive ? ac.bg : 'transparent',
                color: isActive ? ac.color : '#94a3b8',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = isActive ? ac.bg : 'transparent'; e.currentTarget.style.color = isActive ? ac.color : '#94a3b8' }}>
              {t.icon}
            </button>
          )
        })}
          <div className="w-6 h-px my-1 bg-gray-100 dark:bg-slate-800"/>
          <button onClick={() => setMagnet(m => !m)} title="Magnet Snap"
            className="flex items-center justify-center rounded transition-colors"
            style={{ width: 36, height: 30, background: magnet ? 'rgba(245,158,11,0.15)' : 'transparent', color: magnet ? '#f59e0b' : '#94a3b8' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 15H3a9 9 0 1 1 18 0h-3"/><path d="M6 15v3a6 6 0 0 0 12 0v-3"/>
            </svg>
          </button>
          <button onClick={() => setShowDrawings(v => !v)} title="Toggle Drawings"
          className="flex items-center justify-center rounded transition-colors text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800"
          style={{ width: 36, height: 30 }}>
          {showDrawings ? <Eye size={14}/> : <EyeOff size={14}/>}
        </button>
        <button onClick={() => { setDrawings([]); setSelectedId(null); resetWip() }} title="Clear All"
          className="flex items-center justify-center rounded transition-colors text-gray-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          style={{ width: 36, height: 30 }}>
          <Trash2 size={14}/>
        </button>
      </div>

      <div className="flex flex-col flex-1 min-w-0 relative">

        {selDrawing && toolbarPixelPos && (
          <>
            <FloatingToolbar
              drawing={selDrawing}
              onUpdate={(u) => updateDrawing(selectedId, u)}
              onDelete={() => deleteDrawing(selectedId)}
              onClose={() => setSelectedId(null)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              initialPos={toolbarPixelPos}
            />
          </>
        )}

        {/* ── Chart Toolbar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0 flex-nowrap overflow-visible z-40 w-full border-b bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AssetLogo symbol={getFriendlyName(activeTicker)} className="w-6 h-6" />
            <span className="font-mono font-bold text-sm text-blue-500">{getFriendlyName(activeTicker)}</span>
            {displayExchange && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-700">
                {displayExchange}
              </span>
            )}
            {info && (
              <span className={`flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${getMarketStatus(EXCHANGE_MAP[info?.exchange] || info?.exchange) ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                <Clock size={10}/> {getMarketStatus(EXCHANGE_MAP[info?.exchange] || info?.exchange) ? 'Open' : 'Closed'}
              </span>
            )}
            {info?.name && <span className="text-xs hidden lg:block truncate max-w-[150px] text-gray-600 dark:text-slate-400">{info.name}</span>}
            
            {/* 2-State Data Feed UI */}
            <div className="ml-2 hidden sm:flex items-center gap-2">
              {!isBrokerConnected ? (
                <>
                  <span className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/30" title="Data delayed by 15 mins for guest users.">
                    ⚠️ 15-Min Delayed
                  </span>
                  <button 
                    onClick={() => setIsBrokerModalOpen(true)}
                    className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 transition-colors shadow-sm"
                  >
                    🔓 Connect Broker (Live Data)
                  </button>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    🟢 Live Tick Data
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 ml-1">
                    Powered by <span className="font-bold text-gray-700 dark:text-slate-300">{connectedBroker}</span>
                  </span>
                  <button 
                    onClick={() => { setIsBrokerConnected(false); setConnectedBroker(null); }}
                    className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Disconnect Broker"
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
            

          {lastCandle && (
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm text-gray-900 dark:text-slate-200">{fmtPrice(lastCandle.close, currency)}</span>
              {changePct != null && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                  {isPositive?'+':''}{changePct.toFixed(2)}%
                </span>
              )}
            </div>
          )}

          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700/50 mx-1 hidden sm:block"/>

          <button onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={undoHistoryRef.current.length === 0}
            className={`flex items-center justify-center rounded transition-colors w-8 h-8 ${undoHistoryRef.current.length === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800'}`}>
            <Undo2 size={14}/>
          </button>
          <button onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={redoHistoryRef.current.length === 0}
            className={`flex items-center justify-center rounded transition-colors w-8 h-8 mr-1 ${redoHistoryRef.current.length === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800'}`}>
            <Redo2 size={14}/>
          </button>

          <div className="w-px h-4 bg-gray-100 dark:bg-slate-800 mr-2"/>
          
          {/* AI Mode Toggles */}
          <button onClick={() => setIsAiEntryVisible(!isAiEntryVisible)} title="Toggle AI Entry Overlays"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs transition-all ${isAiEntryVisible ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-blue-400'}`}>
            <Sparkles size={14} className={isAiEntryVisible ? "animate-pulse" : ""} /> {aiLoading ? 'Analyzing...' : 'AI Entry'}
          </button>

          <div className="w-px h-4 bg-gray-100 dark:bg-slate-800 mx-2 hidden md:block"/>
            <div className="flex items-center gap-1 mr-2">
              {/* Chart Type Dropdown */}
              <div className="relative">
                <button onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-800 dark:text-slate-300 hover:text-white hover:bg-gray-100 dark:bg-slate-800 transition-colors" title="Chart Type">
                  {chartType === 'candle' ? <BarChart2 size={14} /> : <Activity size={14} />}
                  <ChevronDown size={12} className="text-gray-500 dark:text-slate-500" />
                </button>
                {showChartTypeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded shadow-xl py-1 z-50">
                    <button onClick={() => { setChartType('candle'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 dark:bg-slate-800 ${chartType === 'candle' ? 'text-blue-400' : 'text-gray-800 dark:text-slate-300'}`}>
                      <BarChart2 size={14}/> Candles
                    </button>
                    <button onClick={() => { setChartType('line'); setShowChartTypeDropdown(false) }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 dark:bg-slate-800 ${chartType === 'line' ? 'text-blue-400' : 'text-gray-800 dark:text-slate-300'}`}>
                      <Activity size={14}/> Line
                    </button>
                  </div>
                )}
              </div>

              {/* Indicators Button */}
              <button onClick={() => setShowIndicatorsModal(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-800 dark:text-slate-300 hover:text-white hover:bg-gray-100 dark:bg-slate-800 transition-colors" title="Indicators">
                <FunctionSquare size={14} />
                <span className="text-xs font-medium hidden md:block">Indicators</span>
              </button>
              
              {/* Alert Button */}
              <button onClick={() => setIsAlertModalOpen(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-800 dark:text-slate-300 hover:text-white hover:bg-gray-100 dark:bg-slate-800 transition-colors" title="Create Alert">
                <Bell size={14} />
                <span className="text-xs font-medium hidden md:block">Alerts</span>
              </button>
              
              {/* Favorite Indicators Quick Add */}
              {favoriteIndicators.length > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-100 dark:bg-slate-800 mx-1"/>
                  {favoriteIndicators.map(ind => (
                    <button key={ind.uid} onClick={() => setActiveIndicators(prev => [...prev, {...ind, uid: Date.now().toString()}])}
                      className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-white hover:bg-gray-100 dark:bg-slate-800 rounded transition-colors truncate max-w-[100px]"
                      title={ind.name}>
                      {ind.shortName}
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="w-px h-4 bg-gray-100 dark:bg-slate-800"/>

            <div className="flex items-center gap-0.5 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded font-medium text-gray-800 dark:text-slate-300 hover:text-white hover:bg-gray-100 dark:bg-slate-800 transition-colors" title="Timeframe">
                  {selectedInterval.label}
                  <ChevronDown size={12} className="text-gray-500 dark:text-slate-500" />
                </button>
                {showTimeframeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded shadow-xl py-2 z-50 flex flex-col gap-2">
                    {['Seconds', 'Minutes', 'Hours/Days'].map(cat => (
                      <div key={cat} className="px-2">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">{cat}</div>
                        <div className="grid grid-cols-3 gap-1">
                          {INTERVALS.filter(iv => iv.category === cat).map(iv => (
                            <button key={iv.label} onClick={() => { setSelectedInterval(iv); setShowTimeframeDropdown(false); }}
                              className={`text-xs px-2 py-1 rounded font-medium transition-all text-center
                                ${selectedInterval.label === iv.label ? 'bg-blue-500/20 text-blue-400' : 'text-gray-800 dark:text-slate-300 hover:bg-gray-100 dark:bg-slate-800'}`}>
                              {iv.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-px h-4 mx-2 bg-gray-100 dark:bg-slate-800"/>
            <button onClick={() => {
              if (chartRef.current) {
                chartRef.current.timeScale().fitContent()
                chartRef.current.priceScale('right').applyOptions({ autoScale: true })
              }
            }} title="Fit" className="px-2 py-0.5 rounded transition-all text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:bg-slate-800 hover:text-gray-900 dark:text-slate-200">
              <Maximize2 size={13}/>
            </button>
          </div>

          <div className="flex-1"/>

          <div className="flex items-center gap-1.5">
            <button onClick={toggleReplay}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
              style={{
                background: replayMode ? 'rgba(245,158,11,0.15)' : '#1e293b',
                color: replayMode ? '#f59e0b' : '#94a3b8',
                border: replayMode ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
              }}>
              {replayState === 'selecting' ? <Scissors size={12}/> : replayState === 'playing' ? <Square size={12}/> : <Play size={12}/>} 
              {replayState === 'selecting' ? 'Cancel Cut' : replayState === 'playing' ? 'Stop Replay' : 'Replay'}
            </button>

            <button onClick={onToggleSignals}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
              style={{
                background: signalsOn ? 'rgba(139,92,246,0.15)' : '#1e293b',
                color: signalsOn ? '#8b5cf6' : '#94a3b8',
                border: signalsOn ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
              }}>
              <AlertCircle size={12}/> AI
            </button>

            <button onClick={onToggleFullscreen} title="Fullscreen"
              className="px-2.5 py-1.5 text-xs font-medium rounded transition-all bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:bg-slate-700 hover:text-gray-900 dark:text-slate-200">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>

            <div className="flex items-center">
              {/* Position Calculator Sidebar Toggle (Moved next to Trade) */}
              <button onClick={() => { setIsPosCalcActive(!isPosCalcActive); setIsDrawerOpen(false); }} title="Position Calculator"
                className={`flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded font-bold text-xs transition-all ${isPosCalcActive ? 'bg-teal-500/20 text-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-teal-400'}`}>
                <Calculator size={14} className={isPosCalcActive ? "animate-pulse" : ""} /> Position Calc
              </button>

              <button onClick={() => { setIsDrawerOpen(!isDrawerOpen); setIsPosCalcActive(false); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
                style={{
                  background: isDrawerOpen ? 'rgba(59,130,246,0.15)' : '#1e293b',
                  color: isDrawerOpen ? '#3b82f6' : '#94a3b8',
                  border: isDrawerOpen ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                }}>
                {isDrawerOpen ? <PanelRightClose size={12}/> : <PanelRightOpen size={12}/>} Trade
              </button>
            </div>

            <div className="w-px h-5 bg-gray-100 dark:bg-slate-800 mx-1" />
            <button onClick={() => setIsChartSettingsOpen(true)} title="Chart Settings" className="p-1.5 rounded transition-all text-gray-600 dark:text-slate-400 hover:text-white hover:bg-gray-100 dark:bg-slate-800">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* ── Chart + Drawer ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-row min-h-0">
          <div className="relative flex-1 bg-white dark:bg-slate-950"
               tabIndex={0}
               onKeyDown={(e) => {
                 if (e.key === 'Delete' || e.key === 'Backspace') {
                   if (selectedId) {
                     commitDrawings(prev => prev.filter(d => d.id !== selectedId))
                     setSelectedId(null)
                   }
                 }
                 if (e.ctrlKey && e.key === 'z') {
                    if (undoHistoryRef.current.length > 0) {
                      const prevState = undoHistoryRef.current.pop()
                      redoHistoryRef.current.push(JSON.parse(JSON.stringify(drawingsRef.current)))
                      setDrawings(prevState)
                    }
                 }
                 if (e.ctrlKey && e.key === 'y') {
                    if (redoHistoryRef.current.length > 0) {
                      const nextState = redoHistoryRef.current.pop()
                      undoHistoryRef.current.push(JSON.parse(JSON.stringify(drawingsRef.current)))
                      setDrawings(nextState)
                    }
                 }
               }}>
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-slate-900/70 backdrop-blur-sm">
                <RefreshCw className="animate-spin text-blue-500" size={28}/>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="text-center">
                  <AlertCircle size={36} className="mx-auto mb-3 text-red-500"/>
                  <p className="font-mono text-sm text-red-500">{error}</p>
                </div>
              </div>
            )}

            
            
      <IndicatorsModal 
        isOpen={showIndicatorsModal} 
        onClose={() => setShowIndicatorsModal(false)}
        onAddIndicator={(ind) => setActiveIndicators(prev => [...prev, ind])}
        favoriteIndicators={favoriteIndicators}
        onToggleFavorite={(ind) => setFavoriteIndicators(prev => prev.find(p => p.id === ind.id) ? prev.filter(p => p.id !== ind.id) : [...prev, ind])}
      />

      {/* Freemium Paywall Modal */}
      

              <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                selectedDrawing={selDrawing}
                onSave={(id, updates) => commitDrawings(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))}
                onUpdate={updateDrawing}
              />

            {/* chart container */}
            <IndicatorSettingsModal isOpen={isIndicatorSettingsOpen} onClose={() => setIsIndicatorSettingsOpen(false)} indicator={settingsIndicator} onSave={(updated) => setActiveIndicators(prev => prev.map(i => i.uid === updated.uid ? updated : i))} />
      <ChartSettingsModal isOpen={isChartSettingsOpen} onClose={() => setIsChartSettingsOpen(false)} theme={chartTheme} onChange={setChartTheme} />

            <div ref={containerRef} className="absolute inset-0"
              style={{ cursor: replayState === 'selecting' ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'6\' cy=\'6\' r=\'3\'/><circle cx=\'6\' cy=\'18\' r=\'3\'/><line x1=\'20\' y1=\'4\' x2=\'8.12\' y2=\'15.88\'/><line x1=\'14.47\' y1=\'14.48\' x2=\'20\' y2=\'20\'/><line x1=\'8.12\' y1=\'8.12\' x2=\'12\' y2=\'12\'/></svg>") 12 12, crosshair' : activeTool !== 'cursor' ? 'crosshair' : 'default' }}/>

            <div ref={countdownTimerRef} className="absolute right-0 text-[10px] text-white bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 px-1 py-0.5 rounded-sm shadow z-[60] pointer-events-none " style={{ display: 'none' }}></div>`n              {/* OHLCV Overlay (TradingView Style) */}
            <div className="absolute top-2 left-2 z-10 flex flex-col pointer-events-none">
              <div className="flex items-center gap-3 text-[11px] font-mono mb-1">
                <div className="flex items-center gap-1.5 mr-2">
                  <AssetLogo symbol={getFriendlyName(activeTicker)} className="w-4 h-4" />
                  <span className="font-bold text-gray-900 dark:text-slate-200">{getFriendlyName(activeTicker)}</span>
                </div>
                {hoveredCandle || lastCandle ? (
                  <>
                    <span className="text-gray-500 dark:text-slate-500">O <span className="text-gray-800 dark:text-slate-300">{(hoveredCandle || lastCandle).open.toFixed(2)}</span></span>
                    <span className="text-gray-500 dark:text-slate-500">H <span className="text-gray-800 dark:text-slate-300">{(hoveredCandle || lastCandle).high.toFixed(2)}</span></span>
                    <span className="text-gray-500 dark:text-slate-500">L <span className="text-gray-800 dark:text-slate-300">{(hoveredCandle || lastCandle).low.toFixed(2)}</span></span>
                    <span className="text-gray-500 dark:text-slate-500">C <span className="text-gray-800 dark:text-slate-300">{(hoveredCandle || lastCandle).close.toFixed(2)}</span></span>
                    {(hoveredCandle || lastCandle).volume !== undefined && (
                      <span className="text-gray-500 dark:text-slate-500">Vol <span className="text-gray-800 dark:text-slate-300">{(hoveredCandle || lastCandle).volume.toLocaleString()}</span></span>
                    )}
                  </>
                ) : null}
              </div>
              
              {/* Indicators Legend */}
              {activeIndicators.map(ind => (
                <div key={ind.uid} className="group flex items-center gap-2 text-[11px] pointer-events-auto rounded hover:bg-gray-50 dark:bg-slate-900/40 px-1 py-0.5 w-fit">
                  <span className="font-semibold" style={{ color: ind.color }}>{ind.shortName} {ind.length}</span>
                  <span className="text-gray-600 dark:text-slate-400 hidden group-hover:inline-block truncate max-w-[80px]">{ind.name}</span>
                  
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity ml-1">
                    <button className="text-gray-600 dark:text-slate-400 hover:text-white" onClick={() => setActiveIndicators(prev => prev.map(i => i.uid === ind.uid ? {...i, visible: !i.visible} : i))}>
                      {ind.visible ? <Eye size={12}/> : <EyeOff size={12}/>}
                    </button>
                    <button className="text-gray-600 dark:text-slate-400 hover:text-white" onClick={() => { setSettingsIndicator(ind); setIsIndicatorSettingsOpen(true); }}><Settings2 size={12}/></button>
                    <button className="text-gray-600 dark:text-slate-400 hover:text-red-400" onClick={() => setActiveIndicators(prev => prev.filter(i => i.uid !== ind.uid))}><X size={12}/></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Replay Control Bar */}
            {replayMode && replayState !== 'none' && replayState !== 'selecting' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0f172a] border border-gray-300 dark:border-slate-700 p-2 rounded-lg shadow-2xl z-30">
                <button onClick={() => setReplayState(replayState === 'playing' ? 'paused' : 'playing')} className="w-10 h-10 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                  {replayState === 'playing' ? <Square size={16} className="fill-current"/> : <Play size={16} className="fill-current ml-0.5"/>}
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"/>
                {[1, 2, 3, 5].map(s => (
                  <button key={s} onClick={() => setReplaySpeed(s)} className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded transition-colors ${replaySpeed === s ? 'bg-gray-200 dark:bg-slate-700 text-white' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:bg-slate-800'}`}>
                    {s}x
                  </button>
                ))}
                <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"/>
                <button onClick={toggleReplay} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Stop Replay">
                  <Trash2 size={14}/>
                </button>
              </div>
            )}

            {/* SVG overlay — captures drawing pointer events when activeTool !== 'cursor' */}
            <svg ref={svgRef} className={`absolute inset-0 z-20 ${activeTool !== 'cursor' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
              style={{ width:'100%', height:'100%', display: showDrawings?'block':'none', userSelect: isDragging ? 'none' : 'auto' }}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
              onPointerLeave={handleSvgPointerUp}
            >
              {svgRenders.map(renderSvgTool)}
              {magnetPixel && (
                <g>
                  <line x1={magnetPixel.x} y1={0} x2={magnetPixel.x} y2="100%" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} />
                  <line x1={0} y1={magnetPixel.y} x2="100%" y2={magnetPixel.y} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} />
                  <circle cx={magnetPixel.x} cy={magnetPixel.y} r={3} fill="#94a3b8"/>
                </g>
              )}
            </svg>

            {/* AI Setup Overlay Card */}
            {isAiEntryVisible && aiSetupData && (
              <div 
                className="absolute z-40 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-2xl rounded-xl p-4 w-64 select-none cursor-grab active:cursor-grabbing touch-none"
                style={{ top: aiBoxPos.y, left: aiBoxPos.x }}
                onPointerDown={handleAiBoxPointerDown}
                onPointerMove={handleAiBoxPointerMove}
                onPointerUp={handleAiBoxPointerUp}
                onPointerCancel={handleAiBoxPointerUp}
              >
                <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-slate-700 pb-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-blue-500" />
                      <span className="font-bold text-gray-900 dark:text-white text-sm">AI Prediction</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{aiSetupData.ui_target}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${aiSetupData.trend === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{aiSetupData.trend}</span>
                </div>
                
                <div className="space-y-2 mb-3">

                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-blue-500">Entry Level</span>
                    <span className="font-bold text-gray-900 dark:text-white">{fmtPrice(aiSetupData.entry, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-red-500">Stop Loss</span>
                    <span className="font-bold text-gray-900 dark:text-white">{fmtPrice(aiSetupData.stop_loss, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-500">Target (TP)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{fmtPrice(aiSetupData.take_profit, currency)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-slate-800/50 p-2 rounded-lg space-y-1 mb-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                    <span>Confidence</span>
                    <span className="text-blue-400">{aiSetupData.confidence}</span>
                  </div>
                </div>

                <button
                  id="ai-entry-explain-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExplainModalOpen(true);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles size={13} className="text-violet-200" />
                  <span>Explain Prediction</span>
                </button>

                <div className="text-[9px] text-center text-amber-600 dark:text-amber-500 font-semibold italic border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
                  Note: AI Entry turns off automatically on timeframe/asset change.
                </div>
              </div>
            )}

            {/* Visual Position Calculator Overlay Card Removed - Moved to Sidebar */}

            {/* Countdown Timer Overlay */}
            <div ref={countdownRef} className="absolute right-0 z-30 hidden items-center justify-center text-[10px] font-mono font-bold tracking-wider rounded-l-md px-1 py-0.5 pointer-events-none bg-gray-50 dark:bg-slate-900/80 backdrop-blur-sm border-y border-l border-gray-300 dark:border-slate-700/50 shadow-sm" style={{ transform: 'translateY(0%)' }}>
              00:00
            </div>
          </div>

          {/* Trade Drawers */}
          <div className={`transition-all duration-300 flex-shrink-0 overflow-hidden border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 ${isDrawerOpen || isPosCalcActive ? 'w-72' : 'w-0 opacity-0'}`}>
            {isDrawerOpen && (
              <ErrorBoundary>
                <PaperTradeConsole activeTicker={activeTicker} livePrice={state.lastCandle?.close} marketOpen={getMarketStatus(EXCHANGE_MAP[info?.exchange] || info?.exchange)} onClose={() => setIsDrawerOpen(false)} draftState={draftOrder} setDraftState={setDraftOrder}/>
              </ErrorBoundary>
            )}
            {isPosCalcActive && !isDrawerOpen && (
              <VisualSizerPanel 
                activeTicker={activeTicker} 
                onClose={() => setIsPosCalcActive(false)} 
                posCalcInput={posCalcInput} 
                setPosCalcInput={setPosCalcInput}
                posCalcLines={posCalcLinesRef.current}
                isForex={activeTicker?.endsWith('=X')}
                isCrypto={activeTicker?.includes('-')}
              />
            )}
          </div>
        </div>
      </div>
      
      <BrokerConnectModal 
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        onConnect={(brokerName) => {
          setIsBrokerConnected(true);
          setConnectedBroker(brokerName);
        }}
      />

      <PredictionExplanationModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        ticker={activeTicker}
        prediction={aiSetupData}
        currency={currency}
      />
    </div>
  )
}



