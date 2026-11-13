import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Activity } from 'lucide-react'
import GlobalPortfolio from './GlobalPortfolio.jsx'
import PaperPortfolio from './PaperPortfolio.jsx'

export default function PortfolioPage({ user, activeTicker }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('st_portfolio_view_tab') || 'paper')

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    localStorage.setItem('st_portfolio_view_tab', tab)
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Portfolio Tabs Header */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={() => handleTabChange('global')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200
            ${activeTab === 'global' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
        >
          <Briefcase size={18} />
          Global Original Portfolio
        </button>

        <button
          onClick={() => handleTabChange('paper')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200
            ${activeTab === 'paper' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
        >
          <Activity size={18} />
          P-Trade Portfolio
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'global' && (
          <motion.div
            key="global"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full absolute inset-0"
          >
            <GlobalPortfolio user={user} />
          </motion.div>
        )}
        {activeTab === 'paper' && (
          <motion.div
            key="paper"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full absolute inset-0"
          >
            <PaperPortfolio user={user} activeTicker={activeTicker} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
