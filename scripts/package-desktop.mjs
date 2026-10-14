import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2] ? resolve(process.argv[2]) : join(root, 'dist');
const [template, css, app, scenes, studio, config] = await Promise.all(['index.html', 'style.css', 'app.js', 'scenes.js', 'studio.js', 'site-config.js'].map(name => readFile(join(root, name), 'utf8')));
const sceneImport = "import { SCENES, renderScene } from './scenes.js';";
const studioImport = "import { createStudio } from './studio.js';";
if (!app.includes(sceneImport) || !app.includes(studioImport)) throw new Error('Application imports changed; update the standalone packager.');
const configImport = "import { SITE_CONFIG } from './site-config.js';";
if (!app.includes(configImport)) throw new Error('Site configuration import changed.');
const bundledConfig = config.replace(/^export const /gm, 'const ');
const bundledScenes = scenes.replace(/^export (const|function) /gm, '$1 ');
const bundledStudio = studio.replace(/^export function /gm, 'function ');
const js = bundledScenes + '\n' + bundledStudio + '\n' + bundledConfig + '\n' + app.replace(sceneImport, '').replace(studioImport, '').replace(configImport, '');
const html = template
  .replace('Indig0kid Visual — Free music visualizer', 'Vizual Indig0kid — Artwork studio')
  .replace('<link rel="icon" href="./favicon.svg">', '')
  .replace('class="brand" href="./"', 'class="brand" href="#"')
  .replace('<a class="privacy-link" href="./privacy.html" target="_blank" rel="noopener">Privacy</a> ', '')
  .replace('<link rel="stylesheet" href="./style.css">', `<style>${css}</style>`)
  .replace('<script type="module" src="./app.js"></script>', `<script type="module">${js}</script>`);
if (html.includes('src="./app.js"') || html.includes('href="./style.css"') || html.includes(sceneImport) || html.includes(studioImport) || html.includes(configImport)) throw new Error('Standalone bundle contains an external application dependency.');
const payload = gzipSync(Buffer.from(html, 'utf8')).toString('base64');
const installer = `# Vizual Indig0kid - Artwork studio: 20 scenes, background, cover art, and text.
# Copy ALL of this script and paste into Windows PowerShell, then press Enter.
# Creates/updates a standalone HTML on Desktop; preserves the previous file as a backup.
& {
    $ErrorActionPreference = 'Stop'
    $vizDesktop = [Environment]::GetFolderPath('Desktop')
    if (-not $vizDesktop) { throw 'Windows Desktop folder could not be found.' }
    $vizPath = Join-Path $vizDesktop 'Vizual Indig0kid.html'
    $vizPayload = '${payload}'
    $vizInput = New-Object System.IO.MemoryStream(,[Convert]::FromBase64String($vizPayload))
    $vizGzip = New-Object System.IO.Compression.GZipStream($vizInput, [System.IO.Compression.CompressionMode]::Decompress)
    $vizOutput = New-Object System.IO.MemoryStream
    try {
        $vizGzip.CopyTo($vizOutput)
        if (Test-Path -LiteralPath $vizPath) {
            $vizBackup = Join-Path $vizDesktop ('Vizual Indig0kid.backup-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss-fff') + '.html')
            Copy-Item -LiteralPath $vizPath -Destination $vizBackup
        }
        [System.IO.File]::WriteAllBytes($vizPath, $vizOutput.ToArray())
    } finally {
        $vizGzip.Dispose()
        $vizInput.Dispose()
        $vizOutput.Dispose()
    }
    Start-Process -FilePath $vizPath
    Write-Host 'Vizual Indig0kid Artwork Studio installed on Desktop. Previous version backed up if present.'
}
`;
await mkdir(output, { recursive: true });
await writeFile(join(output, 'Vizual Indig0kid.html'), html);
await writeFile(join(output, 'Azuriraj-Vizual-Indig0kid-Artwork.ps1'), installer);
console.log(`Standalone HTML and Windows Desktop updater created in ${output}`);
