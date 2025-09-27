// Zod Schema Validation for Textify Content Extraction Tool
// API request/response validation schemas

import { z } from 'zod';

// Request Schemas
export const extractionRequestSchema = z.object({
  url: z.string().url('올바른 URL 형식이 아닙니다'),
  options: z
    .object({
      language: z.string().optional(),
      includeTimestamps: z.boolean().optional(),
      format: z.enum(['plain', 'markdown']).optional(),
    })
    .optional(),
});

export const validationRequestSchema = z.object({
  url: z.string().min(1, 'URL이 필요합니다').url('올바른 URL 형식이 아닙니다'),
});

// Response Schemas
export const contentMetadataSchema = z.object({
  // YouTube specific
  videoId: z.string().optional(),
  duration: z.number().optional(),
  availableLanguages: z.array(z.string()).optional(),
  hasTimestamps: z.boolean().optional(),

  // Naver blog specific
  blogId: z.string().optional(),
  postId: z.string().optional(),
  author: z.string().optional(),
  publishDate: z.date().optional(),

  // Common
  extractionMethod: z.string(),
  processingTime: z.number().min(0),
  contentLength: z.number().min(0),
});

export const extractedContentSchema = z.object({
  id: z.string().uuid(),
  sourceUrl: z.string().url(),
  sourceType: z.enum(['youtube', 'naver']),
  title: z.string(),
  content: z.string(),
  language: z.string().optional(),
  timestamp: z.date(),
  metadata: contentMetadataSchema,
});

export const extractionErrorSchema = z.object({
  code: z.enum([
    'INVALID_URL',
    'UNSUPPORTED_PLATFORM',
    'CONTENT_NOT_FOUND',
    'NO_SUBTITLES',
    'EXTRACTION_FAILED',
    'TIMEOUT',
    'RATE_LIMITED',
  ]),
  message: z.string(),
  details: z.string().optional(),
  retryable: z.boolean(),
});

export const extractionResponseSchema = z
  .object({
    success: z.boolean(),
    data: extractedContentSchema.optional(),
    error: extractionErrorSchema.optional(),
    processingTime: z.number().min(0),
    timestamp: z.string().datetime(),
  })
  .refine(
    (data) => {
      // If success is true, data must be present
      if (data.success && !data.data) return false;
      // If success is false, error must be present
      if (!data.success && !data.error) return false;
      return true;
    },
    {
      message:
        'Success response must include data, error response must include error',
    },
  );

export const validationResponseSchema = z.object({
  valid: z.boolean(),
  type: z.enum(['youtube', 'naver', 'unknown']),
  normalizedUrl: z.string().url().optional(),
  reason: z.string().optional(),
});

export const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string(),
});

// Type exports for use in other files
export type ExtractionRequest = z.infer<typeof extractionRequestSchema>;
export type ValidationRequest = z.infer<typeof validationRequestSchema>;
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;
export type ValidationResponse = z.infer<typeof validationResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ExtractedContent = z.infer<typeof extractedContentSchema>;
export type ExtractionError = z.infer<typeof extractionErrorSchema>;
export type ContentMetadata = z.infer<typeof contentMetadataSchema>;
