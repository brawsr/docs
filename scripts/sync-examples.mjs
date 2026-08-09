import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(repoRoot, 'examples.lock.json');
const args = process.argv.slice(2);
const write = args.includes('--write');
const check = args.includes('--check');
const sourceIndex = args.indexOf('--source');
const sourceRoot = sourceIndex === -1 ? undefined : path.resolve(args[sourceIndex + 1] ?? '');

if (write === check) throw new Error('Choose exactly one of --write or --check');
if (write && !sourceRoot) throw new Error('--write requires --source <examples checkout>');
if (sourceIndex !== -1 && !args[sourceIndex + 1]) throw new Error('--source requires a checkout path');

const lock = JSON.parse(await readFile(lockPath, 'utf8'));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(content) {
  return createHash('sha256').update(content).digest('hex');
}

function snapshotPath(sourcePath) {
  return path.join(repoRoot, 'examples-source', sourcePath);
}

function dedent(value) {
  const lines = value.replaceAll('\r\n', '\n').split('\n');
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)[0].length);
  const indent = Math.min(...indents);
  return lines.map((line) => line.slice(Math.min(indent, line.length))).join('\n').trimEnd();
}

function containsExcerpt(source, excerpt) {
  const sourceLines = source.replaceAll('\r\n', '\n').split('\n');
  const excerptLines = excerpt.replaceAll('\r\n', '\n').split('\n');
  const expected = dedent(excerpt);
  for (let index = 0; index <= sourceLines.length - excerptLines.length; index += 1) {
    if (dedent(sourceLines.slice(index, index + excerptLines.length).join('\n')) === expected) return true;
  }
  return false;
}

invariant(lock.schemaVersion === 1, 'Unsupported examples lock schema');
invariant(lock.repository === 'brawsr/examples', 'Unexpected examples repository');
invariant(/^[0-9a-f]{40}$/.test(lock.commit), 'Examples lock must use a full commit SHA');
invariant(Array.isArray(lock.files) && lock.files.length > 0, 'Examples lock has no files');
invariant(
  Array.isArray(lock.documentationPages) && lock.documentationPages.length > 0,
  'Examples lock has no documentation pages',
);

if (sourceRoot) {
  const { stdout } = await execFileAsync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD']);
  const sourceCommit = stdout.trim();
  if (write) lock.commit = sourceCommit;
  else invariant(sourceCommit === lock.commit, `Examples checkout is ${sourceCommit}, expected ${lock.commit}`);
}

const snapshots = new Map();
for (const source of lock.files) {
  invariant(!path.isAbsolute(source.path) && !source.path.includes('..'), `Unsafe source path: ${source.path}`);
  invariant(!snapshots.has(source.path), `Duplicate source path: ${source.path}`);

  let snapshot;
  if (write) {
    snapshot = await readFile(path.join(sourceRoot, source.path));
    await mkdir(path.dirname(snapshotPath(source.path)), { recursive: true });
    await writeFile(snapshotPath(source.path), snapshot);
    source.sha256 = digest(snapshot);
  } else {
    snapshot = await readFile(snapshotPath(source.path));
  }

  invariant(digest(snapshot) === source.sha256, `Snapshot hash mismatch: ${source.path}`);
  if (sourceRoot && !write) {
    const upstream = await readFile(path.join(sourceRoot, source.path));
    invariant(upstream.equals(snapshot), `Pinned source drift: ${source.path}`);
  }
  snapshots.set(source.path, snapshot.toString('utf8'));
}

const excerptPattern = /\{\/\*\s*source:\s*([^\s*]+)\s*\*\/\}\s*```[^\n]*\n([\s\S]*?)\n```/g;
for (const page of lock.documentationPages) {
  invariant(typeof page.slug === 'string' && /^[a-z0-9-]+$/.test(page.slug), 'Invalid example page slug');
  const pagePath = path.join(repoRoot, 'content', 'docs', 'examples', `${page.slug}.mdx`);
  const content = await readFile(pagePath, 'utf8');
  invariant(
    !/SHA-256|CI verifies|checked together|silently drift|synchronized from/i.test(content),
    `${page.slug} exposes maintainer synchronization details`,
  );

  const expectedSources = new Set(page.sources);
  const referencedSources = new Set();
  let excerptCount = 0;
  for (const match of content.matchAll(excerptPattern)) {
    const sourcePath = match[1];
    const excerpt = match[2];
    const snapshot = snapshots.get(sourcePath);
    invariant(snapshot, `${page.slug} references unlocked source: ${sourcePath}`);
    invariant(expectedSources.has(sourcePath), `${page.slug} references unexpected source: ${sourcePath}`);
    invariant(containsExcerpt(snapshot, excerpt), `${page.slug} contains a stale excerpt from ${sourcePath}`);
    invariant(excerpt.length < snapshot.length, `${page.slug} embeds the complete ${sourcePath} file`);
    referencedSources.add(sourcePath);
    excerptCount += 1;
  }

  invariant(excerptCount >= 2, `${page.slug} needs at least two focused source excerpts`);
  invariant(
    referencedSources.size === expectedSources.size,
    `${page.slug} does not excerpt every declared source`,
  );
  for (const sourcePath of expectedSources) {
    invariant(
      content.includes(`https://github.com/${lock.repository}/blob/main/${sourcePath}`),
      `${page.slug} is missing its full-source link`,
    );
  }
}

if (write) await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

console.log(
  `${write ? 'synchronized' : 'verified'} ${lock.documentationPages.length} story pages from ${snapshots.size} source files at ${lock.commit}`,
);
