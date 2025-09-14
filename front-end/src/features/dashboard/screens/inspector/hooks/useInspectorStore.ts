import { create } from 'zustand';
import { InspectorStore, VerificationJob, InspectorProfile } from '../types';

export const useInspectorStore = create<InspectorStore>((set, get) => ({
  // Initial state
  profile: null,
  activeJob: null,
  availableJobs: [],
  currentLocation: null,
  isTracking: false,

  // Actions
  setProfile: (profile: InspectorProfile) => set({ profile }),
  
  setActiveJob: (job: VerificationJob | null) => set({ activeJob: job }),
  
  setAvailableJobs: (jobs: VerificationJob[]) => set({ availableJobs: jobs }),
  
  updateLocation: (location: any) => set({ 
    currentLocation: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp || new Date(),
    }
  }),
  
  startTracking: () => set({ isTracking: true }),
  
  stopTracking: () => set({ isTracking: false }),
  
  acceptJob: (jobId: string) => {
    const { availableJobs } = get();
    const job = availableJobs.find(j => j.id === jobId);
    
    if (job) {
      set({
        activeJob: {
          ...job,
          status: 'ASSIGNED' as any,
          inspectorId: get().profile?.id || 'inspector-001',
        },
        availableJobs: availableJobs.filter(j => j.id !== jobId),
      });
    }
  },
  
  completeJob: () => set({ activeJob: null }),
  
  getJobsByPriority: (priority: string) => {
    const { availableJobs } = get();
    return availableJobs.filter(job => job.priority === priority);
  },
  
  getJobsSortedByDistance: () => {
    const { availableJobs } = get();
    return [...availableJobs].sort((a, b) => {
      const distA = a.distance || Number.MAX_VALUE;
      const distB = b.distance || Number.MAX_VALUE;
      return distA - distB;
    });
  },
  
  reset: () => set({
    profile: null,
    activeJob: null,
    availableJobs: [],
    currentLocation: null,
    isTracking: false,
  }),
}));