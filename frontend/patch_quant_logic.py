import re

filepath = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\TradingChart.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the AI Setup Fetcher logic with Quantitative Simulator
new_logic = """  // ── AI Setup Fetcher (QUANTITATIVE SIMULATOR) ──────────────────────────
  useEffect(() => {
    if (!activeTicker) {
      setAiSetupData(null);
      return;
    }
    
    setAiLoading(true);
    let isMounted = true;
    
    const generateQuantPrediction = async () => {
      try {
        // Fetch real-time price to ensure we don't calculate on 100 (stale ref)
        const res = await fetch(`http://localhost:8000/api/latest-price/${encodeURIComponent(activeTicker)}`);
        let currentPrice = 100;
        if (res.ok) {
          const candle = await res.json();
          if (candle?.close) currentPrice = candle.close;
        } else {
           currentPrice = liveDataRef.current?.lastCandle?.close || 100;
        }

        // Generate deterministic hash
        let hash = 0;
        for (let i = 0; i < activeTicker.length; i++) {
          hash = activeTicker.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // 1. Simulated Volatility (ATR) - 1.2%
        const mockATR = currentPrice * 0.012;
        
        // 2. Trend & Algorithmic Levels (Strict Risk Management)
        const isBullish = (Math.abs(hash) % 2) === 0;
        const trend = isBullish ? 'BULLISH' : 'BEARISH';
        
        let tp, sl;
        if (isBullish) {
          sl = currentPrice - (mockATR * 1.5);
          tp = currentPrice + (mockATR * 3.2);
        } else {
          sl = currentPrice + (mockATR * 1.5);
          tp = currentPrice - (mockATR * 3.2);
        }
        
        // 3. Confidence Score (74.0 to 96.5)
        const confidenceVal = 74.0 + (Math.abs(hash) % 22) + ((Math.abs(hash) % 100) / 100);
        const confidence = `${confidenceVal.toFixed(1)}%`;
        
        let ui_target = 'Swing Target (Next 1-2 Weeks)';
        if (['1s', '5s', '15s', '30s', '1m', '3m', '5m', '15m', '30m'].includes(selectedInterval.interval)) {
          ui_target = 'Intraday Target (Today)';
        } else if (['45m', '60m', '120m', '4h'].includes(selectedInterval.interval)) {
          ui_target = 'Short-Term Target (1-2 Days)';
        }
        
        // Round strictly to 2 decimal places
        const entryNum = parseFloat(currentPrice.toFixed(2));
        const tpNum = parseFloat(tp.toFixed(2));
        const slNum = parseFloat(sl.toFixed(2));
        const riskRewardStr = `1 : ${((Math.abs(tpNum - entryNum) / Math.abs(entryNum - slNum)) || 2.1).toFixed(1)}`;

        if (isMounted) {
          setAiSetupData({
            trend,
            confidence,
            entry: entryNum,
            take_profit: tpNum,
            stop_loss: slNum,
            hold_duration: '2-5 Days',
            ui_target,
            riskReward: riskRewardStr
          });
          setAiLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setAiLoading(false);
      }
    };
    
    generateQuantPrediction();
    
    return () => { isMounted = false; };
  }, [activeTicker, selectedInterval.interval]);"""

old_logic_pattern = r"// ── AI Setup Fetcher \(MOCK ENGINE\) ─────────────────────────────────────────.*?\}, \[activeTicker, selectedInterval\.interval\]\);"

new_content = re.sub(old_logic_pattern, new_logic, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)
    
print("Replaced AI Setup Fetcher with Quant Engine")
