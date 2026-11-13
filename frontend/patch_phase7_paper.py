import re

path = 'src/pages/PaperPortfolio.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add activeOrders and limitOrders
target = "const closedOrders = useMemo(() => marketOrders.filter(o => o.status === 'CLOSED'), [marketOrders])"
repl = """const closedOrders = useMemo(() => marketOrders.filter(o => o.status === 'CLOSED'), [marketOrders])
  const activeOrders = useMemo(() => openOrders.filter(o => o.execType !== 'LIMIT'), [openOrders])
  const limitOrders  = useMemo(() => openOrders.filter(o => o.execType === 'LIMIT'), [openOrders])"""
content = content.replace(target, repl)

# 2. Add 'limit' tab to the array
tab_target = "{[['book','Positions'],['history','History'],['calendar','Calendar']].map(([id,label])=>("
tab_repl = "{[['book','Positions'],['limit','Limit Orders'],['history','History'],['calendar','Calendar']].map(([id,label])=>("
content = content.replace(tab_target, tab_repl)

# Update tab labels to reflect correct counts
label_target = "{label} {id==='book'&&`(${openOrders.length})`}{id==='history'&&`(${closedOrders.length})`}"
label_repl = "{label} {id==='book'&&`(${activeOrders.length})`}{id==='limit'&&`(${limitOrders.length})`}{id==='history'&&`(${closedOrders.length})`}"
content = content.replace(label_target, label_repl)

# 3. Use activeOrders instead of openOrders for the 'book' table
table_target = "{openOrders.length===0 ? ("
table_repl = "{activeOrders.length===0 ? ("
content = content.replace(table_target, table_repl)

map_target = ") : openOrders.map(o=>{"
map_repl = ") : activeOrders.map(o=>{"
content = content.replace(map_target, map_repl)

# 4. Inject 'limit' tab table below 'history' or 'book'
limit_tab_block = """        {/* 📋 LIMIT ORDERS TAB */}
        {paperTab === 'limit' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-slate-400">Time</th>
                  <th className="py-3 px-4 text-left font-medium text-slate-400">Asset</th>
                  <th className="py-3 px-4 text-left font-medium text-slate-400">Type</th>
                  <th className="py-3 px-4 text-right font-medium text-slate-400">Qty</th>
                  <th className="py-3 px-4 text-right font-medium text-slate-400">Limit Price</th>
                  <th className="py-3 px-4 text-right font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {limitOrders.length === 0 ? (
                  <tr><td colSpan="6" className="py-10 text-center text-slate-500">No pending limit orders.</td></tr>
                ) : limitOrders.map(o => {
                  const osym = getOrderSym(o.ticker)
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">{new Date(o.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">{o.ticker}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                          {o.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-slate-300">{o.qty}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-slate-300">
                        {osym}{o.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button onClick={() => { if (window.confirm('Cancel this limit order?')) closeOrder(o.id, o.entryPrice) }}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}"""

insert_after = "        {paperTab === 'history' && ("
content = content.replace(insert_after, limit_tab_block + "\n\n" + insert_after)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
