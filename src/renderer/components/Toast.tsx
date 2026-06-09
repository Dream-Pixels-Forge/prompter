import { useAppStore } from '@/renderer/stores/app-store';
import { Check } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Toast() {
  const { toastMessage, hideToast } = useAppStore();
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toastMessage && toastRef.current) {
      const el = toastRef.current;
      el.classList.add('toast-enter');
      const timer = setTimeout(() => {
        el.classList.remove('toast-enter');
        el.classList.add('toast-exit');
        // Wait for exit animation to complete before hiding
        const onAnimEnd = () => {
          el.removeEventListener('animationend', onAnimEnd);
          hideToast();
        };
        el.addEventListener('animationend', onAnimEnd);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, hideToast]);

  if (!toastMessage) return null;

  return (
    <div ref={toastRef} aria-live="polite" className="fixed z-60 right-6 top-4">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-accent rounded-lg shadow-lg shadow-black/20">
        <Check className="w-3.5 h-3.5 text-surface" aria-hidden="true" />
        <span className="text-xs text-surface font-medium">{toastMessage}</span>
      </div>
    </div>
  );
}
