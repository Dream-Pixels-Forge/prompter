import { useAppStore } from '@/renderer/stores/app-store';
import gsap from 'gsap';
import { Check } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Toast() {
  const { toastMessage, hideToast, isExpanded } = useAppStore();
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toastMessage && toastRef.current) {
      const el = toastRef.current;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(
          el,
          { y: 12, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out', willChange: 'transform, opacity' },
        );
      }
      const timer = setTimeout(() => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap
            .to(el, { y: 8, opacity: 0, duration: 0.2, ease: 'power2.in', willChange: 'transform, opacity' })
            .then(hideToast);
        } else {
          hideToast();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, hideToast]);

  if (!toastMessage) return null;

  return (
    <div ref={toastRef} className={`fixed z-60 right-6 ${isExpanded ? 'top-4' : 'bottom-24'}`}>
      <div className="flex items-center gap-2 px-3.5 py-2 bg-accent rounded-lg shadow-lg shadow-black/20">
        <Check className="w-3.5 h-3.5 text-surface" />
        <span className="text-xs text-surface font-medium">{toastMessage}</span>
      </div>
    </div>
  );
}
