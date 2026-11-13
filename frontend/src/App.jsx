import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from './supabaseClient'
import { PortfolioProvider } from './contexts/PortfolioContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'

import Header from './components/Header.jsx'
import AuthModal from './components/AuthModal.jsx'
import Sidebar from './components/Sidebar.jsx'
import WelcomeOverlay from './components/WelcomeOverlay.jsx'

// ── Lazy Loaded Page Modules for Ultra-Fast App Initialization ───────────────
const MarketingHome = lazy(() => import('./pages/MarketingHome.jsx'))
const AssetDashboard = lazy(() => import('./pages/AssetDashboard.jsx'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage.jsx'))
const GlobalPositionCalculator = lazy(() => import('./pages/GlobalPositionCalculator.jsx'))
const Academy = lazy(() => import('./pages/Academy.jsx'))
const News = lazy(() => import('./pages/News.jsx'))
const GlobalMarkets = lazy(() => import('./pages/GlobalMarkets.jsx'))
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'))
const RiskManagement = lazy(() => import('./pages/RiskManagement.jsx'))
const AIAssistant = lazy(() => import('./pages/AIAssistant.jsx'))

const ModuleLoader = () => (
  <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-gray-500 font-mono tracking-wider">Loading component...</span>
    </div>
  </div>
)

// Premium Layout Wrapper for Authenticated App
function AppLayout({ user, setAuthModalOpen }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('Chart Terminal')
  const [activeAsset, setActiveAsset] = useState('AAPL')
  
  // The sidebar should only show when in 'Chart Terminal'
  const showSidebar = activeTab === 'Chart Terminal';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header 
        user={user} 
        setAuthModalOpen={setAuthModalOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      <div className="flex flex-1 min-h-0 relative">
        {showSidebar && sidebarOpen && (
          <Sidebar 
            isOpen={sidebarOpen} 
            setIsOpen={setSidebarOpen} 
            activeTicker={activeAsset} 
            onSelectTicker={setActiveAsset} 
          />
        )}
        <div className={`flex-1 flex flex-col min-h-0 relative transition-all duration-300`}>
          <Suspense fallback={<ModuleLoader />}>
            {activeTab === 'Chart Terminal' && <AssetDashboard activeTicker={activeAsset} signalsOn={false} />}
            {activeTab === 'Markets' && <div className="p-6 h-full overflow-auto"><GlobalMarkets onSelectTicker={(ticker) => { setActiveAsset(ticker); setActiveTab('Chart Terminal'); }} /></div>}
            {activeTab === 'Academy' && <Academy />}
            {activeTab === 'Portfolio' && <PortfolioPage user={user} activeTicker={activeAsset} />}
            {activeTab === 'Orders' && <div className="h-full"><OrdersPage /></div>}
            {activeTab === 'Risk Mgmt' && <div className="p-6 h-full overflow-auto"><RiskManagement /></div>}
            {activeTab === 'Pos Calc' && <div className="p-6 h-full overflow-auto"><GlobalPositionCalculator /></div>}
            {activeTab === 'News' && <div className="p-6 h-full overflow-auto"><News /></div>}
            {activeTab === 'AI Assistant' && <div className="h-full w-full overflow-hidden"><AIAssistant activeTicker={activeAsset} /></div>}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ user, setAuthModalOpen, children }) {
  const location = useLocation()
  
  useEffect(() => {
    if (!user) {
      setAuthModalOpen(true)
    }
  }, [user, setAuthModalOpen])

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const isDevMode = localStorage.getItem('isDevMode') === 'true'
    
    if (isDevMode) {
      if (!sessionStorage.getItem('dev_welcome_shown')) {
         setShowWelcome(true)
         sessionStorage.setItem('dev_welcome_shown', 'true')
      }
      setUser({ id: 'demo123', email: 'pro_trader@demotrade.com', tier: 'PRO', user_metadata: { full_name: 'Pro Trader' } })
      setLoading(false)
      return
    }

    // Safe session fetch with a 2-second timeout to prevent 5-minute freeze on DNS/network errors
    const checkSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 2000)
        )
        const res = await Promise.race([sessionPromise, timeoutPromise])
        if (res?.data?.session) {
          setUser(res.data.session.user)
        }
      } catch (err) {
        console.warn("Session check timeout or error:", err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const devModeActive = localStorage.getItem('isDevMode') === 'true'
      if (!devModeActive) {
        if (event === 'SIGNED_IN' && session?.user) {
           if (!sessionStorage.getItem('welcome_shown')) {
             setShowWelcome(true)
             sessionStorage.setItem('welcome_shown', 'true')
           }
        }
        setUser(session?.user ?? null)
        if (session?.user) {
          setAuthModalOpen(false)
        }
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="text-sm font-semibold text-slate-400">Loading DemoTrade...</span>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <PortfolioProvider user={user}>
          {showWelcome && <WelcomeOverlay user={user} onClose={() => setShowWelcome(false)} />}
          <BrowserRouter>
            <Suspense fallback={<ModuleLoader />}>
              <Routes>
                {/* Public Marketing Route */}
                <Route path="/" element={
                   user ? <Navigate to="/terminal" replace /> : <MarketingHome setAuthModalOpen={setAuthModalOpen} />
                } />
                {/* Authenticated App Routes (Wrapped in AppLayout) */}
                <Route path="/*" element={
                  <ProtectedRoute user={user} setAuthModalOpen={setAuthModalOpen}>
                    <AppLayout user={user} setAuthModalOpen={setAuthModalOpen} />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </PortfolioProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
