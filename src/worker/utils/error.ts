import { z } from '@hono/zod-openapi';
import { type ZodError } from 'zod';

export const ErrorSchema = z.object({
  code: z.number().openapi({
    example: 400,
  }),
  message: z.string().openapi({
    example: 'Bad Request',
  }),
  issues: z
    .array(
      z.object({
        path: z.array(z.string()),
        message: z.string(),
      }),
    )
    .optional()
    .openapi({
      example: [
        {
          path: ['userId'],
          message: 'String must contain at least 3 character(s)',
        },
      ],
    }),
});

export const getValidationErrorResponse = (error: ZodError) => {
  return {
    code: 400,
    message: 'Validation Error',
    issues: error.issues.map((issue) => ({
      path: issue.path.map(String),
      message: issue.message,
    })),
  };
};
