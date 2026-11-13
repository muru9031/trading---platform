import os
import re

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\LogTradesModal.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Props to include category
content = content.replace(
    "portfolioType\n}) {",
    "portfolioType,\n  category = 'All'\n}) {"
)

# 2. Add BROKER_MAP and currentBrokers
broker_map_code = """
  const BROKER_MAP = {
    'Indian Market': ['Zerodha', 'Upstox', 'Groww', 'Angel One', 'Dhan', 'Fyers'],
    'US Market': ['Interactive Brokers', 'TD Ameritrade', 'Charles Schwab', 'Robinhood', 'Webull'],
    'Crypto': ['Binance', 'Coinbase', 'Kraken', 'KuCoin', 'Bybit'],
    'Forex': ['MetaTrader 4', 'MetaTrader 5', 'OANDA', 'Forex.com'],
    'Commodity': ['Zerodha', 'Upstox', 'Interactive Brokers']
  };
  const currentBrokers = BROKER_MAP[category] || [
    'Zerodha', 'Upstox', 'Groww', 'Angel One', 'Dhan', 'Fyers',
    'Interactive Brokers', 'TD Ameritrade', 'Charles Schwab', 'Robinhood', 'Webull',
    'Binance', 'Coinbase', 'Kraken'
  ];
"""
content = content.replace(
    "const [trades, setTrades] = useState([]);",
    f"const [trades, setTrades] = useState([]);\n{broker_map_code}"
)

# 3. Update getEmptyTrade
new_get_empty = """
  const getEmptyTrade = () => ({
    id: `temp_${Date.now()}_${Math.random()}`,
    asset: '',
    time: '',
    qty: '',
    entryPrice: '',
    exitPrice: '',
    pnlType: 'Profit',
    pnlAmount: '',
    brokerage: '',
    mistakeTag: 'None (Good Trade)',
    strategyNotes: '',
    screenshot_url: '',
    source: 'Manual (No Broker)',
    broker_id: null,
    side: 'Buy'
  });
"""
content = re.sub(r'const getEmptyTrade = \(\) => \(\{\s*id:.*?side: \'Buy\' \/\/ \'Buy\' or \'Sell\'\s*\}\);', new_get_empty.strip(), content, flags=re.DOTALL)

# 4. Update the Broker dropdown
content = content.replace(
    "<select \n                      value={trade.source || 'manual'} \n                      onChange={(e) => handleTradeChange(idx, 'source', e.target.value)}",
    "<select \n                      value={trade.source || 'Manual (No Broker)'} \n                      onChange={(e) => handleTradeChange(idx, 'source', e.target.value)}"
)
content = content.replace(
    '<option value="manual">Manual (No Broker)</option>',
    '<option value="Manual (No Broker)">Manual (No Broker)</option>'
)
content = content.replace(
    "{BROKERS.map(b => <option key={b} value={b}>{b}</option>)}",
    "{currentBrokers.map(b => <option key={b} value={b}>{b}</option>)}"
)

# 5. Make sure the manual default is properly validated in handleSave
content = content.replace(
    "if (!t.source || t.source.trim() === '') {",
    "if (!t.source || t.source.trim() === '' || t.source === 'manual') {" # Just in case
)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched LogTradesModal.jsx successfully")
