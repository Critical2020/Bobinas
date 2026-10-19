import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = useCallback((message) => {
    setToast({ message, visible: true });
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Floating Banner */}
      <div 
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="bg-slate-900 border border-brand-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-md">
          <div className="h-8 w-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-bell text-sm"></i>
          </div>
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
