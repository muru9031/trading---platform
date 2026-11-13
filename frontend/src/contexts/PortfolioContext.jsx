import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from './ToastContext';

const PortfolioContext = createContext();

const INITIAL_CAPITAL_INR = 0;
const INITIAL_CAPITAL_USD = 0;

// Helper: is this ticker an Indian market asset?
export const isINRTicker = (ticker) =>
  ticker?.endsWith('.NS') || ticker?.endsWith('.BO') || ticker?.endsWith('.MC');

// Brokerage calculator — Zerodha-style
// Indian: min(₹20, 0.03% of trade value) + 18% GST
// US/Forex/Crypto: flat $2 per trade
export function calcBrokerage(ticker, tradeValue) {
  if (isINRTicker(ticker)) {
    const baseFee = Math.min(20, tradeValue * 0.0003);
    return parseFloat((baseFee * 1.18).toFixed(2)); // +18% GST
  }
  return 2.00; // $2 flat
}

export function PortfolioProvider({ children, user }) {
  const [capitalINR, setCapitalINR] = useState(() => {
    const userKey = user?.id ? `_${user.id}` : '';
    const saved = localStorage.getItem(`st_capital_inr${userKey}`) || localStorage.getItem('st_capital_inr');
    return saved ? parseFloat(saved) : INITIAL_CAPITAL_INR;
  });

  const [capitalUSD, setCapitalUSD] = useState(() => {
    const userKey = user?.id ? `_${user.id}` : '';
    const saved = localStorage.getItem(`st_capital_usd${userKey}`) || localStorage.getItem('st_capital_usd');
    return saved ? parseFloat(saved) : INITIAL_CAPITAL_USD;
  });

  const [orders, setOrders] = useState(() => {
    try {
      const userKey = user?.id ? `_${user.id}` : '';
      const saved = localStorage.getItem(`st_orders${userKey}`) || localStorage.getItem('st_orders_local');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Broker Auto-Sync Engine & Journal States
  const [connectedBrokers, setConnectedBrokers] = useState({});
  const [livePositions, setLivePositions] = useState([]);
  const [journalEntries, setJournalEntries] = useState({});

  const { showToast } = useToast();

  // Load Data from Supabase (Brokers & Journal)
  useEffect(() => {
    let isMounted = true;
    const fetchPortfolioData = async () => {
      try {
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { user: null } }), 2000));
        const { data: { user: authUser } } = await Promise.race([userPromise, timeoutPromise]);
        const targetUser = user || authUser;
        if (!targetUser || !isMounted) return;

        // 1. Fetch connected brokers
        const { data: brokers, error: brokersError } = await supabase.from('broker_connections').select('*').eq('user_id', targetUser.id);
        if (!brokersError && brokers && isMounted) {
          const brokerMap = {};
          brokers.forEach(b => {
            brokerMap[b.broker_name] = { connected: b.status === 'active', ...b };
          });
          setConnectedBrokers(brokerMap);
        }

        // 2. Fetch journal entries
        const { data: entries, error: entriesError } = await supabase.from('journal_entries').select('*').eq('user_id', targetUser.id);
        if (!entriesError && entries && isMounted) {
          const grouped = { real: {}, paper: {} };
          entries.forEach(t => {
            const d = t.date;
            const pType = t.portfolio_type || 'real';
            if (!grouped[pType]) grouped[pType] = {};
            if (!grouped[pType][d]) grouped[pType][d] = [];
            grouped[pType][d].push({
              id: t.id,
              asset: t.asset,
              market: t.market,
              pnlType: t.type,
              pnlAmount: t.pnl,
              netPnl: t.type === 'Loss' ? -Math.abs(t.pnl) : Math.abs(t.pnl),
              brokerage: t.brokerage,
              side: t.side || 'Buy',
              qty: t.qty,
              entryPrice: t.entry_price,
              exitPrice: t.exit_price,
              time: t.time,
              mistakeTag: t.mistake_tag,
              strategyNotes: t.strategy_notes,
              source: t.broker_id ? 'Broker' : undefined
            });
          });
          setJournalEntries(grouped);
        }
      } catch (err) {
        console.warn("Portfolio database sync info:", err.message);
      }
    };
    fetchPortfolioData();
    return () => { isMounted = false; };
  }, [user, showToast]);

  // Persist capital & orders locally immediately whenever they change
  useEffect(() => { 
    localStorage.setItem('st_capital_inr', capitalINR); 
    if (user?.id) localStorage.setItem(`st_capital_inr_${user.id}`, capitalINR);
  }, [capitalINR, user]);

  useEffect(() => { 
    localStorage.setItem('st_capital_usd', capitalUSD); 
    if (user?.id) localStorage.setItem(`st_capital_usd_${user.id}`, capitalUSD);
  }, [capitalUSD, user]);

  useEffect(() => { 
    localStorage.setItem('st_orders_local', JSON.stringify(orders)); 
    if (user?.id) localStorage.setItem(`st_orders_${user.id}`, JSON.stringify(orders));
  }, [orders, user]);

  // Comprehensive User Data Fetch on Mount / Login
  useEffect(() => {
    let isMounted = true;

    const syncUserData = async () => {
      // Step A: Load from localStorage immediately so user never sees 0 or flash
      const userKey = user?.id ? `_${user.id}` : '';
      const localInr = localStorage.getItem(`st_capital_inr${userKey}`) || localStorage.getItem('st_capital_inr');
      const localUsd = localStorage.getItem(`st_capital_usd${userKey}`) || localStorage.getItem('st_capital_usd');
      const localOrdersStr = localStorage.getItem(`st_orders${userKey}`) || localStorage.getItem('st_orders_local');

      if (localInr !== null && !isNaN(parseFloat(localInr))) {
        setCapitalINR(parseFloat(localInr));
      }
      if (localUsd !== null && !isNaN(parseFloat(localUsd))) {
        setCapitalUSD(parseFloat(localUsd));
      }
      if (localOrdersStr) {
        try {
          const parsed = JSON.parse(localOrdersStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        } catch {}
      }

      if (!user?.id) return;

      // Step B: Query Supabase for capital & trades
      try {
        // 1. Fetch portfolios table
        try {
          const { data: portData, error: portError } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!portError && portData && isMounted) {
            if (portData.capital_inr !== undefined && portData.capital_inr !== null) {
              setCapitalINR(parseFloat(portData.capital_inr));
              localStorage.setItem('st_capital_inr', portData.capital_inr);
              localStorage.setItem(`st_capital_inr_${user.id}`, portData.capital_inr);
            }
            if (portData.capital_usd !== undefined && portData.capital_usd !== null) {
              setCapitalUSD(parseFloat(portData.capital_usd));
              localStorage.setItem('st_capital_usd', portData.capital_usd);
              localStorage.setItem(`st_capital_usd_${user.id}`, portData.capital_usd);
            }
          } else if (user.user_metadata?.capital_inr !== undefined && isMounted) {
            const metaInr = parseFloat(user.user_metadata.capital_inr);
            const metaUsd = parseFloat(user.user_metadata.capital_usd);
            if (!isNaN(metaInr) && metaInr > 0) setCapitalINR(metaInr);
            if (!isNaN(metaUsd) && metaUsd > 0) setCapitalUSD(metaUsd);
          }
        } catch (e) {
          console.warn('Supabase portfolio query note:', e.message);
        }

        // 2. Fetch paper_trades table
        try {
          const { data: tradesData, error: tradesError } = await supabase
            .from('paper_trades')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

          if (!tradesError && tradesData && tradesData.length > 0 && isMounted) {
            const normalized = tradesData.map(t => ({
              id: t.id,
              ticker: t.ticker,
              type: t.type,
              execType: t.exec_type || t.execType || 'MARKET',
              qty: parseFloat(t.qty),
              entryPrice: parseFloat(t.entry_price || t.entryPrice),
              exitPrice: t.exit_price ? parseFloat(t.exit_price) : (t.exitPrice ? parseFloat(t.exitPrice) : null),
              sl: t.sl ? parseFloat(t.sl) : null,
              tp: t.tp ? parseFloat(t.tp) : null,
              status: t.status || 'OPEN',
              timestamp: t.timestamp,
              closedAt: t.closed_at || t.closedAt || null,
              grossPnl: t.gross_pnl !== null && t.gross_pnl !== undefined ? parseFloat(t.gross_pnl) : null,
              brokerage: parseFloat(t.brokerage || 0),
              pnl: t.pnl !== null && t.pnl !== undefined ? parseFloat(t.pnl) : null
            }));
            setOrders(normalized);
            localStorage.setItem('st_orders_local', JSON.stringify(normalized));
            localStorage.setItem(`st_orders_${user.id}`, JSON.stringify(normalized));
            return;
          }
        } catch (e) {
          console.warn('Supabase paper_trades query note:', e.message);
        }

        // 3. Fallback: Check journal_entries for portfolio_type='paper'
        try {
          const { data: jTrades, error: jError } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('portfolio_type', 'paper')
            .order('created_at', { ascending: false });

          if (!jError && jTrades && jTrades.length > 0 && isMounted) {
            setOrders(prev => {
              if (prev && prev.length > 0) return prev; // Keep current local orders if existing
              return jTrades.map(j => ({
                id: j.id,
                ticker: j.asset,
                type: (j.side || 'BUY').toUpperCase(),
                execType: 'MARKET',
                qty: parseFloat(j.qty || 1),
                entryPrice: parseFloat(j.entry_price || 0),
                exitPrice: j.exit_price ? parseFloat(j.exit_price) : null,
                status: j.exit_price ? 'CLOSED' : 'OPEN',
                timestamp: j.created_at || new Date().toISOString(),
                closedAt: j.exit_price ? (j.created_at || new Date().toISOString()) : null,
                pnl: j.pnl ? parseFloat(j.pnl) : 0,
                brokerage: parseFloat(j.brokerage || 0)
              }));
            });
          } else if (user.user_metadata?.paper_orders && isMounted) {
            setOrders(prev => (prev && prev.length > 0 ? prev : user.user_metadata.paper_orders));
          }
        } catch (e) {
          console.warn('Journal paper trades sync note:', e.message);
        }

      } catch (err) {
        console.warn('Portfolio user data sync:', err);
      }
    };

    syncUserData();
    return () => { isMounted = false; };
  }, [user]);

  // First-class Add Capital function — updates state, localStorage, and Supabase DB
  const addCapital = async (amount, currency = 'INR') => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const isINR = currency === 'INR';
    const nextINR = isINR ? parseFloat((capitalINR + val).toFixed(2)) : capitalINR;
    const nextUSD = !isINR ? parseFloat((capitalUSD + val).toFixed(2)) : capitalUSD;

    setCapitalINR(nextINR);
    setCapitalUSD(nextUSD);

    localStorage.setItem('st_capital_inr', nextINR);
    localStorage.setItem('st_capital_usd', nextUSD);
    if (user?.id) {
      localStorage.setItem(`st_capital_inr_${user.id}`, nextINR);
      localStorage.setItem(`st_capital_usd_${user.id}`, nextUSD);

      // 1. Supabase portfolios table
      try {
        await supabase.from('portfolios').upsert({
          user_id: user.id,
          capital_inr: nextINR,
          capital_usd: nextUSD,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('portfolios table upsert:', e.message);
      }

      // 2. Supabase auth user_metadata fallback
      try {
        await supabase.auth.updateUser({
          data: {
            capital_inr: nextINR,
            capital_usd: nextUSD
          }
        });
      } catch (e) {
        console.warn('Supabase auth metadata update:', e.message);
      }
    }
  };

  // Place a new order — deduct entry cost from capital, save to state, local storage & Supabase
  const addOrder = async (order) => {
    const entryCost = order.entryPrice * order.qty;
    const entryBrokerage = calcBrokerage(order.ticker, entryCost);

    const updatedOrders = [order, ...orders];
    setOrders(updatedOrders);

    // Deduct cost + entry brokerage for BUY orders
    let nextINR = capitalINR;
    let nextUSD = capitalUSD;
    if (order.type === 'BUY') {
      const totalDebit = entryCost + entryBrokerage;
      if (isINRTicker(order.ticker)) {
        nextINR = Math.max(0, parseFloat((capitalINR - totalDebit).toFixed(2)));
        setCapitalINR(nextINR);
      } else {
        nextUSD = Math.max(0, parseFloat((capitalUSD - totalDebit).toFixed(2)));
        setCapitalUSD(nextUSD);
      }
    }

    // Immediately cache in localStorage
    localStorage.setItem('st_orders_local', JSON.stringify(updatedOrders));
    localStorage.setItem('st_capital_inr', nextINR);
    localStorage.setItem('st_capital_usd', nextUSD);

    if (user?.id) {
      localStorage.setItem(`st_orders_${user.id}`, JSON.stringify(updatedOrders));
      localStorage.setItem(`st_capital_inr_${user.id}`, nextINR);
      localStorage.setItem(`st_capital_usd_${user.id}`, nextUSD);

      // 1. Supabase paper_trades table insert/upsert
      try {
        await supabase.from('paper_trades').upsert([{
          id: String(order.id),
          user_id: user.id,
          ticker: order.ticker,
          type: order.type,
          exec_type: order.execType || 'MARKET',
          qty: order.qty,
          entry_price: order.entryPrice,
          exit_price: order.exitPrice || null,
          sl: order.sl || null,
          tp: order.tp || null,
          status: order.status || 'OPEN',
          timestamp: order.timestamp || new Date().toISOString(),
          brokerage: entryBrokerage,
          pnl: order.pnl || null
        }]);
      } catch (e) {
        console.warn('paper_trades upsert skipped:', e.message);
      }

      // 2. Supabase journal_entries sync (guaranteed existing table)
      try {
        const d = new Date(order.timestamp || Date.now());
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        await supabase.from('journal_entries').upsert([{
          user_id: user.id,
          date: dateStr,
          time: d.toTimeString().split(' ')[0],
          asset: order.ticker,
          market: isINRTicker(order.ticker) ? 'Indian Market' : 'US Market',
          type: 'Pending',
          pnl: 0,
          brokerage: entryBrokerage,
          qty: order.qty,
          entry_price: order.entryPrice,
          exit_price: null,
          side: order.type === 'BUY' ? 'Buy' : 'Sell',
          portfolio_type: 'paper',
          source: 'simulator'
        }]);
      } catch (e) {
        console.warn('journal_entries sync skipped:', e.message);
      }

      // 3. Supabase portfolios table update
      try {
        await supabase.from('portfolios').upsert({
          user_id: user.id,
          capital_inr: nextINR,
          capital_usd: nextUSD,
          updated_at: new Date().toISOString()
        });
      } catch (e) {}

      // 4. Supabase auth user_metadata fallback
      try {
        await supabase.auth.updateUser({
          data: {
            capital_inr: nextINR,
            capital_usd: nextUSD,
            paper_orders: updatedOrders.slice(0, 50)
          }
        });
      } catch (e) {}
    }
  };

  // Close an order — calculate gross P&L, deduct exit brokerage, update capital & Supabase
  const closeOrder = async (id, exitPrice) => {
    let closedOrderObj = null;
    let nextINR = capitalINR;
    let nextUSD = capitalUSD;

    const nextOrders = orders.map(o => {
      if (o.id !== id) return o;

      const grossPnl = o.type === 'BUY'
        ? (exitPrice - o.entryPrice) * o.qty
        : (o.entryPrice - exitPrice) * o.qty;

      // Exit-side brokerage
      const exitTradeValue = exitPrice * o.qty;
      const exitBrokerage = calcBrokerage(o.ticker, exitTradeValue);
      const netPnl = parseFloat((grossPnl - exitBrokerage).toFixed(2));

      // Return original entry cost + net pnl back to capital
      const entryCost = o.entryPrice * o.qty;
      if (o.type === 'BUY') {
        const returnAmount = entryCost + netPnl;
        if (isINRTicker(o.ticker)) {
          nextINR = parseFloat((capitalINR + returnAmount).toFixed(2));
          setCapitalINR(nextINR);
        } else {
          nextUSD = parseFloat((capitalUSD + returnAmount).toFixed(2));
          setCapitalUSD(nextUSD);
        }
      } else {
        // For SELL orders: credit the net pnl
        if (isINRTicker(o.ticker)) {
          nextINR = parseFloat((capitalINR + netPnl).toFixed(2));
          setCapitalINR(nextINR);
        } else {
          nextUSD = parseFloat((capitalUSD + netPnl).toFixed(2));
          setCapitalUSD(nextUSD);
        }
      }

      const updatedOrder = {
        ...o,
        status:      'CLOSED',
        exitPrice,
        grossPnl:    parseFloat(grossPnl.toFixed(2)),
        brokerage:   exitBrokerage,
        pnl:         netPnl,
        closedAt:    new Date().toISOString(),
      };
      closedOrderObj = updatedOrder;
      return updatedOrder;
    });

    setOrders(nextOrders);

    // Save to localStorage immediately
    localStorage.setItem('st_orders_local', JSON.stringify(nextOrders));
    localStorage.setItem('st_capital_inr', nextINR);
    localStorage.setItem('st_capital_usd', nextUSD);

    if (user?.id) {
      localStorage.setItem(`st_orders_${user.id}`, JSON.stringify(nextOrders));
      localStorage.setItem(`st_capital_inr_${user.id}`, nextINR);
      localStorage.setItem(`st_capital_usd_${user.id}`, nextUSD);

      if (closedOrderObj) {
        // 1. Supabase paper_trades update
        try {
          await supabase.from('paper_trades')
            .update({ 
              status: 'CLOSED', 
              exit_price: exitPrice, 
              gross_pnl: closedOrderObj.grossPnl, 
              brokerage: closedOrderObj.brokerage, 
              pnl: closedOrderObj.pnl,
              closed_at: closedOrderObj.closedAt 
            })
            .eq('id', String(id));
        } catch (e) {}

        // 2. Supabase journal_entries update
        try {
          const d = new Date(closedOrderObj.closedAt || Date.now());
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          await supabase.from('journal_entries').upsert([{
            user_id: user.id,
            date: dateStr,
            time: d.toTimeString().split(' ')[0],
            asset: closedOrderObj.ticker,
            market: isINRTicker(closedOrderObj.ticker) ? 'Indian Market' : 'US Market',
            type: closedOrderObj.pnl >= 0 ? 'Profit' : 'Loss',
            pnl: Math.abs(closedOrderObj.pnl),
            brokerage: closedOrderObj.brokerage,
            qty: closedOrderObj.qty,
            entry_price: closedOrderObj.entryPrice,
            exit_price: exitPrice,
            side: closedOrderObj.type === 'BUY' ? 'Buy' : 'Sell',
            portfolio_type: 'paper',
            source: 'simulator'
          }]);
        } catch (e) {}

        // 3. Supabase portfolios update
        try {
          await supabase.from('portfolios').upsert({
            user_id: user.id,
            capital_inr: nextINR,
            capital_usd: nextUSD,
            updated_at: new Date().toISOString()
          });
        } catch (e) {}

        // 4. Supabase auth user_metadata fallback
        try {
          await supabase.auth.updateUser({
            data: {
              capital_inr: nextINR,
              capital_usd: nextUSD,
              paper_orders: nextOrders.slice(0, 50)
            }
          });
        } catch (e) {}
      }
    }
  };

  // Edit an open order's SL/TP
  const editOrder = (id, updates) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === id ? { ...o, ...updates } : o);
      localStorage.setItem('st_orders_local', JSON.stringify(next));
      if (user?.id) {
        localStorage.setItem(`st_orders_${user.id}`, JSON.stringify(next));
        supabase.from('paper_trades').update(updates).eq('id', String(id)).catch(() => {});
      }
      return next;
    });
  };

  // Run auto-close engine for live prices
  const processLivePrice = useCallback((ticker, livePrice) => {
    setOrders(prev => {
      let changed = false;
      const next = prev.map(o => {
        if (o.status !== 'OPEN' || o.ticker !== ticker) return o;

        // Process LIMIT orders
        if (o.execType === 'LIMIT') {
          if ((o.type === 'BUY' && livePrice <= o.entryPrice) || 
              (o.type === 'SELL' && livePrice >= o.entryPrice)) {
            changed = true;
            setTimeout(() => showToast(`Limit Order Executed for ${ticker}`, 'info'), 0);
            return { ...o, execType: 'MARKET', entryPrice: livePrice }; // Optionally use limit entry price
          }
          return o;
        }

        // Process TP/SL for active MARKET orders
        let triggerClose = false;
        let isProfit = false;
        let closeReason = '';

        if (o.type === 'BUY') {
          if (o.tp && livePrice >= o.tp) { triggerClose = true; isProfit = true; closeReason = 'Take Profit Hit'; }
          else if (o.sl && livePrice <= o.sl) { triggerClose = true; isProfit = false; closeReason = 'Stop Loss Hit'; }
        } else if (o.type === 'SELL') {
          if (o.tp && livePrice <= o.tp) { triggerClose = true; isProfit = true; closeReason = 'Take Profit Hit'; }
          else if (o.sl && livePrice >= o.sl) { triggerClose = true; isProfit = false; closeReason = 'Stop Loss Hit'; }
        }

        if (triggerClose) {
          changed = true;
          const grossPnl = o.type === 'BUY' ? (livePrice - o.entryPrice) * o.qty : (o.entryPrice - livePrice) * o.qty;
          const netPnl = parseFloat((grossPnl - calcBrokerage(o.ticker, livePrice * o.qty)).toFixed(2));
          
          setTimeout(() => {
            showToast(`${closeReason}: ${netPnl >= 0 ? '+' : ''}$${netPnl}`, isProfit ? 'success' : 'error');
            // Since this runs in mapping, we trigger closeOrder via the returned mapped object 
            // but we need to also update the capital state, which relies on a separate state update.
            // To safely do this, we can call closeOrder async.
            closeOrder(o.id, livePrice);
          }, 0);
          return o; // State gets overridden by closeOrder shortly anyway
        }

        return o;
      });
      return changed ? next : prev;
    });
  }, [showToast]);

  // Reset all paper trading data and journal entries
  const resetAll = async (portfolioType = 'real') => {
    try {
      // Delete all journal entries for this portfolio type
      const { error } = await supabase.from('journal_entries').delete().eq('portfolio_type', portfolioType);
      if (error) throw error;
      
      setOrders([]);
      setCapitalINR(0);
      setCapitalUSD(0);
      localStorage.removeItem('st_orders_local');
      setJournalEntries({});
      
      showToast('Portfolio Reset Successfully', 'success');
    } catch (err) {
      console.error('Reset failed:', err);
      showToast('Failed to reset portfolio: ' + err.message, 'error');
    }
  };

  // ── Manual Journal Entry (Supabase Sync) ───────────────────────────────
  const saveJournalTrades = async (dateStr, tradesArray, portfolioType = 'real') => {
    try {
      // 1. Delete existing manual trades for this date to replace them
      const { error: deleteError } = await supabase.from('journal_entries')
        .delete()
        .eq('date', dateStr)
        .eq('portfolio_type', portfolioType)
        .is('broker_id', null);
        
      if (deleteError) throw deleteError;

      // 2. Insert new trades
      const toInsert = tradesArray.map(t => ({
        date: dateStr,
        time: t.time || null,
        asset: t.asset,
        market: t.market,
        type: t.pnlType,
        pnl: t.pnlAmount,
        brokerage: t.brokerage || 0,
        side: t.side || 'Buy',
        qty: t.qty || null,
        entry_price: t.entryPrice || null,
        exit_price: t.exitPrice || null,
        mistake_tag: t.mistakeTag || null,
        strategy_notes: t.strategyNotes || null,
        screenshot_url: t.screenshot_url || null,
        portfolio_type: portfolioType,
        source: t.source || 'manual'
      }));
      
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('journal_entries').insert(toInsert);
        if (insertError) throw insertError;
      }
      
      // 3. Update local state ONLY on success
      setJournalEntries(prev => {
         const next = { ...prev };
         if (!next[portfolioType]) next[portfolioType] = {};
         next[portfolioType] = {
           ...next[portfolioType],
           [dateStr]: tradesArray
         };
         return next;
      });
      showToast('Trade Saved to Database!', 'success');
      
    } catch (err) {
      console.error("Failed to save to database:", err);
      showToast("Failed to save to database: " + err.message, 'error');
    }
  };

  const bulkImportTrades = async (groupedTrades, portfolioType = 'real') => {
    try {
      const allInserts = [];
      let hasInvalidRows = false;
      let errorReason = '';

      // Strict Validation Pass
      Object.keys(groupedTrades).forEach(dateStr => {
        // Validate Date format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          hasInvalidRows = true;
          errorReason = `Invalid date format found: ${dateStr}`;
        }
        
        groupedTrades[dateStr].forEach(t => {
          if (!t.asset || t.asset === 'UNKNOWN' || t.asset.trim() === '') {
            hasInvalidRows = true;
            errorReason = `Missing or invalid asset name for date ${dateStr}`;
          }
          if (isNaN(t.pnlAmount) || t.pnlAmount === null) {
            hasInvalidRows = true;
            errorReason = `Invalid P&L amount for asset ${t.asset}`;
          }
          if (hasInvalidRows) return;

          allInserts.push({
            date: dateStr,
            time: t.time || null,
            asset: t.asset,
            market: t.market || 'Indian Market',
            type: t.pnlType,
            pnl: t.pnlAmount,
            brokerage: t.brokerage || 0,
            qty: t.qty || null,
            entry_price: t.entryPrice || null,
            exit_price: t.exitPrice || null,
            mistake_tag: t.mistakeTag || null,
            strategy_notes: t.strategyNotes || null,
            screenshot_url: t.screenshot_url || null,
            portfolio_type: portfolioType,
            source: 'csv',
            broker_id: null
          });
        });
      });

      if (hasInvalidRows) {
        throw new Error(`Invalid CSV Data: ${errorReason}`);
      }

      if (allInserts.length === 0) {
        throw new Error("No valid trades found in CSV.");
      }

      // 2. Insert validated trades
      const { error } = await supabase.from('journal_entries').insert(allInserts);
      if (error) throw error;

      setJournalEntries(prev => {
        const next = { ...prev };
        Object.keys(groupedTrades).forEach(d => {
          if (!next[d]) next[d] = [];
          next[d] = [...next[d], ...groupedTrades[d]];
        });
        return next;
      });
      showToast(`Imported ${allInserts.length} valid trades successfully!`, 'success');
    } catch (err) {
      console.error("Bulk import failed:", err);
      showToast("Bulk import rejected: " + err.message, 'error');
    }
  };

  // ── Broker Connection Engine (Supabase Sync) ───────────────────────────
  // TODO: Migrate to secure backend API - Do not handle raw API keys on the frontend in Phase 2
  const connectBroker = async (brokerName, config, market) => {
    try {
      const payload = {
        broker_name: brokerName,
        market: market,
        access_token: config.apiKey || config.token,
        api_secret: config.apiSecret,
        status: 'active'
      };
      
      // Insert to Supabase
      const { data, error } = await supabase.from('broker_connections').insert([payload]).select();
      if (error) throw error;
      
      if (data) {
        setConnectedBrokers(prev => ({
          ...prev,
          [brokerName]: { connected: true, ...data[0] }
        }));
        showToast(`${brokerName} Connected Successfully!`, 'success');
      }
    } catch (err) {
      console.error("Broker connection failed:", err);
      showToast("Broker connection failed: " + err.message, 'error');
    }
  };

  const disconnectBroker = async (brokerName) => {
    try {
      const broker = connectedBrokers[brokerName];
      if (broker && broker.id) {
        const { error } = await supabase.from('broker_connections').delete().eq('id', broker.id);
        if (error) throw error;
      }
      
      setConnectedBrokers(prev => {
        const next = { ...prev };
        delete next[brokerName];
        return next;
      });
      showToast(`${brokerName} Disconnected`, 'info');
    } catch (err) {
      console.error("Failed to disconnect broker:", err);
      showToast("Failed to disconnect broker: " + err.message, 'error');
    }
  };

  // ── Auto-Sync Engine ──────────────────────────────────────────────────
  const syncBrokers = async () => {
    // Simulate 1.5s network latency for MVP mocking
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Live Positions Generation (2 active)
    const mockLivePositions = [
      { id: 'pos_1', broker: 'Dhan', asset: 'RELIANCE.NS', type: 'BUY', qty: 50, entryPrice: 2850.00, livePrice: 2875.50, pnl: 1275, market: 'Indian Market' },
      { id: 'pos_2', broker: 'Binance', asset: 'BTC-USD', type: 'SELL', qty: 0.5, entryPrice: 65000.00, livePrice: 64100.00, pnl: 450, market: 'Crypto' }
    ];
    setLivePositions(mockLivePositions);

    // Mock Closed Trades Normalization (3 closed trades)
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const mockClosedTrades = [
      { id: `sync_1_${Date.now()}`, asset: 'NIFTY_FUT', netPnl: 4500, brokerage: 40, pnlType: 'Profit', pnlAmount: 4500, time: '10:15', market: 'Indian Market', source: 'Dhan', mistakeTag: 'None', qty: 50, entryPrice: 22000, exitPrice: 22090 },
      { id: `sync_2_${Date.now()}`, asset: 'AAPL', netPnl: -120, brokerage: 2, pnlType: 'Loss', pnlAmount: 120, time: '20:30', market: 'US Market', source: 'Alpaca', mistakeTag: 'None', qty: 10, entryPrice: 175, exitPrice: 163 },
      { id: `sync_3_${Date.now()}`, asset: 'ETH-USD', netPnl: 320, brokerage: 1.5, pnlType: 'Profit', pnlAmount: 320, time: '04:20', market: 'Crypto', source: 'Binance', mistakeTag: 'None', qty: 2, entryPrice: 3400, exitPrice: 3560 }
    ];

    setJournalEntries(prev => {
      const updated = { ...prev };
      if (!updated[dateStr]) updated[dateStr] = [];
      
      updated[dateStr] = updated[dateStr].filter(t => !t.source); 
      updated[dateStr] = [...updated[dateStr], ...mockClosedTrades];
      return updated;
    });

    showToast('Brokers Synced Successfully', 'success');
  };

  return (
    <PortfolioContext.Provider value={{
      capitalINR, capitalUSD, setCapitalINR, setCapitalUSD, addCapital,
      orders, addOrder, closeOrder, editOrder, resetAll, user, processLivePrice,
      connectedBrokers, connectBroker, disconnectBroker, livePositions, syncBrokers,
      journalEntries, saveJournalTrades, bulkImportTrades
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside PortfolioProvider');
  return ctx;
}
