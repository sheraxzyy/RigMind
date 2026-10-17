import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        if (toast.type === 'success') Icon = CheckCircle2;
        if (toast.type === 'error') Icon = AlertCircle;

        return (
          <div key={toast.id} className={`rm-toast ${toast.type}`}>
            <Icon
              size={18}
              style={{
                color:
                  toast.type === 'success'
                    ? 'var(--color-success)'
                    : toast.type === 'error'
                    ? 'var(--color-danger)'
                    : 'var(--color-info)',
                flexShrink: 0
              }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
              {toast.message}
            </span>
          </div>
        );
      })}
    </div>
  );
};
