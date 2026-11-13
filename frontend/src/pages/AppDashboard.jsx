import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Briefcase, Calculator, BookOpen, Activity, Shield } from 'lucide-react';

const DASHBOARD_CARDS = [
  {
    title: 'Trading Terminal',
    description: 'Advanced technical analysis with AI predictions and MT5-style visual P-Trade drag mechanics.',
    icon: TrendingUp,
    link: '/chart',
    color: 'from-blue-500 to-indigo-600',
    badge: 'Pro'
  },
  {
    title: 'Position Calculators',
    description: 'Calculate risk, lot sizes, and PnL accurately for Forex, Crypto, and Stocks before taking trades.',
    icon: Calculator,
    link: '/calculator',
    color: 'from-teal-400 to-emerald-500',
    badge: 'Free'
  },
  {
    title: 'My Portfolio',
    description: 'Track your global simulated investments and P-Trade executions in real-time.',
    icon: Briefcase,
    link: '/portfolio',
    color: 'from-purple-500 to-pink-600',
    badge: 'Live'
  },
  {
    title: 'Trading Academy',
    description: 'Learn price action, fundamental analysis, and algorithmic trading strategies from curated content.',
    icon: BookOpen,
    link: '/academy',
    color: 'from-orange-400 to-red-500',
    badge: 'New'
  }
];

export default function AppDashboard({ user }) {
  const firstName = user?.email?.split('@')[0] || 'Trader';

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-slate-950 px-6 py-10 md:px-12 lg:px-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400 capitalize">{firstName}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl">
            Access your advanced trading tools, track your portfolio, and analyze the markets with precision.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {DASHBOARD_CARDS.map((card, idx) => (
            <Link key={idx} to={card.link}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col"
              >
                {/* Background Glow */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />
                
                <div className="flex items-start justify-between mb-4 z-10">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                    <card.icon size={24} />
                  </div>
                  {card.badge && (
                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                      {card.badge}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 z-10">{card.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 flex-1 z-10">{card.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Secondary Widgets Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-blue-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white">Market Overview</h3>
            </div>
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-slate-500">Live Market Heatmap (Coming Soon)</p>
            </div>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-emerald-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white">Account Security</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <span className="text-sm text-gray-600 dark:text-slate-300">2FA Status</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Enabled</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <span className="text-sm text-gray-600 dark:text-slate-300">Last Login</span>
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Today, 09:41 AM</span>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
