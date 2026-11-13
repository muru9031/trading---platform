import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, TrendingUp, Layers, ActivitySquare, Globe, Bitcoin } from 'lucide-react';
import { publicSupabase as supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';

const MARKETS = [
  { id: 'indian_equity', label: 'Indian Equity', icon: <TrendingUp size={24}/>, desc: 'NSE/BSE cash trading' },
  { id: 'us_equity', label: 'US Equity', icon: <TrendingUp size={24}/>, desc: 'NYSE/NASDAQ stocks' },
  { id: 'futures_options', label: 'Futures & Options', icon: <Layers size={24}/>, desc: 'Derivatives & leverage trading' },
  { id: 'forex', label: 'Forex', icon: <Globe size={24}/>, desc: 'Global currency pairs' },
  { id: 'crypto', label: 'Crypto', icon: <Bitcoin size={24}/>, desc: 'Digital assets & web3' },
  { id: 'commodity', label: 'Commodity', icon: <ActivitySquare size={24}/>, desc: 'Gold, Crude, Silver, etc.' }
];

const FO_REGIONS = [
  { id: 'indian_futures_options', label: 'Indian F&O', icon: <TrendingUp size={24}/>, desc: 'NSE/BSE Derivatives' },
  { id: 'us_futures_options', label: 'US F&O', icon: <Globe size={24}/>, desc: 'CME/CBOE Derivatives' }
];

const FO_SUBCATEGORIES = {
  indian_futures_options: ['Nifty 50', 'Bank Nifty', 'FinNifty', 'Sensex', 'Midcap Nifty'],
  us_futures_options: ['SPX Options', 'Nasdaq-100 (NDX) Options', 'E-mini S&P (ES) Futures', 'E-mini Nasdaq (NQ) Futures', 'Crude Oil (CL)', 'Gold (GC)']
};

const variants = {
  enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
};

export default function AddCourseWizard({ onClose, onCourseCreated, user }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    market_type: '',
    fo_region: '',
    sub_categories: []
  });

  const isFO = formData.market_type === 'futures_options';
  const totalSteps = isFO ? 4 : 2;

  const nextStep = () => {
    setDirection(1);
    setStep(step + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  const handleCreateCourse = async () => {
    setIsSubmitting(true);
    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      const finalAssetType = isFO ? formData.fo_region : formData.market_type;
      
      // Crucial: Sort array alphabetically to ensure uniqueness matches constraint
      const sortedSubCategories = [...formData.sub_categories].sort();

      // 1. Check for duplicates
      let res = await supabase
        .from('user_asset_courses')
        .select('*')
        .eq('user_id', userId)
        .eq('asset_type', finalAssetType)
        .eq('is_archived', false);
        
      if (res.error) {
        // Fallback without user_id if column missing
        res = await supabase
          .from('user_asset_courses')
          .select('*')
          .eq('asset_type', finalAssetType)
          .eq('is_archived', false);
      }
      
      const { data: existingCourse } = res;
      if (existingCourse && existingCourse.length > 0) {
        // Since Supabase doesn't easily let us filter by exact array match in JS client without contains/contained_by,
        // we manually find an exact array match.
        const exactMatch = existingCourse.find(c => 
          JSON.stringify(c.sub_category || []) === JSON.stringify(sortedSubCategories)
        );
        
        if (exactMatch) {
          showToast("You already have this exact course.", "warning");
          onCourseCreated(exactMatch); // Switch to the existing course
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Insert new course
      const { data, error } = await supabase.from('user_asset_courses').insert([{
        user_id: userId,
        asset_type: finalAssetType,
        sub_category: sortedSubCategories
      }]).select('*').single();

      if (error) {
        if (error.code === '23505') { // Postgres Unique Violation
           showToast("You already have this course.", "warning");
           setIsSubmitting(false);
           return;
        }
        throw error;
      }
      
      showToast("Course successfully created!", "success");
      onCourseCreated(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to create course.", "error");
    }
    setIsSubmitting(false);
  };

  const isStepValid = () => {
    if (step === 1) return formData.market_type !== '';
    if (step === 2 && isFO) return formData.fo_region !== '';
    if (step === 3 && isFO) return formData.sub_categories.length > 0;
    return true;
  };

  const toggleSubCategory = (cat) => {
    setFormData(prev => {
      const arr = prev.sub_categories;
      if (arr.includes(cat)) return { ...prev, sub_categories: arr.filter(i => i !== cat) };
      return { ...prev, sub_categories: [...arr, cat] };
    });
  };

  const getMarketLabel = () => {
    if (isFO) {
      const region = FO_REGIONS.find(m => m.id === formData.fo_region);
      return region ? region.label : 'Futures & Options';
    }
    return MARKETS.find(m => m.id === formData.market_type)?.label || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px]"
      >
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Course</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Design your personalized curriculum.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex justify-center gap-2 py-4 bg-gray-50 dark:bg-slate-900 shrink-0">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step === i + 1 ? 'w-8 bg-blue-500' : step > i + 1 ? 'w-2 bg-emerald-500' : 'w-2 bg-gray-300 dark:bg-slate-700'}`} />
          ))}
        </div>

        <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#0b0e14]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="absolute inset-0 p-6 md:p-10 overflow-y-auto">
              
              {/* STEP 1: Market Focus */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Market Focus</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MARKETS.map(market => (
                      <button key={market.id} onClick={() => setFormData({ ...formData, market_type: market.id, fo_region: '', sub_categories: [] })}
                        className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all group ${formData.market_type === market.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/50'}`}>
                        <div className={`p-3 rounded-xl inline-flex w-fit ${formData.market_type === market.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500'}`}>{market.icon}</div>
                        <div className="text-left">
                          <h4 className={`font-bold ${formData.market_type === market.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{market.label}</h4>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{market.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: F&O Region (Only if F&O) */}
              {step === 2 && isFO && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Market Region</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FO_REGIONS.map(region => (
                      <button key={region.id} onClick={() => setFormData({ ...formData, fo_region: region.id, sub_categories: [] })}
                        className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all group ${formData.fo_region === region.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/50'}`}>
                        <div className={`p-3 rounded-xl inline-flex w-fit ${formData.fo_region === region.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500'}`}>{region.icon}</div>
                        <div className="text-left">
                          <h4 className={`font-bold ${formData.fo_region === region.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{region.label}</h4>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{region.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: F&O Sub Categories (Only if F&O) */}
              {step === 3 && isFO && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Instruments</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Select the specific derivatives you want to master.</p>
                  <div className="flex flex-wrap gap-3">
                    {FO_SUBCATEGORIES[formData.fo_region]?.map(cat => (
                      <button key={cat} onClick={() => toggleSubCategory(cat)}
                        className={`px-4 py-3 rounded-xl border-2 font-bold transition-all flex items-center gap-2 ${formData.sub_categories.includes(cat) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-800/50'}`}>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${formData.sub_categories.includes(cat) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                          {formData.sub_categories.includes(cat) && <Check size={14} strokeWidth={3} />}
                        </div>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FINAL STEP: Review */}
              {step === totalSteps && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Review & Create</h3>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-4">
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Market Focus</span>
                      <span className="font-bold text-gray-900 dark:text-white">{getMarketLabel()}</span>
                    </div>
                    {isFO && formData.sub_categories.length > 0 && (
                      <div className="py-2 border-b border-gray-200 dark:border-slate-700 pb-4">
                        <span className="text-gray-500 dark:text-slate-400 font-medium block mb-2">Selected Instruments</span>
                        <div className="flex flex-wrap gap-2">
                          {formData.sub_categories.map(cat => (
                             <span key={cat} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">{cat}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong className="block mb-1">Your Roadmap Begins</strong>
                        You will start with the Foundation phase for {getMarketLabel()}. Once completed, you will unlock the Global Strategy Library.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 shrink-0 flex justify-between items-center">
          <button onClick={prevStep} disabled={step === 1 || isSubmitting} className={`px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 ${step === 1 ? 'opacity-0 cursor-default' : 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'}`}>
            <ChevronLeft size={18} /> Back
          </button>
          {step < totalSteps ? (
            <button onClick={nextStep} disabled={!isStepValid()} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:text-gray-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:shadow-none">
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleCreateCourse} disabled={isSubmitting} className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              {isSubmitting ? <span className="animate-pulse">Creating...</span> : 'Create Course'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
