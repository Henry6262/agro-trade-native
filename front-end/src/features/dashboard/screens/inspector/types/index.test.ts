import {
  VerificationJob,
  InspectorProfile,
  LocationUpdate,
  VerificationResult,
  JobPriority,
  JobStatus,
  VerificationStatus,
} from './index';

describe('Inspector Types', () => {
  describe('VerificationJob', () => {
    it('should have all required properties', () => {
      const job: VerificationJob = {
        id: 'job-001',
        sellerListingId: 'listing-123',
        inspectorId: 'inspector-001',
        priority: JobPriority.HIGH,
        status: JobStatus.PENDING,
        location: {
          latitude: 42.6977,
          longitude: 23.3219,
          address: 'Field Road 123',
          city: 'Plovdiv',
          region: 'Plovdiv Province',
        },
        productDetails: {
          name: 'Wheat Grade A',
          type: 'Grain',
          quantity: 1000,
          unit: 'kg',
          claimedSpecs: {
            moisture: '12%',
            protein: '14%',
          },
        },
        estimatedDuration: 120,
        distance: 25.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(job.id).toBeDefined();
      expect(job.priority).toBe(JobPriority.HIGH);
      expect(job.status).toBe(JobStatus.PENDING);
    });
  });

  describe('JobPriority', () => {
    it('should have correct priority values', () => {
      expect(JobPriority.LOW).toBe('LOW');
      expect(JobPriority.MEDIUM).toBe('MEDIUM');
      expect(JobPriority.HIGH).toBe('HIGH');
    });
  });

  describe('JobStatus', () => {
    it('should have all status values', () => {
      expect(JobStatus.PENDING).toBe('PENDING');
      expect(JobStatus.ASSIGNED).toBe('ASSIGNED');
      expect(JobStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(JobStatus.COMPLETED).toBe('COMPLETED');
      expect(JobStatus.FAILED).toBe('FAILED');
      expect(JobStatus.CANCELLED).toBe('CANCELLED');
    });
  });

  describe('LocationUpdate', () => {
    it('should track inspector location', () => {
      const update: LocationUpdate = {
        id: 'loc-001',
        inspectorId: 'inspector-001',
        jobId: 'job-001',
        coordinates: {
          latitude: 42.6977,
          longitude: 23.3219,
          accuracy: 10,
          heading: 45,
          speed: 15.5,
        },
        timestamp: new Date(),
        batteryLevel: 85,
        networkType: 'cellular',
        isMoving: true,
      };

      expect(update.coordinates.accuracy).toBe(10);
      expect(update.isMoving).toBe(true);
    });
  });

  describe('VerificationResult', () => {
    it('should contain verification data', () => {
      const result: VerificationResult = {
        id: 'result-001',
        jobId: 'job-001',
        inspectorId: 'inspector-001',
        sellerListingId: 'listing-123',
        originalSpecs: {
          moisture: '12%',
          protein: '14%',
        },
        verifiedSpecs: {
          moisture: '13%',
          protein: '13.5%',
        },
        testMethods: [
          {
            parameter: 'moisture',
            method: 'Laboratory Analysis',
            equipment: 'Moisture Analyzer',
            standardUsed: 'ISO 712',
          },
        ],
        evidence: [
          {
            type: 'photo',
            url: 'https://example.com/photo.jpg',
            caption: 'Sample photo',
            timestamp: new Date(),
          },
        ],
        notes: 'Sample tested according to standards',
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
      };

      expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(result.testMethods).toHaveLength(1);
    });
  });
});