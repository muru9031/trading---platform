import React, { useState, useMemo } from 'react';

export default function TradeHistoryTable({ trades, sym }) {
  const [dateFilter, setDateFilter] = useState('');
  const [brokerFilter, setBrokerFilter] = useState('');

  // Extract unique brokers
  const brokers = useMemo(() => {
    const bSet = new Set();
    trades.forEach(t => {
      if (t.source) bSet.add(t.source);
    });
    return Array.from(bSet).sort();
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (dateFilter && !t.timestamp.startsWith(dateFilter)) return false;
      if (brokerFilter && t.source !== brokerFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [trades, dateFilter, brokerFilter]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-200">Trade History</h2>
        
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-slate-200 [color-scheme:dark]"
          />
          <select 
            value={brokerFilter}
            onChange={e => setBrokerFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-slate-200"
          >
            <option value="">All Brokers</option>
            <option value="manual">Manual Entry</option>
            {brokers.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Asset</th>
              <th className="py-3 px-4">Broker</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Net P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-sm text-gray-500">No trades found matching criteria.</td>
              </tr>
            ) : (
              filteredTrades.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors text-sm">
                  <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-slate-400">
                    {new Date(t.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-slate-200">{t.asset}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 uppercase">
                      {t.source || 'Manual'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.pnl >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {t.pnl >= 0 ? 'Profit' : 'Loss'}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-bold font-mono ${t.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {t.pnl >= 0 ? '+' : ''}{sym}{Math.abs(t.pnl).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
