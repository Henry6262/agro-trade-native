import request from 'supertest';
import { TestEnvironment } from '../setup/test-environment';

describe('Location Data (E2E)', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
  }, 30000);

  afterAll(async () => {
    await env.teardown();
  }, 30000);

  beforeEach(async () => {
    await env.cleanDatabase();
  }, 30000);

  it('should list all regions', async () => {
    const response = await request(env.app.getHttpServer())
      .get('/api/regions')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body).toContainEqual(
      expect.objectContaining({ name: 'Yuzhen tsentralen (South Central)' }),
    );
  });

  it('should list cities in a region', async () => {
    const regionsResponse = await request(env.app.getHttpServer())
      .get('/api/regions')
      .expect(200);

    const region = regionsResponse.body[0];
    expect(region).toBeDefined();

    const response = await request(env.app.getHttpServer())
      .get(`/api/regions/cities?regionId=${region.id}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
