import { cp, mkdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'portfolio-source');
const destination = path.join(root, 'public', 'portfolio');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this through npm run portfolio:build.');

// The same locked, checked build runs locally and in the existing Pages workflow.
for (const args of [['ci'], ['run', 'check'], ['run', 'build']]) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd: source,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Only replace the generated portfolio subtree; keep the parent site intact.
const publicRoot = await realpath(path.join(root, 'public'));
if (path.dirname(destination) !== publicRoot) throw new Error('Unexpected staging path.');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(path.join(source, 'dist'), destination, { recursive: true });
console.log('Staged the verified portfolio at public/portfolio/.');
