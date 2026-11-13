import re

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\OverviewTab.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add TradingCalendar import
if "import TradingCalendar" not in content:
    content = content.replace("import React, { useMemo, useState } from 'react';", "import React, { useMemo, useState } from 'react';\nimport TradingCalendar from './TradingCalendar.jsx';")

# 2. Update OverviewTab signature
old_sig = "export default function OverviewTab({ trades, sym, monthlyDeposits }) {"
new_sig = """export default function OverviewTab({ 
  trades, sym, monthlyDeposits,
  calYear, calMonth, setCalYear, setCalMonth, handleDayClick, 
  isAllTab, category, liveUsdInr, allTabCurrency, currentMonthDeposited, 
  monthlyPnl, journalEntries
}) {"""
content = content.replace(old_sig, new_sig)

# 3. Inject TradingCalendar at the top of the return block
old_return = """  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      
      {/* ROW 1: Top Metric Cards */}"""
      
new_return = """  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      
      <TradingCalendar
        calYear={calYear} calMonth={calMonth} setCalYear={setCalYear} setCalMonth={setCalMonth}
        handleDayClick={handleDayClick} isAllTab={isAllTab} category={category} sym={sym}
        liveUsdInr={liveUsdInr} allTabCurrency={allTabCurrency} currentMonthDeposited={currentMonthDeposited}
        monthlyPnl={monthlyPnl} journalEntries={journalEntries}
      />

      {/* ROW 1: Top Metric Cards */}"""
content = content.replace(old_return, new_return)

# 4. Modify MasterLayout to have exactly 1 grid with 2 charts as requested
old_master_layout = """  const MasterLayout = ({ chartData }) => (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Style1_HorizontalDiverging chartData={chartData} />
        <Style2_VerticalBar chartData={chartData} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <Style3_HorizontalStacked chartData={chartData} />
        <Style4_GroupedVertical chartData={chartData} />
      </div>
      <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">Summary</h3>
      <SummaryTable rowData={chartData} />
    </>
  );"""
  
new_master_layout = """  const MasterLayout = ({ chartData }) => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Style2_VerticalBar chartData={chartData} />
        <Style4_GroupedVertical chartData={chartData} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">Summary</h3>
      <SummaryTable rowData={chartData} />
    </>
  );"""
content = content.replace(old_master_layout, new_master_layout)

# 5. Fix heights of charts to 320 in ResponsiveContainers
# They are already wrapped in <ResponsiveContainer width="100%" height="100%"> inside a div h-[320px].
# But the instruction says: "Wrap EVERY chart (Donuts, Bars, AreaCharts) inside a <ResponsiveContainer width="100%" height={320}>".
content = content.replace('height="100%"', 'height={320}')
content = content.replace('h-[320px]', '')

# The Donut charts are inside h-[280px], let's change those as well.
content = content.replace('h-[280px]', '')

# Let's ensure the Donuts row has the correct gap-8 grid
content = content.replace('<div className="grid grid-cols-1 md:grid-cols-2 gap-6">', '<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">')

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("OverviewTab.jsx successfully patched!")
