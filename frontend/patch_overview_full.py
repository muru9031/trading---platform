import os
import re

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\OverviewTab.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. Import AreaChart and Area ---
content = content.replace(
    "BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,",
    "BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area,"
)

# --- 2. Add New Stats objects in useMemo ---
new_stats_init = """    const buyDayStats = { Monday: createEmptyStats(), Tuesday: createEmptyStats(), Wednesday: createEmptyStats(), Thursday: createEmptyStats(), Friday: createEmptyStats(), Saturday: createEmptyStats(), Sunday: createEmptyStats() };
    const sellDayStats = { Monday: createEmptyStats(), Tuesday: createEmptyStats(), Wednesday: createEmptyStats(), Thursday: createEmptyStats(), Friday: createEmptyStats(), Saturday: createEmptyStats(), Sunday: createEmptyStats() };
    const dailyCurveMap = {}; // { [date]: { date, pnl, winPnL, lossPnL, wins, losses, trades } }
"""
content = content.replace(
    "const monthWeekStats = {",
    new_stats_init + "    const monthWeekStats = {"
)

# --- 3. Update the loop to populate the new stats ---
loop_injection = """
      const dateKey = dateObj.toISOString().split('T')[0];
      dailyPnLMap[dateKey] = (dailyPnLMap[dateKey] || 0) + pnl;

      if (!dailyCurveMap[dateKey]) dailyCurveMap[dateKey] = { pnl: 0, winPnL: 0, lossPnL: 0, wins: 0, losses: 0, trades: 0 };
      dailyCurveMap[dateKey].pnl += pnl;
      dailyCurveMap[dateKey].trades++;
      if (pnl > 0) { dailyCurveMap[dateKey].winPnL += pnl; dailyCurveMap[dateKey].wins++; }
      if (pnl < 0) { dailyCurveMap[dateKey].lossPnL += pnl; dailyCurveMap[dateKey].losses++; }

      if (t.side === 'Buy') {
        buyDayStats[dayName].trades++;
        buyDayStats[dayName].pnl += pnl;
        if (pnl > 0) { buyDayStats[dayName].profit += pnl; buyDayStats[dayName].wins++; }
        else if (pnl < 0) { buyDayStats[dayName].loss += Math.abs(pnl); buyDayStats[dayName].losses++; }
        else buyDayStats[dayName].be++;
        buyDayStats[dayName].longs++;
      } else if (t.side === 'Sell') {
        sellDayStats[dayName].trades++;
        sellDayStats[dayName].pnl += pnl;
        if (pnl > 0) { sellDayStats[dayName].profit += pnl; sellDayStats[dayName].wins++; }
        else if (pnl < 0) { sellDayStats[dayName].loss += Math.abs(pnl); sellDayStats[dayName].losses++; }
        else sellDayStats[dayName].be++;
        sellDayStats[dayName].shorts++;
      }
"""
content = re.sub(
    r"const dateKey = dateObj\.toISOString\(\)\.split\('T'\)\[0\];\s*dailyPnLMap\[dateKey\] = \(dailyPnLMap\[dateKey\] \|\| 0\) \+ pnl;",
    loop_injection.strip(),
    content
)

# --- 4. Generate the Curves and Arrays after the loop ---
curve_generation = """
    let runningEq = 0;
    let totalWinCurvePnL = 0;
    let totalLossCurvePnL = 0;
    let winCurveTrades = 0;
    let lossCurveTrades = 0;

    const sortedDates = Object.keys(dailyCurveMap).sort();
    const equityCurve = [];
    const dailyNetCurve = [];
    const winCurve = [];
    const lossCurve = [];

    sortedDates.forEach(d => {
       const rec = dailyCurveMap[d];
       runningEq += rec.pnl;
       equityCurve.push({ date: d, equity: runningEq });
       dailyNetCurve.push({ date: d, pnl: rec.pnl });
       if (rec.wins > 0) {
           winCurve.push({ date: d, pnl: rec.winPnL });
           totalWinCurvePnL += rec.winPnL;
           winCurveTrades += rec.wins;
       }
       if (rec.losses > 0) {
           lossCurve.push({ date: d, pnl: rec.lossPnL });
           totalLossCurvePnL += rec.lossPnL;
           lossCurveTrades += rec.losses;
       }
    });

    const buyDayData = [
      buyDayStats['Monday'], buyDayStats['Tuesday'], buyDayStats['Wednesday'], 
      buyDayStats['Thursday'], buyDayStats['Friday'], buyDayStats['Saturday'], buyDayStats['Sunday']
    ].map((d, i) => ({
      name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      fullName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
      ...d,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0
    }));

    const sellDayData = [
      sellDayStats['Monday'], sellDayStats['Tuesday'], sellDayStats['Wednesday'], 
      sellDayStats['Thursday'], sellDayStats['Friday'], sellDayStats['Saturday'], sellDayStats['Sunday']
    ].map((d, i) => ({
      name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      fullName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
      ...d,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0
    }));

    const orderedDayData = [
"""
content = content.replace("    const orderedDayData = [", curve_generation.strip() + "\n    const orderedDayData = [")

# Add the new stats to the return block of useMemo
content = content.replace(
    "dayData: orderedDayData, monthData, yearData, monthWeekData, hourData",
    "dayData: orderedDayData, monthData, yearData, monthWeekData, hourData, equityCurve, dailyNetCurve, winCurve, lossCurve, buyDayData, sellDayData, totalWinCurvePnL, winCurveTrades, totalLossCurvePnL, lossCurveTrades"
)

# --- 5. Update Style3 to HorizontalBar (Total Trades ONLY) ---
old_style3 = """const Style3_HorizontalStacked = ({ chartData }) => (
    <div className="card p-6 h-[320px] flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg rounded-lg">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
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
  );"""

new_style3 = """const Style3_HorizontalBar = ({ chartData }) => (
    <div className="card p-6 h-[320px] flex flex-col border border-slate-800 bg-[#0f172a] shadow-lg rounded-lg">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Total Trades Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} vertical={false} />
          <XAxis type="number" hide={true} />
          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} width={80} />
          <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={<CustomDistributionTooltip />} />
          <Bar dataKey="trades" name="Trades" fill="#14b8a6" isAnimationActive={true} animationDuration={1000} barSize={25} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );"""
content = content.replace(old_style3, new_style3)
content = content.replace("<Style3_HorizontalStacked chartData={chartData} />", "<Style3_HorizontalBar chartData={chartData} />")

# --- 6. Inject Rows 4, 5, 6, 7, 8 below Donut Charts (Row 3) ---
donut_end_marker = "</div>\n      </div>\n\n      {/* ROW 4: Weekday Analysis */}"

new_rows = """</div>
      </div>

      {/* [NEW] ROW 4: Equity Curve */}
      <SectionWrapper title="EQUITY CURVE">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.equityCurve} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12}/>
              <YAxis tickFormatter={formatYAxisAmount} stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} width={80}/>
              <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} itemStyle={{color: '#14b8a6'}} />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <Area type="monotone" dataKey="equity" stroke="#14b8a6" fillOpacity={1} fill="url(#colorEquity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionWrapper>

      {/* [NEW] ROW 5: Net Daily P&L */}
      <SectionWrapper title="NET DAILY P&L">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyNetCurve} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12}/>
              <YAxis tickFormatter={formatYAxisAmount} stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} width={80}/>
              <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="pnl" isAnimationActive={true} animationDuration={1000} radius={[4, 4, 0, 0]}>
                 {data.dailyNetCurve.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionWrapper>

      {/* [NEW] ROW 6: Win/Loss Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 border border-slate-800 bg-slate-900/60 shadow-xl rounded-xl">
           <h3 className="text-xl font-black text-white mb-6">Win Performance</h3>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.winCurve} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" hide={true}/>
                  <YAxis hide={true}/>
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} itemStyle={{color: '#10b981'}} />
                  <Area type="monotone" dataKey="pnl" name="Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWin)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                 <div className="text-xs text-slate-400">Total P&L</div>
                 <div className="text-lg font-bold text-emerald-400 font-mono">+{sym}{(data.totalWinCurvePnL || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
              </div>
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                 <div className="text-xs text-slate-400">Winning Trades</div>
                 <div className="text-lg font-bold text-white font-mono">{data.winCurveTrades}</div>
              </div>
           </div>
        </div>

        <div className="card p-6 border border-slate-800 bg-slate-900/60 shadow-xl rounded-xl">
           <h3 className="text-xl font-black text-white mb-6">Loss Performance</h3>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.lossCurve} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" hide={true}/>
                  <YAxis hide={true}/>
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} itemStyle={{color: '#ef4444'}} />
                  <Area type="monotone" dataKey="pnl" name="Loss" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorLoss)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                 <div className="text-xs text-slate-400">Total P&L</div>
                 <div className="text-lg font-bold text-red-400 font-mono">-{sym}{Math.abs(data.totalLossCurvePnL || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
              </div>
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                 <div className="text-xs text-slate-400">Losing Trades</div>
                 <div className="text-lg font-bold text-white font-mono">{data.lossCurveTrades}</div>
              </div>
           </div>
        </div>
      </div>

      {/* [NEW] ROW 7: Buy (Long) Analysis */}
      <SectionWrapper title="BUY (LONG) ANALYSIS">
        <MasterLayout chartData={data.buyDayData} />
      </SectionWrapper>

      {/* [NEW] ROW 8: Sell (Short) Analysis */}
      <SectionWrapper title="SELL (SHORT) ANALYSIS">
        <MasterLayout chartData={data.sellDayData} />
      </SectionWrapper>

      {/* ROW 9: Weekday Analysis */}"""

content = content.replace(donut_end_marker, new_rows)

# Renumber the comments for the remaining rows
content = content.replace("{/* ROW 5: Monthly Analysis */}", "{/* ROW 10: Monthly Analysis */}")
content = content.replace("{/* ROW 6: Yearly Analysis */}", "{/* ROW 11: Yearly Analysis */}")
content = content.replace("{/* ROW 7: Month-Week Drilldown */}", "{/* ROW 12: Month-Week Drilldown */}")
content = content.replace("{/* ROW 8: Intraday (Hourly) Analysis */}", "{/* ROW 13: Intraday (Hourly) Analysis */}")


with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched OverviewTab.jsx successfully")
