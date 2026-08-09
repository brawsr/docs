import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(await readFile(path.join(repoRoot, 'developer-docs.lock.json'), 'utf8'));
const releaseRoot = path.join(repoRoot, 'vendor/public-contract', lock.tag);
const sourceRoot = path.join(releaseRoot, 'source');
const bundleFilename = `developer-docs-${lock.contract_version}.tar.gz`;
const manifestFilename = `developer-docs-${lock.contract_version}.manifest.json`;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function sha256(file) {
  const bytes = await readFile(file);
  return createHash('sha256').update(bytes).digest('hex');
}

async function walkFiles(directory, prefix = '') {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walkFiles(absolute, relative));
    else if (entry.isFile()) output.push(relative);
    else throw new Error(`Unsupported vendored entry type: ${relative}`);
  }
  return output.sort();
}

invariant(lock.schema_version === 'brawsr-docs-consumer-lock-v1', 'Unknown consumer lock schema');

for (const [filename, expected] of Object.entries(lock.assets)) {
  const file = path.join(releaseRoot, filename);
  invariant((await lstat(file)).isFile(), `Release asset is not a regular file: ${filename}`);
  invariant(await sha256(file) === expected, `Release asset digest drift: ${filename}`);
}

const manifest = JSON.parse(
  await readFile(path.join(releaseRoot, manifestFilename), 'utf8'),
);
invariant(manifest.tag === lock.tag, 'Release tag does not match consumer lock');
invariant(manifest.version === lock.contract_version, 'Contract version does not match release');
invariant(manifest.commit === lock.source_commit, 'Source commit does not match release');
invariant(manifest.verification.ci_run_id === lock.ci_run_id, 'CI identity does not match release');
invariant(
  manifest.bundle.sha256 === lock.assets[bundleFilename],
  'Bundle digest does not match release manifest',
);
invariant(manifest.contract.sha256 === lock.openapi_sha256, 'OpenAPI digest does not match manifest');

const contractLock = JSON.parse(await readFile(path.join(sourceRoot, 'contract-lock.json'), 'utf8'));
invariant(contractLock.contract_version === lock.contract_version, 'Vendored contract version drift');
invariant(contractLock.openapi_sha256 === lock.openapi_sha256, 'Vendored contract lock drift');

const expectedFiles = Object.keys(lock.source_files).sort();
const actualFiles = await walkFiles(sourceRoot);
invariant(
  JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
  `Vendored source inventory drift\nexpected: ${expectedFiles.join(', ')}\nactual: ${actualFiles.join(', ')}`,
);

for (const [relative, expected] of Object.entries(lock.source_files)) {
  invariant(
    await sha256(path.join(sourceRoot, relative)) === expected,
    `Vendored source digest drift: ${relative}`,
  );
}

console.log(`verified developer-docs ${lock.tag} (${lock.source_commit.slice(0, 12)})`);
