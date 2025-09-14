import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Inspector Accept Job API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/inspector/jobs/:id/accept', () => {
    it('should accept a verification job', () => {
      const jobId = 'job-001';
      const acceptData = {
        inspectorId: 'inspector-001',
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .send(acceptData)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id', jobId);
          expect(res.body.data).toHaveProperty('inspectorId', 'inspector-001');
          expect(res.body.data).toHaveProperty('status', 'ASSIGNED');
          expect(res.body.data).toHaveProperty('acceptedAt');
        });
    });

    it('should not accept already assigned job', () => {
      const jobId = 'job-assigned';
      const acceptData = {
        inspectorId: 'inspector-002',
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .send(acceptData)
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty('error', 'Job already assigned');
        });
    });

    it('should validate inspector availability', () => {
      const jobId = 'job-002';
      const acceptData = {
        inspectorId: 'inspector-busy', // Inspector with active job
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .send(acceptData)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty('error', 'Inspector already has an active job');
        });
    });

    it('should return 404 for non-existent job', () => {
      const acceptData = {
        inspectorId: 'inspector-001',
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post('/api/inspector/jobs/non-existent/accept')
        .send(acceptData)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty('error', 'Job not found');
        });
    });

    it('should validate required fields', () => {
      const jobId = 'job-003';
      const invalidData = {
        // Missing inspectorId
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .send(invalidData)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toContain('inspectorId');
        });
    });

    it('should validate estimated arrival time', () => {
      const jobId = 'job-004';
      const acceptData = {
        inspectorId: 'inspector-001',
        estimatedArrival: 'invalid-date', // Invalid date format
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .send(acceptData)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty('error');
        });
    });

    it('should not accept past estimated arrival time', () => {
      const jobId = 'job-005';
      const acceptData = {
        inspectorId: 'inspector-001',
        estimatedArrival: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .send(acceptData)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty('error', 'Estimated arrival must be in the future');
        });
    });

    it('should update job status to IN_PROGRESS when inspector arrives', () => {
      const jobId = 'job-006';
      const updateData = {
        inspectorId: 'inspector-001',
        status: 'IN_PROGRESS',
        arrivedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/status`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('status', 'IN_PROGRESS');
        });
    });
  });
});