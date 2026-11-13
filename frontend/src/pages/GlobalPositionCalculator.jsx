import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, DollarSign, Percent, TrendingUp, TrendingDown, Target, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';

export default function GlobalPositionCalculator({ navState }) {
  const { capitalINR, capitalUSD } = usePortfolio();
  
  const [assetClass, setAssetClass] = useState('Stocks');
  const [tradeType, setTradeType] = useState('Buy'); // Buy or Sell
  const [balance, setBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1');
  
  // Forex Specifics
  const [forexPair, setForexPair] = useState('EUR/USD');
  
  const [entryPrice, setEntryPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');

  // Results
  const [riskAmount, setRiskAmount] = useState(0);
  const [positionSize, setPositionSize] = useState(0);
  const [forexLots, setForexLots] = useState({ standard: 0, mini: 0, micro: 0 });

  const forexPairsList = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'GBP/JPY', 'EUR/JPY'];
  const [showSyncDropdown, setShowSyncDropdown] = useState(false);

  useEffect(() => {
    if (navState?.market) {
      const market = navState.market.toLowerCase();
      if (market === 'forex') setAssetClass('Forex');
      else if (market === 'crypto') setAssetClass('Crypto');
      else setAssetClass('Stocks');
    }
  }, [navState]);

  useEffect(() => {
    const bal = parseFloat(balance) || 0;
    const riskPct = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(slPrice) || 0;

    const riskAmt = bal * (riskPct / 100);
    setRiskAmount(riskAmt);

    // Use absolute value to safely handle shorting (SL > Entry)
    const priceDiff = Math.abs(entry - sl);
    
    if (priceDiff > 0) {
      if (assetClass === 'Forex') {
        // Simple Pip Value Heuristic: JPY pairs use 0.01 pip size, others 0.0001
        const isJpyPair = forexPair.includes('JPY');
        const pipSize = isJpyPair ? 0.01 : 0.0001;
        
        const pipsAtRisk = priceDiff / pipSize;
        
        // Approximate point value assuming standard account (1 pip = $10 for standard lot of 100k, usually for USD quote currencies). 
        // For exact math, we'd need exchange rates, but this is a standard approximation for calculators.
        // Risk Amount = (Pips) * (Pip Value per lot) * (Lots)
        // Lots = Risk Amount / (Pips * 10)
        
        // Let's use standard formula: 1 Standard Lot = $10/pip (approximation)
        const standardLots = riskAmt / (pipsAtRisk * 10);
        
        setForexLots({
          standard: standardLots.toFixed(4),
          mini: (standardLots * 10).toFixed(4),
          micro: (standardLots * 100).toFixed(4)
        });
      } else {
        // Stocks and Crypto
        const qty = riskAmt / priceDiff;
        setPositionSize(qty.toFixed(assetClass === 'Crypto' ? 6 : 2));
      }
    } else {
      setPositionSize(0);
      setForexLots({ standard: 0, mini: 0, micro: 0 });
    }
  }, [assetClass, balance, riskPercent, entryPrice, slPrice, forexPair]);

  const assetClasses = ['Stocks', 'Forex', 'Crypto'];
  const showWarning = parseFloat(riskPercent) > 2;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-[#0b0e14] p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-2 mb-10">
          <div className="p-3 bg-teal-500/20 text-teal-500 rounded-full mb-2 mt-4">
            <Calculator size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Position Sizing Calculator</h1>
          <p className="text-gray-500 dark:text-slate-400 max-w-lg text-sm">
            Manage your risk accurately across different asset classes. Select your market and input your setup to calculate the perfect position size.
          </p>
        </div>

        {/* Asset Class Selector */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {assetClasses.map((cls) => (
            <motion.button
              key={cls}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setAssetClass(cls);
                setEntryPrice('');
                setSlPrice('');
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2
                ${assetClass === cls 
                  ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.1)]' 
                  : 'border-transparent bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
            >
              <span className="font-bold">{cls}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              {showWarning && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold py-1.5 px-4 flex items-center gap-2 justify-center"
                >
                  <AlertTriangle size={14} />
                  ⚠️ Risking more than 2% per trade is not recommended for account survival.
                </motion.div>
              )}
              
              <h2 className={`text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 ${showWarning ? 'mt-6 mb-6' : 'mb-6'}`}>
                <Target size={18} className="text-teal-500" />
                Account Setup
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Account Balance</label>
                    <div className="relative">
                      {assetClass === 'Stocks' ? (
                        <button onClick={() => setShowSyncDropdown(!showSyncDropdown)} className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-500/10 px-2 py-1 rounded transition-colors">
                          <RefreshCw size={10} /> Sync <ChevronDown size={10} />
                        </button>
                      ) : (
                        <button onClick={() => setBalance(capitalUSD)} className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-500/10 px-2 py-1 rounded transition-colors">
                          <RefreshCw size={10} /> Sync
                        </button>
                      )}
                      
                      {showSyncDropdown && assetClass === 'Stocks' && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-xl py-1 z-20 w-32">
                          <button onClick={() => { setBalance(capitalUSD); setShowSyncDropdown(false); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700">Sync US ($)</button>
                          <button onClick={() => { setBalance(capitalINR); setShowSyncDropdown(false); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700">Sync Indian (₹)</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative group">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    <input 
                      type="number" 
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-lg pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-mono"
                      placeholder="10000"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Risk %</label>
                  <div className="relative group">
                    <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    <input 
                      type="number"
                      step="0.1" 
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      className={`w-full bg-gray-50 dark:bg-slate-950 border text-gray-900 dark:text-white rounded-lg pl-9 pr-4 py-2.5 outline-none focus:ring-2 transition-all font-mono ${
                        showWarning ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-gray-200 dark:border-slate-800 focus:ring-teal-500/50 focus:border-teal-500'
                      }`}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={assetClass}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-teal-500" />
                    Trade Setup ({assetClass})
                  </h2>

                  {/* Buy / Sell Toggle */}
                  <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => setTradeType('Buy')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        tradeType === 'Buy' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => setTradeType('Sell')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        tradeType === 'Sell' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                </div>

                {assetClass === 'Forex' && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Currency Pair</label>
                    <select
                      value={forexPair}
                      onChange={(e) => setForexPair(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-mono appearance-none"
                    >
                      {forexPairsList.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Entry Price
                    </label>
                    <input 
                      type="number" 
                      step="any"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                      placeholder="e.g. 150.25"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Stop Loss Price
                    </label>
                    <input 
                      type="number"
                      step="any" 
                      value={slPrice}
                      onChange={(e) => setSlPrice(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono"
                      placeholder="e.g. 145.00"
                    />
                  </div>
                </div>

                {entryPrice && slPrice && (
                  (tradeType === 'Buy' && parseFloat(slPrice) > parseFloat(entryPrice)) ||
                  (tradeType === 'Sell' && parseFloat(slPrice) < parseFloat(entryPrice))
                ) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-[11px] text-amber-500 font-medium italic flex items-center gap-1"
                  >
                    ⚠️ Check your Stop Loss! You are trying to {tradeType.toLowerCase()} but the SL is incorrectly placed.
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 dark:from-teal-500/5 dark:to-blue-500/5 backdrop-blur-xl border border-teal-500/20 dark:border-teal-500/10 rounded-2xl p-6 h-full shadow-lg relative overflow-hidden">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Position Summary</h2>

              <div className="space-y-6 relative z-10">
                <AnimatePresence mode="wait">
                  {assetClass === 'Forex' ? (
                    <motion.div 
                      key="forex"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-3"
                    >
                      <div className="p-4 bg-teal-500 dark:bg-teal-600 rounded-xl shadow-lg shadow-teal-500/20 text-white mb-2">
                        <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-1">Recommended Lot Size (Standard)</p>
                        <p className="text-4xl font-black font-mono truncate">{forexLots.standard}</p>
                        <p className="text-xs text-teal-100 mt-1 font-medium">1.0 = 100,000 units</p>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800">
                        <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">Mini (0.1)</span>
                        <span className="text-lg font-bold font-mono text-teal-500">{forexLots.mini}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800">
                        <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">Micro (0.01)</span>
                        <span className="text-lg font-bold font-mono text-teal-400">{forexLots.micro}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="stocks"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="p-4 bg-teal-500 dark:bg-teal-600 rounded-xl shadow-lg shadow-teal-500/20 text-white">
                        <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-1">Recommended Quantity</p>
                        <p className="text-4xl font-black font-mono truncate">{positionSize}</p>
                        <p className="text-xs text-teal-100 mt-2 font-medium">{assetClass === 'Crypto' ? 'Coins / Tokens' : 'Shares'}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm mt-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Risk Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono flex items-center gap-2">
                    ${riskAmount.toFixed(2)}
                    {showWarning && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-sans animate-pulse">HIGH RISK</span>}
                  </p>
                </div>
                
                {entryPrice && slPrice && Math.abs(entryPrice - slPrice) === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium mt-4"
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    Entry and Stop Loss cannot be the same value.
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
