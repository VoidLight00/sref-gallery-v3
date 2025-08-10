'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends ToastData {
  onClose: (id: string) => void;
}

function Toast({ id, type, title, message, duration = 4000, action, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Start enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    const closeTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  const typeConfig = {
    success: {
      icon: '✅',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      borderColor: 'border-blue-600'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      borderColor: 'border-yellow-600'
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={`relative mb-3 min-w-80 max-w-md ${config.bgColor} ${config.textColor} rounded-lg shadow-lg border ${config.borderColor} transition-all duration-300 transform ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      {/* Progress bar */}
      <div 
        className="absolute top-0 left-0 h-1 bg-white/30 rounded-t-lg animate-[shrink_4s_linear_forwards]"
        style={{
          animation: `shrink ${duration}ms linear forwards`
        }}
      />

      <div className="p-4 flex items-start gap-3">
        <div className="text-xl flex-shrink-0">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {title}
          </div>
          {message && (
            <div className="text-sm opacity-90 mt-1">
              {message}
            </div>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

let toastId = 0;
const toastListeners: Set<(toasts: ToastData[]) => void> = new Set();
let toastQueue: ToastData[] = [];

export const toast = {
  success: (title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'success', title, message, ...options });
  },
  error: (title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'error', title, message, ...options });
  },
  info: (title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'info', title, message, ...options });
  },
  warning: (title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({ type: 'warning', title, message, ...options });
  }
};

function addToast(toastData: Omit<ToastData, 'id'>) {
  const newToast: ToastData = {
    id: `toast-${++toastId}`,
    duration: 4000,
    ...toastData
  };
  
  toastQueue = [...toastQueue, newToast];
  notifyListeners();
}

function removeToast(id: string) {
  toastQueue = toastQueue.filter(toast => toast.id !== id);
  notifyListeners();
}

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toastQueue]));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const listener = (newToasts: ToastData[]) => setToasts(newToasts);
    toastListeners.add(listener);
    
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  const toastContainer = (
    <div className="fixed top-4 right-4 z-[60] space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(toastContainer, document.body) : null;
}

// CSS for progress bar animation (add to globals.css or component)
export const toastStyles = `
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
`;