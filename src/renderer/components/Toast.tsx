import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAppStore } from '@/renderer/stores/app-store';

export function Toast() {
  const { toastMessage, hideToast } = useAppStore();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(hideToast, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, hideToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-[fadeInUp_0.3s_ease-out]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#2D4A7A] rounded-xl shadow-lg shadow-black/20">
        <Check className="w-3.5 h-3.5 text-white" />
        <span className="text-xs text-white font-medium">{toastMessage}</span>
      </div>
    </div>
  );
}
