import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenCustomerCopy } from './customer-copy-rules.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(repoRoot, 'content/docs');

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(absolute);
  }
  return files;
}

const contentFiles = await walk(contentRoot);
const violations = [];
for (const file of contentFiles) {
  const content = (await readFile(file, 'utf8')).toLowerCase();
  for (const phrase of forbiddenCustomerCopy) {
    if (content.includes(phrase)) {
      violations.push(`${path.relative(repoRoot, file)}: ${phrase}`);
    }
  }
}

if (violations.length > 0) {
  throw new Error(`Customer-facing copy contains maintainer or orchestration language:\n${violations.join('\n')}`);
}

console.log(`verified customer-facing copy across ${contentFiles.length} pages`);
