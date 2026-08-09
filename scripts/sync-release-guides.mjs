import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repoRoot, 'vendor/public-contract/v0.6.1/source');
const outputRoot = path.join(repoRoot, 'content/docs/guides');

const guides = [
  {
    source: 'API.md',
    output: 'api-and-sdk.mdx',
    title: 'API and SDK guide',
    description: 'Sessions, checkpoints, rewind, fork, operations, and CDP reconnection.',
  },
  {
    source: 'LIMITATIONS.md',
    output: 'recovery-limitations.mdx',
    title: 'Recovery limitations',
    description: 'The boundaries that matter when designing recoverable browser automation.',
  },
  {
    source: 'MCP.md',
    output: 'mcp.mdx',
    title: 'MCP server',
    description: 'Configure and operate the authenticated local stdio MCP integration.',
  },
];

function transformBody(markdown) {
  return markdown
    .replace(/^# .+\n+/, '')
    .replaceAll('[`openapi/v1.json`](openapi/v1.json)', '[API reference](/docs/api-reference)')
    .replaceAll('[`LIMITATIONS.md`](LIMITATIONS.md)', '[recovery limitations](/docs/guides/recovery-limitations)')
    .replaceAll('[`API.md`](API.md)', '[API and SDK guide](/docs/guides/api-and-sdk)');
}

await mkdir(outputRoot, { recursive: true });

for (const guide of guides) {
  const source = await readFile(path.join(sourceRoot, guide.source), 'utf8');
  const frontmatter = `---\ntitle: ${guide.title}\ndescription: ${guide.description}\n---\n\n`;
  await writeFile(path.join(outputRoot, guide.output), frontmatter + transformBody(source));
}

console.log(`generated ${guides.length} release-bound guides`);
