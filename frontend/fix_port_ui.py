import codecs
import re

with codecs.open('src/pages/PortfolioPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<div className="grid grid-cols-2 gap-4">.*?placeholder="e.g. 5200" \s*/>\s*</div>\s*</div>\s*</div>', re.DOTALL)

replacement = """<div className="mb-3">
                    <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Asset / Company <span className="text-red-400">*</span></label>
                    <input type="text" value={trade.asset || ''} onChange={e => handleTradeChange(trade.id, 'asset', e.target.value)} className="input-dark w-full text-xs py-1.5" placeholder="e.g. AAPL, TATAPOWER.NS" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">
                        Entry Price ({isAllTab ? (trade.market==='US Market'?'$':'?') : sym})
                      </label>
                      <input type="number" value={trade.entry || ''} onChange={e => handleTradeChange(trade.id, 'entry', e.target.value)} className="input-dark w-full text-xs py-1.5" placeholder="e.g. 5000" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">
                        Exit Price ({isAllTab ? (trade.market==='US Market'?'$':'?') : sym})
                      </label>
                      <input type="number" value={trade.exit || ''} onChange={e => handleTradeChange(trade.id, 'exit', e.target.value)} className="input-dark w-full text-xs py-1.5" placeholder="e.g. 5200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs text-emerald-600 dark:text-emerald-400 mb-1">Direct P&L (Overrides Math)</label>
                      <input type="number" value={trade.directPnl !== null && trade.directPnl !== undefined ? trade.directPnl : ''} onChange={e => handleTradeChange(trade.id, 'directPnl', e.target.value)} className="input-dark w-full text-xs py-1.5 text-emerald-600 border-emerald-500/30" placeholder="e.g. 500 or -200" />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-600 dark:text-amber-400 mb-1">Brokerage Paid</label>
                      <input type="number" value={trade.brokeragePaid || ''} onChange={e => handleTradeChange(trade.id, 'brokeragePaid', e.target.value)} className="input-dark w-full text-xs py-1.5 text-amber-600 border-amber-500/30" placeholder="e.g. 20" />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-[10px] text-gray-600 dark:text-slate-400 mb-1">Screenshot / Image URL (Opt.)</label>
                    <input type="text" value={trade.screenshot || ''} onChange={e => handleTradeChange(trade.id, 'screenshot', e.target.value)} className="input-dark w-full text-[10px] py-1.5" placeholder="https://..." />
                  </div>
                </div>"""

# we only want to replace the SECOND occurrence of grid-cols-2 because the first is the metrics card grid.
# actually, re.sub with count=0 will replace all, but there is no placeholder="e.g. 5200" in the metrics cards.
new_content = re.sub(pattern, replacement, content)

with codecs.open('src/pages/PortfolioPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Regex replace completed.")
