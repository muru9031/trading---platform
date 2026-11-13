import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, Shield, Zap, Activity, Calculator, CheckCircle } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'

export default function MarketingHome({ setAuthModalOpen }) {
  
  const features = [
    {
      title: "Advanced AI Trading Terminal",
      subtitle: "Predict market trends before they happen.",
      description: "Our proprietary Random Forest ML model analyzes historical patterns to generate highly accurate Entry, Stop Loss, and Take Profit zones in real-time.",
      icon: TrendingUp,
      image: "/image_d4d501.png",
      alt: "Advanced AI Trading Terminal",
      reversed: false
    },
    {
      title: "P-Trade Portfolio Simulator",
      subtitle: "Practice without risking real capital.",
      description: "Execute trades directly from the chart using our revolutionary MT5-style drag mechanics. Track your performance, manage risk, and test strategies in a risk-free environment.",
      icon: Activity,
      image: "/image_8deb18.png",
      alt: "P-Trade Portfolio Simulator",
      reversed: true
    },
    {
      title: "Pro Position Calculators",
      subtitle: "Never blow your account again.",
      description: "Instantly calculate risk percentages, lot sizes for Forex, and exact quantities for Stocks based on your dynamic account balance.",
      icon: Calculator,
      image: "/showcase_poscalc.png",
      alt: "Pro Position Sizing Calculator",
      reversed: false
    }
  ]

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      description: "Perfect for beginners learning the markets.",
      features: ["Basic Charting Tools", "Live Market Data", "P-Trade Simulator (100k Capital)", "Position Calculators"],
      buttonText: "Start Free",
      isPro: false
    },
    {
      name: "Pro",
      price: "₹999/mo",
      description: "Advanced analytics for serious traders.",
      features: ["AI Entry/Target Predictions", "Unlimited Draft Portfolios", "Advanced Options Chain", "No Ads & Priority Support"],
      buttonText: "Upgrade to Pro",
      isPro: true
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar setAuthModalOpen={setAuthModalOpen} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8 border border-blue-200 dark:border-blue-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Market Data Integrated
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Trade with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Clarity</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Control</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Build winning strategies, predict market trends, analyse your trades, and make informed decisions. Perfect for beginners and professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              Start Trading Free <ArrowRight size={20} />
            </button>
            <Link
              to="/academy"
              className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-white rounded-xl font-bold text-lg transition-all border border-gray-200 dark:border-slate-800"
            >
              Explore Academy
            </Link>
          </div>
        </motion.div>

        {/* Hero Image Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          onClick={() => setAuthModalOpen(true)}
          className="mt-16 w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 relative bg-slate-950 flex items-center justify-center group cursor-pointer"
        >
          <img 
            src="/image_d4d501.png" 
            alt="DemoTrade Trading Terminal Demo"
            className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Terminal • Live Multi-Asset Simulator</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/90 text-white rounded-xl text-sm font-semibold shadow-lg">
              <span>Launch Demo</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Zig-Zag Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-32">
          {features.map((feature, idx) => (
            <div key={idx} className={`flex flex-col ${feature.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}>
              
              {/* Text Side */}
              <motion.div 
                initial={{ opacity: 0, x: feature.reversed ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="flex-1 space-y-6"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                  <feature.icon size={24} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{feature.title}</h2>
                <h3 className="text-xl text-teal-600 dark:text-teal-400 font-medium">{feature.subtitle}</h3>
                <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Explore Feature <ArrowRight size={18} />
                </button>
              </motion.div>

              {/* Feature Showcase Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="flex-1 w-full"
              >
                <div className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 bg-slate-900 overflow-hidden relative group">
                  <img 
                    src={feature.image} 
                    alt={feature.alt}
                    className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-mono">
                    {feature.title}
                  </div>
                </div>
              </motion.div>

            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">No hidden fees. Start for free, upgrade when you need advanced intelligence.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            {pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className={`rounded-3xl p-8 border ${plan.isPro ? 'bg-slate-900 border-slate-800 text-white relative overflow-hidden' : 'bg-gray-50 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800'}`}
              >
                {plan.isPro && <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-blue-600 to-teal-400 text-white text-xs font-bold rounded-bl-xl">POPULAR</div>}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-extrabold mb-4">{plan.price}</div>
                <p className={`mb-8 ${plan.isPro ? 'text-slate-400' : 'text-gray-500 dark:text-slate-400'}`}>{plan.description}</p>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle size={20} className={plan.isPro ? 'text-teal-400' : 'text-blue-500'} />
                      <span className={plan.isPro ? 'text-slate-300' : 'text-gray-600 dark:text-slate-300'}>{item}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${plan.isPro ? 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                  {plan.buttonText}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
        <p>© 2026 DemoTrade Platform. All Rights Reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link to="#" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</Link>
          <Link to="#" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</Link>
          <Link to="#" className="hover:text-gray-900 dark:hover:text-white">Contact Support</Link>
        </div>
      </footer>
    </div>
  )
}
