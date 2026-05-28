import type { AppTab } from '@/shared/types';
import { create } from 'zustand';

interface AppStore {
  activeTab: AppTab;
  isProcessing: boolean;
  toastMessage: string | null;
  isRecording: boolean;

  setRecording: (recording: boolean) => void;
  setActiveTab: (tab: AppTab) => void;
  setProcessing: (processing: boolean) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'compose',
  isProcessing: false,
  toastMessage: null,
  isRecording: false,

  setRecording: (recording) => set({ isRecording: recording }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  showToast: (message) => set({ toastMessage: message }),
  hideToast: () => set({ toastMessage: null }),
}));
