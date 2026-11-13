import React, { useState, useMemo, useEffect } from 'react';
import AssetLogo from '../components/AssetLogo.jsx';
import { usePortfolio, isINRTicker } from '../contexts/PortfolioContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { Activity, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

function OrderBadge({ type }) {
  return type === 'BUY'
    ? <span className="badge-buy flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><ArrowUpCircle size={9}/> BUY</span>
    : <span className="badge-sell flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border bg-red-500/15 text-red-400 border-red-500/30"><ArrowDownCircle size={9}/> SELL</span>
}

const getOrderSym = (ticker) => isINRTicker(ticker) ? '₹' : '$';

const MARKETS = ['All', 'Indian Market', 'US Market', 'Forex', 'Crypto', 'Commodity'];

function matchesMarket(o, tab) {
  const t = o.ticker || '';
  if (tab === 'All')           return true;
  if (tab === 'Indian Market') return isINRTicker(t);
  if (tab === 'US Market')     return !isINRTicker(t) && !t.includes('=X') && !t.includes('-USD') && !t.endsWith('=F');
  if (tab === 'Forex')         return t.includes('=X');
  if (tab === 'Crypto')        return t.includes('-USD');
  if (tab === 'Commodity')     return t.endsWith('=F');
  return true;
}

function getMarketName(ticker) {
  if (!ticker) return 'Unknown';
  if (isINRTicker(ticker)) return 'Indian Market';
  if (ticker.includes('=X')) return 'Forex';
  if (ticker.includes('-USD') || ticker.includes('-USDT')) return 'Crypto';
  if (ticker.endsWith('=F')) return 'Commodity';
  return 'US Market';
}

export default function OrdersPage() {
  const { capitalINR, capitalUSD, orders, closeOrder, editOrder } = usePortfolio();
  const { showToast } = useToast();

  const [accountTab, setAccountTab] = useState('paper'); // 'live' | 'paper'
  const [orderTab, setOrderTab] = useState('open'); // 'open' | 'history'
  const [activeMarket, setActiveMarket] = useState('All');

  const [livePrices, setLivePrices] = useState({});
  
  const [editingOrder, setEditingOrder] = useState(null);
  const [editSl, setEditSl] = useState('');
  const [editTp, setEditTp] = useState('');

  // Market-filtered orders
  const marketOrders = useMemo(() => orders.filter(o => matchesMarket(o, activeMarket)), [orders, activeMarket]);
  const openOrders   = useMemo(() => marketOrders.filter(o => o.status === 'OPEN'), [marketOrders]);
  const closedOrders = useMemo(() => marketOrders.filter(o => o.status === 'CLOSED'), [marketOrders]);

  // Live Price Polling
  useEffect(() => {
    if (openOrders.length === 0) { setLivePrices({}); return; }
    const tickers = [...new Set(openOrders.map(o => o.ticker))];
    
    const cryptoTickers = tickers.filter(t => t.endsWith('-USD') || t.endsWith('-USDT'));
    const restTickers = tickers.filter(t => !t.endsWith('-USD') && !t.endsWith('-USDT'));
    
    let ws = null;
    if (cryptoTickers.length > 0) {
      const streams = cryptoTickers.map(t => {
        const sym = t.replace('-', '').replace('USD', 'USDT').toLowerCase();
        return `${sym}@miniTicker`;
      }).join('/');
      
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.s && msg.c) {
            let base = msg.s.toUpperCase();
            if (base.endsWith('USDT')) base = base.replace('USDT', '');
            const ticker = `${base}-USD`;
            setLivePrices(prev => ({ ...prev, [ticker]: parseFloat(msg.c) }));
          }
        } catch {}
      };
    }

    let pollId = null;
    if (restTickers.length > 0) {
      const fetchRest = async () => {
        const results = {};
        await Promise.all(restTickers.map(async t => {
          try {
            const r = await fetch(`${API_BASE}/api/latest-price/${encodeURIComponent(t)}`);
            if (r.ok) { const d = await r.json(); if (d?.close) results[t] = d.close; }
          } catch {}
        }));
        setLivePrices(prev => ({ ...prev, ...results }));
      };
      fetchRest();
      pollId = setInterval(fetchRest, 2000);
    }

    return () => {
      if (ws) ws.close();
      if (pollId) clearInterval(pollId);
    };
  }, [openOrders]);

  const [liveUsdInr, setLiveUsdInr] = useState(84.5);
  useEffect(() => {
    fetch(`${API_BASE}/api/latest-price/USDINR%3DX`)
      .then(r => r.json())
      .then(d => { if (d?.close) setLiveUsdInr(d.close); })
      .catch(() => {});
  }, []);

  // Simple analytics for the top
  const analytics = useMemo(() => {
    const realizedPnL = closedOrders.reduce((s, o) => s + (o.pnl||0), 0);
    const unrealizedPnL = openOrders.reduce((s, o) => {
      const lp = livePrices[o.ticker] || o.entryPrice;
      return s + (o.type==='BUY' ? (lp-o.entryPrice) : (o.entryPrice-lp)) * o.qty;
    }, 0);
    const totalBrokerage = closedOrders.reduce((s, o) => s + (o.brokerage||0), 0);
    return { realizedPnL, unrealizedPnL, totalBrokerage };
  }, [closedOrders, openOrders, livePrices]);

  const displayCapital = activeMarket === 'All' 
    ? capitalINR + (capitalUSD * liveUsdInr)
    : (activeMarket === 'Indian Market' || activeMarket === 'Commodity' ? capitalINR : capitalUSD);
  const displaySym = (activeMarket === 'Indian Market' || activeMarket === 'Commodity' || activeMarket === 'All') ? '₹' : '$';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-[#0B0E14]">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-[#0B0E14] border-b border-gray-200 dark:border-slate-800/50 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" /> Orders Book
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage your active positions and review trade history.</p>
        </div>
        
        {/* Account Tabs */}
        <div className="flex bg-gray-100 dark:bg-[#151924] p-1 rounded-lg">
          <button
            onClick={() => setAccountTab('live')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              accountTab === 'live' ? 'bg-white dark:bg-[#2A3143] text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200'
            }`}
          >
            Live Account
          </button>
          <button
            onClick={() => setAccountTab('paper')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              accountTab === 'paper' ? 'bg-white dark:bg-[#2A3143] text-teal-600 dark:text-teal-400 shadow' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200'
            }`}
          >
            P-Trade
          </button>
        </div>
      </div>

      {accountTab === 'live' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-200">Connect Your Broker</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2">Live trading integration is coming soon.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Analytics Top Bar */}
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-[#0B0E14] border-b border-gray-200 dark:border-slate-800/50">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800/80 bg-gray-50 dark:bg-[#11151C]">
              <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Unrealized P&L</div>
              <div className={`text-xl font-bold font-mono ${analytics.unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {analytics.unrealizedPnL >= 0 ? '+' : ''}{Math.abs(analytics.unrealizedPnL).toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800/80 bg-gray-50 dark:bg-[#11151C]">
              <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Realized P&L</div>
              <div className={`text-xl font-bold font-mono ${analytics.realizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {analytics.realizedPnL >= 0 ? '+' : ''}{Math.abs(analytics.realizedPnL).toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800/80 bg-gray-50 dark:bg-[#11151C]">
              <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Brokerage Paid</div>
              <div className="text-xl font-bold font-mono text-amber-500">
                {analytics.totalBrokerage.toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800/80 bg-gray-50 dark:bg-[#11151C]">
              <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
                Base Capital 
                {activeMarket === 'All' && <span className="text-[9px] text-slate-600 ml-2 normal-case">(Combined INR)</span>}
              </div>
              <div className="text-xl font-bold font-mono text-gray-900 dark:text-slate-200">
                {activeMarket === 'All' ? `₹${displayCapital.toLocaleString('en-IN', {maximumFractionDigits:0})}` : `${displaySym}${displayCapital.toLocaleString('en-IN')}`}
              </div>
            </div>
          </div>

          {/* Market & Order Type Tabs */}
          <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {MARKETS.map(m => (
                <button key={m} onClick={() => setActiveMarket(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    activeMarket === m 
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' 
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}>
                  {m}
                </button>
              ))}
            </div>

            <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
              <button onClick={() => setOrderTab('open')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  orderTab === 'open' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-slate-400'
                }`}>
                Open Positions ({openOrders.length})
              </button>
              <button onClick={() => setOrderTab('history')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  orderTab === 'history' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-slate-400'
                }`}>
                History ({closedOrders.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            
            {/* ── POSITIONS TAB ─────────────────────────────────────────────── */}
            {orderTab === 'open' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-left text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Order</th>
                      <th className="py-3 px-4 text-left text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Time</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Qty</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Entry</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Live Price</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Live P&L</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">SL / TP</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {openOrders.length === 0 ? (
                      <tr><td colSpan="8" className="py-10 text-center text-gray-500 dark:text-slate-500">No open positions.</td></tr>
                    ) : openOrders.map(o => {
                      const osym = getOrderSym(o.ticker);
                      const lp   = livePrices[o.ticker];
                      const livePnl = lp != null ? (o.type === 'BUY' ? (lp - o.entryPrice) : (o.entryPrice - lp)) * o.qty : null;
                      return (
                        <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center gap-2">
                              <OrderBadge type={o.type}/>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <AssetLogo symbol={o.ticker} className="w-5 h-5" />
                                  <span className="font-mono font-bold text-gray-900 dark:text-slate-200">{o.ticker}</span>
                                </div>
                                {activeMarket === 'All' && (
                                  <span className="text-[9px] text-gray-500 dark:text-slate-500 mt-0.5 ml-6">{getMarketName(o.ticker)}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-left text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">{new Date(o.timestamp).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-slate-200">{o.qty}</td>
                          <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-slate-200">{osym}{o.entryPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono">{lp != null ? <span className="text-gray-900 dark:text-slate-200">{osym}{lp.toFixed(2)}</span> : <span className="text-slate-400 animate-pulse">…</span>}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {livePnl != null ? <span className={livePnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>{livePnl >= 0 ? '+' : ''}{osym}{Math.abs(livePnl).toFixed(2)}</span> : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex flex-col gap-1 items-end text-xs font-mono">
                              {o.tp && <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">TP:{osym}{o.tp.toFixed(2)}</span>}
                              {o.sl && <span className="text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">SL:{osym}{o.sl.toFixed(2)}</span>}
                              {!o.tp && !o.sl && <span className="text-slate-400">—</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => { setEditingOrder(o); setEditSl(o.sl?.toString() || ''); setEditTp(o.tp?.toString() || ''); }}
                                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:border-gray-400 dark:hover:border-slate-500 transition-colors">Edit</button>
                              <button onClick={() => {
                                  closeOrder(o.id, lp || o.entryPrice);
                                  showToast(`Position Closed for ${o.ticker}`, 'info');
                                }}
                                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors whitespace-nowrap">
                                Close{lp ? ` @ ${osym}${lp.toFixed(2)}` : ''}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
            {orderTab === 'history' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-left text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Order</th>
                      <th className="py-3 px-4 text-left text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Entry / Exit</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Qty</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Gross P&L</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Brokerage</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Net P&L</th>
                      <th className="py-3 px-4 text-right text-gray-600 dark:text-slate-400 font-semibold whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {closedOrders.length === 0 ? (
                      <tr><td colSpan="7" className="py-10 text-center text-gray-500 dark:text-slate-500">No closed trades.</td></tr>
                    ) : closedOrders.map(o => {
                      const osym = getOrderSym(o.ticker);
                      return (
                        <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center gap-2">
                              <OrderBadge type={o.type}/>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <AssetLogo symbol={o.ticker} className="w-5 h-5" />
                                  <span className="font-mono font-bold text-gray-900 dark:text-slate-200">{o.ticker}</span>
                                </div>
                                {activeMarket === 'All' && (
                                  <span className="text-[9px] text-gray-500 dark:text-slate-500 mt-0.5 ml-6">{getMarketName(o.ticker)}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-left font-mono text-xs">
                            <div className="text-gray-500 dark:text-slate-400">In: {osym}{o.entryPrice.toFixed(2)}</div>
                            <div className="text-gray-900 dark:text-slate-200">Out: {osym}{(o.exitPrice || 0).toFixed(2)}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-slate-200">{o.qty}</td>
                          <td className="py-3 px-4 text-right font-mono"><span className={(o.grossPnl || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}>{(o.grossPnl || 0) >= 0 ? '+' : ''}{osym}{Math.abs(o.grossPnl || 0).toFixed(2)}</span></td>
                          <td className="py-3 px-4 text-right font-mono text-amber-500 text-xs">− {osym}{(o.brokerage || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold"><span className={(o.pnl || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}>{(o.pnl || 0) >= 0 ? '+' : ''}{osym}{Math.abs(o.pnl || 0).toFixed(2)}</span></td>
                          <td className="py-3 px-4 text-right text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">{new Date(o.closedAt || o.timestamp).toLocaleString('en-IN')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Edit Order Modal ─────────────────────────────────────────────── */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Edit — <span className="font-mono text-blue-500">{editingOrder.ticker}</span></h3>
              <button onClick={() => setEditingOrder(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs font-bold text-red-500 mb-1">Stop Loss</label><input type="number" value={editSl} onChange={e => setEditSl(e.target.value)} placeholder={editingOrder.sl?.toString() || 'Not set'} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
              <div><label className="block text-xs font-bold text-emerald-500 mb-1">Take Profit</label><input type="number" value={editTp} onChange={e => setEditTp(e.target.value)} placeholder={editingOrder.tp?.toString() || 'Not set'} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { editOrder(editingOrder.id, { sl: parseFloat(editSl) || editingOrder.sl, tp: parseFloat(editTp) || editingOrder.tp }); setEditingOrder(null); }} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors">Save</button>
                <button onClick={() => setEditingOrder(null)} className="flex-1 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
