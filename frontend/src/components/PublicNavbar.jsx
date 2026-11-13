import { Link } from 'react-router-dom'
import { Moon, Sun, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function PublicNavbar({ setAuthModalOpen }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-16 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 select-none flex-shrink-0">
          <img src="/logo.png" alt="DemoTrade" className="h-8 w-auto mr-1" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">DemoTrade</span>
            <span className="text-[9px] text-teal-600 dark:text-teal-400 font-medium tracking-widest">PRO</span>
          </div>
        </Link>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Tools <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-2">
              <Link to="/terminal" className="block px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400">Trading Terminal</Link>
              <Link to="/portfolio" className="block px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400">Portfolio & Journal</Link>
              <Link to="/calculator" className="block px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400">Calculators</Link>
              <Link to="/fundamentals" className="block px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400">Fundamental Analysis</Link>
              <Link to="/news" className="block px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400">Market News</Link>
            </div>
          </div>
          <button onClick={() => {
            if (window.location.pathname !== '/') window.location.href = '/#pricing'
            else document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
          }} className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</button>
          
          <Link to="/academy" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">Academy</Link>
          
          <button onClick={() => {
            if (window.location.pathname !== '/') window.location.href = '/#pricing' // Mock FAQ anchor for now
            else document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
          }} className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">Help / FAQ</button>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-5 py-2 text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Log In
          </button>
          
          <button
            onClick={() => setAuthModalOpen(true)}
            className="hidden sm:block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all shadow-md shadow-blue-500/20"
          >
            Sign Up Free
          </button>
        </div>
      </div>
    </header>
  )
}
