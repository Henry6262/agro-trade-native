import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVerificationJobs } from '../../../src/features/dashboard/screens/inspector/hooks/useVerificationJobs';
import { mockVerificationJobs } from '../../../src/features/dashboard/screens/inspector/__mocks__/mockData';
import React from 'react';

// Mock API calls
jest.mock('axios');
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useVerificationJobs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should fetch verification jobs', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockVerificationJobs,
      },
    });

    const { result } = renderHook(() => useVerificationJobs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.jobs).toEqual(mockVerificationJobs);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/inspector/jobs');
  });

  it('should filter jobs by priority', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockVerificationJobs,
      },
    });

    const { result } = renderHook(
      () => useVerificationJobs({ priority: 'HIGH' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/inspector/jobs', {
      params: { priority: 'HIGH' },
    });
  });

  it('should filter jobs by location radius', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockVerificationJobs,
      },
    });

    const { result } = renderHook(
      () => useVerificationJobs({
        location: { lat: 42.6977, lng: 23.3219 },
        radius: 50,
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/inspector/jobs', {
      params: {
        lat: 42.6977,
        lng: 23.3219,
        radius: 50,
      },
    });
  });

  it('should handle API errors', async () => {
    const mockError = new Error('Network error');
    mockedAxios.get = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useVerificationJobs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.jobs).toEqual([]);
  });

  it('should accept a job', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: { ...mockVerificationJobs[0], status: 'ASSIGNED' },
      },
    });

    const { result } = renderHook(() => useVerificationJobs(), { wrapper });

    await result.current.acceptJob('job-001', 'inspector-001');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/inspector/jobs/job-001/accept',
      {
        inspectorId: 'inspector-001',
        estimatedArrival: expect.any(String),
      }
    );
  });

  it('should complete a job', async () => {
    const verificationResult = {
      verifiedSpecs: { moisture: '13%' },
      testMethods: [],
      evidence: [],
      notes: 'Test complete',
      verificationStatus: 'VERIFIED',
    };

    mockedAxios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: verificationResult,
      },
    });

    const { result } = renderHook(() => useVerificationJobs(), { wrapper });

    await result.current.completeJob('job-001', verificationResult);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/inspector/jobs/job-001/complete',
      verificationResult
    );
  });

  it('should refetch jobs', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockVerificationJobs,
      },
    });

    const { result } = renderHook(() => useVerificationJobs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('should enable polling for jobs', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockVerificationJobs,
      },
    });

    renderHook(
      () => useVerificationJobs({ refetchInterval: 5000 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Verify refetch interval is set
    expect(queryClient.getQueryDefaults(['verificationJobs'])).toEqual(
      expect.objectContaining({
        refetchInterval: 5000,
      })
    );
  });

  it('should cache job data', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockVerificationJobs,
      },
    });

    const { result: result1 } = renderHook(
      () => useVerificationJobs(),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Second hook should use cached data
    const { result: result2 } = renderHook(
      () => useVerificationJobs(),
      { wrapper }
    );

    expect(result2.current.jobs).toEqual(mockVerificationJobs);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only one API call
  });

  it('should invalidate cache after mutation', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockVerificationJobs,
      },
    });

    mockedAxios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: { ...mockVerificationJobs[0], status: 'ASSIGNED' },
      },
    });

    const { result } = renderHook(() => useVerificationJobs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.acceptJob('job-001', 'inspector-001');

    // Cache should be invalidated and refetch triggered
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});