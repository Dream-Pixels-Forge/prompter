import type { AppTab, BubbleState } from '@/shared/types';
import { create } from 'zustand';

interface AppStore {
  bubbleState: BubbleState;
  isExpanded: boolean;
  activeTab: AppTab;
  isProcessing: boolean;
  toastMessage: string | null;
  isRecording: boolean;

  setBubbleState: (state: BubbleState) => void;
  setRecording: (recording: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  setActiveTab: (tab: AppTab) => void;
  setProcessing: (processing: boolean) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
  toggleExpanded: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  bubbleState: 'dormant',
  isExpanded: false,
  activeTab: 'compose',
  isProcessing: false,
  toastMessage: null,
  isRecording: false,

  setBubbleState: (state) => set({ bubbleState: state }),
  setRecording: (recording) => set({ isRecording: recording, bubbleState: recording ? 'listening' : 'expanded' }),
  setExpanded: (expanded) => set({ isExpanded: expanded, bubbleState: expanded ? 'expanded' : 'dormant' }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setProcessing: (processing) => set({ isProcessing: processing, bubbleState: processing ? 'processing' : 'expanded' }),
  showToast: (message) => set({ toastMessage: message }),
  hideToast: () => set({ toastMessage: null }),
  toggleExpanded: () =>
    set((state) => ({
      isExpanded: !state.isExpanded,
      bubbleState: state.isExpanded ? 'dormant' : 'expanded',
    })),
}));
