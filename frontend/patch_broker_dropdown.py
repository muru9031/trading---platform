import os
import re

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\LogTradesModal.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update getEmptyTrade to default source to ''
content = content.replace("source: 'Manual (No Broker)',", "source: '',")

# 2. Update the Broker select dropdown to have a disabled default option and no 'Manual (No Broker)'
old_select = """<select 
                      value={trade.source || 'Manual (No Broker)'} 
                      onChange={(e) => handleTradeChange(idx, 'source', e.target.value)}
                      disabled={isBrokerConnected}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="Manual (No Broker)">Manual (No Broker)</option>
                      {currentBrokers.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>"""

new_select = """<select 
                      value={trade.source || ''} 
                      onChange={(e) => handleTradeChange(idx, 'source', e.target.value)}
                      disabled={isBrokerConnected}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="" disabled>Select Broker</option>
                      {currentBrokers.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>"""

content = content.replace(old_select, new_select)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched LogTradesModal.jsx broker dropdown successfully")
