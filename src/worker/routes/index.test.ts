// Health Check API Contract Test
// Tests for GET /api/health endpoint

import { describe, test, expect } from 'bun:test';
import type { HealthResponse } from '../types';
import app from './index';

describe('GET /api/health', () => {
  test('should return healthy status', async () => {
    const req = new Request('http://localhost/api/health');
    const response = await app.request(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const result: HealthResponse = await response.json();
    expect(result.status).toBe('healthy');
    expect(result.timestamp).toBeDefined();
    expect(result.version).toBeDefined();

    // Validate timestamp format (ISO 8601)
    const timestamp = new Date(result.timestamp);
    expect(timestamp.toISOString()).toBe(result.timestamp);
  });

  test('should respond quickly', async () => {
    const startTime = Date.now();

    const req = new Request('http://localhost/api/health');
    const response = await app.request(req);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Health check should respond within 100ms
    expect(responseTime).toBeLessThan(100);
    expect(response.status).toBe(200);
  });

  test('should include correct CORS headers', async () => {
    const req = new Request('http://localhost/api/health');
    const response = await app.request(req);

    // Should include CORS headers for browser access
    expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    expect(response.headers.get('access-control-allow-methods')).toBeDefined();
  });

  test('should handle OPTIONS preflight request', async () => {
    const req = new Request('http://localhost/api/health', {
      method: 'OPTIONS',
    });
    const response = await app.request(req);

    expect(response.status).toBeOneOf([200, 204]); // 204 is also valid for OPTIONS
    expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    const allowMethods = response.headers.get('access-control-allow-methods');
    expect(allowMethods).toBeDefined();
    if (allowMethods) {
      expect(allowMethods).toContain('GET');
    }
  });
});
