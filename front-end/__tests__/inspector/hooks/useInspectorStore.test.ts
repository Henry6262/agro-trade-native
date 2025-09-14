import { renderHook, act } from '@testing-library/react-native';
import { useInspectorStore } from '../../../src/features/dashboard/screens/inspector/hooks/useInspectorStore';
import { mockVerificationJobs, mockActiveJob, mockInspectorProfile } from '../../../src/features/dashboard/screens/inspector/__mocks__/mockData';

describe('useInspectorStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useInspectorStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    expect(result.current.profile).toBeNull();
    expect(result.current.activeJob).toBeNull();
    expect(result.current.availableJobs).toEqual([]);
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.isTracking).toBe(false);
  });

  it('should set inspector profile', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setProfile(mockInspectorProfile);
    });
    
    expect(result.current.profile).toEqual(mockInspectorProfile);
  });

  it('should set active job', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setActiveJob(mockActiveJob);
    });
    
    expect(result.current.activeJob).toEqual(mockActiveJob);
  });

  it('should set available jobs', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setAvailableJobs(mockVerificationJobs);
    });
    
    expect(result.current.availableJobs).toEqual(mockVerificationJobs);
  });

  it('should update current location', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    const location = {
      latitude: 42.6977,
      longitude: 23.3219,
      accuracy: 10,
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.updateLocation(location);
    });
    
    expect(result.current.currentLocation).toEqual(location);
  });

  it('should start location tracking', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.startTracking();
    });
    
    expect(result.current.isTracking).toBe(true);
  });

  it('should stop location tracking', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.startTracking();
      result.current.stopTracking();
    });
    
    expect(result.current.isTracking).toBe(false);
  });

  it('should accept a job', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setAvailableJobs(mockVerificationJobs);
      result.current.acceptJob('job-001');
    });
    
    expect(result.current.activeJob).toBeTruthy();
    expect(result.current.activeJob?.id).toBe('job-001');
    expect(result.current.availableJobs).toHaveLength(2);
  });

  it('should complete active job', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setActiveJob(mockActiveJob);
      result.current.completeJob();
    });
    
    expect(result.current.activeJob).toBeNull();
  });

  it('should filter jobs by priority', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setAvailableJobs(mockVerificationJobs);
    });
    
    const highPriorityJobs = result.current.getJobsByPriority('HIGH');
    expect(highPriorityJobs).toHaveLength(1);
    expect(highPriorityJobs[0].priority).toBe('HIGH');
  });

  it('should sort jobs by distance', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setAvailableJobs(mockVerificationJobs);
    });
    
    const sortedJobs = result.current.getJobsSortedByDistance();
    expect(sortedJobs[0].distance).toBe(25.5);
    expect(sortedJobs[1].distance).toBe(45.2);
    expect(sortedJobs[2].distance).toBe(120.8);
  });

  it('should reset store state', () => {
    const { result } = renderHook(() => useInspectorStore());
    
    act(() => {
      result.current.setProfile(mockInspectorProfile);
      result.current.setActiveJob(mockActiveJob);
      result.current.setAvailableJobs(mockVerificationJobs);
      result.current.reset();
    });
    
    expect(result.current.profile).toBeNull();
    expect(result.current.activeJob).toBeNull();
    expect(result.current.availableJobs).toEqual([]);
  });
});