import { useState, useEffect } from 'react'
import { usePortfolio, calcBrokerage, isINRTicker } from '../contexts/PortfolioContext.jsx'
import { TICKER_MAP } from '../utils/tickerMap.js'
import { useToast } from '../contexts/ToastContext.jsx'
import { ArrowRight, TrendingUp, TrendingDown, Info } from 'lucide-react'

let orderIdCounter = 1

export default function PaperTradeConsole({ activeTicker, livePrice, marketOpen, onClose, draftState, setDraftState }) {
  const { capitalINR, capitalUSD, addOrder, user } = usePortfolio()
  const { showToast } = useToast()

  const isINR = isINRTicker(activeTicker)
  const sym = isINR ? '₹' : '$'
  const capital = isINR ? capitalINR : capitalUSD

  const isForexOrCommodity = TICKER_MAP['Forex']?.includes(activeTicker) || TICKER_MAP['Commodity']?.includes(activeTicker)
  const qtyLabel = isForexOrCommodity ? 'Lot Size' : 'Quantity (Shares)'
  const qtyStep = isForexOrCommodity ? "0.01" : "1"
  const defaultQty = isForexOrCommodity ? 0.1 : 10

  // Use draftState if provided (controlled component), otherwise fallback to local state
  const [_orderType, _setOrderType] = useState('BUY')
  const [_execType, _setExecType]   = useState('MARKET') // MARKET, LIMIT, STOP, STOP_LIMIT
  const [_qty, _setQty]             = useState(defaultQty)
  const [_limitPrice, _setLimitPrice] = useState('')
  const [_stopPrice, _setStopPrice] = useState('') // New state for Stop Price
  const [_sl, _setSl]               = useState('')
  const [_tp, _setTp]               = useState('')

  const [showZeroCapitalModal, setShowZeroCapitalModal] = useState(false)

  const orderType = draftState ? draftState.orderType : _orderType;
  const execType = draftState ? draftState.execType : _execType;
  const qty = draftState ? draftState.qty : _qty;
  const limitPrice = draftState ? draftState.limitPrice : _limitPrice;
  const stopPrice = draftState ? draftState.stopPrice : _stopPrice;
  const sl = draftState ? draftState.sl : _sl;
  const tp = draftState ? draftState.tp : _tp;

  const setOrderType = (v) => { _setOrderType(v); if(setDraftState) setDraftState(prev=>({...prev, orderType: typeof v === 'function' ? v(prev.orderType) : v})) };
  const setExecType = (v) => { _setExecType(v); if(setDraftState) setDraftState(prev=>({...prev, execType: typeof v === 'function' ? v(prev.execType) : v})) };
  const setQty = (v) => { _setQty(v); if(setDraftState) setDraftState(prev=>({...prev, qty: typeof v === 'function' ? v(prev.qty) : v})) };
  const setLimitPrice = (v) => { _setLimitPrice(v); if(setDraftState) setDraftState(prev=>({...prev, limitPrice: typeof v === 'function' ? v(prev.limitPrice) : v})) };
  const setStopPrice = (v) => { _setStopPrice(v); if(setDraftState) setDraftState(prev=>({...prev, stopPrice: typeof v === 'function' ? v(prev.stopPrice) : v})) };
  const setSl = (v) => { _setSl(v); if(setDraftState) setDraftState(prev=>({...prev, sl: typeof v === 'function' ? v(prev.sl) : v})) };
  const setTp = (v) => { _setTp(v); if(setDraftState) setDraftState(prev=>({...prev, tp: typeof v === 'function' ? v(prev.tp) : v})) };

  // Use the live price from the chart — never hardcode
  const entryPrice = ['LIMIT', 'STOP_LIMIT'].includes(execType) ? (parseFloat(limitPrice) || 0) : (execType === 'STOP' ? (parseFloat(stopPrice) || 0) : (livePrice || 0))
  const totalCost = entryPrice * qty

  // Brokerage preview
  const previewBrokerage = entryPrice > 0 ? calcBrokerage(activeTicker, totalCost) : 0

  // SL/TP distance helpers
  const slVal = parseFloat(sl) || null
  const tpVal = parseFloat(tp) || null
  const riskPts   = slVal && entryPrice ? Math.abs(entryPrice - slVal) : null
  const rewardPts = tpVal && entryPrice ? Math.abs(tpVal - entryPrice) : null
  const rrRatio   = riskPts && rewardPts ? (rewardPts / riskPts).toFixed(2) : null

  const placeOrder = () => {
    if (!entryPrice || isNaN(entryPrice) || entryPrice <= 0) {
      alert('Live price not available yet. Please wait a moment.')
      return
    }

    if (capital <= 0 || (orderType === 'BUY' && totalCost > capital)) {
      setShowZeroCapitalModal(true)
      return
    }

    if (execType === 'MARKET' && (!sl || !tp)) {
      alert('Discipline Check: Please enter both a Stop Loss and Take Profit to place a market order!')
      return
    }

    // --- Strict Order Validation Logic ---
    const cmp = livePrice || 0;
    const limitVal = parseFloat(limitPrice);
    const stopVal = parseFloat(stopPrice);

    if (execType === 'LIMIT') {
      if (!limitVal) {
        showToast('Please enter a Limit Price.', 'error');
        return;
      }
      if (orderType === 'BUY' && limitVal >= cmp) {
        showToast('Buy Limit price must be LESS than the Current Market Price.', 'error');
        return;
      }
      if (orderType === 'SELL' && limitVal <= cmp) {
        showToast('Sell Limit price must be GREATER than the Current Market Price.', 'error');
        return;
      }
    } else if (execType === 'STOP') {
      if (!stopVal) {
        showToast('Please enter a Stop Price.', 'error');
        return;
      }
      if (orderType === 'BUY' && stopVal <= cmp) {
        showToast('Buy Stop price must be GREATER than the Current Market Price.', 'error');
        return;
      }
      if (orderType === 'SELL' && stopVal >= cmp) {
        showToast('Sell Stop price must be LESS than the Current Market Price.', 'error');
        return;
      }
    } else if (execType === 'STOP_LIMIT') {
      if (!stopVal || !limitVal) {
        showToast('Please enter both Stop Price and Limit Price.', 'error');
        return;
      }
      if (orderType === 'BUY' && stopVal <= cmp) {
        showToast('Buy Stop-Limit Stop Price must be GREATER than the Current Market Price.', 'error');
        return;
      }
      if (orderType === 'SELL' && stopVal >= cmp) {
        showToast('Sell Stop-Limit Stop Price must be LESS than the Current Market Price.', 'error');
        return;
      }
    }
    // -------------------------------------

    const order = {
      id:         Date.now() + orderIdCounter++,
      ticker:     activeTicker,
      type:       orderType,
      execType,
      qty,
      entryPrice,
      sl:         slVal,
      tp:         tpVal,
      status:     'OPEN',
      timestamp:  new Date().toISOString(),
      pnl:        null,
    }

    addOrder(order)
    showToast('Order Placed Successfully', 'success')
    if (onClose) onClose()
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
          Place Order — <span className="font-mono text-teal-400">{activeTicker}</span>
        </h3>
        <button onClick={onClose} className="p-1 text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:text-slate-200">
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {!user && (
          <div className="text-[10px] text-amber-500 bg-amber-500/10 px-3 py-2 rounded border border-amber-500/20 text-center">
            Sign in to persist your trades across sessions
          </div>
        )}

        {/* Live Price Display */}
        <div className="bg-gray-100 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-300 dark:border-slate-700 text-center">
          <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1">Live Market Price</div>
          <div className="text-xl font-bold font-mono text-teal-400">
            {livePrice ? `${sym}${livePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
          </div>
        </div>

        {/* BUY / SELL Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700">
          {['BUY', 'SELL'].map(t => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`flex-1 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1
                ${orderType === t
                  ? t === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  : 'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:text-slate-300 hover:bg-gray-100 dark:bg-slate-800'
                }`}
            >
              {t === 'BUY' ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
              {t}
            </button>
          ))}
        </div>

        {/* Exec Type */}
        <div>
          <label className="block text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Order Type</label>
          <div className="flex flex-wrap gap-2">
            {['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'].map(t => (
              <button
                key={t}
                onClick={() => {
                  if (t === 'STOP_LIMIT') {
                    const cmp = livePrice || 100;
                    const lPrice = orderType === 'BUY' ? cmp * 1.015 : cmp * 0.985;
                    const sPrice = orderType === 'BUY' ? cmp * 1.01 : cmp * 0.99;
                    if (setDraftState) {
                       setDraftState(prev => ({ ...prev, execType: t, limitPrice: lPrice.toFixed(2), stopPrice: sPrice.toFixed(2) }));
                    }
                    _setExecType(t);
                  } else {
                    setExecType(t);
                  }
                }}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex-1 min-w-[70px]
                  ${execType === t
                    ? 'border-teal-500/50 bg-teal-500/10 text-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
                    : 'border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-500 hover:border-slate-600'
                  }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Qty + Limit/Stop Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">{qtyLabel}</label>
            <input type="number" min={isForexOrCommodity ? 0.01 : 1} step={qtyStep} value={qty}
              onChange={e => setQty(parseFloat(e.target.value) || (isForexOrCommodity ? 0.01 : 1))}
              className="input-dark w-full" />
          </div>
          
          <div className="flex flex-col gap-2">
            {['STOP', 'STOP_LIMIT'].includes(execType) && (
              <div>
                <label className="block text-xs text-amber-500 dark:text-amber-400 mb-1">Stop Price</label>
                <input type="number" id="pt-stopprice-input" value={stopPrice}
                  onChange={e => setStopPrice(e.target.value)}
                  placeholder={livePrice?.toFixed(2) || '0.00'}
                  className="input-dark w-full border-amber-900/30 focus:border-amber-500/50" />
              </div>
            )}
            {['LIMIT', 'STOP_LIMIT'].includes(execType) && (
              <div>
                <label className="block text-xs text-blue-500 dark:text-blue-400 mb-1">Limit Price</label>
                <input type="number" id="pt-entry-input" value={limitPrice}
                  onChange={e => setLimitPrice(e.target.value)}
                  placeholder={livePrice?.toFixed(2) || '0.00'}
                  className="input-dark w-full border-blue-900/30 focus:border-blue-500/50" />
              </div>
            )}
          </div>
        </div>

        {/* SL / TP */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-red-400 mb-1">Stop Loss</label>
            <input type="number" id="pt-sl-input" value={sl}
              onChange={e => setSl(e.target.value)}
              placeholder="e.g. 2600"
              className="input-dark w-full border-red-900/50 focus:border-red-500/50" />
          </div>
          <div>
            <label className="block text-xs text-emerald-400 mb-1">Take Profit</label>
            <input type="number" id="pt-tp-input" value={tp}
              onChange={e => setTp(e.target.value)}
              placeholder="e.g. 2750"
              className="input-dark w-full border-emerald-900/50 focus:border-emerald-500/50" />
          </div>
        </div>

        {/* R:R Display */}
        {rrRatio && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-500 dark:text-slate-500">Risk:</span>
            <span className="text-red-400 font-mono">{sym}{riskPts?.toFixed(2)}</span>
            <span className="text-slate-600">→</span>
            <span className="text-gray-500 dark:text-slate-500">Reward:</span>
            <span className="text-emerald-400 font-mono">{sym}{rewardPts?.toFixed(2)}</span>
            <span className={`ml-auto font-bold px-2 py-0.5 rounded ${parseFloat(rrRatio) >= 2 ? 'bg-emerald-500/20 text-emerald-400' : parseFloat(rrRatio) >= 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
              R:R {rrRatio}
            </span>
          </div>
        )}

        {/* Order Preview */}
        <div className="bg-gray-100 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-300 dark:border-slate-700/50 text-xs font-mono space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-500">Entry @ {execType}</span>
            <span className="text-gray-900 dark:text-slate-200">{sym}{entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-500">Est. Trade Value</span>
            <span className="text-gray-900 dark:text-slate-200">{sym}{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-500">Brokerage (entry)</span>
            <span className="text-amber-400">- {sym}{previewBrokerage.toFixed(2)}</span>
          </div>
          <div className="h-px bg-gray-200 dark:bg-slate-700 my-1" />
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-slate-400 font-semibold">Total Debit</span>
            <span className="text-slate-100 font-semibold">{sym}{(totalCost + previewBrokerage).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-500">Available Capital</span>
            <span className={`${totalCost + previewBrokerage > capital ? 'text-red-400' : 'text-teal-400'}`}>
              {sym}{capital.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {isINR && (
            <div className="text-[9px] text-slate-600 border-t border-gray-300 dark:border-slate-700/50 pt-1">
              Brokerage = min(₹20, 0.03%) + 18% GST (Zerodha-style)
            </div>
          )}
        </div>

        <button
          onClick={placeOrder}
          disabled={entryPrice <= 0 || !marketOpen}
          className={`w-full py-3 rounded-lg text-sm font-bold shadow-lg transition-all
            ${orderType === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-400 text-slate-900 shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
        >
          {!marketOpen ? 'MARKET CLOSED' : 
            (capital <= 0 || (orderType === 'BUY' && (totalCost + previewBrokerage) > capital)) ? 'INSUFFICIENT FUNDS (CLICK)' :
            (orderType === 'BUY' ? '⚡ CONFIRM BUY' : '⚡ CONFIRM SELL') + ' × ' + qty}
        </button>
      </div>

      {/* ── Zero Capital Alert Modal ──────────────────────────────────────── */}
      {showZeroCapitalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                <Info size={24} />
              </div>
              <h3 className="text-gray-900 dark:text-slate-200 font-bold text-lg">Insufficient Funds</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                You do not have enough Virtual Capital for this trade. Please go to the <strong className="text-gray-900 dark:text-slate-200">P-Trade</strong> tab and click "Add Capital" to deposit money.
              </p>
              <button onClick={() => setShowZeroCapitalModal(false)} className="w-full bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
