import { useAppStore } from '@/renderer/stores/app-store';
import { Bubble } from '@/renderer/components/Bubble';
import { BubbleExpanded } from '@/renderer/components/BubbleExpanded';
import { Toast } from '@/renderer/components/Toast';

export default function App() {
  const { isExpanded } = useAppStore();
  
  return (
    <div className="w-screen h-screen overflow-hidden select-none">
      {isExpanded ? <BubbleExpanded /> : <Bubble />}
      <Toast />
    </div>
  );
}
