import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TourRole = 'buyer' | 'seller' | 'transport';

interface TourState {
  hasSeenTour: boolean;
  isTourActive: boolean;
  currentStep: number;
  tourRole: TourRole | null;
  startTour: (role: TourRole) => void;
  nextStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      hasSeenTour: false,
      isTourActive: false,
      currentStep: 0,
      tourRole: null,

      startTour: (role) =>
        set({ isTourActive: true, currentStep: 0, tourRole: role, hasSeenTour: false }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

      skipTour: () => set({ isTourActive: false, hasSeenTour: true, currentStep: 0 }),

      completeTour: () => set({ isTourActive: false, hasSeenTour: true, currentStep: 0 }),

      resetTour: () =>
        set({ hasSeenTour: false, isTourActive: false, currentStep: 0, tourRole: null }),
    }),
    {
      name: 'tour-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasSeenTour: state.hasSeenTour }),
    }
  )
);
