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
      className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-gradient-to-br from-[#2D4A7A] to-[#4A7FA0]
                 flex items-center justify-center cursor-pointer shadow-lg shadow-[#2D4A7A]/20
                 hover:scale-110 hover:shadow-xl hover:shadow-[#2D4A7A]/30
                 transition-all duration-300 ease-out z-50
                 backdrop-blur-sm border border-white/10"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <Sparkles className="w-5 h-5 text-white" />
    </button>
  );
}
