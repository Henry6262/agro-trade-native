import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * API Client
 * Wrapper for HTTP requests with common patterns for integration tests
 */
export class ApiClient {
  private authToken?: string;

  constructor(private readonly app: INestApplication) {}

  /**
   * Set authentication token for subsequent requests
   */
  setAuthToken(token: string) {
    this.authToken = token;
    return this;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = undefined;
    return this;
  }

  /**
   * GET request
   */
  async get(path: string, expectedStatus = 200) {
    const req = request(this.app.getHttpServer()).get(path);

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await req.expect(expectedStatus);
    return response;
  }

  /**
   * POST request
   */
  async post(path: string, body: any, expectedStatus = 201) {
    const req = request(this.app.getHttpServer())
      .post(path)
      .send(body)
      .set('Content-Type', 'application/json');

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await req.expect(expectedStatus);
    return response;
  }

  /**
   * PUT request
   */
  async put(path: string, body: any, expectedStatus = 200) {
    const req = request(this.app.getHttpServer())
      .put(path)
      .send(body)
      .set('Content-Type', 'application/json');

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await req.expect(expectedStatus);
    return response;
  }

  /**
   * PATCH request
   */
  async patch(path: string, body: any, expectedStatus = 200) {
    const req = request(this.app.getHttpServer())
      .patch(path)
      .send(body)
      .set('Content-Type', 'application/json');

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await req.expect(expectedStatus);
    return response;
  }

  /**
   * DELETE request
   */
  async delete(path: string, expectedStatus = 200) {
    const req = request(this.app.getHttpServer()).delete(path);

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await req.expect(expectedStatus);
    return response;
  }

  /**
   * Make a request expecting an error
   */
  async expectError(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, body?: any, expectedStatus = 400) {
    let req;

    switch (method) {
      case 'get':
        req = request(this.app.getHttpServer()).get(path);
        break;
      case 'post':
        req = request(this.app.getHttpServer()).post(path).send(body);
        break;
      case 'put':
        req = request(this.app.getHttpServer()).put(path).send(body);
        break;
      case 'patch':
        req = request(this.app.getHttpServer()).patch(path).send(body);
        break;
      case 'delete':
        req = request(this.app.getHttpServer()).delete(path);
        break;
    }

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await req.expect(expectedStatus);
    return response;
  }

  /**
   * Batch requests (execute multiple requests in parallel)
   */
  async batch(requests: Array<{ method: string; path: string; body?: any; expectedStatus?: number }>) {
    const promises = requests.map(({ method, path, body, expectedStatus }) => {
      switch (method.toLowerCase()) {
        case 'get':
          return this.get(path, expectedStatus);
        case 'post':
          return this.post(path, body, expectedStatus);
        case 'put':
          return this.put(path, body, expectedStatus);
        case 'patch':
          return this.patch(path, body, expectedStatus);
        case 'delete':
          return this.delete(path, expectedStatus);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Wait for condition to be true (polling)
   */
  async waitFor(
    condition: () => Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<boolean> {
    const timeout = options.timeout || 10000; // 10 seconds default
    const interval = options.interval || 500; // 500ms default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return false;
  }

  /**
   * Measure response time
   */
  async measureResponseTime(method: 'get' | 'post', path: string, body?: any): Promise<{
    response: request.Response;
    duration: number;
  }> {
    const startTime = Date.now();
    const response = method === 'get'
      ? await this.get(path)
      : await this.post(path, body);
    const duration = Date.now() - startTime;

    return { response, duration };
  }
}

/**
 * Helper to extract response body with type safety
 */
export function extractBody<T>(response: request.Response): T {
  return response.body as T;
}

/**
 * Helper to assert response has specific fields
 */
export function assertHasFields(obj: any, fields: string[]) {
  for (const field of fields) {
    if (!(field in obj)) {
      throw new Error(`Expected field '${field}' not found in response`);
    }
  }
}

/**
 * Helper to wait for async operations
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
