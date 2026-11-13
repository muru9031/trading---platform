import { X, CheckCircle, Lock, TrendingUp, Zap } from 'lucide-react'

export default function ProFeatureModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/20 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-fade-in flex flex-col md:flex-row">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors bg-slate-900/50 rounded-full p-1 backdrop-blur-md">
          <X size={20} />
        </button>

        {/* Left Side: Pitch */}
        <div className="flex-1 bg-gradient-to-br from-blue-900 to-indigo-900 p-8 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center mb-6 border border-blue-400/30 shadow-lg shadow-blue-500/20">
              <Lock className="text-blue-300" size={24} />
            </div>
            <h2 className="text-3xl font-extrabold mb-4 leading-tight">Unlock AI Trading Intelligence</h2>
            <p className="text-blue-200 mb-8 leading-relaxed">
              You're currently on the Free plan. Upgrade to Pro to access our proprietary AI prediction models, advanced options data, and unlimited draft portfolios.
            </p>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <CheckCircle className="text-teal-400" size={18} />
                 <span className="text-sm font-medium">Random Forest AI Price Predictions</span>
               </div>
               <div className="flex items-center gap-3">
                 <CheckCircle className="text-teal-400" size={18} />
                 <span className="text-sm font-medium">Auto-calculated Stop Loss & Take Profit</span>
               </div>
               <div className="flex items-center gap-3">
                 <CheckCircle className="text-teal-400" size={18} />
                 <span className="text-sm font-medium">Advanced Multi-strike Options Chain</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Pricing & CTA */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 text-center">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Pro Plan</div>
          <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">₹999<span className="text-xl text-gray-500 font-medium">/mo</span></div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">Billed monthly. Cancel anytime.</p>
          
          <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
            <Zap size={20} />
            Upgrade to Pro Now
          </button>
          
          <p className="mt-4 text-xs text-gray-400 dark:text-slate-500">
            Secure payment via Razorpay / Stripe
          </p>
        </div>

      </div>
    </div>
  )
}
