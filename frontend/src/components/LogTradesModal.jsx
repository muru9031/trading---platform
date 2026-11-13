import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext.jsx';
import AssetSearchSelect from './shared/AssetSearchSelect.jsx';

const BROKERS = [
  'Zerodha', 'Upstox', 'Groww', 'Angel One', 'Dhan', 'Fyers',
  'Interactive Brokers', 'TD Ameritrade', 'Charles Schwab', 'Robinhood', 'Webull', 'Alpaca',
  'Binance', 'Coinbase', 'Kraken'
];

export default function LogTradesModal({
  isOpen,
  onClose,
  selectedDateStr,
  dayTrades,
  onSave,
  portfolioType,
  category = 'All'
}) {
  const { connectedBrokers } = usePortfolio();
  
  // Any broker connected?
  const isBrokerConnected = Object.values(connectedBrokers).some(b => b.connected);

  const [trades, setTrades] = useState([]);
  const [modalDate, setModalDate] = useState(selectedDateStr || '');

  useEffect(() => {
    setModalDate(selectedDateStr || '');
  }, [selectedDateStr]);

  const BROKER_MAP = {
    'Indian Market': ['Zerodha', 'Upstox', 'Groww', 'Angel One', 'Dhan', 'Fyers'],
    'US Market': ['Interactive Brokers', 'TD Ameritrade', 'Charles Schwab', 'Robinhood', 'Webull'],
    'Crypto': ['Binance', 'Coinbase', 'Kraken', 'KuCoin', 'Bybit'],
    'Forex': ['MetaTrader 4', 'MetaTrader 5', 'OANDA', 'Forex.com'],
    'Commodity': ['Zerodha', 'Upstox', 'Interactive Brokers']
  };
  const currentBrokers = BROKER_MAP[category] || [
    'Zerodha', 'Upstox', 'Groww', 'Angel One', 'Dhan', 'Fyers',
    'Interactive Brokers', 'TD Ameritrade', 'Charles Schwab', 'Robinhood', 'Webull',
    'Binance', 'Coinbase', 'Kraken'
  ];

  
  useEffect(() => {
    if (isOpen) {
      if (dayTrades && dayTrades.length > 0) {
        const safeTrades = JSON.parse(JSON.stringify(dayTrades)).map(t => ({
          ...t,
          side: t.side || 'Buy',
          pnlType: t.pnlType || 'Profit',
          source: t.source || ''
        }));
        setTrades(safeTrades);
      } else {
        setTrades([getEmptyTrade()]);
      }
    }
  }, [isOpen, dayTrades]);

  const getEmptyTrade = () => ({
    id: `temp_${Date.now()}_${Math.random()}`,
    asset: '',
    time: '',
    qty: '',
    entryPrice: '',
    exitPrice: '',
    pnlType: 'Profit',
    pnlAmount: '',
    brokerage: '',
    mistakeTag: 'None (Good Trade)',
    strategyNotes: '',
    screenshot_url: '',
    source: '',
    broker_id: null,
    side: 'Buy'
  });

  const handleAddTrade = () => setTrades([...trades, getEmptyTrade()]);
  
  const handleRemoveTrade = (index) => {
    if (isBrokerConnected) return; // Cannot delete if broker connected
    setTrades(trades.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    if (isBrokerConnected) return; // Cannot clear if broker connected
    if (window.confirm('Are you sure you want to delete all trades for this day?')) {
      setTrades([]);
    }
  };

  const handleTradeChange = (index, field, value) => {
    setTrades(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleScreenshotUpload = (index) => {
    // Disabled UI Mock for Cloudinary
    alert("Cloudinary Upload Integration is Coming Soon.");
  };

  const handleSave = () => {
    // Strict validation
    for (let t of trades) {
      if (!t.asset || t.asset.trim() === '') {
        alert("Asset name cannot be empty. Please select from the dropdown.");
        return;
      }
      if (!t.source || t.source.trim() === '' || t.source === 'manual') {
        alert(`Broker must be selected for ${t.asset}`);
        return;
      }
      // Auto-assign result type
      const pnlAmt = parseFloat(t.pnlAmount);
      if (t.pnlAmount === '' || isNaN(pnlAmt)) {
        alert(`Invalid P&L amount for ${t.asset}`);
        return;
      }
      
      // We assume pnlAmount could be entered as negative by user if they want, but the UI might restrict it.
      // Wait, earlier validation says "Invalid positive P&L amount", so user enters absolute value?
      // Wait, let's assume they enter absolute value for Profit/Loss or real value. 
      // Usually users enter signed value (-100 for loss) if no dropdown exists.
      // If they enter -100, we make it absolute and set Loss.
      // Let's just use the sign.
      if (pnlAmt > 0) {
        t.pnlType = 'Profit';
      } else if (pnlAmt < 0) {
        t.pnlType = 'Loss';
        t.pnlAmount = Math.abs(pnlAmt).toString(); // Ensure absolute value if schema expects positive
      } else {
        t.pnlType = 'Breakeven';
      }

      if (!t.side || t.side.trim() === '') {
        alert(`Side (Buy/Sell) must be selected for ${t.asset}`);
        return;
      }
    }
    onSave(modalDate, trades, portfolioType);
    onClose();
  };

  const isSaveDisabled = trades.some(t => 
    !t.asset || !t.source || !t.side ||
    t.pnlAmount === '' || isNaN(t.pnlAmount)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] text-slate-200 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#1e293b] rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
              Log Trades - 
              <input 
                type="date" 
                value={modalDate} 
                onChange={(e) => setModalDate(e.target.value)} 
                className="bg-[#0f172a] border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 [color-scheme:dark]"
              />
            </h2>
            {isBrokerConnected && (
              <p className="text-xs text-amber-400 mt-1">Broker connected. Trade details are Read-Only. You can only edit Notes and Screenshots.</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#0f172a] custom-scrollbar">
          {trades.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No trades for this day. Click 'Add Trade' to start.
            </div>
          ) : (
            trades.map((trade, idx) => (
              <div key={trade.id || idx} className="bg-[#1e293b] p-5 rounded-xl border border-slate-700 relative">
                
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trade #{idx + 1}</span>
                  {!isBrokerConnected && (
                    <button onClick={() => handleRemoveTrade(idx)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 relative">
                  <div className="md:col-span-2 relative">
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Asset/Company Name *</label>
                    <AssetSearchSelect 
                      value={trade.asset} 
                      onChange={(selectedSymbol) => handleTradeChange(idx, 'asset', selectedSymbol)} 
                      disabled={isBrokerConnected} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Broker</label>
                    <select 
                      value={trade.source || ''} 
                      onChange={(e) => handleTradeChange(idx, 'source', e.target.value)}
                      disabled={isBrokerConnected}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="" disabled>Select Broker</option>
                      {currentBrokers.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Time (Optional)</label>
                    <input 
                      type="time" 
                      value={trade.time || ''} 
                      onChange={(e) => handleTradeChange(idx, 'time', e.target.value)}
                      disabled={isBrokerConnected}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-slate-300 disabled:opacity-50 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Quantity (Opt)</label>
                    <input type="number" placeholder="e.g. 100" value={trade.qty || ''} onChange={e => handleTradeChange(idx, 'qty', e.target.value)} disabled={isBrokerConnected} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Entry Price (Opt)</label>
                    <input type="number" placeholder="e.g. 150.5" value={trade.entryPrice || ''} onChange={e => handleTradeChange(idx, 'entryPrice', e.target.value)} disabled={isBrokerConnected} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Exit Price (Opt)</label>
                    <input type="number" placeholder="e.g. 160.0" value={trade.exitPrice || ''} onChange={e => handleTradeChange(idx, 'exitPrice', e.target.value)} disabled={isBrokerConnected} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Brokerage Paid (Opt)</label>
                    <input type="number" placeholder="e.g. 25" value={trade.brokerage || ''} onChange={e => handleTradeChange(idx, 'brokerage', e.target.value)} disabled={isBrokerConnected} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white disabled:opacity-50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b border-slate-700 pb-4">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Side *</label>
                    <select value={trade.side || 'Buy'} onChange={e => handleTradeChange(idx, 'side', e.target.value)} disabled={isBrokerConnected} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white disabled:opacity-50 focus:border-blue-500">
                      <option value="Buy">Buy (Long)</option>
                      <option value="Sell">Sell (Short)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">P&L Amount *</label>
                    <input type="number" placeholder="0" value={trade.pnlAmount || ''} onChange={e => handleTradeChange(idx, 'pnlAmount', e.target.value)} disabled={isBrokerConnected} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono disabled:opacity-50" />
                  </div>
                </div>

                {/* Always Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Mistake/Strategy Tag (Opt)</label>
                    <select value={trade.mistakeTag || 'None (Good Trade)'} onChange={e => handleTradeChange(idx, 'mistakeTag', e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500">
                      <option value="None (Good Trade)">None (Good Trade)</option>
                      <option value="FOMO Entry">FOMO Entry</option>
                      <option value="Revenge Trading">Revenge Trading</option>
                      <option value="Overtrading">Overtrading</option>
                      <option value="Hesitation">Hesitation</option>
                      <option value="Broke Rules">Broke Rules</option>
                      <option value="Perfect Setup">Perfect Setup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Journal Notes</label>
                    <input type="text" placeholder="e.g. Strong breakout setup..." value={trade.strategyNotes || ''} onChange={e => handleTradeChange(idx, 'strategyNotes', e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button 
                    disabled 
                    onClick={() => handleScreenshotUpload(idx)} 
                    className="text-xs text-blue-400 opacity-50 flex items-center gap-1 font-semibold cursor-not-allowed"
                  >
                    <ImageIcon size={14} /> 📸 Upload Screenshot (Coming Soon)
                  </button>
                </div>

              </div>
            ))
          )}
          
          {!isBrokerConnected && (
            <div className="border border-dashed border-slate-700 rounded-xl p-4 flex justify-center hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={handleAddTrade}>
              <button className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                <PlusCircle size={16} /> Add Trade
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#1e293b] rounded-b-2xl flex justify-between items-center">
          {!isBrokerConnected && (
            <button onClick={handleClearAll} className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1">
              <Trash2 size={14} /> Clear Day
            </button>
          )}
          {isBrokerConnected && <div></div>}
          
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaveDisabled}
              className={`px-6 py-2 text-sm font-bold rounded-lg shadow-lg transition-all ${
                isSaveDisabled 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-[#14b8a6] text-[#0f172a] hover:bg-[#0d9488] shadow-teal-500/20'
              }`}
            >
              Save Day Entries
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
