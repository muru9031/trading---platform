import os

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\OverviewTab.jsx"

jsx_content = """import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, ReferenceLine, CartesianGrid
} from 'recharts';
import { Activity, Trophy, TrendingUp, AlertTriangle } from 'lucide-react';

export default function OverviewTab({ trades, sym, monthlyDeposits }) {
  // 0. State for Daily Drilldown
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

    const dayStats = {
      Monday: { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 },
      Tuesday: { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 },
      Wednesday: { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 },
      Thursday: { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 },
      Friday: { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 },
      Saturday: { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 },
      Sunday: { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 },
    };

    const monthlyStats = {};
    const yearStats = {};
    const hourlyStats = {};
    const monthDaysStats = {};
    const dailyPnLMap = {}; 
    const availableMonths = new Set();
    
    for(let i=0; i<24; i++) hourlyStats[i] = { pnl: 0, trades: 0, wins: 0, losses: 0, be: 0 };
    for(let i=1; i<=31; i++) monthDaysStats[i] = { pnl: 0, trades: 0, wins: 0, losses: 0, be: 0 };

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
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[dateObj.getDay()];
      
      dayStats[dayName].trades++;
      dayStats[dayName].pnl += pnl;
      if (pnl > 0) { dayStats[dayName].profit += pnl; dayStats[dayName].wins++; }
      else if (pnl < 0) { dayStats[dayName].loss += Math.abs(pnl); dayStats[dayName].losses++; }
      else dayStats[dayName].be++;

      const dateKey = dateObj.toISOString().split('T')[0];
      dailyPnLMap[dateKey] = (dailyPnLMap[dateKey] || 0) + pnl;

      // Month
      const monthKey = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getFullYear()}`;
      if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 };
      monthlyStats[monthKey].trades++;
      monthlyStats[monthKey].pnl += pnl;
      if (pnl > 0) { monthlyStats[monthKey].profit += pnl; monthlyStats[monthKey].wins++; }
      else if (pnl < 0) { monthlyStats[monthKey].loss += Math.abs(pnl); monthlyStats[monthKey].losses++; }
      else monthlyStats[monthKey].be++;

      // Year
      const yearKey = dateObj.getFullYear();
      if (!yearStats[yearKey]) yearStats[yearKey] = { pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0 };
      yearStats[yearKey].trades++;
      yearStats[yearKey].pnl += pnl;
      if (pnl > 0) { yearStats[yearKey].profit += pnl; yearStats[yearKey].wins++; }
      else if (pnl < 0) { yearStats[yearKey].loss += Math.abs(pnl); yearStats[yearKey].losses++; }
      else yearStats[yearKey].be++;

      // Hourly
      const hour = dateObj.getHours();
      hourlyStats[hour].trades++;
      hourlyStats[hour].pnl += pnl;
      if (pnl > 0) hourlyStats[hour].wins++;
      else if (pnl < 0) hourlyStats[hour].losses++;
      else hourlyStats[hour].be++;

      // Daily Drilldown (1-31)
      const tradeMonthRaw = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      availableMonths.add(tradeMonthRaw);
      if (tradeMonthRaw === selectedMonth) {
        const d = dateObj.getDate();
        monthDaysStats[d].trades++;
        monthDaysStats[d].pnl += pnl;
        if (pnl > 0) monthDaysStats[d].wins++;
        else if (pnl < 0) monthDaysStats[d].losses++;
        else monthDaysStats[d].be++;
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
          be: d.be
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
      pnl: hourlyStats[h].pnl,
      trades: hourlyStats[h].trades,
      wins: hourlyStats[h].wins,
      losses: hourlyStats[h].losses,
      be: hourlyStats[h].be
    }));

    const monthDaysData = Object.keys(monthDaysStats).map(d => ({
      name: d,
      pnl: monthDaysStats[d].pnl,
      trades: monthDaysStats[d].trades,
      wins: monthDaysStats[d].wins,
      losses: monthDaysStats[d].losses,
      be: monthDaysStats[d].be
    }));

    return { 
      totalTrades, wins, losses, breakevens, winRate, 
      totalDeposited, totalNetPnL, profitFactor, maxDrawdown,
      maxProfit, maxLoss, avgWin, avgLoss, grossProfit, grossLoss,
      avgTradePnL, tradeExpectancy, avgWinningDayPnL, avgLosingDayPnL,
      bestDayProfit, worstDayLoss, bestMonth, worstMonth,
      maxWinStreak, maxLossStreak, longs, shorts,
      availableMonths: Array.from(availableMonths).sort().reverse(),
      dayData: orderedDayData, monthData, yearData, monthDaysData, hourData 
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

  const formatYAxis = (val) => `${val >= 0 ? '+' : ''}${sym}${Intl.NumberFormat('en-US', { notation: 'compact' }).format(Math.abs(val))}`;

  // Helper for Summary Tables
  const SummaryTable = ({ title, rowData }) => (
    <div className="card p-6 overflow-x-auto border border-slate-800 bg-[#0f172a] shadow-lg mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{title} Summary</h3>
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
                      <div className="bg-red-500 h-full transition-all" style={{ width: `${(d.losses / Math.max(d.trades, 1)) * 100}%` }}></div>
                    </div>
                    <div className="flex-1 flex justify-start bg-slate-800">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(d.wins / Math.max(d.trades, 1)) * 100}%` }}></div>
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

  // Helper for Chart Rows
  const ChartRow = ({ title, chartData }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Chart (Diverging) */}
      <div className="card p-6 h-[300px] flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Performance {title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
            <YAxis width={80} stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
              formatter={(val) => [`${sym}${val.toFixed(2)}`, 'Net P&L']}
            />
            <ReferenceLine y={0} stroke="#475569" />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Chart (Grouped) */}
      <div className="card p-6 h-[300px] flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Distribution {title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
            <YAxis width={40} stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
            />
            <Bar dataKey="wins" name="Wins" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="losses" name="Losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="be" name="Break Evens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      
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

      {/* ROW 2: Additional Top Metrics (From Image 4) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Profit</span>
            <div className="text-emerald-500/50"><TrendingUp size={14} /></div>
          </div>
          <span className="text-xl font-bold text-emerald-400 mt-2 font-mono">+{sym}{data.maxProfit.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Win</span>
            <div className="text-emerald-500/50"><TrendingUp size={14} /></div>
          </div>
          <span className="text-xl font-bold text-emerald-400 mt-2 font-mono">+{sym}{data.avgWin.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Loss</span>
            <div className="text-red-500/50"><TrendingUp size={14} /></div>
          </div>
          <span className="text-xl font-bold text-red-400 mt-2 font-mono">
            {data.avgLoss < 0 ? '-' : ''}{sym}{Math.abs(data.avgLoss).toLocaleString('en-IN', {minimumFractionDigits:2})}
          </span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Win Streak</span>
            <div className="text-emerald-500/50"><Trophy size={14} /></div>
          </div>
          <span className="text-xl font-bold text-emerald-400 mt-2 font-mono">{data.maxWinStreak}</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Loss Streak</span>
            <div className="text-red-500/50"><AlertTriangle size={14} /></div>
          </div>
          <span className="text-xl font-bold text-red-400 mt-2 font-mono">{data.maxLossStreak}</span>
        </div>
      </div>

      {/* ROW 3: Donuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-6 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col min-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Accuracy Distribution</h3>
          <div className="relative flex-1 w-full flex items-center justify-center mt-4">
            <div className="w-[300px] h-[150px] relative">
              <ResponsiveContainer width="100%" height="100%">
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
          <div className="flex justify-between items-end mt-4 px-4 w-full">
            <span className="text-sm font-bold text-emerald-500">{data.wins} Wins</span>
            <span className="text-sm font-bold text-red-500">{data.losses} Losses</span>
          </div>
        </div>

        <div className="card p-6 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col min-h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Directional Eval (Buy/Sell)</h3>
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

      {/* ROW 4: Detailed Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-6 border border-slate-800 bg-slate-900 shadow-xl rounded-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-6">P&L Statistics</h3>
          <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Avg Trade P&L</div>
              <div className={`font-mono text-base font-semibold ${data.avgTradePnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.avgTradePnL >= 0 ? '+' : '-'}{sym}{Math.abs(data.avgTradePnL).toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Trade Expectancy</div>
              <div className={`font-mono text-base font-semibold ${data.tradeExpectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{sym}{data.tradeExpectancy.toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Avg Winning Day P&L</div>
              <div className="font-mono text-base font-semibold text-emerald-400">{sym}{data.avgWinningDayPnL.toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Avg Losing Day P&L</div>
              <div className="font-mono text-base font-semibold text-red-400">{data.avgLosingDayPnL < 0 ? '-' : ''}{sym}{Math.abs(data.avgLosingDayPnL).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="card p-6 border border-slate-800 bg-slate-900 shadow-xl rounded-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-6">Performance Extremes</h3>
          <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Best Day Profit</div>
              <div className="font-mono text-base font-semibold text-emerald-400">{sym}{data.bestDayProfit.toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Worst Day Loss</div>
              <div className="font-mono text-base font-semibold text-red-400">{data.worstDayLoss < 0 ? '-' : ''}{sym}{Math.abs(data.worstDayLoss).toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Best Month ({data.bestMonth.name})</div>
              <div className={`font-mono text-base font-semibold ${data.bestMonth.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.bestMonth.pnl >= 0 ? '' : '-'}{sym}{Math.abs(data.bestMonth.pnl).toFixed(2)}</div>
            </div>
            <div className="border-b border-slate-800/60 pb-4">
              <div className="text-[11px] text-slate-400 mb-1">Worst Month ({data.worstMonth.name})</div>
              <div className={`font-mono text-base font-semibold ${data.worstMonth.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.worstMonth.pnl >= 0 ? '' : '-'}{sym}{Math.abs(data.worstMonth.pnl).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 5: Weekday Analysis */}
      <div>
        <h2 className="text-xl font-black text-white mb-6 border-b border-slate-800 pb-2">1. Weekday Analysis</h2>
        <SummaryTable title="Weekday" rowData={data.dayData} />
        <ChartRow title="by Weekday" chartData={data.dayData} />
      </div>

      {/* ROW 6: Monthly Analysis */}
      <div>
        <h2 className="text-xl font-black text-white mb-6 border-b border-slate-800 pb-2">2. Monthly Analysis</h2>
        <SummaryTable title="Monthly" rowData={data.monthData} />
        <ChartRow title="by Month" chartData={data.monthData} />
      </div>

      {/* ROW 7: Yearly Analysis */}
      <div>
        <h2 className="text-xl font-black text-white mb-6 border-b border-slate-800 pb-2">3. Yearly Analysis</h2>
        <SummaryTable title="Yearly" rowData={data.yearData} />
        <ChartRow title="by Year" chartData={data.yearData} />
      </div>

      {/* ROW 8: Daily Drilldown */}
      <div>
        <div className="flex justify-between items-end border-b border-slate-800 pb-2 mb-6">
          <h2 className="text-xl font-black text-white">4. Daily Drilldown (1-31)</h2>
          <select 
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {data.availableMonths.length === 0 && <option value={selectedMonth}>{selectedMonth}</option>}
            {data.availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <ChartRow title={`for Days in ${selectedMonth}`} chartData={data.monthDaysData} />
      </div>

      {/* ROW 9: Intraday Analysis */}
      <div>
        <h2 className="text-xl font-black text-white mb-6 border-b border-slate-800 pb-2">5. Intraday Analysis (Hourly)</h2>
        <ChartRow title="by Hour" chartData={data.hourData} />
      </div>

    </div>
  );
}
"""

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(jsx_content)

print("Successfully patched OverviewTab.jsx")
