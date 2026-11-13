import React, { useMemo, useState } from 'react';
import TradingCalendar from './TradingCalendar.jsx';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, ReferenceLine
} from 'recharts';
import { ChevronLeft, ChevronRight, Activity, Trophy, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MonthlyAnalysisTab({ trades, sym = '$', monthlyDeposits = {} }) {
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Data Engine for the specific month
  const data = useMemo(() => {
    let totalTrades = 0;
    let wins = 0;
    let losses = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let peakPnL = 0;
    let maxDrawdown = 0;
    let cumulativePnL = 0;

    const createEmptyStats = () => ({ pnl: 0, profit: 0, loss: 0, trades: 0, wins: 0, losses: 0, be: 0, longs: 0, shorts: 0 });
    
    const monthWeekStats = {
      'Week 1 (1-7)': createEmptyStats(),
      'Week 2 (8-14)': createEmptyStats(),
      'Week 3 (15-21)': createEmptyStats(),
      'Week 4 (22+)': createEmptyStats(),
    };

    // Ledger Data
    const ledger = {};

    const filteredTrades = trades.filter(t => {
      const d = new Date(t.timestamp);
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    filteredTrades.forEach(t => {
      totalTrades++;
      const pnl = parseFloat(t.netPnl) || parseFloat(t.pnl) || 0;
      
      if (pnl > 0) {
        wins++;
        grossProfit += pnl;
      } else if (pnl < 0) {
        losses++;
        grossLoss += pnl;
      }

      cumulativePnL += pnl;
      if (cumulativePnL > peakPnL) peakPnL = cumulativePnL;
      const currentDrawdown = peakPnL - cumulativePnL;
      if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

      const dateObj = new Date(t.timestamp);
      const d = dateObj.getDate();
      
      let weekKey = 'Week 4 (22+)';
      let weekIndex = 4;
      if (d <= 7) { weekKey = 'Week 1 (1-7)'; weekIndex = 1; }
      else if (d <= 14) { weekKey = 'Week 2 (8-14)'; weekIndex = 2; }
      else if (d <= 21) { weekKey = 'Week 3 (15-21)'; weekIndex = 3; }
      
      monthWeekStats[weekKey].trades++;
      monthWeekStats[weekKey].pnl += pnl;
      if (pnl > 0) { monthWeekStats[weekKey].profit += pnl; monthWeekStats[weekKey].wins++; }
      else if (pnl < 0) { monthWeekStats[weekKey].loss += Math.abs(pnl); monthWeekStats[weekKey].losses++; }
      else monthWeekStats[weekKey].be++;
      if (t.side === 'Buy') monthWeekStats[weekKey].longs++;
      if (t.side === 'Sell') monthWeekStats[weekKey].shorts++;

      // Ledger aggregation
      const dateStr = dateObj.toISOString().split('T')[0];
      if (!ledger[weekIndex]) ledger[weekIndex] = {};
      if (!ledger[weekIndex][dateStr]) ledger[weekIndex][dateStr] = { date: dateStr, trades: 0, pnl: 0 };
      ledger[weekIndex][dateStr].trades++;
      ledger[weekIndex][dateStr].pnl += pnl;
    });

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalNetPnL = grossProfit + grossLoss;
    const profitFactor = Math.abs(grossLoss) > 0 ? (grossProfit / Math.abs(grossLoss)) : (grossProfit > 0 ? 99.99 : 0);
    
    // Monthly deposit
    const monthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    const totalDeposited = parseFloat(monthlyDeposits[monthKey] || 0);

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

    // Convert ledger dict to sorted array for rendering
    const ledgerDataArr = [];
    for (let i = 1; i <= 4; i++) {
        if (ledger[i]) {
            const days = Object.values(ledger[i]).sort((a,b) => new Date(a.date) - new Date(b.date));
            ledgerDataArr.push({ weekNumber: i, days });
        }
    }

    return { 
      totalTrades, winRate, totalNetPnL, profitFactor, maxDrawdown, totalDeposited,
      monthWeekData, ledgerData: ledgerDataArr, filteredTrades
    };
  }, [trades, calYear, calMonth, monthlyDeposits]);

  // Calendar Logic
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calOffset = calFirstDay === 0 ? 6 : calFirstDay - 1;

  // Formatters
  const formatYAxisAmount = (val) => `${val >= 0 ? '+' : ''}${sym}${Intl.NumberFormat('en-US', { notation: 'compact' }).format(Math.abs(val))}`;
  const formatXAxisAmount = (val) => `${val >= 0 ? '+' : ''}${sym}${Intl.NumberFormat('en-US', { notation: 'compact' }).format(Math.abs(val))}`;



  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      
      {/* ROW 1: Month Navigation Header */}
      <div className="flex items-center justify-center gap-6 py-4">
        <button 
          onClick={() => {
            const d = new Date(calYear, calMonth - 1);
            setCalYear(d.getFullYear());
            setCalMonth(d.getMonth());
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-widest uppercase">
          {MONTH_NAMES[calMonth]} {calYear}
        </h2>
        <button 
          onClick={() => {
            const d = new Date(calYear, calMonth + 1);
            setCalYear(d.getFullYear());
            setCalMonth(d.getMonth());
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ROW 2: Selected Month Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Month Deposited</span>
            <div className="text-blue-500/50"><Activity size={14} /></div>
          </div>
          <span className="text-xl font-bold text-blue-400 mt-2 font-mono">{sym}{(data?.totalDeposited || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Month Net P&L</span>
            <div className="text-emerald-500/50"><Activity size={14} /></div>
          </div>
          <span className={`text-xl font-bold mt-2 font-mono ${(data?.totalNetPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {(data?.totalNetPnL || 0) >= 0 ? '+' : ''}{sym}{Math.abs((data?.totalNetPnL || 0)).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Win Rate</span>
            <div className="text-amber-500/50"><Trophy size={14} /></div>
          </div>
          <span className="text-xl font-bold text-amber-400 mt-2 font-mono">{(data?.winRate || 0).toFixed(1)}%</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profit Factor</span>
            <div className="text-emerald-500/50"><TrendingUp size={14} /></div>
          </div>
          <span className="text-xl font-bold text-emerald-400 mt-2 font-mono">{(data?.profitFactor || 0).toFixed(2)}</span>
        </div>
        <div className="card p-5 border border-slate-800 bg-[#0f172a] shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Drawdown</span>
            <div className="text-red-500/50"><AlertTriangle size={14} /></div>
          </div>
          <span className="text-xl font-bold text-red-400 mt-2 font-mono">
            -{sym}{(data?.maxDrawdown || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </span>
        </div>
      </div>

      {/* ROW 3: Read-Only Calendar */}
      <div className="mt-8">
        <TradingCalendar 
          trades={trades} 
          calYear={calYear} 
          calMonth={calMonth} 
          setCalYear={setCalYear} 
          setCalMonth={setCalMonth} 
          sym={sym} 
          isAllTab={true} 
        />
      </div>

      {/* ROW 4: Month-Week Drilldown Charts */}
      {(data?.totalTrades || 0) > 0 ? (
        <SectionWrapper title="Month-Week Drilldown">
          <MasterLayout chartData={(data?.monthWeekData || [])} />
        </SectionWrapper>
      ) : (
        <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/30">
          No trades logged in {MONTH_NAMES[calMonth]} {calYear}.
        </div>
      )}



    </div>
  );
}
