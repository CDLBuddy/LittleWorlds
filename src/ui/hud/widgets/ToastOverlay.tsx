/**
 * ToastOverlay - Kid-friendly toast notification overlay
 */

import { useEffect } from 'react';
import { useToastStore } from '@ui/state/useToastStore';

export default function ToastOverlay() {
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    // Auto-dismiss toasts based on level
    const timers: NodeJS.Timeout[] = [];
    
    toasts.forEach((toast) => {
      const dismissTime = toast.level === 'error' ? 5000 : 3000;
      const elapsed = Date.now() - toast.createdAt;
      const remaining = dismissTime - elapsed;
      
      if (remaining > 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, remaining);
        timers.push(timer);
      } else {
        // Already expired, remove immediately
        removeToast(toast.id);
      }
    });
    
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {toasts.map((toast, index) => {
        // Color based on level
        const bgColor =
          toast.level === 'error' ? 'rgba(220, 50, 50, 0.95)' :
          toast.level === 'warning' ? 'rgba(255, 180, 50, 0.95)' :
          'rgba(100, 200, 100, 0.95)';

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: bgColor,
              color: 'white',
              padding: '16px 32px',
              borderRadius: '24px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              minWidth: '200px',
              maxWidth: '500px',
              textAlign: 'center',
              animation: `toastSlideIn 0.3s ease-out ${index * 0.1}s both`,
              fontFamily: 'Comic Sans MS, cursive',
            }}
          >
            {toast.message}
          </div>
        );
      })}
      
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
