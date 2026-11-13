import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Imports
if 'import ChartSettingsModal' not in c:
    c = c.replace(
        "import IndicatorsModal from './IndicatorsModal.jsx'",
        "import IndicatorsModal from './IndicatorsModal.jsx'\nimport ChartSettingsModal from './ChartSettingsModal.jsx'\nimport { Settings } from 'lucide-react'"
    )

# 2. Add Utility for Logo
logo_util = """
const getLogoUrl = (symbol) => {
  if (!symbol) return '';
  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
  const domainMap = {
    'AAPL': 'apple.com', 'GOOGL': 'google.com', 'MSFT': 'microsoft.com', 'TSLA': 'tesla.com', 'AMZN': 'amazon.com', 'META': 'meta.com', 'NFLX': 'netflix.com'
  };
  if (domainMap[cleanSymbol]) return `https://logo.clearbit.com/${domainMap[cleanSymbol]}`;
  return `https://ui-avatars.com/api/?name=${cleanSymbol}&background=random&color=fff`;
}
"""
if 'const getLogoUrl' not in c:
    c = c.replace("const API_BASE = 'http://localhost:8000'", logo_util + "\nconst API_BASE = 'http://localhost:8000'")

# 3. Add States
state_vars = """    const [isChartSettingsOpen, setIsChartSettingsOpen] = useState(false)
    const [chartTheme, setChartTheme] = useState({ upColor: '#10b981', downColor: '#ef4444', bgColor: '#0f172a', showGrid: true })"""

if 'const [chartTheme' not in c:
    c = c.replace(
        "const [isIndicatorSettingsOpen, setIsIndicatorSettingsOpen] = useState(false)",
        "const [isIndicatorSettingsOpen, setIsIndicatorSettingsOpen] = useState(false)\n" + state_vars
    )

# 4. Add Live Sync useEffect
live_sync_effect = """
    // Live Chart Theme Sync
    useEffect(() => {
      if (!chartRef.current || !candleRef.current) return;
      
      chartRef.current.applyOptions({
        layout: { background: { type: 'Solid', color: chartTheme.bgColor } },
        grid: { 
          vertLines: { visible: chartTheme.showGrid, color: '#1e293b' }, 
          horzLines: { visible: chartTheme.showGrid, color: '#1e293b' } 
        }
      });
      
      candleRef.current.applyOptions({
        upColor: chartTheme.upColor, 
        downColor: chartTheme.downColor, 
        borderUpColor: chartTheme.upColor, 
        borderDownColor: chartTheme.downColor, 
        wickUpColor: chartTheme.upColor, 
        wickDownColor: chartTheme.downColor
      });
    }, [chartTheme])
"""
if 'Live Chart Theme Sync' not in c:
    c = c.replace(
        "const [historyCount, setHistoryCount] = useState(0)",
        "const [historyCount, setHistoryCount] = useState(0)\n" + live_sync_effect
    )

# 5. Top Header Logo Injection
target_header_ticker = """          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-blue-500">{activeTicker}</span>"""

new_header_ticker = """          <div className="flex items-center gap-2">
            <img src={getLogoUrl(activeTicker)} alt={activeTicker} className="w-6 h-6 rounded-full bg-slate-800 object-contain p-0.5 border border-slate-700" />
            <span className="font-mono font-bold text-sm text-blue-500">{activeTicker}</span>"""

if target_header_ticker in c:
    c = c.replace(target_header_ticker, new_header_ticker)

# 6. Chart Settings Gear Icon in Top Header (Next to AI/Trade)
target_trade_ai = """            <button onClick={() => setIsDrawerOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
              style={{
                background: isDrawerOpen ? 'rgba(59,130,246,0.15)' : '#1e293b',
                color: isDrawerOpen ? '#3b82f6' : '#94a3b8',
                border: isDrawerOpen ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              }}>
              {isDrawerOpen ? <PanelRightClose size={12}/> : <PanelRightOpen size={12}/>} Trade
            </button>
          </div>
        </div>"""

new_trade_ai = """            <button onClick={() => setIsDrawerOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all"
              style={{
                background: isDrawerOpen ? 'rgba(59,130,246,0.15)' : '#1e293b',
                color: isDrawerOpen ? '#3b82f6' : '#94a3b8',
                border: isDrawerOpen ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              }}>
              {isDrawerOpen ? <PanelRightClose size={12}/> : <PanelRightOpen size={12}/>} Trade
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />
            <button onClick={() => setIsChartSettingsOpen(true)} title="Chart Settings" className="p-1.5 rounded transition-all text-slate-400 hover:text-white hover:bg-slate-800">
              <Settings size={16} />
            </button>
          </div>
        </div>"""

if target_trade_ai in c:
    c = c.replace(target_trade_ai, new_trade_ai)

# 7. Render ChartSettingsModal
target_render_modals = """      <IndicatorSettingsModal isOpen={isIndicatorSettingsOpen} onClose={() => setIsIndicatorSettingsOpen(false)} indicator={settingsIndicator} onSave={(updated) => setActiveIndicators(prev => prev.map(i => i.uid === updated.uid ? updated : i))} />"""
new_render_modals = target_render_modals + """\n      <ChartSettingsModal isOpen={isChartSettingsOpen} onClose={() => setIsChartSettingsOpen(false)} theme={chartTheme} onChange={setChartTheme} />"""

if 'ChartSettingsModal isOpen=' not in c:
    c = c.replace(target_render_modals, new_render_modals)

with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Patched TradingChart.jsx for phase 7")
