import React, { useMemo, useState } from 'react';
import TradingCalendar from './TradingCalendar.jsx';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, ReferenceLine, CartesianGrid
} from 'recharts';
import { Activity, Trophy, TrendingUp, AlertTriangle } from 'lucide-react';

export default function OverviewTab({ 
  trades, sym, monthlyDeposits,
  calYear, calMonth, setCalYear, setCalMonth, handleDayClick, 
  isAllTab, category, liveUsdInr, allTabCurrency, currentMonthDeposited, 
  monthlyPnl, journalEntries
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // 1. Data Aggregation Engine
  const data = useMemo(() => {
    let totalTrades = 0;
    let wins = 0;
    let losses = 0;
    let breakevens = 0;

    let grossProfit = 0;
    let grossLoss = 0;
    let maxProfit = 0;
    let maxLoss = 0;

    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let longs = 0;
    let shorts = 0;

    const createEmptyStats = () => ({ pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0, longs: 0, shorts: 0 });

    const dayStats = {
      Monday: createEmptyStats(),
      Tuesday: createEmptyStats(),
      Wednesday: createEmptyStats(),
      Thursday: createEmptyStats(),
      Friday: createEmptyStats(),
      Saturday: createEmptyStats(),
      Sunday: createEmptyStats(),
    };

    const monthlyStats = {};
    const yearStats = {};
    const hourlyStats = {};
    const monthWeekStats = {
      'Week 1 (1-7)': createEmptyStats(),
      'Week 2 (8-14)': createEmptyStats(),
      'Week 3 (15-21)': createEmptyStats(),
      'Week 4 (22+)': createEmptyStats(),
    };
    const dailyPnLMap = {}; 
    const availableMonths = new Set();
    
    for(let i=0; i<24; i++) hourlyStats[i] = createEmptyStats();

    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let cumulativePnL = 0;
    let peakPnL = 0;
    let maxDrawdown = 0;

    sortedTrades.forEach(t => {
      totalTrades++;
      const pnl = parseFloat(t.pnl) || 0;
      
      if (pnl > 0) {
        wins++;
        grossProfit += pnl;
        if (pnl > maxProfit) maxProfit = pnl;
        
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (pnl < 0) {
        losses++;
        grossLoss += pnl;
        if (pnl < maxLoss) maxLoss = pnl;
        
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      } else {
        breakevens++;
        currentWinStreak = 0;
        currentLossStreak = 0;
      }

      if (t.side === 'Buy') longs++;
      if (t.side === 'Sell') shorts++;

      cumulativePnL += pnl;
      if (cumulativePnL > peakPnL) peakPnL = cumulativePnL;
      
      const currentDrawdown = peakPnL - cumulativePnL;
      if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

      const dateObj = new Date(t.timestamp);
      
      // Weekday
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[dateObj.getDay()];
      dayStats[dayName].trades++;
      dayStats[dayName].pnl += pnl;
      if (pnl > 0) { dayStats[dayName].profit += pnl; dayStats[dayName].wins++; }
      else if (pnl < 0) { dayStats[dayName].loss += Math.abs(pnl); dayStats[dayName].losses++; }
      else dayStats[dayName].be++;
      if (t.side === 'Buy') dayStats[dayName].longs++;
      if (t.side === 'Sell') dayStats[dayName].shorts++;

      const dateKey = dateObj.toISOString().split('T')[0];
      dailyPnLMap[dateKey] = (dailyPnLMap[dateKey] || 0) + pnl;

      // Month
      const monthKey = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getFullYear()}`;
      if (!monthlyStats[monthKey]) monthlyStats[monthKey] = createEmptyStats();
      monthlyStats[monthKey].trades++;
      monthlyStats[monthKey].pnl += pnl;
      if (pnl > 0) { monthlyStats[monthKey].profit += pnl; monthlyStats[monthKey].wins++; }
      else if (pnl < 0) { monthlyStats[monthKey].loss += Math.abs(pnl); monthlyStats[monthKey].losses++; }
      else monthlyStats[monthKey].be++;
      if (t.side === 'Buy') monthlyStats[monthKey].longs++;
      if (t.side === 'Sell') monthlyStats[monthKey].shorts++;

      // Year
      const yearKey = dateObj.getFullYear();
      if (!yearStats[yearKey]) yearStats[yearKey] = createEmptyStats();
      yearStats[yearKey].trades++;
      yearStats[yearKey].pnl += pnl;
      if (pnl > 0) { yearStats[yearKey].profit += pnl; yearStats[yearKey].wins++; }
      else if (pnl < 0) { yearStats[yearKey].loss += Math.abs(pnl); yearStats[yearKey].losses++; }
      else yearStats[yearKey].be++;
      if (t.side === 'Buy') yearStats[yearKey].longs++;
      if (t.side === 'Sell') yearStats[yearKey].shorts++;

      // Hourly
      const hour = dateObj.getHours();
      hourlyStats[hour].trades++;
      hourlyStats[hour].pnl += pnl;
      if (pnl > 0) hourlyStats[hour].wins++;
      else if (pnl < 0) hourlyStats[hour].losses++;
      else hourlyStats[hour].be++;
      if (t.side === 'Buy') hourlyStats[hour].longs++;
      if (t.side === 'Sell') hourlyStats[hour].shorts++;

      // Month-Week Drilldown
      const tradeMonthRaw = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      availableMonths.add(tradeMonthRaw);
      if (tradeMonthRaw === selectedMonth) {
        const d = dateObj.getDate();
        let weekKey = 'Week 4 (22+)';
        if (d <= 7) weekKey = 'Week 1 (1-7)';
        else if (d <= 14) weekKey = 'Week 2 (8-14)';
        else if (d <= 21) weekKey = 'Week 3 (15-21)';
        
        monthWeekStats[weekKey].trades++;
        monthWeekStats[weekKey].pnl += pnl;
        if (pnl > 0) { monthWeekStats[weekKey].profit += pnl; monthWeekStats[weekKey].wins++; }
        else if (pnl < 0) { monthWeekStats[weekKey].loss += Math.abs(pnl); monthWeekStats[weekKey].losses++; }
        else monthWeekStats[weekKey].be++;
        if (t.side === 'Buy') monthWeekStats[weekKey].longs++;
        if (t.side === 'Sell') monthWeekStats[weekKey].shorts++;
      }
    });

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const avgWin = wins > 0 ? (grossProfit / wins) : 0;
    const avgLoss = losses > 0 ? (grossLoss / losses) : 0;
    const totalNetPnL = grossProfit + grossLoss;
    const profitFactor = Math.abs(grossLoss) > 0 ? (grossProfit / Math.abs(grossLoss)) : (grossProfit > 0 ? 99.99 : 0);

    const totalDeposited = Object.values(monthlyDeposits || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const avgTradePnL = totalTrades > 0 ? totalNetPnL / totalTrades : 0;
    const lossRate = totalTrades > 0 ? (losses / totalTrades) : 0;
    const tradeExpectancy = totalTrades > 0 ? ((wins / totalTrades) * avgWin) - (lossRate * Math.abs(avgLoss)) : 0;

    let bestDayProfit = 0;
    let worstDayLoss = 0;
    let totalWinningDayPnL = 0;
    let totalLosingDayPnL = 0;
    let winningDaysCount = 0;
    let losingDaysCount = 0;

    Object.values(dailyPnLMap).forEach(pnl => {
      if (pnl > bestDayProfit) bestDayProfit = pnl;
      if (pnl < worstDayLoss) worstDayLoss = pnl;
      if (pnl > 0) { totalWinningDayPnL += pnl; winningDaysCount++; } 
      else if (pnl < 0) { totalLosingDayPnL += pnl; losingDaysCount++; }
    });

    const avgWinningDayPnL = winningDaysCount > 0 ? totalWinningDayPnL / winningDaysCount : 0;
    const avgLosingDayPnL = losingDaysCount > 0 ? totalLosingDayPnL / losingDaysCount : 0;

    let bestMonth = { name: '-', pnl: 0 };
    let worstMonth = { name: '-', pnl: 0 };
    Object.keys(monthlyStats).forEach(key => {
      const pnl = monthlyStats[key].pnl;
      if (pnl > bestMonth.pnl || bestMonth.name === '-') bestMonth = { name: key, pnl };
      if (pnl < worstMonth.pnl || worstMonth.name === '-') worstMonth = { name: key, pnl };
    });

    const buildTableData = (statsObj, labelMapper) => {
      return Object.keys(statsObj).map(key => {
        const d = statsObj[key];
        return {
          name: labelMapper ? labelMapper(key) : key,
          fullName: key,
          pnl: d.pnl,
          profit: d.profit || 0,
          loss: d.loss || 0,
          trades: d.trades,
          winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
          wins: d.wins,
          losses: d.losses,
          be: d.be,
          longs: d.longs,
          shorts: d.shorts
        };
      });
    };

    const orderedDayData = [
      dayStats['Monday'], dayStats['Tuesday'], dayStats['Wednesday'], 
      dayStats['Thursday'], dayStats['Friday'], dayStats['Saturday'], dayStats['Sunday']
    ].map((d, i) => ({
      name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      fullName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
      ...d,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0
    }));

    const monthData = buildTableData(monthlyStats);
    const yearData = buildTableData(yearStats);
    
    const hourData = Object.keys(hourlyStats).map(h => ({
      name: `${h}:00`,
      ...hourlyStats[h]
    }));

    const monthWeekData = Object.keys(monthWeekStats).map(d => ({
      name: d,
      fullName: d,
      pnl: monthWeekStats[d].pnl,
      profit: monthWeekStats[d].profit,
      loss: monthWeekStats[d].loss,
      trades: monthWeekStats[d].trades,
      wins: monthWeekStats[d].wins,
      losses: monthWeekStats[d].losses,
      be: monthWeekStats[d].be,
      longs: monthWeekStats[d].longs,
      shorts: monthWeekStats[d].shorts,
      winRate: monthWeekStats[d].trades > 0 ? (monthWeekStats[d].wins / monthWeekStats[d].trades) * 100 : 0
    }));

    return { 
      totalTrades, wins, losses, breakevens, winRate, 
      totalDeposited, totalNetPnL, profitFactor, maxDrawdown,
      maxProfit, maxLoss, avgWin, avgLoss, grossProfit, grossLoss,
      avgTradePnL, tradeExpectancy, avgWinningDayPnL, avgLosingDayPnL,
      bestDayProfit, worstDayLoss, bestMonth, worstMonth,
      maxWinStreak, maxLossStreak, longs, shorts,
      availableMonths: Array.from(availableMonths).sort().reverse(),
      dayData: orderedDayData, monthData, yearData, monthWeekData, hourData 
    };
  }, [trades, monthlyDeposits, selectedMonth]);

  const gaugeData = [
    { name: 'Wins', value: data.wins, fill: '#10b981' },
    { name: 'Losses', value: data.losses, fill: '#ef4444' },
    { name: 'Breakeven', value: data.breakevens, fill: '#3b82f6' }
  ];

  const RADIAN = Math.PI / 180;
  const needleAngle = 180 - (data.winRate * 1.8);
  const cx = 150;
  const cy = 120;
  const r = 100;
  const xba = cx + r * Math.cos(needleAngle * RADIAN);
  const yba = cy - r * Math.sin(needleAngle * RADIAN);

  const formatYAxisAmount = (val) => `${val >= 0 ? '+' : ''}${sym}${Intl.NumberFormat('en-US', { notation: 'compact' }).format(Math.abs(val))}`;
  const formatXAxisAmount = (val) => `${val >= 0 ? '+' : ''}${sym}${Intl.NumberFormat('en-US', { notation: 'compact' }).format(Math.abs(val))}`;

  // -------------------------------------------------------------
  // REUSABLE COMPONENTS
  // -------------------------------------------------------------

  const SectionWrapper = ({ title, headerRight, children }) => (
    <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700 min-h-[500px]">
      <div className="flex justify-between items-end border-b border-slate-700/50 pb-4 mb-6">
        <h2 className="text-xl font-black text-white">{title}</h2>
        {headerRight && <div>{headerRight}</div>}
      </div>
      {children}
    </div>
  );

  const SummaryTable = ({ rowData }) => (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-700/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <th className="py-3 px-4">Period</th>
            <th className="py-3 px-4">Net P&L</th>
            <th className="py-3 px-4 text-center">Winning %</th>
            <th className="py-3 px-4 text-right">Total Profit</th>
            <th className="py-3 px-4 text-right">Total Loss</th>
            <th className="py-3 px-4 text-center">Trades</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {rowData.map(d => (
            <tr key={d.name} className="hover:bg-slate-800/40 transition-colors text-sm">
              <td className="py-4 px-4 font-bold text-slate-200">{d.fullName || d.name}</td>
              <td className={`py-4 px-4 font-bold font-mono ${d.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {d.pnl >= 0 ? '+' : ''}{sym}{Math.abs(d.pnl).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
              </td>
              <td className="py-4 px-4 w-48">
                 <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
                    <div className="flex-1 flex justify-end bg-slate-800 border-r border-slate-900">
                      <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${(d.losses / Math.max(d.trades, 1)) * 100}%` }}></div>
                    </div>
                    <div className="flex-1 flex justify-start bg-slate-800">
                      <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(d.wins / Math.max(d.trades, 1)) * 100}%` }}></div>
                    </div>
                 </div>
                 <div className="text-[10px] text-center mt-1 text-slate-400 flex justify-between px-2">
                   <span className="text-red-400">{d.losses}L</span>
                   <span>{d.winRate.toFixed(1)}%</span>
                   <span className="text-emerald-400">{d.wins}W</span>
                 </div>
              </td>
              <td className="py-4 px-4 text-right font-mono text-emerald-400">{sym}{d.profit.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
              <td className="py-4 px-4 text-right font-mono text-red-400">{sym}{d.loss.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
              <td className="py-4 px-4 text-center font-bold text-slate-300">{d.trades}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CustomPerformanceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-lg shadow-xl text-xs min-w-[150px]">
          <p className="font-bold text-slate-200 mb-3 text-sm">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between gap-4 border-b border-[#1e293b] pb-2">
              <span className="text-slate-400">% Inc/Dec:</span>
              <span className={`font-mono font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.pnl >= 0 ? 'Increase' : 'Decrease'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Total Profit:</span>
              <span className="font-mono text-emerald-400">
                +{sym}{(data.profit || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Total Loss:</span>
              <span className="font-mono text-red-400">
                -{sym}{(data.loss || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-[#1e293b]">
              <span className="text-slate-400">Net P&L:</span>
              <span className={`font-mono font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.pnl >= 0 ? '+' : '-'}{sym}{Math.abs(data.pnl).toLocaleString('en-IN', {minimumFractionDigits:2})}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDistributionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-lg shadow-xl text-xs min-w-[150px]">
          <p className="font-bold text-slate-200 mb-3 text-sm">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Total Trades:</span>
              <span className="font-mono font-bold text-slate-200">{data.trades}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-[#1e293b]">
              <span className="text-slate-400">Wins:</span>
              <span className="font-mono text-emerald-400">{data.wins}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Losses:</span>
              <span className="font-mono text-red-400">{data.losses}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-[#1e293b]">
              <span className="text-slate-400">Buy Trades:</span>
              <span className="font-mono text-blue-400">{data.longs || 0}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Sell Trades:</span>
              <span className="font-mono text-purple-400">{data.shorts || 0}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Style 1: Horizontal Diverging (Y is category, X is number)
  const Style1_HorizontalDiverging = ({ chartData }) => (
    <div className="card p-6  flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg rounded-lg">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Performance</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} tickFormatter={formatXAxisAmount} />
          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} width={80} />
          <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={<CustomPerformanceTooltip />} />
          <ReferenceLine x={0} stroke="#475569" />
          <Bar dataKey="pnl" isAnimationActive={true} animationDuration={1000} radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Style 2: Vertical Bar (X is category, Y is number)
  const Style2_VerticalBar = ({ chartData }) => (
    <div className="card p-6  flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg rounded-lg">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Performance</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="horizontal" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
          <YAxis type="number" width={60} stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} tickFormatter={formatYAxisAmount} />
          <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={<CustomPerformanceTooltip />} />
          <ReferenceLine y={0} stroke="#475569" />
          <Bar dataKey="pnl" isAnimationActive={true} animationDuration={1000} radius={[4, 4, 0, 0]} maxBarSize={50}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Style 3: Horizontal 100% Stacked (Y is category, X is number hidden)
  const Style3_HorizontalStacked = ({ chartData }) => (
    <div className="card p-6  flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg rounded-lg">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Distribution</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" stackOffset="expand" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} vertical={false} />
          <XAxis type="number" hide={true} />
          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} width={80} />
          <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={<CustomDistributionTooltip />} />
          <Bar dataKey="wins" name="Wins" stackId="a" fill="#10b981" isAnimationActive={true} animationDuration={1000} barSize={25} />
          <Bar dataKey="losses" name="Losses" stackId="a" fill="#ef4444" isAnimationActive={true} animationDuration={1000} barSize={25} />
          <Bar dataKey="be" name="Break Evens" stackId="a" fill="#3b82f6" isAnimationActive={true} animationDuration={1000} barSize={25} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Style 4: Grouped Vertical (X is category, Y is number)
  const Style4_GroupedVertical = ({ chartData }) => (
    <div className="card p-6  flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg rounded-lg">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Distribution</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="horizontal" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
          <YAxis type="number" width={40} stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={<CustomDistributionTooltip />} />
          <Bar dataKey="wins" name="Wins" fill="#10b981" isAnimationActive={true} animationDuration={1000} radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="losses" name="Losses" fill="#ef4444" isAnimationActive={true} animationDuration={1000} radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="be" name="Break Evens" fill="#3b82f6" isAnimationActive={true} animationDuration={1000} radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const MasterLayout = ({ chartData }) => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Style2_VerticalBar chartData={chartData} />
        <Style4_GroupedVertical chartData={chartData} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">Summary</h3>
      <SummaryTable rowData={chartData} />
    </>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      
      <TradingCalendar
        calYear={calYear} calMonth={calMonth} setCalYear={setCalYear} setCalMonth={setCalMonth}
        handleDayClick={handleDayClick} isAllTab={isAllTab} category={category} sym={sym}
        liveUsdInr={liveUsdInr} allTabCurrency={allTabCurrency} currentMonthDeposited={currentMonthDeposited}
        monthlyPnl={monthlyPnl} journalEntries={journalEntries}
      />

      {/* ROW 1: Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Deposited</span>
            <div className="text-blue-500/50"><Activity size={14} /></div>
          </div>
          <span className="text-xl font-bold text-blue-400 mt-2 font-mono">{sym}{data.totalDeposited.toLocaleString('en-IN')}</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Net P&L</span>
            <div className="text-emerald-500/50"><Activity size={14} /></div>
          </div>
          <span className={`text-xl font-bold mt-2 font-mono ${data.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.totalNetPnL >= 0 ? '+' : ''}{sym}{Math.abs(data.totalNetPnL).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Win Rate</span>
            <div className="text-amber-500/50"><Trophy size={14} /></div>
          </div>
          <span className="text-xl font-bold text-amber-400 mt-2 font-mono">{data.winRate.toFixed(1)}%</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profit Factor</span>
            <div className="text-emerald-500/50"><TrendingUp size={14} /></div>
          </div>
          <span className="text-xl font-bold text-emerald-400 mt-2 font-mono">{data.profitFactor.toFixed(2)}</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Drawdown</span>
            <div className="text-red-500/50"><AlertTriangle size={14} /></div>
          </div>
          <span className="text-xl font-bold text-red-400 mt-2 font-mono">
            -{sym}{data.maxDrawdown.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </span>
        </div>
      </div>

      {/* ROW 2: 3 Detailed Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border border-slate-800 bg-slate-900/60 shadow-xl rounded-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-6">P&L Statistics</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div className="border-b border-slate-800/60 pb-3">
              <div className="text-[11px] text-slate-400 mb-1">Avg Trade P&L</div>
              <div className={`font-mono text-base font-semibold ${data.avgTradePnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.avgTradePnL >= 0 ? '+' : '-'}{sym}{Math.abs(data.avgTradePnL).toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-3">
              <div className="text-[11px] text-slate-400 mb-1">Trade Expectancy</div>
              <div className={`font-mono text-base font-semibold ${data.tradeExpectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{sym}{data.tradeExpectancy.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1">Avg Win</div>
              <div className="font-mono text-base font-semibold text-emerald-400">+{sym}{data.avgWin.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1">Avg Loss</div>
              <div className="font-mono text-base font-semibold text-red-400">{data.avgLoss < 0 ? '-' : ''}{sym}{Math.abs(data.avgLoss).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="card p-6 border border-slate-800 bg-slate-900/60 shadow-xl rounded-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-6">Performance Extremes</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div className="border-b border-slate-800/60 pb-3">
              <div className="text-[11px] text-slate-400 mb-1">Best Day Profit</div>
              <div className="font-mono text-base font-semibold text-emerald-400">{sym}{data.bestDayProfit.toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-3">
              <div className="text-[11px] text-slate-400 mb-1">Worst Day Loss</div>
              <div className="font-mono text-base font-semibold text-red-400">{data.worstDayLoss < 0 ? '-' : ''}{sym}{Math.abs(data.worstDayLoss).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1">Best Month ({data.bestMonth.name})</div>
              <div className={`font-mono text-base font-semibold ${data.bestMonth.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.bestMonth.pnl >= 0 ? '' : '-'}{sym}{Math.abs(data.bestMonth.pnl).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1">Worst Month ({data.worstMonth.name})</div>
              <div className={`font-mono text-base font-semibold ${data.worstMonth.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.worstMonth.pnl >= 0 ? '' : '-'}{sym}{Math.abs(data.worstMonth.pnl).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="card p-6 border border-slate-800 bg-slate-900/60 shadow-xl rounded-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-6">Streaks & Averages</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div className="border-b border-slate-800/60 pb-3">
              <div className="text-[11px] text-slate-400 mb-1">Max Win Streak</div>
              <div className="font-mono text-base font-semibold text-emerald-400">{data.maxWinStreak}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-3">
              <div className="text-[11px] text-slate-400 mb-1">Max Loss Streak</div>
              <div className="font-mono text-base font-semibold text-red-400">{data.maxLossStreak}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1">Avg Winning Day</div>
              <div className="font-mono text-base font-semibold text-emerald-400">{sym}{data.avgWinningDayPnL.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1">Avg Losing Day</div>
              <div className="font-mono text-base font-semibold text-red-400">{data.avgLosingDayPnL < 0 ? '-' : ''}{sym}{Math.abs(data.avgLosingDayPnL).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: 2 Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col ">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Accuracy Distribution</h3>
          <div className="relative flex-1 w-full flex items-center justify-center">
            <div className="w-[300px] h-[150px] relative">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={gaugeData} cx="50%" cy={120} startAngle={180} endAngle={0} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none" />
                </PieChart>
              </ResponsiveContainer>
              {data.totalTrades > 0 && (
                <svg className="absolute top-0 left-0 w-full h-full">
                  <line x1="50%" y1={120} x2={xba} y2={yba} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="50%" cy={120} r="6" fill="#94a3b8" />
                </svg>
              )}
              <div className="absolute bottom-0 w-full text-center flex flex-col items-center justify-end pb-4">
                <span className="text-2xl font-black text-white">{data.totalTrades}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Trades</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end px-4 w-full">
            <span className="text-sm font-bold text-emerald-500">{data.wins} Wins</span>
            <span className="text-sm font-bold text-red-500">{data.losses} Losses</span>
          </div>
        </div>

        <div className="card p-6 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col ">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Directional Eval (Buy/Sell)</h3>
          <div className="relative flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[{ name: 'Buy', value: data.longs, fill: '#3b82f6' }, { name: 'Sell', value: data.shorts, fill: '#8b5cf6' }]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none"
                />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }} formatter={(val, name) => [`${val} Trades`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-2xl font-black text-white">{data.longs + data.shorts}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">B/S Trades</span>
            </div>
          </div>
          <div className="flex justify-between items-end px-4 w-full">
            <span className="text-sm font-bold text-blue-500">{data.longs} Buy</span>
            <span className="text-sm font-bold text-purple-500">{data.shorts} Sell</span>
          </div>
        </div>
      </div>

      {/* ROW 4+: PREMIUM TIMEFRAME SECTIONS */}

      <SectionWrapper title="1. Weekday Analysis">
        <MasterLayout chartData={data.dayData} />
      </SectionWrapper>

      <SectionWrapper title="2. Monthly Analysis">
        <MasterLayout chartData={data.monthData} />
      </SectionWrapper>

      <SectionWrapper title="3. Yearly Analysis">
        <MasterLayout chartData={data.yearData} />
      </SectionWrapper>

      

      <SectionWrapper title="5. Intraday Analysis (Hourly)">
        {/* Strictly Performance Chart Only */}
        <div className="w-full">
          <Style2_VerticalBar chartData={data.hourData} />
        </div>
      </SectionWrapper>

    </div>
  );
}
