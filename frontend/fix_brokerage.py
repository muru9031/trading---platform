import codecs
import re

with codecs.open('src/pages/PortfolioPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add totalBrokerage metric computation
target_metrics = """  const { totalPnl, winRate, profitFactor, maxDrawdown, totalActiveDays } = useMemo(() => {"""
replacement_metrics = """  const { totalPnl, winRate, profitFactor, maxDrawdown, totalActiveDays, totalBrokerage } = useMemo(() => {
    let tBrokerage = 0"""

if target_metrics in content:
    content = content.replace(target_metrics, replacement_metrics)

# 2. Add brokerage to dayPnl and totalBrokerage
# Find the first calculation block inside useMemo
content = content.replace("""        filtered.forEach(t => {
          let pnl = t.directPnl !== undefined && t.directPnl !== null ? parseFloat(t.directPnl) : ((t.exit || 0) - (t.entry || 0))""", """        filtered.forEach(t => {
          let pnl = t.directPnl !== undefined && t.directPnl !== null ? parseFloat(t.directPnl) : ((t.exit || 0) - (t.entry || 0))
          let brok = parseFloat(t.brokeragePaid) || 0
          pnl -= brok
          tBrokerage += brok""")

# 3. Add to the second calculation block
content = content.replace("""        filtered.forEach(t => {
        let pnl = t.directPnl !== undefined && t.directPnl !== null ? parseFloat(t.directPnl) : ((t.exit || 0) - (t.entry || 0))""", """        filtered.forEach(t => {
        let pnl = t.directPnl !== undefined && t.directPnl !== null ? parseFloat(t.directPnl) : ((t.exit || 0) - (t.entry || 0))
        let brok = parseFloat(t.brokeragePaid) || 0
        pnl -= brok""")

# 4. Add to the third calculation block
content = content.replace("""                filtered.forEach(t => {
                  let p = t.directPnl !== undefined && t.directPnl !== null ? parseFloat(t.directPnl) : ((t.exit || 0) - (t.entry || 0))""", """                filtered.forEach(t => {
                  let p = t.directPnl !== undefined && t.directPnl !== null ? parseFloat(t.directPnl) : ((t.exit || 0) - (t.entry || 0))
                  let brok = parseFloat(t.brokeragePaid) || 0
                  p -= brok""")

# 5. Return totalBrokerage from useMemo
content = content.replace("""    return { totalPnl, winRate, profitFactor, maxDrawdown, totalActiveDays }
  }, [journalEntries, category, isAllTab, allTabCurrency, liveUsdInr])""", """    return { totalPnl, winRate, profitFactor, maxDrawdown, totalActiveDays, totalBrokerage: tBrokerage }
  }, [journalEntries, category, isAllTab, allTabCurrency, liveUsdInr])""")

# 6. Add Brokerage Paid card to PortfolioPage metrics!
target_card = """          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Wallet size={13} className="text-emerald-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Capital Balance</span></div>"""

replacement_card = """          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Wallet size={13} className="text-emerald-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Capital Balance</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {sym}{capitalBalance.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Activity size={13} className="text-amber-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Brokerage Paid</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {sym}{totalBrokerage.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>"""

# Remove the original capital balance block from content to prevent duplication, by replacing a larger chunk.
target_full_card = """          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Wallet size={13} className="text-emerald-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Capital Balance</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {sym}{capitalBalance.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>"""

content = content.replace(target_full_card, replacement_card)

with codecs.open('src/pages/PortfolioPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Brokerage added to PortfolioPage.")
