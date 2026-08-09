import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { generateFiles } from 'fumadocs-openapi';

const output = './content/docs/api-reference/operations';
const openapi = createOpenAPI({
  input: ['./contract/openapi/v1.json'],
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

async function files(root, directory = root) {
  const result = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [name, contents] of await files(root, absolute)) {
        result.set(name, contents);
      }
    } else if (entry.isFile()) {
      result.set(path.relative(root, absolute), await readFile(absolute));
    }
  }
  return result;
}

function assertSameFiles(expected, actual) {
  if (
    expected.size !== actual.size ||
    [...expected].some(
      ([name, contents]) => !actual.has(name) || !contents.equals(actual.get(name)),
    )
  ) {
    throw new Error('generated OpenAPI operation pages are stale; run npm run content:generate');
  }
}

const check = process.argv.includes('--check');
const generatedOutput = check
  ? await mkdtemp(path.join(tmpdir(), 'brawsr-openapi-'))
  : output;

try {
  if (!check) await rm(output, { recursive: true, force: true });
  await generateFiles({
    input: openapi,
    output: generatedOutput,
    per: 'operation',
    groupBy: 'none',
    name: operationFilename,
    meta: true,
    includeDescription: true,
    addGeneratedComment: false,
  });
  if (check) assertSameFiles(await files(generatedOutput), await files(output));
} finally {
  if (check) await rm(generatedOutput, { recursive: true, force: true });
}

console.log(`${check ? 'verified' : 'generated'} release-bound OpenAPI operation pages`);
