import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Target, Filter } from 'lucide-react';
import AssetLogo from './AssetLogo.jsx';

export default function AssetDrilldownModal({ asset, trades, sym, isMarketView, onClose }) {
  const [sortBy, setSortBy] = useState('date_desc');

  const sortedTrades = useMemo(() => {
    let arr = [...trades];
    
    // Apply Filtering First
    if (sortBy === 'wins_only') {
      arr = arr.filter(t => t.pnl >= 0);
    } else if (sortBy === 'losses_only') {
      arr = arr.filter(t => t.pnl < 0);
    }

    // Apply Sorting
    if (sortBy === 'date_desc' || sortBy === 'wins_only' || sortBy === 'losses_only') {
      arr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'profit_desc') {
      arr.sort((a, b) => b.pnl - a.pnl);
    } else if (sortBy === 'loss_asc') {
      arr.sort((a, b) => a.pnl - b.pnl);
    }
    
    return arr;
  }, [trades, sortBy]);

  // Recalculate analytics based strictly on the filtered `sortedTrades`
  const analytics = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let totalPnl = 0;
    
    sortedTrades.forEach(t => {
      totalPnl += t.pnl;
      if (t.pnl >= 0) wins++;
      else losses++;
    });

    const winRate = sortedTrades.length > 0 ? (wins / sortedTrades.length) * 100 : 0;
    return { wins, losses, winRate, totalPnl, totalTrades: sortedTrades.length };
  }, [sortedTrades]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            {!isMarketView && <AssetLogo symbol={asset} className="w-8 h-8 rounded-lg shadow-sm" />}
            <div>
              <h3 className="text-gray-900 dark:text-slate-200 font-bold text-base leading-tight">{asset}</h3>
              <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">
                {isMarketView ? 'Market Drilldown' : 'Asset Drilldown'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
              <Filter size={14} className="text-gray-500 dark:text-slate-400" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer font-medium outline-none [&>option]:bg-white [&>optgroup]:bg-white dark:[&>option]:bg-slate-800 dark:[&>optgroup]:bg-slate-800"
              >
                <optgroup label="Sort By">
                  <option value="date_desc">Date (Newest First)</option>
                  <option value="profit_desc">Highest Profit</option>
                  <option value="loss_asc">Highest Loss</option>
                </optgroup>
                <optgroup label="Filter By">
                  <option value="wins_only">Winning Trades Only</option>
                  <option value="losses_only">Losing Trades Only</option>
                </optgroup>
              </select>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-slate-800 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 shrink-0">
          <div className="p-4 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase font-bold tracking-wider mb-1">Total P&L</span>
            <span className={`text-lg font-bold font-mono ${analytics.totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {analytics.totalPnl >= 0 ? '+' : ''}{sym}{Math.abs(analytics.totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase font-bold tracking-wider mb-1">Win Rate</span>
            <span className="text-lg font-bold font-mono text-blue-500">{analytics.winRate.toFixed(1)}%</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase font-bold tracking-wider mb-1">Total Trades</span>
            <span className="text-lg font-bold font-mono text-gray-900 dark:text-slate-200">
              {analytics.totalTrades} <span className="text-xs text-gray-500 dark:text-slate-500 font-sans">({analytics.wins}W / {analytics.losses}L)</span>
            </span>
          </div>
        </div>
        
        {/* Trades List */}
        <div className="overflow-y-auto flex-1 bg-white dark:bg-slate-900 p-4">
          {sortedTrades.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-slate-500 text-sm">No trades found.</div>
          ) : (
            <div className="space-y-2">
              {sortedTrades.map(trade => {
                const isWin = trade.pnl >= 0;
                return (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isWin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {isWin ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-gray-900 dark:text-slate-200">
                            {new Date(trade.timestamp).toLocaleString(undefined, {
                              weekday: 'short', month: 'short', day: 'numeric', 
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                          {isMarketView && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-bold border border-blue-500/20">{trade.asset}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 font-mono">
                          {trade.entry > 0 && trade.exit > 0 ? `In: ${sym}${trade.entry.toFixed(2)} | Out: ${sym}${trade.exit.toFixed(2)}` : 'Direct P&L Entry'}
                        </div>
                      </div>
                    </div>
                    <div className={`font-mono font-bold text-sm ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isWin ? '+' : ''}{sym}{trade.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
