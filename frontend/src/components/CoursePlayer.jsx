import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle, Lock, XCircle, Award, BookOpen, Target, Map, BarChart3, ChevronRight, AlertTriangle, LineChart, ShieldAlert, Activity, Zap, Clock, Layers, Globe, TrendingUp, Plus } from 'lucide-react';
import { publicSupabase as supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import ChatWidget from './ChatWidget';
import confetti from 'canvas-confetti';
import { List } from 'react-window';

const STRATEGY_CARDS = [
  { id: 'price_action', label: 'Price Action', subtitle: 'Naked Charts & S/R', icon: <LineChart size={40}/>, desc: 'Master market structure, support/resistance, and candlestick patterns.' },
  { id: 'smc', label: 'Smart Money Concepts', subtitle: 'Institutional Trading', icon: <Target size={40}/>, desc: 'Trade like the banks. Identify liquidity grabs, order blocks, and fair value gaps.' },
  { id: 'indicator_based', label: 'Indicator Based', subtitle: 'Algorithmic Edge', icon: <Activity size={40}/>, desc: 'RSI, MACD, Bollinger Bands, and Moving Averages.' },
  { id: 'breakout_momentum', label: 'Breakout Momentum', subtitle: 'Catch the Move', icon: <Zap size={40}/>, desc: 'Identify consolidations and trade explosive breakouts with volume.' },
  { id: 'swing_positional', label: 'Swing & Positional', subtitle: 'Higher Timeframes', icon: <Clock size={40}/>, desc: 'Wyckoff method, multi-day holds, and sector rotation.' },
  { id: 'options_strategies', label: 'Options Strategies', subtitle: 'Advanced Derivatives', icon: <Layers size={40}/>, desc: 'Greeks, Spreads, Condors, and premium decay.', requires_options: true },
  { id: 'scalping', label: 'Scalping', subtitle: 'Ultra-Short Term', icon: <Zap size={40}/>, desc: 'Tape reading, order book analysis, and fast execution.' },
  { id: 'mean_reversion', label: 'Mean Reversion', subtitle: 'Fade the Extreme', icon: <Activity size={40}/>, desc: 'Trade against over-extended moves and return to the mean.' },
  { id: 'news_event_based', label: 'News & Event Based', subtitle: 'Volatility Trading', icon: <Globe size={40}/>, desc: 'Economic calendar, earnings, and central bank reactions.' },
  { id: 'trend_following_systematic', label: 'Trend Following', subtitle: 'Systematic Rules', icon: <TrendingUp size={40}/>, desc: 'Mechanical entry/exits, trailing stops, and pyramiding.' }
];

const ROADMAP_PHASES = [
  { phase_number: 1, title: "Foundation", category: 'foundation' },
  { phase_number: 2, title: "Strategy Library", category: 'strategy' },
  { phase_number: 3, title: "Risk Management", category: 'risk' },
  { phase_number: 4, title: "Discipline", category: 'discipline' },
  { phase_number: 5, title: "Psychology", category: 'psychology' },
  { phase_number: 6, title: "P-Trade Certification", category: 'certification' },
];

export default function CoursePlayer({ course, allCourses, user }) {
  const [activeSubTab, setActiveSubTab] = useState('roadmap'); 
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Roadmap Data
  const [topics, setTopics] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [userStrategies, setUserStrategies] = useState([]);
  const [userGlobal, setUserGlobal] = useState(null);
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);
  const [pTradeCount, setPTradeCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(null); 
  const [showStrategyPicker, setShowStrategyPicker] = useState(false);

  // Challenge (Video) State
  const [challengeModules, setChallengeModules] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  
  // Anti-Cheat State
  const playerRef = useRef(null);
  const [maxTimeWatched, setMaxTimeWatched] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const { showToast } = useToast();

  const userId = user?.id || '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    fetchCourseData();
  }, [course.id]);

  useEffect(() => {
    if (!playerRef.current) return;
    const interval = setInterval(async () => {
      try {
        const currentTime = await playerRef.current.getCurrentTime();
        const state = await playerRef.current.getPlayerState();
        if (state === 1 || state === 3) {
           if (currentTime > maxTimeWatched + 2) {
             playerRef.current.seekTo(maxTimeWatched);
             showToast("Please watch the video without skipping.", "warning");
           } else {
             setMaxTimeWatched(Math.max(maxTimeWatched, currentTime));
             if (videoDuration > 0 && currentTime >= videoDuration - 2) {
                unlockLessonVideo();
             }
           }
        }
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [maxTimeWatched, videoDuration, currentLesson]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Topics
      const { data: dbTopics } = await supabase
        .from('topics')
        .select('*')
        .or(`asset_type.eq.${course.asset_type},asset_type.is.null`)
        .order('order_index');
        
      // Filter out NSE vs BSE topic if Sensex is not selected
      const filteredTopics = (dbTopics || []).filter(t => {
          if (t.asset_type === 'indian_futures_options' && t.title === 'NSE vs BSE Derivatives Differences') {
              return course.sub_category && course.sub_category.includes('Sensex');
          }
          return true;
      });
      setTopics(filteredTopics);

      // 2. Fetch Progress
      const { data: dbProgress } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', userId);
        
      // 3. Fetch Global Strategy Progress
      const { data: dbStrats } = await supabase
        .from('user_strategy_progress')
        .select('*')
        .eq('user_id', userId);

      // 4. Fetch Global Progress
      let { data: dbGlobal } = await supabase
        .from('user_global_progress')
        .select('*')
        .eq('user_id', userId).single();
        
      if (!dbGlobal) {
        const res = await supabase.from('user_global_progress').insert([{ user_id: userId }]).select().single();
        dbGlobal = res.data;
      }

      // 5. Fetch P-Trade Gate
      let { data: dbGate } = await supabase
        .from('user_ptrade_gate')
        .select('*')
        .eq('user_asset_course_id', course.id).single();

      if (!dbGate) {
        const res = await supabase.from('user_ptrade_gate').insert([{ user_asset_course_id: course.id }]).select().single();
        dbGate = res.data;
      }
      
      const progressMap = {};
      dbProgress?.forEach(p => { progressMap[p.topic_id] = p; });
      setProgressData(progressMap);

      const userStratsList = dbStrats || [];
      setUserStrategies(userStratsList);
      setUserGlobal(dbGlobal);
      setIsGateUnlocked(dbGate?.is_unlocked || false);
      setPTradeCount(dbGate?.trades_completed || 0);

      // Evaluate P-Trades if Gate isn't unlocked but Phase 5 is done
      await evaluateTradeGate(filteredTopics, progressMap, userStratsList, dbGate);

      // CHALLENGE DATA (Legacy Video mapping)
      const { data: cCourses } = await supabase.from('courses').select('*').eq('market_type', 'Stocks').order('order_index');
      const { data: cModules } = await supabase.from('modules').select('*').order('order_index');
      const { data: cLessons } = await supabase.from('lessons').select('*').order('order_index');
      const { data: cProgress } = await supabase.from('user_progress').select('*').eq('user_id', userId);

      if (cCourses && cCourses.length > 0) {
        const hasPriceAction = userStratsList.some(s => s.strategy_key === 'price_action');
        const hasSMC = userStratsList.some(s => s.strategy_key === 'smc');
        
        const filteredCCourses = cCourses.filter(c => {
           if (c.phase_name.includes('Price Action')) return hasPriceAction;
           if (c.phase_name.includes('SMC')) return hasSMC;
           return true; 
        });

        const tree = filteredCCourses.map(c => ({
          ...c,
          modules: cModules.filter(m => m.course_id === c.id).map(m => ({
            ...m,
            lessons: cLessons.filter(l => l.module_id === m.id).map(l => {
              const p = cProgress?.find(pr => pr.lesson_id === l.id);
              return { ...l, progress: p || { video_completed: false, quiz_passed: false, quiz_score: 0 } };
            })
          }))
        }));
        setChallengeModules(tree);
      }
    } catch (err) {
      console.error("Data fetch error:", err);
    }
    setLoading(false);
  };

  const evaluateTradeGate = async (allTopics, currentProgressMap, strats, gate) => {
    if (gate?.is_unlocked) return;
    
    const psychTopics = allTopics.filter(t => t.category === 'psychology');
    const psychDone = psychTopics.length > 0 && psychTopics.every(t => currentProgressMap[t.id]?.is_completed);
    
    if (psychDone) {
      const { count, error } = await supabase.from('paper_trades').select('*', { count: 'exact' }).eq('user_id', userId);
      if (!error) {
        setPTradeCount(count || 0);
        if (count >= 50 && !gate?.is_unlocked) {
           setIsGateUnlocked(true);
           await supabase.from('user_ptrade_gate').update({ trades_completed: count, is_unlocked: true }).eq('user_asset_course_id', course.id);
           await supabase.from('user_asset_courses').update({ certified: true, certified_at: new Date().toISOString() }).eq('id', course.id);
        } else if (count !== gate?.trades_completed) {
           await supabase.from('user_ptrade_gate').update({ trades_completed: count }).eq('user_asset_course_id', course.id);
        }
      }
    }
  };

  const handleStrategySelection = async (strategyId) => {
    setSavingStrategy(true);
    try {
      const { data, error } = await supabase.from('user_strategy_progress').insert([
        { user_id: userId, strategy_key: strategyId }
      ]).select('*').single();
      if (error) throw error;
      
      setUserStrategies(prev => [...prev, data]);
      setShowStrategyPicker(false);
      showToast("Strategy added to your library!", "success");
      
      await fetchCourseData(); 
    } catch (err) {
      showToast("Failed to add strategy.", "error");
    }
    setSavingStrategy(false);
  };

  const handleToggleTopic = async (topic, currentPhaseNum, e) => {
    if (savingStrategy) return;

    const isCompleted = !progressData[topic.id]?.is_completed;
    
    if (isCompleted && !prefersReducedMotion && e) {
       const x = e.clientX / window.innerWidth;
       const y = e.clientY / window.innerHeight;
       confetti({ particleCount: 25, spread: 40, origin: { x, y }, colors: ['#10B981', '#34D399'], ticks: 50, gravity: 0.8, scalar: 0.6, zIndex: 100 });
    }

    const newProgress = {
      ...progressData,
      [topic.id]: { is_completed: isCompleted, completed_at: new Date().toISOString() }
    };
    setProgressData(newProgress);

    await supabase.from('user_topic_progress').upsert({
      user_id: userId, topic_id: topic.id, is_completed: isCompleted, completed_at: new Date().toISOString()
    });

    if (isCompleted) {
      let phaseTopics = [];
      if (topic.category === 'strategy') {
        phaseTopics = topics.filter(t => t.category === 'strategy' && t.strategy_key === topic.strategy_key);
      } else {
        phaseTopics = topics.filter(t => t.category === topic.category);
      }
      
      const allPhaseComplete = phaseTopics.every(t => newProgress[t.id]?.is_completed);
      
      if (allPhaseComplete) {
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            zIndex: 1000
          });
        }
        setShowCelebration(topic.category);
        setTimeout(() => setShowCelebration(null), 3000);
        
        if (topic.category === 'strategy') {
           await supabase.from('user_strategy_progress')
             .update({ is_completed: true, completed_at: new Date().toISOString() })
             .eq('user_id', userId).eq('strategy_key', topic.strategy_key);
             
           setUserStrategies(prev => prev.map(s => s.strategy_key === topic.strategy_key ? { ...s, is_completed: true } : s));
        }
      }
    }

    if (currentPhaseNum === 5) {
      evaluateTradeGate(topics, newProgress, userStrategies, { is_unlocked: isGateUnlocked, trades_completed: pTradeCount });
    }
  };

  const isPhaseUnlocked = (phaseNumber) => {
    if (phaseNumber === 1) return true;
    
    const foundTopics = topics.filter(t => t.category === 'foundation');
    const foundationDone = foundTopics.length > 0 && foundTopics.every(t => progressData[t.id]?.is_completed);
    
    if (phaseNumber === 2) return foundationDone;
    
    if (phaseNumber >= 3) {
      const strategyDone = userStrategies.some(s => s.is_completed);
      if (!strategyDone) return false;
      if (phaseNumber === 3) return true; 
      
      const riskTopics = topics.filter(t => t.category === 'risk');
      const riskDone = riskTopics.length > 0 && riskTopics.every(t => progressData[t.id]?.is_completed);
      if (phaseNumber === 4) return riskDone; 
      
      const discTopics = topics.filter(t => t.category === 'discipline');
      const discDone = discTopics.length > 0 && discTopics.every(t => progressData[t.id]?.is_completed);
      if (phaseNumber === 5) return discDone; 
      
      const psychTopics = topics.filter(t => t.category === 'psychology');
      const psychDone = psychTopics.length > 0 && psychTopics.every(t => progressData[t.id]?.is_completed);
      if (phaseNumber === 6) return psychDone;
    }
    return false;
  };

  const handleSelectLesson = async (lesson) => {
    setCurrentLesson(lesson);
    setQuizAnswers({});
    setQuizResult(null);
    setMaxTimeWatched(0);
    setVideoDuration(0);
    playerRef.current = null;
    const { data } = await supabase.from('quiz_questions').select('*').eq('lesson_id', lesson.id);
    if (data) setQuizQuestions(data);
  };

  const unlockLessonVideo = async () => {
    if (!currentLesson || currentLesson.progress.video_completed) return;
    try { await supabase.from('user_progress').upsert({ user_id: userId, lesson_id: currentLesson.id, video_completed: true }); } catch (e) {}
    setCurrentLesson(prev => ({ ...prev, progress: { ...prev.progress, video_completed: true } }));
    setChallengeModules(prev => prev.map(c => ({
      ...c, modules: c.modules.map(m => ({ ...m, lessons: m.lessons.map(l => l.id === currentLesson.id ? { ...l, progress: { ...l.progress, video_completed: true } } : l) }))
    })));
    showToast("Video Completed! Knowledge Check Unlocked.", "success");
  };

  const submitQuiz = async () => {
    let score = 0;
    quizQuestions.forEach(q => { if (quizAnswers[q.id] === q.correct_option) score++; });
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const passed = percentage >= 70;
    setQuizResult({ passed, score: percentage, rawScore: score, total: quizQuestions.length });
    if (passed) {
      try { await supabase.from('user_progress').upsert({ user_id: userId, lesson_id: currentLesson.id, video_completed: true, quiz_passed: true, quiz_score: percentage, completed_at: new Date().toISOString() }); } catch (e) {}
      setCurrentLesson(prev => ({ ...prev, progress: { ...prev.progress, quiz_passed: true, quiz_score: percentage } }));
      setChallengeModules(prev => prev.map(c => ({
        ...c, modules: c.modules.map(m => ({ ...m, lessons: m.lessons.map(l => l.id === currentLesson.id ? { ...l, progress: { ...l.progress, quiz_passed: true, quiz_score: percentage } } : l) }))
      })));
    }
  };

  const loadNextLesson = () => {
    const all = challengeModules.flatMap(c => c.modules).flatMap(m => m.lessons);
    const idx = all.findIndex(l => l.id === currentLesson.id);
    if (idx >= 0 && idx < all.length - 1) handleSelectLesson(all[idx + 1]);
  };

  const getVideoId = (lesson) => {
    if (!lesson || !lesson.youtube_video_ids) return '';
    try {
      let ids = lesson.youtube_video_ids;
      if (typeof ids === 'string') ids = JSON.parse(ids);
      return ids['English'] || Object.values(ids)[0] || '';
    } catch (e) { return ''; }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    setVideoDuration(event.target.getDuration());
  };
  const onPlayerStateChange = (event) => {
    if (event.data === 1 && videoDuration === 0) setVideoDuration(event.target.getDuration());
  };

  const allChallengeLessons = challengeModules.flatMap(c => c.modules).flatMap(m => m.lessons);

  // Virtualized Topic Row Renderer
  const VirtualTopicRow = ({ index, style, data }) => {
    const { phaseTopics, progressData, handleToggleTopic, phaseNumber } = data;
    const topic = phaseTopics[index];
    const isChecked = progressData[topic.id]?.is_completed;
    return (
      <div style={{ ...style, paddingBottom: '12px', paddingRight: '8px', paddingLeft: '8px' }}>
        <motion.button 
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          key={topic.id} 
          onClick={(e) => handleToggleTopic(topic, phaseNumber, e)} 
          className={`w-full h-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 shadow-sm relative overflow-hidden group ${isChecked ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-blue-400 hover:shadow-md'}`}>
          
          <div className={`relative mt-0.5 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors z-10 ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'}`}>
            {isChecked && <CheckCircle size={14} strokeWidth={3} />}
          </div>
          
          <div className="flex flex-col">
             <span className={`text-[15px] font-bold leading-snug z-10 transition-colors ${isChecked ? 'opacity-80' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{topic.title}</span>
             {!isChecked && <span className="text-xs font-semibold text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to complete</span>}
          </div>
        </motion.button>
      </div>
    );
  };

  const TopicList = ({ phaseTopics, phaseNumber }) => {
    if (phaseTopics.length <= 20) {
      return (
        <div className="space-y-3">
          {phaseTopics.map(topic => {
            const isChecked = progressData[topic.id]?.is_completed;
            return (
              <motion.button 
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                key={topic.id} 
                onClick={(e) => handleToggleTopic(topic, phaseNumber, e)} 
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 shadow-sm relative overflow-hidden group ${isChecked ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-blue-400 hover:shadow-md'}`}>
                
                <div className={`relative mt-0.5 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors z-10 ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'}`}>
                  {isChecked && <CheckCircle size={14} strokeWidth={3} />}
                </div>
                
                <div className="flex flex-col">
                   <span className={`text-[15px] font-bold leading-snug z-10 transition-colors ${isChecked ? 'opacity-80' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{topic.title}</span>
                   {!isChecked && <span className="text-xs font-semibold text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to complete</span>}
                </div>
              </motion.button>
            );
          })}
        </div>
      );
    }

    return (
      <List
        height={Math.min(phaseTopics.length * 60, 400)}
        itemCount={phaseTopics.length}
        itemSize={60}
        width="100%"
        itemData={{ phaseTopics, progressData, handleToggleTopic, phaseNumber }}
        className="hide-scrollbar"
      >
        {VirtualTopicRow}
      </List>
    );
  };

  const StrategySelectionUI = () => {
    const hasOptionsCourse = allCourses.some(c => c.asset_type.includes('futures_options'));
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Strategy Library</h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
            Choose a trading framework that resonates with you.
          </p>
        </div>
        <div className="grid gap-6 max-w-5xl mx-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {STRATEGY_CARDS.map((strat, idx) => {
            if (strat.requires_options && !hasOptionsCourse) return null;
            if (userStrategies.some(s => s.strategy_key === strat.id)) return null;

            return (
              <button
                key={strat.id}
                onClick={() => handleStrategySelection(strat.id)}
                disabled={savingStrategy}
                className="flex flex-col text-left p-8 rounded-3xl border-2 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all relative overflow-hidden group min-h-[320px] justify-between hover:scale-[1.02] hover:border-blue-500 hover:shadow-[0_10px_40px_rgba(59,130,246,0.2)]"
              >
                <div>
                   <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 transition-colors ${idx % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                   <div className={`mb-6 p-4 rounded-2xl w-fit ${idx % 2 === 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                     {strat.icon}
                   </div>
                   <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{strat.label}</h3>
                   <div className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-400">{strat.subtitle}</div>
                   <p className="text-gray-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">{strat.desc}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Select Path <ChevronRight size={18} />
                </div>
              </button>
            )
          })}
        </div>
        {userStrategies.length > 0 && (
          <div className="text-center mt-8">
            <button onClick={() => setShowStrategyPicker(false)} className="text-gray-500 hover:text-gray-800 font-bold">Cancel</button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-white dark:bg-[#0b0e14]">
      
      {/* Left Sub-Tab Navigation */}
      <div className="w-full md:w-56 bg-gray-50 dark:bg-slate-900/80 border-r border-gray-200 dark:border-slate-800 flex flex-row md:flex-col shrink-0 p-4 gap-2 z-10 overflow-x-auto md:overflow-y-auto hide-scrollbar">
        <button onClick={() => setActiveSubTab('roadmap')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeSubTab === 'roadmap' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
          <Map size={18} /> Master Roadmap
        </button>
        <button onClick={() => setActiveSubTab('challenge')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeSubTab === 'challenge' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
          <Target size={18} /> Video Challenges
        </button>
        <button onClick={() => setActiveSubTab('tracker')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeSubTab === 'tracker' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
          <BarChart3 size={18} /> Tracker
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative scroll-smooth flex">
        {loading ? (
           <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>
        ) : (
          <>
            {/* TAB 1: ROADMAP */}
            {activeSubTab === 'roadmap' && (
              <div className="max-w-4xl mx-auto pb-20 p-4 md:p-8 w-full relative">
                
                <AnimatePresence>
                  {showCelebration && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="bg-emerald-500 text-white px-10 py-8 rounded-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                        <Award size={64} className="mx-auto mb-4" />
                        <h2 className="text-3xl font-black mb-2">Phase Unlocked!</h2>
                        <p className="font-medium opacity-90">Outstanding dedication to your craft.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mb-8 p-6 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl text-white shadow-xl flex gap-5 items-center relative overflow-hidden border border-blue-500/30">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <BookOpen size={40} className="shrink-0 drop-shadow-md text-blue-200" />
                  <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Master Syllabus</h2>
                    <p className="text-blue-200 font-medium text-sm md:text-base">Your personalized skill-tree for {course.asset_type.split('_').join(' ').toUpperCase()}.</p>
                  </div>
                </div>

                {/* Animated connecting line gradient */}
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-blue-500/50 before:via-blue-300/30 before:to-blue-500/50 before:animate-pulse before:rounded-full">
                  {ROADMAP_PHASES.map((phase) => {
                    let phaseTopics = topics.filter(t => t.category === phase.category);
                    const unlocked = isPhaseUnlocked(phase.phase_number);
                    const active = unlocked && (!isPhaseUnlocked(phase.phase_number + 1) || phase.phase_number === 6);
                    
                    const isPhase2 = phase.phase_number === 2;
                    let completed = false;
                    
                    if (isPhase2) {
                       completed = userStrategies.length > 0 && userStrategies.every(s => s.is_completed);
                    } else if (phase.phase_number === 6) {
                       completed = isGateUnlocked;
                    } else {
                       completed = phaseTopics.length > 0 && phaseTopics.every(t => progressData[t.id]?.is_completed);
                    }

                    return (
                      <div key={phase.phase_number} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-ml-5 md:group-even:-mr-5 shadow-sm absolute left-5 md:left-1/2 -translate-x-1/2 z-10 ${completed ? 'bg-emerald-500 border-emerald-200 text-white' : active ? 'bg-blue-600 border-blue-200 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : unlocked ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600' : 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-400'}`}>
                          {completed ? <CheckCircle size={16} strokeWidth={3} /> : <span className="font-bold text-sm">{phase.phase_number}</span>}
                        </div>

                        <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0 p-1`}>
                          <motion.div layout className={`bg-white dark:bg-slate-900 border-2 rounded-2xl overflow-hidden transition-all duration-500 ${active ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : unlocked ? 'border-gray-200 dark:border-slate-800' : 'border-gray-200/50 dark:border-slate-800/50 opacity-60 backdrop-blur-sm grayscale-[50%]'}`}>
                            <div className={`p-5 border-b flex justify-between items-center relative overflow-hidden ${active ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-gray-50/50 dark:bg-slate-800/20 border-gray-100 dark:border-slate-800/50'}`}>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Phase {phase.phase_number}</span>
                                <h3 className={`text-lg font-bold ${unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-500'}`}>{phase.title}</h3>
                              </div>
                              {!unlocked && (
                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                  <Lock size={20} className="text-gray-400" />
                                </motion.div>
                              )}
                            </div>

                            <div className="p-5">
                              {!unlocked ? (
                                <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">Complete Phase {phase.phase_number - 1} to unlock this module.</div>
                              ) : (
                                isPhase2 ? (
                                  showStrategyPicker || userStrategies.length === 0 ? (
                                    <StrategySelectionUI />
                                  ) : (
                                    <div className="space-y-6">
                                      {userStrategies.map(strat => {
                                         const stratInfo = STRATEGY_CARDS.find(s => s.id === strat.strategy_key);
                                         const stratTopics = topics.filter(t => t.category === 'strategy' && t.strategy_key === strat.strategy_key);
                                         const stratComplete = strat.is_completed;
                                         return (
                                           <div key={strat.id} className="border-2 border-gray-200 dark:border-slate-700 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-md">
                                              <div className={`p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center transition-colors ${stratComplete ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                                                <div className="flex items-center gap-4">
                                                  <div className={`p-3 rounded-2xl ${stratComplete ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>{stratInfo?.icon}</div>
                                                  <div>
                                                    <h4 className="font-extrabold text-xl text-gray-900 dark:text-white">{stratInfo?.label}</h4>
                                                    <p className="text-sm font-semibold text-gray-500">{stratInfo?.subtitle}</p>
                                                  </div>
                                                </div>
                                                {stratComplete ? <CheckCircle className="text-emerald-500" size={28} strokeWidth={2.5}/> : <div className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 text-xs font-bold rounded-full">IN PROGRESS</div>}
                                              </div>
                                              <div className="p-4 bg-gray-50 dark:bg-slate-900/50">
                                                <TopicList phaseTopics={stratTopics} phaseNumber={phase.phase_number} />
                                              </div>
                                           </div>
                                         )
                                      })}
                                      
                                      {!showStrategyPicker && (
                                        <div className="pt-4">
                                          {userStrategies.length > 0 && userStrategies.some(s => !s.is_completed) ? (
                                             <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 font-semibold text-center flex items-center justify-center gap-2 text-sm shadow-inner">
                                               <Lock size={16}/> Complete your active strategy path to unlock more.
                                             </div>
                                          ) : (
                                            <button onClick={() => setShowStrategyPicker(true)} className="w-full py-5 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400 font-bold hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 group">
                                              <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors"><Plus size={20}/></div>
                                              Learn another strategy
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                ) : phase.phase_number === 6 ? (
                                  <div className={`p-8 rounded-3xl text-center relative overflow-hidden shadow-2xl border-2 ${isGateUnlocked ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 border-emerald-500/50' : 'bg-gradient-to-br from-slate-900 to-black border-slate-800'}`}>
                                     {/* Boss level aesthetic glow */}
                                     <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full opacity-20 -translate-y-1/2 translate-x-1/2 ${isGateUnlocked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                     <div className={`absolute bottom-0 left-0 w-64 h-64 blur-3xl rounded-full opacity-20 translate-y-1/2 -translate-x-1/2 ${isGateUnlocked ? 'bg-emerald-500' : 'bg-rose-600'}`} />
                                     
                                     <div className="relative z-10">
                                       <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-4 ${isGateUnlocked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-slate-800/80 border-slate-600 text-slate-400'}`}>
                                         {isGateUnlocked ? <Award size={40} /> : <Lock size={40} />}
                                       </div>
                                       
                                       <h4 className={`text-2xl font-black tracking-tight mb-3 ${isGateUnlocked ? 'text-emerald-400' : 'text-white'}`}>
                                         {isGateUnlocked ? 'CERTIFICATION UNLOCKED' : 'FINAL GATE: PRACTICAL EXECUTION'}
                                       </h4>
                                       
                                       <p className="text-slate-300 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                                         Execute 50 virtual trades in the <strong className="text-amber-400">{course.asset_type.split('_').join(' ').toUpperCase()}</strong> market via P-Trade with strict Stop-Loss attached to earn your certification.
                                       </p>
                                       
                                       <div className="max-w-md mx-auto bg-black/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                                          <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                                            <span className={`text-lg font-black font-mono ${isGateUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.min(pTradeCount, 50)} / 50</span>
                                          </div>
                                          <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden relative border border-slate-700/50 shadow-inner">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (pTradeCount / 50) * 100)}%` }} className={`absolute top-0 left-0 h-full shadow-[0_0_20px_rgba(255,255,255,0.5)] ${isGateUnlocked ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'}`} />
                                          </div>
                                       </div>
                                     </div>
                                  </div>
                                ) : (
                                  <TopicList phaseTopics={phaseTopics} phaseNumber={phase.phase_number} />
                                )
                              )}
                            </div>

                          </motion.div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CHALLENGE */}
            {activeSubTab === 'challenge' && (
              challengeModules.length > 0 ? (
                <div className="flex flex-1 overflow-hidden w-full">
                  <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">
                      
                      {!currentLesson ? (
                        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                           <Target size={48} className="mx-auto mb-4 text-blue-500 opacity-80" />
                           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select a Video Lesson</h2>
                           <p className="text-gray-500 dark:text-slate-400">Choose a lesson from the curriculum sidebar to begin.</p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="relative pt-[56.25%] bg-black">
                              <YouTube
                                videoId={getVideoId(currentLesson)}
                                opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, modestbranding: 1, rel: 0, controls: 1, fs: 1 } }}
                                onReady={onPlayerReady}
                                onStateChange={onPlayerStateChange}
                                className="absolute top-0 left-0 w-full h-full"
                              />
                            </div>
                            <div className="p-6">
                              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{currentLesson.title}</h1>
                              <div className="flex items-center gap-4">
                                {currentLesson.progress.video_completed ? (
                                  <span className="flex items-center gap-1 text-sm text-emerald-500 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full"><CheckCircle size={14} /> Video Completed</span>
                                ) : (
                                  <span className="flex items-center gap-2 text-sm text-amber-500 font-semibold bg-amber-500/10 px-3 py-1 rounded-full"><Lock size={14} /> Watch without skipping to unlock quiz.</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {currentLesson.progress.video_completed && quizQuestions.length > 0 && (
                              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">Knowledge Check</h2>
                                
                                {quizResult?.passed || currentLesson.progress.quiz_passed ? (
                                  <div className="text-center py-10 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                    <Award size={56} className="text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Module Mastered!</h3>
                                    <p className="text-gray-500 dark:text-slate-400 mb-6">Score: {currentLesson.progress.quiz_score}%</p>
                                    <button onClick={loadNextLesson} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20">
                                      Next Lesson <ChevronRight size={18} className="inline ml-1" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-8">
                                    {quizQuestions.map((q, idx) => (
                                      <div key={q.id} className="space-y-4">
                                        <p className="font-semibold text-gray-800 dark:text-slate-200 text-lg">{idx + 1}. {q.question_text}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {['A', 'B', 'C', 'D'].map(opt => {
                                            const isSelected = quizAnswers[q.id] === opt;
                                            const showCorrect = quizResult && opt === q.correct_option;
                                            const showWrong = quizResult && isSelected && !showCorrect;
                                            let btnClass = "border-gray-200 dark:border-slate-700 hover:border-blue-500 text-gray-700 dark:text-slate-300";
                                            if (isSelected) btnClass = "border-blue-500 bg-blue-500/10 text-blue-600 ring-1 ring-blue-500";
                                            if (showCorrect) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500";
                                            if (showWrong) btnClass = "border-red-500 bg-red-500/10 text-red-600 ring-1 ring-red-500";
                                            return (
                                              <button key={opt} onClick={() => !quizResult && setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))} disabled={quizResult !== null} className={`text-left px-5 py-4 rounded-xl border-2 transition-all ${btnClass}`}>
                                                <span className="font-bold mr-3 opacity-50">{opt}.</span> {q[`option_${opt.toLowerCase()}`]}
                                              </button>
                                            )
                                          })}
                                        </div>
                                        {quizResult && quizAnswers[q.id] !== q.correct_option && (
                                          <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl flex gap-3 text-red-800 dark:text-red-200">
                                            <XCircle size={20} className="shrink-0 mt-0.5" />
                                            <p><span className="font-bold block mb-1">Incorrect Concept:</span> {q.explanation_text}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {quizResult && !quizResult.passed && (
                                      <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-6 rounded-2xl text-center">
                                        <p className="font-bold mb-3 text-lg">Score: {quizResult.score}% (Requires 70%)</p>
                                        <button onClick={() => { setQuizResult(null); setQuizAnswers({}); }} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-lg font-bold">Retry Quiz</button>
                                      </div>
                                    )}
                                    {!quizResult && (
                                      <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                        <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length !== quizQuestions.length} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-bold">Submit</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="w-72 hidden lg:flex flex-col border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full shrink-0">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-800"><h3 className="font-bold text-gray-900 dark:text-white">Video Library</h3></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {challengeModules.map((c) => {
                         return (
                           <div key={c.id} className="space-y-2">
                             <h4 className="text-xs font-bold text-gray-500 uppercase">{c.phase_name}</h4>
                             {c.modules.map(module => (
                                module.lessons.map(lesson => {
                                   const idx = allChallengeLessons.findIndex(l => l.id === lesson.id);
                                   const isLocked = idx > 0 && !allChallengeLessons[idx - 1].progress.quiz_passed;
                                   const isCompleted = lesson.progress.quiz_passed;
                                   const isActive = currentLesson?.id === lesson.id;
                                   return (
                                     <button key={lesson.id} disabled={isLocked} onClick={() => handleSelectLesson(lesson)} className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : isCompleted ? 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800' : isLocked ? 'text-gray-400 opacity-60 cursor-not-allowed' : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                                       <div className="mt-0.5 shrink-0">{isCompleted ? <CheckCircle size={14} className="text-emerald-500" /> : isLocked ? <Lock size={14} /> : <PlayCircle size={14} className={isActive ? 'text-blue-500' : ''} />}</div>
                                       <span className="font-medium leading-tight">{lesson.title}</span>
                                     </button>
                                   )
                                })
                             ))}
                           </div>
                         )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-slate-400">
                  <BookOpen size={48} className="mb-4 opacity-50 mx-auto" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Video Challenges Coming Soon</h3>
                  <p>Curated videos for this market are being prepared.</p>
                </div>
              )
            )}

            {/* TAB 3: TRACKER */}
            {activeSubTab === 'tracker' && (
              <div className="max-w-4xl mx-auto pb-20 p-4 md:p-8 w-full">
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Progress Tracker</h2>
                  <p className="text-gray-500 dark:text-slate-400">Master Syllabus completion analytics.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Topics Mastered</div>
                    <div className="text-5xl font-black text-blue-600 dark:text-blue-400">
                      {topics.filter(t => progressData[t.id]?.is_completed).length}
                      <span className="text-2xl text-gray-400"> / {topics.length}</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Phase Unlocks</div>
                    <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400">
                      {ROADMAP_PHASES.filter(p => isPhaseUnlocked(p.phase_number)).length}
                      <span className="text-2xl text-gray-400"> / {ROADMAP_PHASES.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {currentLesson && activeSubTab === 'challenge' && <ChatWidget lessonTitle={currentLesson.title} />}
    </div>
  );
}
