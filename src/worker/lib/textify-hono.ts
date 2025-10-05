import { OpenAPIHono } from '@hono/zod-openapi';

export type TextifyBindings = {
  KV: KVNamespace;
};

export class TextifyHono extends OpenAPIHono<{
  Bindings: TextifyBindings;
}> {}
