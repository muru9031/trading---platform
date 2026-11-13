import React from 'react'

export default function News() {
  return (
    <div className="h-full w-full overflow-auto bg-gray-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Market News & Context</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Stay updated with macroeconomic events and fundamental news that drives market volatility.</p>
        
        <div className="grid gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-6">
             <div className="w-full md:w-48 h-32 bg-gray-200 dark:bg-slate-800 rounded-xl flex-shrink-0"></div>
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded">MACRO</span>
                 <span className="text-xs text-gray-500">10 mins ago</span>
               </div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fed Holds Rates Steady, Signals One Cut Before Year-End</h2>
               <p className="text-gray-600 dark:text-slate-400 text-sm">The Federal Reserve opted to keep its benchmark interest rate unchanged, while updating its economic projections to show fewer cuts than anticipated.</p>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-6">
             <div className="w-full md:w-48 h-32 bg-gray-200 dark:bg-slate-800 rounded-xl flex-shrink-0"></div>
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded">TECH</span>
                 <span className="text-xs text-gray-500">2 hours ago</span>
               </div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Semiconductor Stocks Rally Following Earnings Beat</h2>
               <p className="text-gray-600 dark:text-slate-400 text-sm">Major chipmakers saw their shares surge in pre-market trading after reporting stronger than expected forward guidance for the next quarter.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
