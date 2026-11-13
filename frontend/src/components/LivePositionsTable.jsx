import { useMemo } from 'react';

export default function LivePositionsTable({ positions = [] }) {
  const totalFloatingPnl = useMemo(() => {
    return positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  }, [positions]);

  return (
    <div className="card p-6 min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
            Live Open Positions
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
            Auto-synced from connected brokers
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-sm border ${totalFloatingPnl >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          Total Floating: {totalFloatingPnl >= 0 ? '+' : ''}{totalFloatingPnl.toFixed(2)}
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-500">
          <p className="text-sm">No active positions synced.</p>
          <p className="text-xs mt-1">Connect your broker and click Sync.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="pb-3 font-semibold">Broker</th>
                <th className="pb-3 font-semibold">Symbol</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold text-right">Lot/Qty</th>
                <th className="pb-3 font-semibold text-right">Avg Entry</th>
                <th className="pb-3 font-semibold text-right">Live Price</th>
                <th className="pb-3 font-semibold text-right">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {positions.map(pos => (
                <tr key={pos.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-bold">
                      {pos.broker}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-gray-900 dark:text-slate-200">{pos.asset}</td>
                  <td className="py-3">
                    <span className={`font-bold ${pos.type === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {pos.type}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-600 dark:text-slate-400">{pos.qty}</td>
                  <td className="py-3 text-right text-gray-600 dark:text-slate-400">{pos.entryPrice}</td>
                  <td className="py-3 text-right font-semibold text-gray-900 dark:text-slate-200">{pos.livePrice}</td>
                  <td className={`py-3 text-right font-bold ${pos.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
