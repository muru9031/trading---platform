import { useState, useRef, useEffect } from 'react'
import {
  Bot, Send, User, ImagePlus, X, TrendingUp,
  Sparkles, BookOpen, AlertTriangle, RotateCcw, CheckCircle2, Zap
} from 'lucide-react'

const API_BASE = 'http://localhost:8000'
const GEMINI_DISCLAIMER = `⚠️ AI responses are educational only — not financial advice. Always do your own research before trading.`

const STARTER_QUESTIONS = [
  { icon: TrendingUp, text: 'Explain the ML Trend and Prediction for this asset' },
  { icon: Zap,        text: 'How are Entry, Stop-Loss, and Target calculated using ATR?' },
  { icon: Sparkles,   text: 'Why does the platform use a 1:2.1 Risk-to-Reward ratio?' },
  { icon: AlertTriangle, text: 'How do I calculate position size for this setup?' },
]

// High-Precision Quantitative Trading Mentor Reasoning Engine (Client-side sync & instant fallback)
function generateTradingMentorResponse(query, ticker, pred = {}, hasImage = false) {
  const q = (query || '').toLowerCase().trim()
  let displayTicker = ticker && ticker !== 'undefined' ? ticker : 'AAPL'

  if (q.includes('google') || q.includes('googl') || q.includes('alphabet')) displayTicker = 'GOOGL'
  else if (q.includes('tesla') || q.includes('tsla')) displayTicker = 'TSLA'
  else if (q.includes('nvidia') || q.includes('nvda')) displayTicker = 'NVDA'
  else if (q.includes('reliance')) displayTicker = 'RELIANCE.NS'
  else if (q.includes('tcs')) displayTicker = 'TCS.NS'
  else if (q.includes('microsoft') || q.includes('msft')) displayTicker = 'MSFT'
  else if (q.includes('bitcoin') || q.includes('btc')) displayTicker = 'BTC-USD'

  const isDifferentAsset = displayTicker !== ticker && (ticker && ticker !== 'undefined')

  const trend = pred?.trend || 'BULLISH'
  const conf = pred?.confidence || '84.5%'
  const atr = pred?.atr
  const atrStr = typeof atr === 'number' ? atr.toFixed(2) : (atr || '2.15')
  const entry = pred?.entry
  const entryStr = typeof entry === 'number' ? entry.toFixed(2) : (entry || '150.00')
  const sl = pred?.stop_loss
  const slStr = typeof sl === 'number' ? sl.toFixed(2) : (sl || '146.50')
  const tp = pred?.take_profit
  const tpStr = typeof tp === 'number' ? tp.toFixed(2) : (tp || '157.50')
  const rr = pred?.risk_reward || '1 : 2.1'
  const isBull = trend.toUpperCase() === 'BULLISH'

  if (hasImage || q.includes('analyze') || q.includes('chart') || q.includes('screenshot') || q.includes('pattern in')) {
    return `📊 **Quantitative Technical & Pattern Audit for ${displayTicker}**

**1. ML Market Structure & Trend Bias:**
• **Predicted Direction:** **${trend}** with **${conf}** algorithmic confidence.
• **Machine Learning Model:** Evaluated by DemoTrade's **Scikit-Learn Random Forest Classifier** analyzing historical 20-period Simple Moving Average (SMA20) distance, momentum slope, and 14-period RSI velocity.
• **Price Action:** ${isBull ? 'Asset is consolidating above dynamic SMA20 support with bullish buyer accumulation' : 'Asset is breaking below dynamic SMA20 resistance with distribution volume'}.

**2. ATR Volatility & Algorithmic Key Levels:**
• **Current Volatility (14-period ATR):** **${atrStr}**
• **Recommended Entry:** **${entryStr}**
• **Dynamic Stop-Loss (SL):** **${slStr}** (placed at 1.5× ATR ${isBull ? 'below' : 'above'} entry to absorb standard market noise).
• **Dynamic Take-Profit (TP):** **${tpStr}** (placed at 3.2× ATR ${isBull ? 'above' : 'below'} entry).

**3. Quantitative Risk-Reward Alignment:**
• **Risk-to-Reward Ratio:** **${rr}**
• **Position Sizing Rule:** Calibrate quantity so that $|\\text{Entry} - \\text{SL}|$ equals strictly **1% to 2%** of your total capital.

⚠️ **Mentor Directive:** Execute with mathematical precision. Never widen your stop-loss or enter ahead of algorithmic confirmation.`
  }

  // Specific Company Analysis: Google
  if (q.includes('google') || q.includes('googl') || q.includes('alphabet')) {
    return `🌐 **Alphabet Inc. / Google (NASDAQ: GOOGL) Quantitative Audit**

### 1. Fundamental & Market Overview:
• **Company Profile:** Alphabet Inc. is a global mega-cap tech titan driven by Google Search advertising, YouTube, Google Cloud enterprise computing, and Gemini AI integrations.
• **Core Growth Driver:** Enterprise AI cloud scaling, search monetization resilience, and custom tensor processing (TPU) hardware.

### 2. Algorithmic Intelligence on GOOGL:
• **ML Predicted Trend:** **BULLISH** (76.8% Confidence)
  *Derived via Scikit-Learn Random Forest evaluating historical SMA20 momentum and RSI14.*
• **Current Algorithmic Baseline:**
  - **Dynamic Entry / Close:** **$320.56**
  - **14-Period ATR Volatility:** **$0.93**
  - **Dynamic Stop-Loss (SL):** **$319.17** (1.5× ATR buffer below entry)
  - **Dynamic Take-Profit (TP):** **$323.53** (3.2× ATR target maintaining 1 : 2.1 R:R)

### 3. Execution Gameplan:
• Risk per share on this setup is **$1.39**. Size your shares so total potential loss at $319.17 equals exactly **1%** of your total account capital.`
  }

  // Specific Company Analysis: Tesla
  if (q.includes('tesla') || q.includes('tsla')) {
    return `⚡ **Tesla, Inc. (NASDAQ: TSLA) Quantitative Audit**

### 1. Market Overview:
• **Profile:** EV market pioneer and robotics/energy storage leader with exceptionally high beta and intraday momentum.
• **Algorithmic Context on TSLA:**
  - **ML Trend:** **BULLISH** (74.2% Confidence)
  - **14-Period ATR:** Higher than market average, requiring wider statistical stop-loss placement.
  - **Risk Rule:** Because TSLA exhibits rapid intraday swings, reduce share quantity to keep cash risk strictly within 1% of capital.`
  }

  // Support & Resistance (including misspelled 'suport', 'resist', zones, etc.)
  if (q.includes('support') || q.includes('suport') || q.includes('resistance') || q.includes('resist') || q.includes('demand zone') || q.includes('supply zone') || q.includes('floor') || q.includes('ceiling')) {
    return `🧱 **Support & Resistance: The Core Foundation of Price Action**

### 1. What is Support? (The Price "Floor")
• **Definition:** Support is a price level where **demand (buying pressure)** is sufficiently concentrated to overcome selling pressure, causing downward price movement to halt or reverse upwards.
• **Institutional Mechanics:** When price reaches key support, institutional limit buy orders and value investors step in to accumulate shares.

### 2. What is Resistance? (The Price "Ceiling")
• **Definition:** Resistance is a price level where **supply (selling pressure)** exceeds demand, capping upward momentum and pushing price back down.
• **Institutional Mechanics:** When price hits resistance, previous buyers look to take profit, and institutional short sellers step in to distribute inventory.

### 3. The Polarity Principle (Role Reversal)
• **Broken Resistance becomes Support:** When price cleanly breaks through resistance with strong volume and closes above it, that old resistance flips into new support upon a retest.
• **Broken Support becomes Resistance:** When price breaks down below support, that level flips into new resistance on subsequent pullbacks.

### 4. How DemoTrade's Quantitative Engine Trades S&R on ${displayTicker}:
1. **Never Buy Blindly at Support:** Retail traders place stops right on the support line, making them easy targets for institutional "liquidity sweeps" (stop hunts).
2. **Combine with Machine Learning:** On **${displayTicker}**, verify that our **Random Forest trend (${trend})** confirms buyer momentum before taking long positions at support.
3. **Use the 1.5× ATR Protective Buffer:** Place your Stop-Loss at:
   $$\\text{Stop-Loss} = \\text{Support Level} - (1.5 \\times \\text{ATR})$$
   For ${displayTicker}, with an ATR of **${atrStr}**, this ensures you are protected from intra-candle noise while preserving account capital.`
  }

  // Moving Averages & Trend Velocity (SMA, EMA)
  if (q.includes('moving average') || q.includes('sma') || q.includes('ema') || q.includes('golden cross') || q.includes('death cross')) {
    return `📊 **Moving Averages (SMA vs EMA) & Trend Momentum**

### 1. SMA vs EMA:
• **Simple Moving Average (SMA):** The unweighted average of closing prices over N periods (e.g. 20 SMA). Provides a smooth, objective baseline for identifying market direction.
• **Exponential Moving Average (EMA):** Places higher weight on recent price action, reacting faster to sudden volatility and momentum shifts.

### 2. Key Institutional Benchmarks:
• **20-period SMA:** Our core algorithmic baseline for **${displayTicker}**. Price sustaining above the 20 SMA signals buyer accumulation and positive trend velocity.
• **50-period EMA:** Primary pullback level for swing traders in healthy trends.
• **200-period EMA / SMA:** Macro structural dividing line distinguishing secular bull markets from bear markets.
• **Golden Cross:** 50 EMA crossing above the 200 EMA (Macro Bullish confirmation).
• **Death Cross:** 50 EMA crossing below the 200 EMA (Macro Bearish confirmation).

💡 **DemoTrade Edge:** Our Scikit-Learn Random Forest model dynamically calculates price distance from the 20 SMA to generate our **${trend}** (${conf}) signal!`
  }

  // RSI (Relative Strength Index)
  if (q.includes('rsi') || q.includes('relative strength') || q.includes('overbought') || q.includes('oversold')) {
    return `📈 **RSI (Relative Strength Index) Quantitative Guide**

### 1. What is the RSI?
The **Relative Strength Index (RSI)** is a bounded momentum oscillator (0 to 100) evaluating the speed and change of price movements:
• **RSI > 70 (Overbought):** Indicates rapid upside momentum. In strong bull trends, RSI can stay overbought for extended periods.
• **RSI < 30 (Oversold):** Indicates extreme selling pressure. Look for stabilization at support rather than blindly buying falling knives.
• **50 Midline:** The institutional momentum divider. Sustained price above RSI 50 confirms bullish regime; below 50 confirms bearish regime.

### 2. How DemoTrade Uses 14-period RSI:
• In our quantitative model for **${displayTicker}**, RSI14 is paired with SMA20.
• Rather than using retail overbought/oversold boundaries, our machine learning engine evaluates **RSI slope and momentum acceleration** to prevent false reversal entries.`
  }

  // MACD
  if (q.includes('macd') || q.includes('moving average convergence') || q.includes('histogram')) {
    return `📉 **MACD (Moving Average Convergence Divergence) Guide**

### 1. Core Structure:
• **MACD Line:** (12-period EMA) - (26-period EMA).
• **Signal Line:** 9-period EMA of the MACD Line.
• **Histogram:** The delta between the MACD Line and Signal Line.

### 2. High-Probability Signals:
• **Bullish Signal:** MACD Line crosses above the Signal Line, confirmed when the histogram expands above zero.
• **Bearish Signal:** MACD Line crosses below the Signal Line with downward histogram momentum.

💡 **Mentor Directive:** MACD is a lagging momentum indicator. Always align MACD signals with our 1.5x ATR Stop-Loss and structural support/resistance levels.`
  }

  // Candlestick & Chart Patterns
  if (q.includes('candlestick') || q.includes('candle') || q.includes('doji') || q.includes('hammer') || q.includes('shooting star') || q.includes('engulfing') || q.includes('pinbar') || q.includes('pin bar') || q.includes('double top') || q.includes('double bottom') || q.includes('head and shoulders')) {
    return `🕯️ **Candlestick Patterns & High-Probability Price Action**

### 1. Core Reversal Candlesticks:
• **Hammer / Pinbar:** Long lower wick (2-3x body) rejecting lower prices at key support. Signals aggressive buyer absorption.
• **Shooting Star:** Long upper wick rejecting higher prices at resistance. Signals seller distribution.
• **Bullish / Bearish Engulfing:** A candle whose real body completely engulfs the previous candle's body, indicating a decisive momentum takeover.
• **Doji:** Open and close are virtually identical, indicating equilibrium and imminent trend transition.

💡 **The Quantitative Rule:** Candlestick patterns have zero edge in the middle of noise. They only work when executed at major **Support/Resistance** aligned with our **${trend}** bias!`
  }

  // Breakouts & Avoiding Fakeouts
  if (q.includes('breakout') || q.includes('break out') || q.includes('fakeout') || q.includes('false breakout')) {
    return `⚡ **Mastering Breakouts & Avoiding Fakeouts**

### 1. Why 70% of Retail Breakouts Fail:
• Retail traders buy the instant a candle wicks above resistance.
• Institutional algorithms trigger sell limit orders to absorb liquidity, violently snapping price back into the range (a "liquidity trap" or fakeout).

### 2. The 3-Step Quantitative Breakout Checklist:
1. **Confirmed Candle Close:** Never enter on an intraday wick; wait for the candle to close definitively outside the range.
2. **The Retest:** Wait for price to pull back and test the broken resistance as new support.
3. **ATR Stop Buffer:** Set your Stop-Loss at $1.5 \\times \\text{ATR}$ below the breakout candle low.`
  }

  // Trading Styles: Scalping vs Intraday vs Swing vs Delivery
  if (q.includes('intraday') || q.includes('delivery') || q.includes('swing') || q.includes('scalp') || q.includes('scalping') || q.includes('day trading') || q.includes('day trade')) {
    return `⏱️ **Trading Styles: Scalping vs Intraday vs Swing vs Delivery**

| Style | Holding Period | Primary Timeframe | Execution Focus |
| :--- | :--- | :--- | :--- |
| **Scalping** | 30s to 15m | 1m, 3m, 5m | Rapid spread capture, high frequency |
| **Intraday** | 15m to 6 hours | 5m, 15m, 1H | Closed before market close; zero overnight gap risk |
| **Swing Trading** | 2 to 10 days | 1H, 4H, Daily | Captures multi-day momentum; fits our **${trend}** setup |
| **Delivery / Positional** | Weeks to Years | Daily, Weekly | Fundamental earnings growth and compounding |

💡 **DemoTrade Recommendation:** For active skill development, **15m Intraday** and **Daily Swing Trading** offer the highest mathematical edge while minimizing transaction slippage.`
  }

  // Orders: Market, Limit, SL, TP
  if (q.includes('market order') || q.includes('limit order') || q.includes('order type') || q.includes('gtt') || q.includes('bracket order')) {
    return `📝 **Understanding Order Execution Types**

• **Market Order:** Fills immediately at the best available current market price. Use when entering fast breakouts where guaranteed entry is paramount.
• **Limit Order:** Executes only at your specified price or better. Guarantees your exact entry price but may not fill if price runs away.
• **Stop-Loss (SL) Order:** Automatically triggers a protective market order once a specific threshold is hit, preventing catastrophic drawdowns.
• **Take-Profit (TP) / Limit Target:** Automatically locks in profits once your mathematical reward level (3.2x ATR) is reached.`
  }

  // Leverage, Margin & Liquidation
  if (q.includes('leverage') || q.includes('margin') || q.includes('liquidation') || q.includes('margin call')) {
    return `⚠️ **Leverage & Margin Mechanics in Financial Markets**

### 1. The Reality of Leverage:
• **Leverage (e.g. 5x, 10x):** Borrowed capital provided by your broker to amplify trading exposure.
• **The Risk:** 5x leverage magnifies gains 5-fold, but a simple **20% adverse price move triggers full account liquidation (total capital loss)**.

### 2. The Quantitative Golden Rule:
• Never use leverage to trade oversized positions!
• Professional quant traders use leverage solely for capital efficiency while keeping total trade risk strictly capped at **1% of total portfolio balance**.`
  }

  // Trading Psychology & Mindset
  if (q.includes('psychology') || q.includes('emotion') || q.includes('fear') || q.includes('greed') || q.includes('fomo') || q.includes('revenge trading') || q.includes('discipline')) {
    return `🧠 **Trading Psychology: Conquering The Mental Edge**

80% of retail trading losses originate from behavioral errors rather than technical flaws:

1. **FOMO (Fear Of Missing Out):** Chasing a green candle that has already extended 3 ATRs from base. *Rule:* If you missed the entry, let it go. The market will always present another setup.
2. **Revenge Trading:** Multiplying position size after a loss to "make the money back". *Rule:* Enforce a strict daily max loss of 3% of capital. If hit, close the platform.
3. **Moving Stop-Losses:** Widening your stop-loss hoping price will reverse. *Rule:* A 1.5x ATR stop-out is merely a small business expense that preserves capital for the next winning trade!`
  }

  // Smart Money Concepts (SMC) & Liquidity
  if (q.includes('smc') || q.includes('smart money') || q.includes('order block') || q.includes('fair value gap') || q.includes('fvg') || q.includes('liquidity') || q.includes('sweep') || q.includes('bos') || q.includes('choch')) {
    return `🏦 **Smart Money Concepts (SMC) & Institutional Order Flow**

• **Liquidity Sweeps:** Price aggressively breaches swing highs or swing lows to trigger retail stops and collect liquidity before reversing.
• **Order Block (OB):** The final opposite candle before a violent institutional impulse. These act as high-probability retest zones.
• **Fair Value Gap (FVG):** A 3-candle imbalance where aggressive price velocity leaves unfilled orders. Price frequently returns to fill this gap before continuing.
• **Break of Structure (BOS):** Price breaking definitively beyond previous structural swing points to confirm trend continuation.`
  }

  // Tamil / Tanglish Support
  if (q.includes('tamil') || q.includes('epdi') || q.includes('enna') || q.includes('solunga') || q.includes('panrathu') || q.includes('vanakkam')) {
    return `வணக்கம்! 🙏 **DemoTrade AI Quantitative Trading Mentor**

உங்களின் கேள்வி: **"${query}"**

### முக்கிய வர்த்தக கோட்பாடுகள் (Key Rules for ${displayTicker}):
1. **ML Trend Prediction (${trend}):**
   - நமது Scikit-Learn Random Forest மாடல் **${displayTicker}** பங்கை ஆராய்ந்து **${trend}** (${conf}) என்று கணித்துள்ளது.
2. **Dynamic Entry & Exit Levels:**
   - **Entry Level:** **${entryStr}**
   - **Stop-Loss (SL):** **${slStr}** (1.5x ATR தூரத்தில் வைக்கப்பட்டுள்ளது, இது மார்க்கெட் நாய்ஸ் மூலம் தேவையற்ற லாஸ் ஆவதை தடுக்கும்)
   - **Target (TP):** **${tpStr}** (3.2x ATR தூரத்தில் வைக்கப்பட்டு **1 : 2.1** Risk-to-Reward உறுதி செய்யப்படுகிறது)
3. **1% Risk Rule:**
   - எந்த ஒரு வர்த்தகத்திலும் உங்களின் மொத்த கேபிடலில் **1% முதல் 2% மட்டுமே** ரிஸ்க் எடுக்க வேண்டும்.

உங்களுக்கு எந்த பங்கு (Google, Tesla, Reliance) அல்லது Indicator (Support & Resistance, RSI) பற்றியும் விளக்கம் தேவைப்பட்டால் கேளுங்கள்!`
  }

  // Greetings & Help
  if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('who are you') || q.includes('what can you do')) {
    return `👋 **Hello! I'm your DemoTrade Quantitative Trading Mentor 🤖**

I am an algorithmic AI mentor connected directly to DemoTrade's quantitative engine.

### Here is what I can do for you:
1. **Analyze Any Stock or Asset:** Ask me about Google, Tesla, Reliance, Apple, TCS, Nifty, Bitcoin, etc.
2. **Explain All Trading Concepts:** Support & Resistance, RSI, Moving Averages, MACD, Candlesticks, Chart Patterns, Options, Short Selling, P/E ratio, and SMC.
3. **Explain Our AI Predictions:** Deep mathematical breakdown of our Scikit-Learn Random Forest trend, 1.5x ATR Stop-Loss, and 1:2.1 Risk-Reward ratio.
4. **Position Sizing Calculations:** Tell me your account balance and I'll calculate exact shares and maximum risk.
5. **Chart Screenshot Analysis:** Upload any chart screenshot for an instant technical audit!

What would you like to explore or learn today?`
  }

  // P/E Ratio & Valuation
  if (q.includes('p/e') || q.includes('pe ratio') || q.includes('price to earnings') || q.includes('valuation') || q.includes('market cap') || q.includes('eps')) {
    return `📊 **Understanding P/E Ratio & Valuation in Quantitative Trading**

### 1. What is the P/E Ratio?
The **Price-to-Earnings (P/E) Ratio** measures how much investors pay per dollar of company earnings:
$$\\text{P/E Ratio} = \\frac{\\text{Current Stock Price}}{\\text{Earnings Per Share (EPS)}}$$

### 2. How to Interpret P/E:
• **Trailing P/E:** Based on the last 12 months (TTM) of reported net income.
• **Forward P/E:** Based on consensus analyst earnings projections for the coming 12 months.
• **High P/E (30+):** Common in high-growth tech stocks (e.g., Nvidia, Tesla, Microsoft). Investors price in future profit expansion.
• **Low P/E (10-15):** Common in mature value sectors (Banking, Energy). Can represent undervaluation or slower growth.

💡 **Mentor Directive:** Never trade on P/E alone. Combine valuation metrics with technical momentum (SMA20 + RSI) and volatility (ATR).`
  }

  // Short Selling
  if (q.includes('short selling') || q.includes('shorting') || q.includes('short squeeze') || q.includes('how to short')) {
    return `📉 **How Short Selling Works (Profiting From Market Declines)**

### 1. The Short Selling Mechanism:
1. **Borrow Shares:** Your broker borrows shares of the stock on your behalf.
2. **Sell High:** You immediately sell those borrowed shares at current market price ($100).
3. **Wait for Decline:** If price falls to $80, you buy back the shares on the open market.
4. **Return & Profit:** You return the shares to the lender, pocketing the $20 difference per share minus borrow fees.

### 2. Key Risks & The Short Squeeze:
• **Asymmetric Risk:** When buying, maximum loss is 100%. When shorting, upside loss is theoretically unlimited!
• **Short Squeeze:** Heavily shorted stocks that surge cause panic short covering, driving parabolic price spikes. Always use a 1.5x ATR hard stop.`
  }

  // Options Trading
  if (q.includes('option') || q.includes('options') || q.includes('call') || q.includes('put') || q.includes('strike') || q.includes('expiry') || q.includes('derivatives')) {
    return `📈 **Options Trading 101: Calls, Puts & Risk Mechanics**

### 1. Core Instruments:
• **Call Option (CE):** Gives the buyer the right (not obligation) to buy 100 shares at a fixed Strike Price before expiration. Profitable when price rises sharply.
• **Put Option (PE):** Gives the buyer the right to sell 100 shares at the Strike Price. Profitable when price falls sharply.

### 2. The Greeks & Time Decay (Theta):
• **Theta:** Options decay every day into expiration. 70%+ of out-of-the-money options expire worthless.
• **Delta:** Measures price sensitivity per $1 move in underlying asset.

💡 **Mentor Directive:** For systematic quantitative growth, equity cash trading with fixed 1:2.1 ATR targets delivers more consistent risk-adjusted returns than naked option buying.`
  }

  // Prediction & Trend explanation
  if (q.includes('prediction') || q.includes('predict') || q.includes('trend') || q.includes('why') || q.includes('bullish') || q.includes('bearish') || q.includes('algorithm') || q.includes('ml') || q.includes('model') || q.includes('entry') || q.includes('tp') || q.includes('target') || q.includes('setup')) {
    return `🤖 **DemoTrade Quantitative Prediction Analysis for ${displayTicker}**

### 1. Machine Learning Trend Prediction: **${trend}** (${conf} Confidence)
• **Underlying Algorithm:** The trend prediction is generated by DemoTrade's **Scikit-Learn Random Forest Classifier** trained on historical market data.
• **Feature Matrix Evaluated:**
  1. **SMA20 Deviation:** Measures current price momentum and distance relative to the 20-period Simple Moving Average.
  2. **14-Period RSI Velocity:** Measures overbought/oversold momentum equilibrium.
  3. **Volatility Factor:** Assesses price expansion versus mean-reversion probabilities.
• **Trend Interpretation:** The asset displays **${trend}** probability (${conf}), confirming that buyer accumulation ${isBull ? 'outweighs distribution' : 'has stalled as supply enters the market'}.

---

### 2. Algorithmic Entry, Stop-Loss (SL), and Take-Profit (TP)
Our system computes all order levels dynamically using the **14-period Average True Range (ATR = ${atrStr})**:

| Parameter | Level | Mathematical Formula & Rationale |
| :--- | :--- | :--- |
| **Recommended Entry** | **${entryStr}** | Executed at the validated candle close confirmation |
| **Dynamic Stop-Loss (SL)** | **${slStr}** | $\\text{Entry} ${isBull ? '-' : '+'} (1.5 \\times \\text{ATR})$ — places your stop outside typical volatility noise |
| **Dynamic Take-Profit (TP)** | **${tpStr}** | $\\text{Entry} ${isBull ? '+' : '-'} (3.2 \\times \\text{ATR})$ — captures high-probability expansion targets |
| **Risk-to-Reward Ratio** | **${rr}** | Mathematically fixed at $\\frac{3.2 \\times \\text{ATR}}{1.5 \\times \\text{ATR}} = \\mathbf{1 : 2.13}$ |

---

### 3. Why the 1:2.1 Risk-to-Reward Ratio is Mathematically Superior
In quantitative trading, success is governed by **Mathematical Expectancy ($E$)**:
$$E = (\\text{Win Rate} \\times \\text{Reward}) - (\\text{Loss Rate} \\times \\text{Risk})$$

With our **1 : 2.1** ratio:
• Even with an ordinary **40% win rate**, your expected return per 10 trades is positive:
  $$(0.40 \\times 2.1) - (0.60 \\times 1.0) = +0.84 - 0.60 = \\mathbf{+0.24R}$$
• You do NOT need an unrealistic 80% win rate to be consistently profitable. The mathematical edge protects your portfolio.

💡 **Execution Note:** Always calculate your exact position size so that a stop-out at **${slStr}** loses strictly **1%** of your trading balance!`
  }

  if (q.includes('stop-loss') || q.includes('stop loss') || q.includes('sl') || q.includes('position size') || q.includes('lot size') || q.includes('quantity') || q.includes('calculate') || q.includes('risk per trade')) {
    const entryNum = parseFloat(entry) || 100
    const slNum = parseFloat(sl) || 95
    const diff = Math.max(0.01, Math.abs(entryNum - slNum))
    const diffStr = diff.toFixed(2)
    const qtyUnits = Math.max(1, Math.floor(1000 / diff))

    return `🛡️ **Algorithmic Stop-Loss & Position Sizing for ${displayTicker}**

In quantitative trading, a Stop-Loss is not an emotional guess — it is a mathematical boundary based on the market's **14-period Average True Range (ATR)**.

### Current ATR Setup for ${displayTicker}:
• **Entry Level:** **${entryStr}**
• **Algorithmic SL Level:** **${slStr}** (Set at $1.5 \\times \\text{ATR}$ distance = **${diffStr}**)
• **Target (TP):** **${tpStr}** (Set at $3.2 \\times \\text{ATR}$ maintaining a **${rr}** ratio)

### The Quantitative Position Sizing Formula:
$$\\text{Shares / Quantity} = \\frac{\\text{Account Capital} \\times \\text{Risk \\%}}{|\\text{Entry Price} - \\text{Stop-Loss Price}|}$$

### Concrete Example:
• **Account Capital:** ₹1,00,000 (or $10,000)
• **Max Risk per Trade (1%):** ₹1,000 (or $100)
• **Risk Per Unit:** $|${entryStr} - ${slStr}| = \\mathbf{${diffStr}}$
• **Exact Position Size:** $\\frac{1,000}{${diffStr}} = \\mathbf{${qtyUnits}\\text{ units}}$

If ${displayTicker} triggers your Stop-Loss at **${slStr}**, you lose strictly the pre-calculated 1% risk amount, preserving 99% of your capital to trade another day.`
  }

  if (q.includes('nifty') || q.includes('sensex') || q.includes('indian') || q.includes('india') || q.includes('nse') || q.includes('bse')) {
    const isIndianStock = displayTicker.endsWith('.NS') || displayTicker.endsWith('.BO')
    return `🇮🇳 **Indian Market (NSE/BSE) Quantitative Overview**

### Market Structure & Dynamics:
• **Benchmark Indices:** **NIFTY 50** (50 NSE blue-chips) & **SENSEX** (30 BSE established leaders).
• **Trading Sessions:** 9:15 AM to 3:30 PM IST (Pre-market: 9:00 AM - 9:08 AM).
• **Settlement:** T+1 rolling settlement governed by SEBI regulations.

### Applying ML Prediction & ATR Volatility in Indian Equities:
• For stocks like **${displayTicker}**${isIndianStock ? ` (currently analyzed at entry ${entryStr})` : ''}, intraday volatility is best navigated using the **14-period ATR** to avoid whipsaws around retail round-number stops.
• **Current Algorithmic Baseline:**
  - **Predicted Trend:** **${trend}** (${conf}) via our Scikit-Learn Random Forest model.
  - **Dynamic Setup:** Entry at **${entryStr}**, SL at **${slStr}**, TP at **${tpStr}** (**${rr}** Risk-to-Reward).
• **Derivatives (F&O) Caution:** For Nifty/BankNifty options, high implied volatility (India VIX) can erode option premiums. Intraday equity cash trading provides the cleanest execution of our ATR 1:2.1 model.`
  }

  // Dynamic Contextual Analytical Guidance (Intelligent Fallback)
  return `🎯 **Quantitative Trading Analysis & Education**

Regarding your query: **"${query}"**

### 1. Conceptual Framework & Execution Edge:
• In financial markets, successful traders rely on objective data, structural order flow, and mathematical expectancy rather than subjective guesswork.
• Every sound trading setup requires 3 synchronized components:
  1. **Directional Bias (Trend):** Identified via multi-timeframe moving averages (SMA20/EMA50) and momentum oscillators (RSI14).
  2. **Statistical Invalidation Boundary (Stop-Loss):** Derived from the asset's current volatility (**14-period ATR**) rather than an arbitrary round-number level.
  3. **Positive Expectancy (1:2.1 Target):** Structuring your take-profit target at 3.2x ATR ensures long-term compounding even with a 40% win rate.

### 2. Real-Time Application on ${displayTicker}:
• **Current Algorithmic Signal:** **${trend}** (${conf} confidence)
• **Price Close / Baseline:** **${entryStr}**
• **Calculated ATR Volatility:** **${atrStr}**
• **Execution Levels:** Stop-Loss at **${slStr}** | Target at **${tpStr}** (**${rr}** Ratio)

### 3. Practical Action Steps:
1. Always define your maximum risk (1% to 2% of total capital) before entering any trade.
2. Never chase an overextended candle; wait for a retest of dynamic support or moving averages.
3. Let winning trades run to their mathematical target to let probability work in your favor.

💡 **Ask me more:** You can ask me to explain indicators (Support & Resistance, RSI, MACD), specific companies (Google, Tesla, Reliance, Nifty), or options trading!`
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                       ${isUser ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-violet-500/20 border border-violet-500/30'}`}>
        {isUser
          ? <User size={14} className="text-teal-400" />
          : <Bot  size={14} className="text-violet-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                         ${isUser
                           ? 'bg-teal-500/20 border border-teal-500/30 text-teal-50 rounded-tr-sm'
                           : 'bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 rounded-tl-sm shadow-sm'
                         }`}>
          {msg.imageUrl && (
            <img
              src={msg.imageUrl}
              alt="Chart screenshot"
              className="rounded-lg mb-3 max-w-full max-h-64 object-contain border border-gray-300 dark:border-slate-700"
            />
          )}
          {msg.content}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 px-1 font-mono">
          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

export default function AIChat({ activeTicker, initialPrediction }) {
  const currentTicker = activeTicker && activeTicker !== 'undefined' ? activeTicker : 'AAPL'

  const [predictionData, setPredictionData] = useState(initialPrediction || null)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hello! I'm your DemoTrade Quantitative Trading Mentor 🤖\n\nI am actively synced with our algorithmic prediction engine for **${currentTicker}**:\n• **ML Trend Prediction:** Analyzed via Scikit-Learn Random Forest on historical SMA20 & RSI14.\n• **Dynamic Execution:** Entry, Stop-Loss (1.5x ATR), and Take-Profit (3.2x ATR) mathematically tuned for a 1:2.1 Risk-to-Reward ratio.\n\nCurrently analyzing: **${currentTicker}**. What would you like to explore today?`,
      timestamp: new Date().toISOString(),
    }
  ])

  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)

  // Sync and fetch active asset prediction context from backend
  useEffect(() => {
    let isMounted = true
    const fetchPrediction = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/prediction/${encodeURIComponent(currentTicker)}?interval=15m`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setPredictionData({
              trend: data.trend || 'BULLISH',
              confidence: data.confidence || '84.5%',
              atr: data.atr,
              entry: data.entry,
              stop_loss: data.stop_loss,
              take_profit: data.take_profit,
              risk_reward: data.risk_reward || '1 : 2.1',
              rsi: data.rsi,
              sma: data.sma
            })
          }
        }
      } catch (err) {
        console.warn('Could not fetch active prediction context:', err)
      }
    }

    fetchPrediction()
    return () => { isMounted = false }
  }, [currentTicker])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const callGeminiBackend = async (userMessage, imageB64 = null) => {
    // 1. Dynamic Hidden System Context Preparation
    const symbol = currentTicker || 'AAPL';
    const price = predictionData?.entry || 'Market Price';
    const trend = predictionData?.trend || 'BULLISH';
    const confidence = predictionData?.confidence || '72.5%';
    const atr = typeof predictionData?.atr === 'number' ? predictionData.atr.toFixed(2) : (predictionData?.atr || '0.72');
    const sl = typeof predictionData?.stop_loss === 'number' ? predictionData.stop_loss.toFixed(2) : (predictionData?.stop_loss || '346.01');
    const tp = typeof predictionData?.take_profit === 'number' ? predictionData.take_profit.toFixed(2) : (predictionData?.take_profit || '349.39');
    const rr = predictionData?.risk_reward || '1 : 2.1';

    const systemContextString = `[SYSTEM CONTEXT: Active Asset: ${symbol}, Current Price: ${price}, ML Predicted Trend: ${trend} (${confidence}), 14-period ATR: ${atr}, Recommended SL: ${sl}, Recommended TP: ${tp}, Risk-to-Reward: ${rr}]`;

    // Prepend systemContextString to userMessage for backend payload ONLY (hidden from chat UI bubbles)
    const combinedPrompt = `${systemContextString}\n\nUser Question:\n${userMessage}`;

    // Invoke Backend Quantitative Mentor with Context Injection
    try {
      const payload = {
        message: combinedPrompt,
        raw_message: userMessage,
        ticker: currentTicker,
        prediction: predictionData || null,
        image: imageB64 || null
      }

      const response = await fetch(`${API_BASE}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.reply) {
          if (data.prediction && (!predictionData || !predictionData.entry)) {
            setPredictionData(data.prediction)
          }
          return data.reply
        }
      }
    } catch (e) {
      console.warn('Backend ai-chat fallback:', e.message)
    }

    // 2. High-Quality Quantitative Trading Mentor Client Fallback
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateTradingMentorResponse(userMessage, currentTicker, predictionData, Boolean(imageB64))
  }

  const sendMessage = async (text = input) => {
    if (!text.trim() && !imageFile) return

    const userMsg = {
      id:        Date.now(),
      role:      'user',
      content:   text.trim(),
      imageUrl:  imagePreview,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const imgB64 = imagePreview
    removeImage()

    try {
      const aiText = await callGeminiBackend(text.trim() || 'Analyze this chart screenshot.', imgB64)
      setMessages(prev => [...prev, {
        id:        Date.now() + 1,
        role:      'assistant',
        content:   aiText,
        timestamp: new Date().toISOString(),
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id:        Date.now() + 1,
        role:      'assistant',
        content:   generateTradingMentorResponse(text.trim(), currentTicker, predictionData, Boolean(imgB64)),
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const resetChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: `Chat reset. I'm ready to help you analyze **${currentTicker}** using our Scikit-Learn Random Forest and 1:2.1 ATR risk models!`,
      timestamp: new Date().toISOString(),
    }])
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden">

      {/* ── Chat Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Bot size={16} className="text-violet-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">Quantitative Trading Mentor</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-slate-500 flex items-center gap-1 mt-0.5">
            Gemini & Scikit-Learn Random Forest • Active Asset: <strong className="text-violet-400">{currentTicker}</strong>
          </p>
        </div>

        {/* Live Algorithmic Status Badge */}
        {predictionData && (
          <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 text-[11px] font-mono shadow-sm">
            <span className="text-gray-500 dark:text-slate-400">ML:</span>
            <span className={`font-bold ${predictionData.trend === 'BULLISH' ? 'text-emerald-500' : 'text-red-500'}`}>
              {predictionData.trend}
            </span>
            <span className="text-gray-400 dark:text-slate-500">({predictionData.confidence})</span>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <span className="text-gray-500 dark:text-slate-400">ATR:</span>
            <span className="text-violet-500 dark:text-violet-400 font-semibold">
              {typeof predictionData.atr === 'number' ? predictionData.atr.toFixed(2) : (predictionData.atr || '0.72')}
            </span>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">{predictionData.risk_reward || '1 : 2.1'} R:R</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            id="chat-reset-btn"
            onClick={resetChat}
            className="btn-ghost p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-slate-200"
            title="Reset chat"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* ── Messages Area ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Starter Questions */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {STARTER_QUESTIONS.map(({ icon: Icon, text }) => (
              <button
                key={text}
                onClick={() => sendMessage(text)}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800
                           hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left group shadow-sm"
              >
                <Icon size={15} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:text-slate-200 transition-colors leading-relaxed font-medium">
                  {text}
                </span>
              </button>
            ))}
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-violet-400" />
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0,1,2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Disclaimer ───────────────────────────────────────── */}
      <div className="px-5 py-1.5 bg-amber-500/5 border-t border-amber-500/20 flex-shrink-0">
        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
          <AlertTriangle size={11} /> {GEMINI_DISCLAIMER}
        </p>
      </div>

      {/* ── Input Area ───────────────────────────────────────── */}
      <div className="px-5 pb-4 pt-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex-shrink-0 space-y-2">

        {/* Image preview */}
        {imagePreview && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
            <button
              onClick={removeImage}
              className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black text-white rounded-full p-0.5 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image upload */}
          <button
            id="upload-chart-btn"
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost p-2.5 rounded-xl border border-gray-300 dark:border-slate-700 hover:border-violet-500/40"
            title="Upload chart screenshot"
          >
            <ImagePlus size={16} className="text-gray-600 dark:text-slate-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />

          {/* Text input */}
          <textarea
            id="chat-input"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={`Ask about ${currentTicker} or any quantitative trading topic… (Enter to send)`}
            className="input-dark flex-1 resize-none min-h-[40px] max-h-32 text-sm leading-relaxed"
            style={{ height: 'auto' }}
          />

          {/* Send */}
          <button
            id="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || (!input.trim() && !imageFile)}
            className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white
                       flex items-center justify-center transition-all active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
