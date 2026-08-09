import { rm } from 'node:fs/promises';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { generateFiles } from 'fumadocs-openapi';

const output = './content/docs/api-reference/operations';
const openapi = createOpenAPI({
  input: ['./vendor/public-contract/v0.6.1/source/openapi/v1.json'],
});

function toKebabCase(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function operationFilename(outputEntry) {
  const operation = this.fromExtractedOperation(outputEntry.item)?.operation;
  if (!operation?.operationId) throw new Error(`Missing operationId for ${outputEntry.item.method} ${outputEntry.item.path}`);
  return toKebabCase(operation.operationId);
}

await rm(output, { recursive: true, force: true });
await generateFiles({
  input: openapi,
  output,
  per: 'operation',
  groupBy: 'none',
  name: operationFilename,
  meta: true,
  includeDescription: true,
  addGeneratedComment: false,
});

console.log('generated release-bound OpenAPI operation pages');
