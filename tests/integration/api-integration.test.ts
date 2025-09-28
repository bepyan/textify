/**
 * API Integration Tests
 *
 * 전체 API 통합 테스트
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Test Configuration
// ============================================================================

const API_BASE_URL = 'http://localhost:8787/api';

// Mock API client
const apiClient = {
  async get(path: string, headers: Record<string, string> = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return {
      status: response.status,
      json: () => response.json(),
      headers: response.headers,
    };
  },

  async post(
    path: string,
    data: unknown,
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
    return {
      status: response.status,
      json: () => response.json(),
      headers: response.headers,
    };
  },
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('API Integration Tests', () => {
  describe('Health and Status', () => {
    it('should return API status from root endpoint', async () => {
      const response = await apiClient.get('/');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('name', 'Textify API');
      expect(data).toHaveProperty('version', '1.0.0');
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
    });

    it('should return health status from extract endpoint', async () => {
      const response = await apiClient.get('/extract/health');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('service', 'content-extraction-api');
      expect(data).toHaveProperty('version', '1.0.0');
    });
  });

  describe('Middleware Integration', () => {
    it('should add security headers to responses', async () => {
      const response = await apiClient.get('/');

      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
    });

    it('should add CORS headers to responses', async () => {
      const response = await apiClient.get('/');

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain(
        'GET',
      );
      expect(response.headers.get('access-control-allow-methods')).toContain(
        'POST',
      );
    });

    it('should add request ID to responses', async () => {
      const response = await apiClient.get('/');

      expect(response.headers.get('x-request-id')).toBeDefined();
      expect(response.headers.get('x-request-id')).toMatch(
        /^req_\d+_[a-z0-9]+$/,
      );
    });

    it('should respect custom request ID header', async () => {
      const customRequestId = 'test-request-123';
      const response = await apiClient.get('/', {
        'x-request-id': customRequestId,
      });

      expect(response.headers.get('x-request-id')).toBe(customRequestId);
    });

    it('should add rate limit headers', async () => {
      const response = await apiClient.post('/extract/auto', {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });

      expect(response.headers.get('x-ratelimit-limit')).toBeDefined();
      expect(response.headers.get('x-ratelimit-remaining')).toBeDefined();
      expect(response.headers.get('x-ratelimit-reset')).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors consistently', async () => {
      const response = await apiClient.post('/extract/auto', {
        url: 'invalid-url',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('type');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('retryable');
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('requestId');
      expect(data.metadata).toHaveProperty('timestamp');
    });

    it('should handle unsupported platform errors', async () => {
      const response = await apiClient.post('/extract/auto', {
        url: 'https://www.instagram.com/p/example/',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe('UNSUPPORTED_PLATFORM');
      expect(data.error.retryable).toBe(false);
    });

    it('should handle missing request body', async () => {
      const response = await fetch(`${API_BASE_URL}/extract/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('Content Extraction Integration', () => {
    it('should successfully extract YouTube content end-to-end', async () => {
      const response = await apiClient.post('/extract/youtube', {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          includeTags: true,
          timeout: 10000,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.platform).toBe('youtube');
      expect(data.data.videoId).toBe('dQw4w9WgXcQ');
      expect(data.data.title).toBeDefined();
      expect(data.data.description).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should auto-detect platform and extract content', async () => {
      const response = await apiClient.post('/extract/auto', {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.platform).toBe('youtube');
      expect(data.metadata.platform).toBe('youtube');
    });

    it('should handle extraction with custom options', async () => {
      const response = await apiClient.post('/extract/auto', {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          maxContentLength: 1000,
          timeout: 5000,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.description.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          apiClient.post('/extract/auto', {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      const data = await Promise.all(responses.map((r) => r.json()));

      // 모든 요청이 고유한 requestId를 가져야 함
      const requestIds = data.map((d) => d.metadata.requestId);
      const uniqueRequestIds = new Set(requestIds);
      expect(uniqueRequestIds.size).toBe(requests.length);
    });

    it('should complete extraction within reasonable time', async () => {
      const startTime = Date.now();

      const response = await apiClient.post('/extract/auto', {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(totalTime).toBeLessThan(15000); // 15초 이내

      const data = await response.json();
      expect(data.metadata.processingTime).toBeLessThan(10000); // 서버 처리 시간 10초 이내
    });

    it('should maintain consistent response structure across endpoints', async () => {
      const endpoints = [
        {
          path: '/extract/youtube',
          data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        },
        {
          path: '/extract/auto',
          data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        },
      ];

      for (const endpoint of endpoints) {
        const response = await apiClient.post(endpoint.path, endpoint.data);
        expect(response.status).toBe(200);

        const data = await response.json();

        // 공통 응답 구조 검증
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('metadata');

        expect(data.metadata).toHaveProperty('requestId');
        expect(data.metadata).toHaveProperty('processingTime');
        expect(data.metadata).toHaveProperty('platform');
        expect(data.metadata).toHaveProperty('extractedFields');
      }
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/extract/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle very long URLs', async () => {
      const longUrl =
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ' +
        '&param=' +
        'a'.repeat(1000);

      const response = await apiClient.post('/extract/auto', {
        url: longUrl,
      });

      // URL이 너무 길어도 적절히 처리되어야 함
      expect([200, 400]).toContain(response.status);
    });

    it('should handle special characters in URLs', async () => {
      const response = await apiClient.post('/extract/auto', {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&title=한글제목',
      });

      expect([200, 400]).toContain(response.status);
    });
  });
});
