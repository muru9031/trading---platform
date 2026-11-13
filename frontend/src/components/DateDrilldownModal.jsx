import React, { useMemo } from 'react';
import { X, Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import AssetLogo from './AssetLogo.jsx';

export default function DateDrilldownModal({ dateStr, trades, onClose }) {
  // Compute analytics per asset for this date
  const { assetList, totalPnl } = useMemo(() => {
    let dayPnl = 0;
    const byAsset = {};

    trades.forEach(t => {
      // Filter trades to strictly match the dateStr (which is derived from toLocaleDateString)
      const tDate = new Date(t.timestamp).toLocaleDateString();
      if (tDate !== dateStr) return;

      dayPnl += t.pnl;
      
      if (!byAsset[t.asset]) {
        byAsset[t.asset] = { asset: t.asset, pnl: 0, count: 0, wins: 0 };
      }
      byAsset[t.asset].pnl += t.pnl;
      byAsset[t.asset].count++;
      if (t.pnl >= 0) byAsset[t.asset].wins++;
    });

    const assetList = Object.values(byAsset).sort((a, b) => b.pnl - a.pnl);
    
    return { assetList, totalPnl: dayPnl };
  }, [trades, dateStr]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#131722] border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-200 leading-tight">{dateStr}</h2>
              <div className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Day Performance Breakdown</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Total Day P&L */}
        <div className="bg-gray-50/50 dark:bg-slate-900/20 px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Net P&L for {dateStr}</span>
          <span className={`text-xl font-bold font-mono ${totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString()}
          </span>
        </div>

        {/* Assets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {assetList.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-10">No specific asset data found for this date.</div>
          ) : (
            assetList.map((item, idx) => {
              const isWin = item.pnl >= 0;
              return (
                <div key={item.asset} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-gray-300 dark:hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold text-gray-400 dark:text-slate-600 w-4 text-center">#{idx + 1}</div>
                    <AssetLogo symbol={item.asset} className="w-8 h-8 rounded shadow-sm" />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-slate-200 text-sm">{item.asset}</div>
                      <div className="text-[10px] text-gray-500 dark:text-slate-500">
                        {item.count} Trades ({item.wins}W / {item.count - item.wins}L)
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold font-mono px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 ${isWin ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {isWin ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isWin ? '+' : ''}{item.pnl.toLocaleString()}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}
