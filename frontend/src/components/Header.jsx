import { useState, useEffect } from 'react'
import {
  Bell, User, Menu, ChevronDown,
  Activity, Zap, BarChart2, Globe, Shield,
  Newspaper, Bot, Briefcase, LayoutDashboard, BookOpen, Calculator,
  Moon, Sun, Monitor, LogOut
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../supabaseClient'

const NAV_ITEMS = [
  { id: 'Chart Terminal',   label: 'Chart Terminal',    icon: LayoutDashboard },
  { id: 'Markets',          label: 'Markets',           icon: Globe },
  { id: 'Academy',          label: 'Academy',           icon: BookOpen },
  { id: 'Portfolio',        label: 'Portfolio',         icon: Briefcase },
  { id: 'Orders',           label: 'Orders',            icon: Activity },
  { id: 'Risk Mgmt',        label: 'Risk Mgmt',         icon: Shield },
  { id: 'Pos Calc',         label: 'Pos Calc',          icon: Calculator },
  { id: 'AI Assistant',     label: 'AI Assistant',      icon: Bot },
]

function getMarketStatus() {
  const now = new Date()
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000)
  const mins = ist.getHours() * 60 + ist.getMinutes()
  const isWeekday = [1, 2, 3, 4, 5].includes(ist.getDay())
  const nseOpen = isWeekday && mins >= 555 && mins <= 930
  const nyseOpen = [1,2,3,4,5].includes(now.getDay()) && now.getUTCHours() >= 14 && now.getUTCHours() < 21
  return { nseOpen, nyseOpen, ist }
}

export default function Header({ user, setAuthModalOpen, activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const [time, setTime] = useState(new Date())
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleLogout = async () => {
    try {
      // 1. Clear developer bypass flags & session flags
      localStorage.removeItem('isDevMode')
      sessionStorage.removeItem('dev_welcome_shown')
      sessionStorage.removeItem('welcome_shown')

      // 2. Clear all Supabase auth storage tokens and application caches
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('st_') || key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key)
        }
      })
      sessionStorage.clear()

      // 3. Graceful Supabase signOut with strict 1.5s timeout (prevents hanging if Supabase domain is offline)
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ])
    } catch (err) {
      console.warn("Logout cleanup warning:", err)
    } finally {
      // 4. Force hard redirect to home to wipe state completely
      window.location.href = '/'
    }
  }

  const { nseOpen, nyseOpen, ist } = getMarketStatus()
  const istStr = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="h-14 flex-shrink-0 flex items-center px-4 gap-4
                       bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-30 transition-colors shadow-sm">

      {/* 3-Line Menu (Hamburger) to toggle Watchlist sidebar */}
      {activeTab === 'Chart Terminal' && setSidebarOpen && (
        <button
          id="toggle-watchlist-menu"
          onClick={() => setSidebarOpen(prev => !prev)}
          title={sidebarOpen ? "Collapse Watchlist" : "Expand Watchlist"}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center mr-1 ${sidebarOpen ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
        >
          <Menu size={18} />
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2 select-none flex-shrink-0 mr-4 cursor-pointer" onClick={() => setActiveTab('Chart Terminal')}>
        <img src="/logo.png" alt="DemoTrade" className="h-8 w-auto mr-1" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">DemoTrade</span>
          <span className="text-[9px] text-teal-600 dark:text-teal-400 font-medium">Platform</span>
        </div>
      </div>

      {/* ── Primary Navigation ─────────────────────────────────── */}
      <nav className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
                        whitespace-nowrap transition-all duration-200 flex-shrink-0
              ${activeTab === id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Right cluster ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* Market Status pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold
                           ${nseOpen ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                     : 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${nseOpen ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400 dark:bg-slate-600'}`} />
            NSE
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold
                           ${nyseOpen ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${nyseOpen ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400 dark:bg-slate-600'}`} />
            NYSE
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-[10px] font-mono text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
          <Zap size={10} className="text-blue-500" /> {istStr}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'normal' : 'light')}
          className="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Auth / User Profile */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold hidden sm:block max-w-[100px] truncate">
                  {user.email}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-gray-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
            >
              <User size={16} />
              Login
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
