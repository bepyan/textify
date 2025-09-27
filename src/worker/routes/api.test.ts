// API Contract Tests for Textify Content Extraction Tool
// Tests for POST /api/extract and POST /api/validate endpoints

import { describe, test, expect } from 'bun:test';
import type {
  ExtractionRequest,
  ExtractionResponse,
  ValidationRequest,
  ValidationResponse,
} from '../types';
import app from './api';

describe('POST /extract', () => {
  test('should validate request format', async () => {
    const invalidRequest = {
      // Missing required 'url' field
      options: {},
    };

    const req = new Request('http://localhost/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest),
    });
    const response = await app.request(req);

    expect(response.status).toBe(400);
  });

  test('should handle YouTube URL', async () => {
    const request: ExtractionRequest = {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      options: {
        language: 'en',
        includeTimestamps: true,
      },
    };

    const req = new Request('http://localhost/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBeOneOf([200, 404, 500]); // May fail due to API key or network

    const result: ExtractionResponse = await response.json();
    expect(result.success).toBeDefined();
    expect(result.processingTime).toBeGreaterThan(0);
    expect(result.timestamp).toBeDefined();
  });

  test('should handle Naver blog URL', async () => {
    const request: ExtractionRequest = {
      url: 'https://blog.naver.com/example/123456789',
      options: {},
    };

    const req = new Request('http://localhost/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBeOneOf([200, 404, 500]); // May fail due to network

    const result: ExtractionResponse = await response.json();
    expect(result.success).toBeDefined();
    expect(result.processingTime).toBeGreaterThan(0);
    expect(result.timestamp).toBeDefined();
  });

  test('should return 400 for invalid URL', async () => {
    const request: ExtractionRequest = {
      url: 'not-a-valid-url',
      options: {},
    };

    const req = new Request('http://localhost/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBe(400);
  });

  test('should handle unsupported platform', async () => {
    const request: ExtractionRequest = {
      url: 'https://twitter.com/example/status/123',
      options: {},
    };

    const req = new Request('http://localhost/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBe(400);

    const result: ExtractionResponse = await response.json();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('UNSUPPORTED_PLATFORM');
    expect(result.error?.retryable).toBe(false);
  });

  test('should respect processing time limits', async () => {
    const request: ExtractionRequest = {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      options: {},
    };

    const startTime = Date.now();

    const req = new Request('http://localhost/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    const endTime = Date.now();
    const actualTime = endTime - startTime;

    // Should complete within reasonable time (allowing for network delays in tests)
    expect(actualTime).toBeLessThan(10000); // 10 seconds for test environment

    const result: ExtractionResponse = await response.json();
    expect(result.processingTime).toBeDefined();
  });
});

describe('POST /validate', () => {
  test('should validate YouTube URL successfully', async () => {
    const request: ValidationRequest = {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    const req = new Request('http://localhost/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBe(200);

    const result: ValidationResponse = await response.json();
    expect(result.valid).toBe(true);
    expect(result.type).toBe('youtube');
    expect(result.normalizedUrl).toBeDefined();
  });

  test('should validate Naver blog URL successfully', async () => {
    const request: ValidationRequest = {
      url: 'https://blog.naver.com/example/123456789',
    };

    const req = new Request('http://localhost/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBe(200);

    const result: ValidationResponse = await response.json();
    expect(result.valid).toBe(true);
    expect(result.type).toBe('naver');
    expect(result.normalizedUrl).toBeDefined();
  });

  test('should reject invalid URL format', async () => {
    const request: ValidationRequest = {
      url: 'not-a-url',
    };

    const req = new Request('http://localhost/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBe(400);
  });

  test('should handle unsupported platform', async () => {
    const request: ValidationRequest = {
      url: 'https://twitter.com/example',
    };

    const req = new Request('http://localhost/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBe(200);

    const result: ValidationResponse = await response.json();
    expect(result.valid).toBe(false);
    expect(result.type).toBe('unknown');
    expect(result.reason).toBeDefined();
  });

  test('should normalize YouTube short URLs', async () => {
    const request: ValidationRequest = {
      url: 'https://youtu.be/dQw4w9WgXcQ',
    };

    const req = new Request('http://localhost/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const response = await app.request(req);

    expect(response.status).toBe(200);

    const result: ValidationResponse = await response.json();
    expect(result.valid).toBe(true);
    expect(result.type).toBe('youtube');
    expect(result.normalizedUrl).toContain('youtube.com/watch?v=');
  });
});
