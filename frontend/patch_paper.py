import codecs
import re

with codecs.open('src/pages/PaperPortfolio.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Brokerage in useMemo
target_memo = """  const { totalPnl, winRate, profitFactor, maxDrawdown, totalActiveDays } = useMemo(() => {"""
replacement_memo = """  const { totalPnl, winRate, profitFactor, maxDrawdown, totalActiveDays, totalBrokerage } = useMemo(() => {
    let tBrokerage = 0"""

if target_memo in content:
    content = content.replace(target_memo, replacement_memo)

# 2. Add to totalBrokerage in the loop
target_loop = """        if (o.pnl !== undefined) {
          pnlSum += parseFloat(o.pnl)
          if (o.pnl > 0) wins++"""

replacement_loop = """        if (o.pnl !== undefined) {
          pnlSum += parseFloat(o.pnl)
          tBrokerage += parseFloat(o.brokerage || 0)
          if (o.pnl > 0) wins++"""

if target_loop in content:
    content = content.replace(target_loop, replacement_loop)

# 3. Add to return of useMemo
target_ret = """    return { totalPnl: pnlSum, winRate, profitFactor, maxDrawdown: maxDD, totalActiveDays: activeDays }
  }, [paperOrders, category, isAllTab, allTabCurrency, liveUsdInr])"""

replacement_ret = """    return { totalPnl: pnlSum, winRate, profitFactor, maxDrawdown: maxDD, totalActiveDays: activeDays, totalBrokerage: tBrokerage }
  }, [paperOrders, category, isAllTab, allTabCurrency, liveUsdInr])"""

if target_ret in content:
    content = content.replace(target_ret, replacement_ret)

# 4. Add the Card
target_cards = """        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Wallet size={13} className="text-emerald-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Paper Capital</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {sym}{paperCapital.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>"""

replacement_cards = """        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Wallet size={13} className="text-emerald-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Paper Capital</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {sym}{paperCapital.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><Activity size={13} className="text-amber-400"/><span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">Brokerage Paid</span></div>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {sym}{(totalBrokerage || 0).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
            </div>
          </div>"""

if target_cards in content:
    content = content.replace(target_cards, replacement_cards)


# 5. Move DetailedAnalysis
content = content.replace("<DetailedAnalysis trades={closedOrders} />", "")

# Insert it at the end of the calendar div
target_calendar_end = """                  )
                })}
              </div>
            </div>
          )}"""

replacement_calendar_end = """                  )
                })}
              </div>
            </div>
            <DetailedAnalysis trades={closedOrders} />
          </>
          )}"""

if target_calendar_end in content:
    content = content.replace(target_calendar_end, replacement_calendar_end)
    # also we need to wrap the contents of the calendar tab in a fragment so they sit together
    content = content.replace("{paperTab === 'calendar' && (\\n            <div className=\\"card p-5\\">", "{paperTab === 'calendar' && (\\n          <>\\n            <div className=\\"card p-5\\">")
    content = content.replace("{paperTab === 'calendar' && (\n            <div className=\"card p-5\">", "{paperTab === 'calendar' && (\n          <>\n            <div className=\"card p-5\">")

with codecs.open('src/pages/PaperPortfolio.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("PaperPortfolio patched.")
