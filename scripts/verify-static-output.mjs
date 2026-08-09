import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenCustomerCopy } from './customer-copy-rules.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(repoRoot, 'out');

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

const required = [
  'index.html',
  'docs/index.html',
  'docs/get-started/installation/index.html',
  'docs/get-started/quickstart/index.html',
  'docs/examples/index.html',
  'docs/examples/playwright-rewind-typescript/index.html',
  'docs/examples/playwright-rewind-python/index.html',
  'docs/examples/playwright-fork-typescript/index.html',
  'docs/examples/speculative-branching/index.html',
  'docs/concepts/state-lineage/index.html',
  'docs/guides/api-and-sdk/index.html',
  'docs/guides/recovery-limitations/index.html',
  'docs/guides/mcp/index.html',
  'docs/api-reference/index.html',
  'icon.svg',
  'llms.txt',
  'llms-full.txt',
];

for (const relative of required) {
  invariant(await exists(path.join(outputRoot, relative)), `Missing static output: ${relative}`);
}

const home = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
invariant(home.includes('Your browser,'), 'Homepage is missing the landing-derived hero headline');
invariant(home.includes('at any point in time.'), 'Homepage is missing the branded hero accent');
invariant(home.includes('LIVE STATE / 03'), 'Homepage is missing the live recovery demo');
invariant(home.includes('RECOVERY BOUNDARY'), 'Homepage is missing the recovery boundary');
invariant(home.includes('brawsr'), 'Homepage is missing the brawsr wordmark');
invariant(
  !home.includes('Recover, retry, and branch with intent.'),
  'Deprecated generic hero copy returned to the homepage',
);

const operationSources = (await walk(path.join(repoRoot, 'content/docs/api-reference/operations')))
  .filter((file) => file.endsWith('.mdx'));
invariant(operationSources.length === 16, `Expected 16 OpenAPI operations, found ${operationSources.length}`);

for (const source of operationSources) {
  const relative = path.relative(
    path.join(repoRoot, 'content/docs'),
    source.slice(0, -'.mdx'.length),
  );
  invariant(
    await exists(path.join(outputRoot, 'docs', relative, 'index.html')),
    `Missing generated operation page: ${relative}`,
  );
}

const outputFiles = await walk(outputRoot);
invariant(
  outputFiles.some((file) => file.includes(`${path.sep}api${path.sep}search`)),
  'Static search index was not exported',
);

const htmlFiles = outputFiles.filter((file) => file.endsWith('.html'));
const broken = [];

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  for (const match of html.matchAll(/\shref=["']([^"']+)["']/g)) {
    const href = match[1];
    if (
      href.startsWith('#') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('data:')
    ) continue;

    const pathname = decodeURIComponent(new URL(href, 'https://docs.brawsr.io').pathname);
    const relative = pathname.replace(/^\//, '');
    const candidates = path.extname(relative)
      ? [path.join(outputRoot, relative)]
      : [path.join(outputRoot, relative, 'index.html'), path.join(outputRoot, `${relative}.html`)];

    if (!(await Promise.all(candidates.map(exists))).some(Boolean)) {
      broken.push(`${path.relative(outputRoot, htmlFile)} -> ${href}`);
    }
  }
}

invariant(broken.length === 0, `Broken internal links:\n${broken.slice(0, 30).join('\n')}`);

const llms = await readFile(path.join(outputRoot, 'llms-full.txt'), 'utf8');
invariant(llms.includes('Recovery limitations'), 'llms-full.txt is missing release-bound guides');
invariant(llms.includes('@brawsr/sdk'), 'llms-full.txt is missing the TypeScript SDK package');
invariant(llms.includes('python -m pip install brawsr'), 'llms-full.txt is missing Python installation');
invariant(llms.includes('@brawsr/mcp-server@0.1.0'), 'llms-full.txt is missing MCP installation');
invariant(
  llms.includes('prepared-for-route-comparison'),
  'llms-full.txt is missing the speculative branching source',
);
invariant(!llms.includes('Hello World'), 'Template placeholder leaked into llms-full.txt');

const speculativeExample = await readFile(
  path.join(outputRoot, 'docs/examples/speculative-branching/index.html'),
  'utf8',
);
invariant(
  speculativeExample.includes('data-external-link="true"') &&
    speculativeExample.includes('external-link-marker') &&
    speculativeExample.includes('target="_blank"') &&
    speculativeExample.includes('rel="noopener noreferrer"') &&
    speculativeExample.includes('opens in a new tab'),
  'External documentation links are missing their marker or safe new-tab behavior',
);

const faviconSource = await readFile(path.join(repoRoot, 'src/app/icon.svg'), 'utf8');
const faviconOutput = await readFile(path.join(outputRoot, 'icon.svg'), 'utf8');
invariant(faviconOutput === faviconSource, 'Static output is not using the canonical brawsr favicon');
invariant(
  faviconOutput.includes('#1763FF') && !faviconOutput.includes('state lineage'),
  'Deprecated lineage artwork returned to the favicon',
);

const customerArtifacts = outputFiles.filter(
  (file) => file.endsWith('.html') || file.endsWith('llms.txt') || file.endsWith('llms-full.txt'),
);
const copyViolations = [];
for (const file of customerArtifacts) {
  const content = (await readFile(file, 'utf8')).toLowerCase();
  for (const phrase of forbiddenCustomerCopy) {
    if (content.includes(phrase)) copyViolations.push(`${path.relative(outputRoot, file)}: ${phrase}`);
  }
}
invariant(
  copyViolations.length === 0,
  `Rendered customer copy contains maintainer or orchestration language:\n${copyViolations.slice(0, 30).join('\n')}`,
);

console.log(`verified ${htmlFiles.length} static HTML pages and ${operationSources.length} API operations`);
