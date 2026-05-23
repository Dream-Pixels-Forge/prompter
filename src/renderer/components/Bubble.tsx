import { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useAppStore } from '@/renderer/stores/app-store';
import { useBubblePosition } from '@/renderer/hooks/useBubblePosition';

export function Bubble() {
  const { toggleExpanded } = useAppStore();
  const { position, startDrag } = useBubblePosition();
  const bubbleRef = useRef<HTMLButtonElement>(null);

  // Floating/pulse animation
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
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <button
      ref={bubbleRef}
      onClick={toggleExpanded}
      onMouseDown={(e) => startDrag(e, position)}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#2D4A7A] to-[#4A7FA0]
                 flex items-center justify-center cursor-pointer shadow-lg shadow-[#2D4A7A]/25
                 hover:shadow-xl hover:shadow-[#2D4A7A]/35 hover:scale-110
                 transition-all duration-300 ease-out z-50
                 backdrop-blur-sm border border-white/[0.12]"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {/* Inner glow */}
      <div className="absolute inset-1 rounded-full bg-white/[0.06]" />
      <Sparkles className="w-5 h-5 text-white relative z-10" />
    </button>
  );
}
