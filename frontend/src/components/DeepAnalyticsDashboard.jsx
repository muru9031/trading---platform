import React, { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Target, TrendingUp, TrendingDown, Activity, Award, AlertTriangle } from 'lucide-react'

export default function DeepAnalyticsDashboard({ trades, sym = '$' }) {
  const data = useMemo(() => {
    let wins = 0
    let losses = 0
    let grossWin = 0
    let grossLoss = 0
    let maxDrawdown = 0
    let peakCapital = 0
    let currentCapital = 0
    
    // Streaks
    let currentWinStreak = 0
    let maxWinStreak = 0
    let currentLossStreak = 0
    let maxLossStreak = 0

    // Day of week mapping
    const dayMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 }

    // Sort chronologically for accurate drawdown/streaks
    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    sortedTrades.forEach(t => {
      const pnl = parseFloat(t.netPnl) || parseFloat(t.pnl) || 0
      
      // Capital & Drawdown
      currentCapital += pnl
      if (currentCapital > peakCapital) peakCapital = currentCapital
      const drawdown = peakCapital - currentCapital
      if (drawdown > maxDrawdown) maxDrawdown = drawdown

      // Day of Week
      if (t.timestamp) {
        const d = new Date(t.timestamp).toLocaleDateString('en-US', { weekday: 'short' })
        if (dayMap[d] !== undefined) dayMap[d] += pnl
      }

      if (pnl > 0) {
        wins++
        grossWin += pnl
        currentWinStreak++
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak
        currentLossStreak = 0
      } else if (pnl < 0) {
        losses++
        grossLoss += Math.abs(pnl)
        currentLossStreak++
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak
        currentWinStreak = 0
      }
    })

    const totalTrades = wins + losses
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
    const avgWin = wins > 0 ? grossWin / wins : 0
    const avgLoss = losses > 0 ? grossLoss / losses : 0
    const profitFactor = grossLoss > 0 ? (grossWin / grossLoss) : (grossWin > 0 ? 99.99 : 0)

    const dayChartData = Object.entries(dayMap).map(([day, pnl]) => ({ day, pnl }))
    const donutData = [
      { name: 'Wins', value: wins, color: '#10b981' },
      { name: 'Losses', value: losses, color: '#ef4444' }
    ]

    return {
      totalTrades, wins, losses, winRate, avgWin, avgLoss, profitFactor,
      maxDrawdown, maxWinStreak, maxLossStreak,
      dayChartData, donutData,
      netPnl: grossWin - grossLoss
    }
  }, [trades])

  if (trades.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-gray-500 dark:text-slate-500 min-h-[300px]">
        <Activity size={32} className="mb-3 opacity-50" />
        <p className="text-sm font-semibold">No closed trades yet.</p>
        <p className="text-xs mt-1">Execute trades to generate deep analytics.</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const isPositive = payload[0].value >= 0
      return (
        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 p-2 rounded shadow-xl text-xs font-mono">
          <span className="text-gray-600 dark:text-slate-400">{payload[0].payload.day}: </span>
          <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
            {isPositive ? '+' : ''}{sym}{Math.abs(payload[0].value).toFixed(2)}
          </span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Total Net P&L</span>
            <Target size={14} className="text-blue-400" />
          </div>
          <div className={`text-xl font-bold font-mono ${data.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.netPnl >= 0 ? '+' : ''}{sym}{Math.abs(data.netPnl).toFixed(2)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Win Rate</span>
            <Award size={14} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {data.winRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Profit Factor</span>
            <TrendingUp size={14} className={data.profitFactor >= 1 ? 'text-emerald-400' : 'text-orange-400'} />
          </div>
          <div className={`text-xl font-bold font-mono ${data.profitFactor >= 1 ? 'text-emerald-400' : 'text-orange-400'}`}>
            {data.profitFactor.toFixed(2)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Max Drawdown</span>
            <AlertTriangle size={14} className="text-red-400" />
          </div>
          <div className="text-xl font-bold font-mono text-red-400">
            {sym}{data.maxDrawdown.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gauge Chart: Wins vs Losses */}
        <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-4">Accuracy Distribution</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.donutData}
                  cx="50%" cy="100%"
                  startAngle={180} endAngle={0}
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-2 text-center">
              <div className="text-2xl font-bold font-mono text-gray-900 dark:text-slate-200">{data.totalTrades}</div>
              <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-widest">Total Trades</div>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-xs font-mono">
            <div className="text-emerald-400">{data.wins} Wins</div>
            <div className="text-red-400">{data.losses} Losses</div>
          </div>
        </div>

        {/* Bar Chart: Performance by Day */}
        <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-slate-800 lg:col-span-2 flex flex-col">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-4">Performance By Day</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dayChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v>=0?'+':''}${v}`} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                  {data.dayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Averages Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg Win</div>
            <div className="text-sm font-bold font-mono text-emerald-400">+{sym}{data.avgWin.toFixed(2)}</div>
          </div>
          <TrendingUp size={20} className="text-emerald-500/30" />
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg Loss</div>
            <div className="text-sm font-bold font-mono text-red-400">-{sym}{data.avgLoss.toFixed(2)}</div>
          </div>
          <TrendingDown size={20} className="text-red-500/30" />
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Max Win Streak</div>
            <div className="text-sm font-bold font-mono text-emerald-400">{data.maxWinStreak}</div>
          </div>
          <div className="flex gap-0.5">{Array.from({length: Math.min(data.maxWinStreak, 5)}).map((_,i) => <div key={i} className="w-1.5 h-4 bg-emerald-500/50 rounded-sm"/>)}</div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Max Loss Streak</div>
            <div className="text-sm font-bold font-mono text-red-400">{data.maxLossStreak}</div>
          </div>
          <div className="flex gap-0.5">{Array.from({length: Math.min(data.maxLossStreak, 5)}).map((_,i) => <div key={i} className="w-1.5 h-4 bg-red-500/50 rounded-sm"/>)}</div>
        </div>
      </div>
    </div>
  )
}
