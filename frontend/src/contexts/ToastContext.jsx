import React, { createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const showToast = useCallback((message, type = 'info') => {
    const style = {
      background: '#0f172a', // Tailwind slate-900
      color: '#f8fafc', // Tailwind slate-50
      border: '1px solid #1e293b', // Tailwind slate-800
      fontSize: '14px',
      fontWeight: '500'
    };
    
    if (type === 'success') {
      toast.success(message, { style, iconTheme: { primary: '#10b981', secondary: '#fff' } });
    } else if (type === 'error') {
      toast.error(message, { style, iconTheme: { primary: '#ef4444', secondary: '#fff' } });
    } else {
      toast(message, { style, icon: 'ℹ️' });
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'custom-toast-animation',
          duration: 4000,
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
