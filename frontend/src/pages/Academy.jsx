import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { publicSupabase as supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import AddCourseWizard from '../components/AddCourseWizard';
import CoursePlayer from '../components/CoursePlayer';

export default function Academy({ user }) {
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      let res = await supabase
        .from('user_asset_courses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });
        
      if (res.error) {
        // Fallback: If user_id column doesn't exist yet, query without it
        res = await supabase
          .from('user_asset_courses')
          .select('*')
          .eq('is_archived', false)
          .order('created_at', { ascending: true });
          
        if (res.error) throw res.error;
      }
      
      const data = res.data;
      setCourses(data || []);
      if (data && data.length > 0 && !activeCourseId) {
        setActiveCourseId(data[0].id);
      } else if (!data || data.length === 0) {
        setShowAddWizard(true);
      }
    } catch (err) {
      console.error(err);
      setCourses([]);
      setShowAddWizard(true);
    }
    setLoading(false);
  };

  const handleCourseCreated = (newCourse) => {
    setCourses([...courses, newCourse]);
    setActiveCourseId(newCourse.id);
    setShowAddWizard(false);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return;
    try {
      const { error } = await supabase
        .from('user_asset_courses')
        .update({ is_archived: true })
        .eq('id', showDeleteConfirm);
        
      if (error) throw error;
      
      const newCourses = courses.filter(c => c.id !== showDeleteConfirm);
      setCourses(newCourses);
      if (activeCourseId === showDeleteConfirm) {
        setActiveCourseId(newCourses.length > 0 ? newCourses[0].id : null);
      }
      if (newCourses.length === 0) setShowAddWizard(true);
      showToast("Course archived successfully.", "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete course", "error");
    }
    setShowDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0b0e14]">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeCourse = courses.find(c => c.id === activeCourseId);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-[#0b0e14] overflow-hidden">
      {/* ── TOP HEADER (Tab Bar) ──────────────────────────────────────────────── */}
      <div className="flex items-center px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-20 shrink-0 relative">
        <div className="flex overflow-x-auto hide-scrollbar flex-1 relative">
          {courses.map(course => (
            <div key={course.id} className="relative group">
              <button
                onClick={() => setActiveCourseId(course.id)}
                className={`whitespace-nowrap px-6 py-4 text-sm font-bold transition-colors relative flex items-center gap-2 ${
                  activeCourseId === course.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-slate-300'
                }`}
              >
                {course.asset_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                {/* Active Tab Underline using Framer Motion */}
                {activeCourseId === course.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
              
              {/* ⋮ Menu for Delete */}
              <div className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setShowDeleteConfirm(course.id)}
                  className="p-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setShowAddWizard(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      {activeCourse ? (
        <CoursePlayer course={activeCourse} allCourses={courses} user={user} />
      ) : (
        !showAddWizard && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Academy</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">Create your first course to begin your journey.</p>
            <button onClick={() => setShowAddWizard(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <Plus size={20}/> Create Course
            </button>
          </div>
        )
      )}

      {/* Add Course Wizard Modal */}
      <AnimatePresence>
        {showAddWizard && (
          <AddCourseWizard 
            user={user}
            onClose={() => {
              setShowAddWizard(false);
              if (courses.length === 0) {
                 // Prevent closing if no courses exist, they must create one
              }
            }} 
            onCourseCreated={handleCourseCreated} 
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(239,68,68,0.2)]"
            >
              <div className="flex justify-center mb-4 text-red-500">
                <motion.div
                  animate={{ x: [-2, 2, -2, 2, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Trash2 size={48} />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete Course?</h3>
              <p className="text-center text-gray-500 dark:text-slate-400 mb-6 text-sm">
                This will permanently delete your progress for this course. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-slate-700">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-500/30">
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
