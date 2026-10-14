import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/scenes.js': ['scenes.js', 'text/javascript'], '/studio.js': ['studio.js', 'text/javascript'], '/project.js': ['project.js', 'text/javascript'], '/site-config.js': ['site-config.js', 'text/javascript'], '/privacy.html': ['privacy.html', 'text/html'], '/favicon.png': ['public/favicon.png', 'image/png'], '/favicon.svg': ['public/favicon.svg', 'image/svg+xml'] };
http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` }); res.end(await readFile(root + file[0])); }
  catch { res.writeHead(500); res.end('Unable to load application'); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Indig0kid studio listening on port ' + (process.env.PORT || 3000)));
