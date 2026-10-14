import { execFileSync } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

await import('./build-site.mjs');
const root = fileURLToPath(new URL('../', import.meta.url));
const run = (args, options = {}) => execFileSync('git', args, { cwd: root, encoding: 'utf8', ...options }).trim();
const reference = 'refs/heads/gh-pages';
const remote = run(['ls-remote', 'origin', reference]);
const previous = remote ? remote.split(/\s+/)[0] : null;
if (previous) {
  run(['fetch', 'origin', 'gh-pages']);
  let marker;
  try { marker = JSON.parse(run(['show', `${previous}:.indig0kid-site.json`])); } catch { throw new Error('An existing gh-pages branch is not marked as this site. It was not overwritten.'); }
  if (marker.application !== 'Indig0kid Visual') throw new Error('Existing Pages site belongs to another application. It was not overwritten.');
}
const temporary = await mkdtemp(join(tmpdir(), 'indig0kid-pages-'));
const gitEnv = { ...process.env, GIT_INDEX_FILE: join(temporary, 'index') };
const stage = args => run(args, { env: gitEnv });
try {
  stage(['read-tree', '--empty']);
  const files = ['index.html', 'style.css', 'app.js', 'scenes.js', 'studio.js', 'site-config.js', 'project.js', 'privacy.html', 'favicon.svg', '.nojekyll'];
  const marker = Buffer.from(JSON.stringify({ application: 'Indig0kid Visual', sourceCommit: run(['rev-parse', 'HEAD']) }, null, 2) + '\n');
  for (const file of [...files, '.indig0kid-site.json']) {
    const content = file === '.indig0kid-site.json' ? marker : await readFile(join(root, 'site', file));
    const hash = run(['hash-object', '-w', '--stdin'], { input: content });
    stage(['update-index', '--add', '--cacheinfo', `100644,${hash},${file}`]);
  }
  const tree = stage(['write-tree']);
  const args = ['commit-tree', tree, ...(previous ? ['-p', previous] : []), '-m', 'Publish Indig0kid Visual static website'];
  const commit = run(args);
  run(['push', 'origin', `${commit}:${reference}`], { stdio: ['pipe', 'pipe', 'inherit'] });
  console.log(`Static site pushed to gh-pages (${commit.slice(0, 12)}). GitHub Pages must be enabled with gh-pages / root; this push alone does not prove a live website.`);
} finally { await rm(temporary, { recursive: true, force: true }); }
