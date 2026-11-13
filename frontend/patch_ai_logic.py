import re

filepath = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\TradingChart.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_logic = """  // ── AI Setup Fetcher (MOCK ENGINE) ─────────────────────────────────────────
  useEffect(() => {
    if (!activeTicker) {
      setAiSetupData(null);
      return;
    }
    
    setAiLoading(true);
    
    // Generate mock deterministic data based on symbol
    setTimeout(() => {
      let hash = 0;
      for (let i = 0; i < activeTicker.length; i++) {
        hash = activeTicker.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const isBullish = (Math.abs(hash) % 2) === 0;
      const trend = isBullish ? 'BULLISH' : 'BEARISH';
      
      const confidencePct = 65 + (Math.abs(hash) % 30);
      const confidence = `${confidencePct.toFixed(1)}%`;
      
      // Get current price from liveDataRef if available, else 100
      const currentPrice = liveDataRef.current?.lastCandle?.close || 100;
      
      let tp, sl;
      if (isBullish) {
        tp = currentPrice + (currentPrice * 0.05);
        sl = currentPrice - (currentPrice * 0.02);
      } else {
        tp = currentPrice - (currentPrice * 0.05);
        sl = currentPrice + (currentPrice * 0.02);
      }

      let ui_target = 'Swing Target (Next 1-2 Weeks)';
      if (['1s', '5s', '15s', '30s', '1m', '3m', '5m', '15m', '30m'].includes(selectedInterval.interval)) {
        ui_target = 'Intraday Target (Today)';
      } else if (['45m', '60m', '120m', '4h'].includes(selectedInterval.interval)) {
        ui_target = 'Short-Term Target (1-2 Days)';
      }
      
      setAiSetupData({
        trend,
        confidence,
        entry: currentPrice,
        take_profit: tp,
        stop_loss: sl,
        hold_duration: '2-5 Days',
        ui_target
      });
      setAiLoading(false);
    }, 500);
    
  }, [activeTicker, selectedInterval.interval]);"""

old_logic_pattern = r"// ── AI Setup Fetcher \(ALWAYS ON\) ─────────────────────────────────────────.*?\}, \[activeTicker, selectedInterval\.interval\]\);"

new_content = re.sub(old_logic_pattern, new_logic, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)
    
print("Replaced AI Setup Fetcher")
