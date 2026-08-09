import { createOpenAPI } from 'fumadocs-openapi/server';

export const openapi = createOpenAPI({
  input: ['./vendor/developer-docs/v0.6.0/source/openapi/v1.json'],
});
