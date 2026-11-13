import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Activity, TrendingUp, TrendingDown, Target, Award, List, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import AssetDrilldownModal from './AssetDrilldownModal.jsx';
import DateDrilldownModal from './DateDrilldownModal.jsx';
import AssetLogo from './AssetLogo.jsx';

export default function DetailedAnalysis({ activeTab = 'overview', trades = [], sym = '₹', isAllTab = false, monthlyDeposits = {}, liveUsdInr = 84.5 }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Drill-down Modal States
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // 1. Normalize trades from both Portfolio (manual) and P-Trade (auto)
  const normalizedTrades = useMemo(() => {
    return trades.map(t => ({
      ...t,
      id: t.id || Math.random().toString(),
      asset: t.asset || t.ticker || 'Unknown',
      market: t.market || 'Unknown Market', // Used for All Tab Leaderboard
      pnl: parseFloat(t.netPnl) || parseFloat(t.pnl) || parseFloat(t.directPnl) || 0,
      timestamp: t.closedAt || t.timestamp || new Date().toISOString(),
      entry: parseFloat(t.entry) || parseFloat(t.entryPrice) || 0,
      exit: parseFloat(t.exit) || parseFloat(t.closePrice) || 0
    }));
  }, [trades]);

  // 2. Filter by date range
  const filteredTrades = useMemo(() => {
    return normalizedTrades.filter(t => {
      const tradeDate = new Date(t.timestamp);
      if (fromDate) {
        const fromD = new Date(fromDate);
        fromD.setHours(0, 0, 0, 0);
        if (tradeDate < fromD) return false;
      }
      if (toDate) {
        const toD = new Date(toDate);
        toD.setHours(23, 59, 59, 999);
        if (tradeDate > toD) return false;
      }
      return true;
    });
  }, [normalizedTrades, fromDate, toDate]);

  // 3. Analytics Engine
  const summary = useMemo(() => {
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;
    let grossWin = 0;
    let grossLoss = 0;
    let maxDrawdown = 0;
    let peakCapital = 0;
    let currentCapital = 0;

    // Streaks
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;

    let maxWin = { pnl: 0, asset: '' }; // strictly > 0
    let maxLoss = { pnl: 0, asset: '' }; // strictly < 0

    const byAsset = {};
    const dayMap = [0, 0, 0, 0, 0, 0, 0]; // Sun(0) to Sat(6)
    const byDay = {};

    // Sort chronologically for accurate drawdown/streaks
    const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedTrades.forEach(t => {
      totalPnl += t.pnl;
      
      // Capital & Drawdown
      currentCapital += t.pnl;
      if (currentCapital > peakCapital) peakCapital = currentCapital;
      const drawdown = peakCapital - currentCapital;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      // Day of Week Aggregation (Properly tracking specific days of week across date range)
      if (t.timestamp) {
        const dayOfWeekIndex = new Date(t.timestamp).getDay(); // 0-6 (Sun-Sat)
        dayMap[dayOfWeekIndex] += t.pnl;
      }

      if (t.pnl > 0) {
        wins++;
        grossWin += t.pnl;
        currentWinStreak++;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
        currentLossStreak = 0;
        
        // Single trade extremes
        if (t.pnl > maxWin.pnl) maxWin = { pnl: t.pnl, asset: t.asset, date: t.timestamp };
      } else if (t.pnl < 0) {
        losses++;
        grossLoss += Math.abs(t.pnl);
        currentLossStreak++;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
        currentWinStreak = 0;

        // Single trade extremes
        if (t.pnl < maxLoss.pnl) maxLoss = { pnl: t.pnl, asset: t.asset, date: t.timestamp };
      }

      // Group by Asset OR Market (if isAllTab is true)
      const groupKey = isAllTab ? t.market : t.asset;
      
      if (!byAsset[groupKey]) {
        byAsset[groupKey] = { asset: groupKey, pnl: 0, count: 0, wins: 0 };
      }
      byAsset[groupKey].pnl += t.pnl;
      byAsset[groupKey].count += 1;
      if (t.pnl >= 0) byAsset[groupKey].wins += 1;

      // By Day (Specific Dates)
      const dateStr = new Date(t.timestamp).toLocaleDateString();
      if (!byDay[dateStr]) {
        byDay[dateStr] = { date: dateStr, pnl: 0, assets: new Set() };
      }
      byDay[dateStr].pnl += t.pnl;
      byDay[dateStr].assets.add(t.asset);
    });

    const totalTrades = filteredTrades.length;
    
    // Equity Curve
    let runPnl = 0;
    const equityData = sortedTrades.map(t => {
      runPnl += t.pnl;
      return {
        date: new Date(t.timestamp).toLocaleDateString(),
        equity: runPnl
      };
    });

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const avgWin = wins > 0 ? grossWin / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const profitFactor = grossLoss > 0 ? (grossWin / grossLoss) : (grossWin > 0 ? Infinity : 0);

    const assetArr = Object.values(byAsset).sort((a, b) => b.pnl - a.pnl);
    
    const dayArr = Object.values(byDay).map(d => ({
      ...d,
      assets: Array.from(d.assets).join(', ')
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse(); // Newest first

    // Mon to Sun charting
    const chartDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Map standard getDay() [Sun(0) to Sat(6)] to [Mon to Sun]
    const mapping = [1, 2, 3, 4, 5, 6, 0]; 
    const dayChartData = chartDayNames.map((dayName, idx) => ({
      day: dayName,
      pnl: dayMap[mapping[idx]]
    }));

    const donutData = [
      { name: 'Wins', value: wins, color: '#10b981' },
      { name: 'Losses', value: losses, color: '#ef4444' }
    ];

    // Calculate Total Deposited within Date Range
    let totalDeposited = 0;
    Object.keys(monthlyDeposits).forEach(monthKey => {
      // monthKey is "YYYY-MM"
      const mDate = new Date(`${monthKey}-01T00:00:00Z`);
      const y = mDate.getUTCFullYear();
      const m = mDate.getUTCMonth();
      const lastDay = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));

      let include = true;
      if (fromDate) {
        const fromD = new Date(fromDate);
        fromD.setHours(0, 0, 0, 0);
        if (lastDay < fromD) include = false;
      }
      if (toDate) {
        const toD = new Date(toDate);
        toD.setHours(23, 59, 59, 999);
        if (mDate > toD) include = false;
      }

      if (include) {
        const depObj = monthlyDeposits[monthKey] || { INR: 0, USD: 0 };
        // Determine currency sum
        if (isAllTab) {
           // We'll assume DetailedAnalysis sym represents base currency mapping, but let's just 
           // use the liveUsdInr conversion directly based on the global display rules.
           // Actually `sym` is passed down. If sym is '₹', then allTabCurrency was 'INR'
           if (sym === '₹') {
             totalDeposited += depObj.INR + (depObj.USD * liveUsdInr);
           } else {
             totalDeposited += (depObj.INR / liveUsdInr) + depObj.USD;
           }
        } else {
           // Specific market tab
           if (sym === '₹') {
             totalDeposited += depObj.INR;
           } else {
             totalDeposited += depObj.USD;
           }
        }
      }
    });

    return {
      totalPnl,
      totalDeposited,
      totalTrades,
      wins,
      losses,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      maxWinStreak,
      maxLossStreak,
      assetArr,
      maxWin: maxWin.pnl > 0 ? maxWin : null,
      maxLoss: maxLoss.pnl < 0 ? maxLoss : null,
      dayArr,
      dayChartData,
      donutData,
      equityData
    };
  }, [filteredTrades, isAllTab, fromDate, toDate, monthlyDeposits, sym, liveUsdInr]);

  // Modals Data
  const assetTrades = useMemo(() => {
    if (!selectedAsset) return [];
    return filteredTrades.filter(t => (isAllTab ? t.market : t.asset) === selectedAsset);
  }, [filteredTrades, selectedAsset, isAllTab]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const isPositive = payload[0].value >= 0;
      return (
        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 p-2 rounded shadow-xl text-xs font-mono">
          <span className="text-gray-600 dark:text-slate-400">{payload[0].payload.day}: </span>
          <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
            {isPositive ? '+' : ''}{sym}{Math.abs(payload[0].value).toFixed(2)}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={18} className="text-teal-400" />
        <h2 className="text-sm font-bold text-gray-900 dark:text-slate-200">Detailed Analytics</h2>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-6 relative z-10">
        <div>
          <label className="block text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold mb-1">From Date</label>
          <input 
            type="date" 
            value={fromDate} 
            onChange={e => setFromDate(e.target.value)} 
            className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs px-2 py-1.5 rounded text-gray-800 dark:text-slate-200 focus:outline-none focus:border-teal-500" 
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold mb-1">To Date</label>
          <input 
            type="date" 
            value={toDate} 
            onChange={e => setToDate(e.target.value)} 
            className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs px-2 py-1.5 rounded text-gray-800 dark:text-slate-200 focus:outline-none focus:border-teal-500" 
          />
        </div>
        <button 
          onClick={() => { setFromDate(''); setToDate(''); }} 
          className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs px-3 py-1.5 rounded transition-colors border border-gray-200 dark:border-slate-700"
        >
          <RefreshCw size={12} />
          Reset Filters
        </button>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800">
          <p className="text-gray-500 dark:text-slate-400 text-sm">No trades found for this period.</p>
        </div>
      ) : (
        <>
          
          {activeTab === 'overview' && (
            <>
              {/* Equity Curve */}
              <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-slate-800 mb-4 h-64">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-4">Equity Curve</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.equityData}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v>=0?'+':''}${v}`} />
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                    <Area type="monotone" dataKey="equity" stroke="#14b8a6" fillOpacity={1} fill="url(#colorEquity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top Metrics Row */}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Total Deposited</span>
                <Target size={14} className="text-blue-400" />
              </div>
              <div className="text-xl font-bold font-mono text-blue-400">
                {sym}{summary.totalDeposited.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Total Net P&L</span>
                <Target size={14} className="text-blue-400" />
              </div>
              <div className={`text-xl font-bold font-mono ${summary.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {summary.totalPnl >= 0 ? '+' : ''}{sym}{Math.abs(summary.totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Win Rate</span>
                <Award size={14} className="text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-400">
                {summary.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Profit Factor</span>
                <TrendingUp size={14} className={summary.profitFactor >= 1 ? 'text-emerald-400' : 'text-orange-400'} />
              </div>
              <div className={`text-xl font-bold font-mono ${summary.profitFactor >= 1 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {summary.profitFactor.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Max Drawdown</span>
                <AlertTriangle size={14} className="text-red-400" />
              </div>
              <div className="text-xl font-bold font-mono text-red-400">
                {sym}{summary.maxDrawdown.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Gauge Chart: Wins vs Losses */}
            <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-4">Accuracy Distribution</h3>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.donutData}
                      cx="50%" cy="100%"
                      startAngle={180} endAngle={0}
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                    >
                      {summary.donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-2 text-center">
                  <div className="text-2xl font-bold font-mono text-gray-900 dark:text-slate-200">{summary.totalTrades}</div>
                  <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-widest">Total Trades</div>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-xs font-mono">
                <div className="text-emerald-400">{summary.wins} Wins</div>
                <div className="text-red-400">{summary.losses} Losses</div>
              </div>
            </div>

            {/* Bar Chart: Performance by Day */}
            <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-slate-800 lg:col-span-2 flex flex-col z-0">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-4">Performance By Day</h3>
              <div className="flex-1 min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.dayChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v>=0?'+':''}${v}`} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                    <Bar dataKey="pnl" radius={[4, 4, 4, 4]} maxBarSize={40} minPointSize={3} animationDuration={1000} isAnimationActive={true}>
                      {summary.dayChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? '#10b981' : entry.pnl < 0 ? '#ef4444' : '#64748b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Averages Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Max Profit</div>
                <div className="text-sm font-bold font-mono text-emerald-400">{summary.maxWin ? `+${sym}${summary.maxWin.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}</div>
              </div>
              <TrendingUp size={20} className="text-emerald-500/30" />
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg Win</div>
                <div className="text-sm font-bold font-mono text-emerald-400">+{sym}{summary.avgWin.toFixed(2)}</div>
              </div>
              <TrendingUp size={20} className="text-emerald-500/30" />
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg Loss</div>
                <div className="text-sm font-bold font-mono text-red-400">-{sym}{summary.avgLoss.toFixed(2)}</div>
              </div>
              <TrendingDown size={20} className="text-red-500/30" />
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Max Win Streak</div>
                <div className="text-sm font-bold font-mono text-emerald-400">{summary.maxWinStreak}</div>
              </div>
              <div className="flex gap-0.5">{Array.from({length: Math.min(summary.maxWinStreak, 5)}).map((_,i) => <div key={i} className="w-1.5 h-4 bg-emerald-500/50 rounded-sm"/>)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Max Loss Streak</div>
                <div className="text-sm font-bold font-mono text-red-400">{summary.maxLossStreak}</div>
              </div>
              <div className="flex gap-0.5">{Array.from({length: Math.min(summary.maxLossStreak, 5)}).map((_,i) => <div key={i} className="w-1.5 h-4 bg-red-500/50 rounded-sm"/>)}</div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              <Award size={16} className="text-amber-400" />
              <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {isAllTab ? 'Market Leaderboard' : 'Asset Leaderboard'} (Click to drill down)
              </h3>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold w-12 text-center">Rank</th>
                    <th className="p-3 font-semibold">{isAllTab ? 'Market' : 'Asset'}</th>
                    <th className="p-3 font-semibold text-center">Trades (W/L)</th>
                    <th className="p-3 font-semibold text-right">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {summary.assetArr.map((item, idx) => {
                    const isWin = item.pnl >= 0;
                    return (
                      <tr 
                        key={item.asset} 
                        onClick={() => setSelectedAsset(item.asset)}
                        className="hover:bg-blue-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        <td className="p-3 text-center font-bold text-gray-400 dark:text-slate-600">
                          {idx === 0 ? '🏆' : idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {!isAllTab && <AssetLogo symbol={item.asset} className="w-6 h-6 rounded" />}
                            <span className="font-bold text-gray-900 dark:text-slate-200 group-hover:text-blue-500 transition-colors">{item.asset}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-gray-600 dark:text-slate-400">
                          <span className="font-medium text-gray-900 dark:text-slate-300">{item.count}</span> <span className="text-[10px]">({item.wins}W/{item.count - item.wins}L)</span>
                        </td>
                        <td className={`p-3 text-right font-bold font-mono ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isWin ? '+' : ''}{sym}{item.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extremes */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">Single Trade Extremes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mb-1">Largest Win</div>
                {summary.maxWin ? (
                  <div 
                    onClick={() => !isAllTab && setSelectedAsset(summary.maxWin.asset)}
                    className={`flex justify-between items-center bg-gray-50 dark:bg-slate-900 border border-emerald-500/30 p-3 rounded-lg hover:border-emerald-500 transition-colors ${!isAllTab ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={summary.maxWin.asset} className="w-5 h-5 rounded-sm" />
                      <span className="font-bold text-xs text-gray-900 dark:text-slate-200">{summary.maxWin.asset}</span>
                    </div>
                    <span className="text-emerald-500 font-bold font-mono text-xs">+{sym}{summary.maxWin.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                ) : <div className="text-xs text-gray-500 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800/50">-</div>}
              </div>
              <div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mb-1">Largest Loss</div>
                {summary.maxLoss ? (
                  <div 
                    onClick={() => !isAllTab && setSelectedAsset(summary.maxLoss.asset)}
                    className={`flex justify-between items-center bg-gray-50 dark:bg-slate-900 border border-red-500/30 p-3 rounded-lg hover:border-red-500 transition-colors ${!isAllTab ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={summary.maxLoss.asset} className="w-5 h-5 rounded-sm" />
                      <span className="font-bold text-xs text-gray-900 dark:text-slate-200">{summary.maxLoss.asset}</span>
                    </div>
                    <span className="text-red-500 font-bold font-mono text-xs">-{sym}{Math.abs(summary.maxLoss.pnl).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                ) : <div className="text-xs text-gray-500 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800/50">-</div>}
              </div>
            </div>
          </div>

          {/* Day Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              <List size={16} className="text-blue-400" />
              <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Day-by-Day Breakdown (Click Date to drill down)</h3>
            </div>
            <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Instruments Traded</th>
                    <th className="p-3 font-semibold text-right">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {summary.dayArr.map(d => (
                    <tr key={d.date} className="hover:bg-blue-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-gray-900 dark:text-slate-300 font-medium whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedDate(d.date)}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-bold"
                        >
                          {d.date}
                        </button>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-slate-400 truncate max-w-[200px]">{d.assets}</td>
                      <td className={`p-3 text-right font-bold font-mono ${d.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {d.pnl >= 0 ? '+' : ''}{sym}{d.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Render Modals */}
      {selectedAsset && (
        <AssetDrilldownModal 
          asset={selectedAsset} 
          trades={assetTrades}
          sym={sym}
          isMarketView={isAllTab}
          onClose={() => setSelectedAsset(null)} 
        />
      )}

      {selectedDate && (
        <DateDrilldownModal 
          dateStr={selectedDate} 
          trades={filteredTrades} 
          sym={sym}
          onClose={() => setSelectedDate(null)} 
        />
      )}
      </>
      )}
    </div>
  );
}
