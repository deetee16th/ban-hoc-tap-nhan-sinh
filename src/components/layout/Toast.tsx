import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'success' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const isInfo = toast.tone === 'info';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-toast-in"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-elevated border ${
          isInfo
            ? 'bg-[#1C1917] text-[#FAF9F6] border-[#3A3735] dark:bg-[#25272D] dark:text-[#F3F4F6] dark:border-[#3A3D45]'
            : 'bg-[#1E5631] text-white border-[#2F6B45] dark:bg-[#1B2E22] dark:text-[#E3F3E8] dark:border-[#2F5A3F]'
        }`}
      >
        {isInfo ? (
          <Info className="w-5 h-5 text-[#8EC3E6] shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-[#8CC9A0] shrink-0" />
        )}
        <p className="text-sm font-medium leading-snug flex-1">{toast.text}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="tap-compact p-1.5 rounded-lg hover:bg-white/10 text-white/75 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
