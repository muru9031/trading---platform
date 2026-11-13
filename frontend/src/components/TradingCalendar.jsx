import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TradingCalendar({
  calYear, calMonth, setCalYear, setCalMonth, handleDayClick = () => {}, 
  isAllTab, category, sym, liveUsdInr = 1, allTabCurrency = 'USD', 
  currentMonthDeposited = 0, monthlyPnl = 0, journalEntries = {}, mode = "real"
}) {
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay    = new Date(calYear, calMonth, 1).getDay();
  const calOffset      = calFirstDay === 0 ? 6 : calFirstDay - 1;

  return (
    <div className="card p-6 mb-8 border border-gray-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-600 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
            {isAllTab ? 'Aggregated Trading Journal (Read-Only)' : 'Interactive Trading Journal (Click day to edit)'}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Calendar Navigation & Add Trade Button */}
          <div className="flex items-center gap-3">
            <button onClick={()=>{const d=new Date(calYear,calMonth-1);setCalYear(d.getFullYear());setCalMonth(d.getMonth())}} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200"><ChevronLeft size={16}/></button>
            <span className="text-sm font-bold text-gray-900 dark:text-slate-200 w-24 text-center">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button onClick={()=>{const d=new Date(calYear,calMonth+1);setCalYear(d.getFullYear());setCalMonth(d.getMonth())}} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-200"><ChevronRight size={16}/></button>
          </div>
          
          {!isAllTab && (
            <button onClick={() => {
              const today = new Date();
              handleDayClick(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);
            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md ml-2">
              <PlusCircle size={14} /> Add Trade
            </button>
          )}
        </div>
      </div>

      {/* ── Monthly Capital Header ── */}
      <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1">Monthly Deposited</div>
          <div className="text-sm font-bold font-mono text-blue-400">{sym}{(currentMonthDeposited || 0).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1">Monthly Net P&L</div>
          <div className={`text-sm font-bold font-mono ${(monthlyPnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {(monthlyPnl || 0) >= 0 ? '+' : ''}{sym}{Math.abs(monthlyPnl || 0).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase pb-2">{d}</div>
        ))}
        
        {/* Blank days for padding */}
        {Array.from({length: calOffset}).map((_, i) => (
          <div key={`offset-${i}`} className="p-2 border border-gray-200 dark:border-slate-800/50 rounded-lg min-h-24 bg-gray-50 dark:bg-slate-900/30"></div>
        ))}
        
        {/* Calendar Days */}
        {Array.from({length: calDaysInMonth}).map((_, i) => {
          const day = i + 1
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const trades = journalEntries?.[mode]?.[dateStr] || []
          const filtered = isAllTab ? trades : trades.filter(t => (t.market || 'Indian Market') === category)
          let dayPnl = 0
          filtered.forEach(t => {
            let p = (t.netPnl !== undefined && t.netPnl !== "" && t.netPnl !== null) ? parseFloat(t.netPnl) : ((parseFloat(t.exit) || 0) - (parseFloat(t.entry) || 0)); p -= (parseFloat(t.brokerage) || 0)
            let tSym = t.market === 'US Market' ? '$' : '₹'
            if (isAllTab) {
              if (allTabCurrency === 'INR' && tSym === '$') p *= liveUsdInr
              if (allTabCurrency === 'USD' && tSym === '₹') p /= liveUsdInr
            }
            dayPnl += p
          })

          return (
            <div 
              key={day}
              onClick={() => handleDayClick(dateStr)}
              className={`p-2 border border-gray-300 dark:border-slate-700 rounded-lg min-h-24 bg-gray-100 dark:bg-slate-800/50 hover:border-blue-500 transition-colors ${!isAllTab ? 'cursor-pointer group hover:shadow-md' : ''} relative`}
            >
              <span className="text-xs font-bold text-gray-600 dark:text-slate-400">{day}</span>
              {filtered.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <span className={`text-[9px] px-1 py-0.5 rounded border font-mono ${dayPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {dayPnl >= 0 ? '+' : ''}{sym}{(dayPnl || 0).toLocaleString('en-IN', {minimumFractionDigits:0,maximumFractionDigits:2})}
                  </span>
                  <span className="text-[9px] text-gray-500 dark:text-slate-500">{filtered.length} Trades</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
