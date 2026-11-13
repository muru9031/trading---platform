import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, TrendingUp, BookOpen, ArrowRight, Check } from 'lucide-react';
import { publicSupabase as supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Gujarati'];
const MARKETS = [
  { id: 'Stocks & Investing', label: 'Stocks & Investing (Basics)', icon: TrendingUp },
  { id: 'Options & Futures', label: 'Options & Futures (Advanced)', icon: TrendingUp },
  { id: 'Forex', label: 'Forex (Currencies)', icon: Globe },
  { id: 'Crypto', label: 'Crypto (Digital Assets)', icon: BookOpen }
];
const SUBMARKETS = ['Nifty 50', 'Bank Nifty', 'Sensex'];

export default function LMSOnboarding({ onComplete, user }) {
  const [step, setStep] = useState(1);
  const [languages, setLanguages] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [submarkets, setSubmarkets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const toggleSelection = (setter, item) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (languages.length === 0) {
        showToast("Please select at least one language.", "error");
        return;
      }
      setStep(2);
      return;
    }
    
    if (step === 2) {
      if (markets.length === 0) {
        showToast("Please select at least one market.", "error");
        return;
      }
      if (markets.includes('Options & Futures')) {
        setStep(3);
        return;
      }
      await saveLearningPath();
      return;
    }
    
    if (step === 3) {
      if (submarkets.length === 0) {
        showToast("Please select at least one index.", "error");
        return;
      }
      await saveLearningPath();
      return;
    }
  };

  const saveLearningPath = async () => {
    setIsSaving(true);
    const pathData = { languages, markets, submarkets };

    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      const { error } = await supabase.from('user_learning_path').upsert({
        user_id: userId,
        language: languages.join(','), // store as comma-separated or json in DB
        market_type: markets.join(','),
        current_phase: 1
      }, { onConflict: 'user_id, market_type' });

      if (error) throw error;
      
      showToast("Welcome to the Academy!", "success");
      onComplete(pathData);
    } catch (err) {
      console.warn("Save path error:", err);
      // Fallback for resilient MVP
      localStorage.setItem('lms_path', JSON.stringify(pathData));
      showToast("Saved locally (Database not synced). Welcome!", "success");
      onComplete(pathData);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0b0e14] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Beginner to Pro Trading</h1>
          <p className="text-gray-500 dark:text-slate-400">Personalize your learning journey (Multi-select allowed).</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">1. Choose your Languages</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {LANGUAGES.map(lang => {
                  const isSelected = languages.includes(lang);
                  return (
                    <button 
                      key={lang} 
                      onClick={() => toggleSelection(setLanguages, lang)}
                      className={`relative py-4 px-6 rounded-xl border-2 font-semibold transition-all ${
                        isSelected 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                        : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {lang}
                      {isSelected && <Check size={16} className="absolute top-2 right-2 text-blue-500" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">2. Which Markets do you want to learn?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MARKETS.map(m => {
                  const Icon = m.icon;
                  const isSelected = markets.includes(m.id);
                  return (
                    <button 
                      key={m.id} 
                      onClick={() => toggleSelection(setMarkets, m.id)}
                      className={`relative flex items-center p-4 rounded-xl border-2 font-semibold transition-all ${
                        isSelected 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                        : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon size={24} className="mr-4" />
                      <div className="text-left text-lg">{m.label}</div>
                      {isSelected && <Check size={18} className="absolute top-4 right-4 text-blue-500" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">3. Select Your Primary Indices (Options)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBMARKETS.map(sub => {
                  const isSelected = submarkets.includes(sub);
                  return (
                    <button 
                      key={sub} 
                      onClick={() => toggleSelection(setSubmarkets, sub)}
                      className={`relative py-4 px-6 rounded-xl border-2 font-semibold transition-all ${
                        isSelected 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {sub}
                      {isSelected && <Check size={16} className="absolute top-2 right-2 text-emerald-500" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex justify-between items-center">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)} 
              className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 font-semibold"
            >
              Back
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={isSaving}
            className={`ml-auto flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all ${
              isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30'
            }`}
          >
            {isSaving ? 'Saving...' : (step === 2 && !markets.includes('Options & Futures')) || step === 3 ? 'Start Learning' : 'Continue'} 
            {!isSaving && <ArrowRight size={18} />}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
