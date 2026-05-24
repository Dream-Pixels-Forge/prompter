import { useBubblePosition } from '@/renderer/hooks/useBubblePosition';
import { useAppStore } from '@/renderer/stores/app-store';
import gsap from 'gsap';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Bubble() {
  const { toggleExpanded } = useAppStore();
  const { position, isDragging, startDrag } = useBubblePosition();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);

  // Floating/pulse animation on inner button only (no conflict with wrapper transform)
  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: -4,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        willChange: 'transform',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={wrapperRef}
      onMouseDown={(e) => startDrag(e, position)}
      onTouchStart={(e) => startDrag(e, position)}
      className="fixed z-50"
      style={{ bottom: `${position.bottom}px`, right: `${position.right}px` }}
    >
      <button
        ref={bubbleRef}
        onClick={toggleExpanded}
        aria-label="Open Prompter"
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-[#2D4A7A] to-[#4A7FA0]
                   flex items-center justify-center cursor-pointer shadow-lg shadow-[#2D4A7A]/25
                   hover:shadow-xl hover:shadow-[#2D4A7A]/35 ${isDragging ? '' : 'hover:scale-110'}
                   transition-all duration-300 ease-out
                   backdrop-blur-sm border border-white/[0.12]`}
      >
        {/* Inner glow */}
        <div className="absolute inset-1 rounded-full bg-white/[0.06]" />
        <Sparkles className="w-5 h-5 text-white relative z-10" />
      </button>
    </div>
  );
}
