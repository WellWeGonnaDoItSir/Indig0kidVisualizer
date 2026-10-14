import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'site');
const files = ['index.html', 'style.css', 'app.js', 'scenes.js', 'studio.js', 'site-config.js', 'project.js', 'privacy.html', 'favicon.svg'];
await mkdir(output, { recursive: true });
for (const file of files) await copyFile(join(root, file), join(output, file));
const html = await readFile(join(output, 'index.html'), 'utf8');
if (html.includes('src="/app.js"') || html.includes('href="/style.css"')) throw new Error('Root-relative assets would break GitHub project Pages.');
await writeFile(join(output, '.nojekyll'), '');
console.log('Static website built in site/. No server, secrets, audio, or user images are included.');
