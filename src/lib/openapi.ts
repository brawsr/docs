import { createOpenAPI } from 'fumadocs-openapi/server';

export const openapi = createOpenAPI({
  input: ['./vendor/public-contract/v0.6.1/source/openapi/v1.json'],
});
