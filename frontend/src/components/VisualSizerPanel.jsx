import React from 'react';
import { ArrowRight, Calculator, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';

export default function VisualSizerPanel({ 
  activeTicker, 
  onClose, 
  posCalcInput, 
  setPosCalcInput,
  posCalcLines,
  isForex,
  isCrypto
}) {
  const { capitalINR, capitalUSD } = usePortfolio();
  const { balance, risk } = posCalcInput;
  const { entryPrice, slPrice, tpPrice } = posCalcLines;

  const riskAmt = balance * (risk / 100);
  const diff = Math.abs(entryPrice - slPrice);
  let qty = 0;
  
  if (diff > 0) {
    if (isForex) {
      const units = riskAmt / diff;
      qty = (units / 100000).toFixed(4) + ' Lots';
    } else if (isCrypto) {
      qty = (riskAmt / diff).toFixed(6) + ' Coins';
    } else {
      qty = Math.floor(riskAmt / diff) + ' Shares';
    }
  }

  const handleSyncBalance = () => {
    const isIndian = activeTicker?.endsWith('.NS') || activeTicker?.endsWith('.BO') || activeTicker?.endsWith('.MC');
    const newBalance = isIndian ? capitalINR : capitalUSD;
    setPosCalcInput(prev => ({ ...prev, balance: newBalance }));
  };

  const showWarning = parseFloat(risk) > 2;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl overflow-y-auto w-72 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200 flex items-center gap-2">
          <Calculator size={16} className="text-teal-500" />
          Position Calculator
        </h3>
        <button onClick={onClose} className="p-1 text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:text-slate-200 transition-colors">
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {showWarning && (
          <div className="text-[10px] text-red-500 bg-red-500/10 px-3 py-2 rounded border border-red-500/20 text-center font-bold flex items-center justify-center gap-1">
            <AlertTriangle size={12} />
            Risk exceeds recommended 2%
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Balance ({activeTicker?.endsWith('.NS') || activeTicker?.endsWith('.BO') || activeTicker?.endsWith('.MC') ? '₹' : '$'})</label>
              <button onClick={handleSyncBalance} title="Sync with Portfolio" className="flex items-center gap-1 text-[9px] font-bold text-blue-500 hover:text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors">
                <RefreshCw size={10} /> Sync
              </button>
            </div>
            <input 
              type="number"
              value={balance}
              onChange={(e) => setPosCalcInput(prev => ({ ...prev, balance: e.target.value }))}
              className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded px-2 py-2 text-xs font-mono font-semibold text-gray-900 dark:text-white outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Risk (%)</label>
            <input 
              type="number"
              step="0.1"
              value={risk}
              onChange={(e) => setPosCalcInput(prev => ({ ...prev, risk: e.target.value }))}
              className={`w-full bg-white dark:bg-slate-950 border rounded px-2 py-2 text-xs font-mono font-semibold text-gray-900 dark:text-white outline-none transition-colors ${
                showWarning ? 'border-red-500 focus:border-red-500 text-red-500' : 'border-gray-200 dark:border-slate-800 focus:border-teal-500'
              }`}
            />
          </div>
        </div>

        {/* Outputs via Vanilla DOM for 0-lag updates */}
        <div className="space-y-3 bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700/50">
          <div className="flex justify-between text-xs font-mono items-center">
            <span className="text-blue-500 font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/> Entry</span>
            <span id="pos-calc-entry" className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded">
              {entryPrice ? entryPrice.toFixed(4) : '0.0000'}
            </span>
          </div>
          <div className="flex justify-between text-xs font-mono items-center">
            <span className="text-red-500 font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/> Stop Loss</span>
            <span id="pos-calc-sl" className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded">
              {slPrice ? slPrice.toFixed(4) : '0.0000'}
            </span>
          </div>
        </div>

        {/* 
          IMPORTANT:
          The visual dominance of the output is achieved here by prioritizing the Quantity.
        */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
          <div className="bg-teal-500 dark:bg-teal-600 rounded-xl p-4 shadow-lg shadow-teal-500/20 text-white text-center">
            <span className="block text-[10px] font-bold text-teal-100 uppercase tracking-wider mb-1">
              {isForex ? 'Lot Size' : isCrypto ? 'Position Size' : 'Quantity'}
            </span>
            <span id="pos-calc-qty" className="block text-2xl font-mono font-black truncate">
              {qty}
            </span>
          </div>

          <div className="flex justify-between items-center bg-gray-100 dark:bg-slate-800/80 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Risk Amount</span>
            <span id="pos-calc-risk-amt" className="text-sm font-mono font-bold text-gray-900 dark:text-white">
              ${riskAmt.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="text-center mt-2">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 tracking-widest uppercase">
            DRAG LINES ON CHART
          </span>
        </div>
      </div>
    </div>
  );
}
