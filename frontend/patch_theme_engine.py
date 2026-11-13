import re

with open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update chartTheme initial state
old_theme = "const [chartTheme, setChartTheme] = useState({ upColor: '#10b981', downColor: '#ef4444', bgColor: '#0f172a', showGrid: true })"
new_theme = "const [chartTheme, setChartTheme] = useState({ mode: 'dark', upColor: '#10b981', downColor: '#ef4444', upBorder: '#10b981', downBorder: '#ef4444', upWick: '#10b981', downWick: '#ef4444', bgColor: '#131722', textColor: '#d1d4dc', showGrid: true, gridColor: '#363c4e60', showCrosshair: true, crosshairColor: '#d1d4dc' })"
c = c.replace(old_theme, new_theme)

# 2. Update Live Sync useEffect
old_sync = """    // Live Chart Theme Sync
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
    }, [chartTheme])"""

new_sync = """    // Live Chart Theme Sync
    useEffect(() => {
      if (!chartRef.current || !candleRef.current) return;
      
      chartRef.current.applyOptions({
        layout: { 
          background: { type: 'Solid', color: chartTheme.bgColor },
          textColor: chartTheme.textColor 
        },
        grid: { 
          vertLines: { visible: chartTheme.showGrid, color: chartTheme.gridColor }, 
          horzLines: { visible: chartTheme.showGrid, color: chartTheme.gridColor } 
        },
        crosshair: {
          mode: chartTheme.showCrosshair ? 1 : 0, // 1 is Magnet, 0 is Normal. Wait, crosshair visibility is handled via mode or color.
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
    }, [chartTheme])"""

if old_sync in c:
    c = c.replace(old_sync, new_sync)
else:
    # try regex
    c = re.sub(r'// Live Chart Theme Sync\s+useEffect\(\(\) => \{[\s\S]*?\}, \[chartTheme\]\)', new_sync, c)

with open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Patched TradingChart Engine")
