import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';

// Always rebuild the latest application before creating the clearly named final copy.
await import('./package-desktop.mjs');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2] ? resolve(process.argv[2]) : join(root, 'dist');
const name = 'Indig0kid Visual Final Program';
const current = await readFile(join(output, 'Vizual Indig0kid.html'), 'utf8');
const html = current.replace('<title>Vizual Indig0kid — Artwork studio</title>', `<title>${name}</title>`);
if (html === current) throw new Error('Unexpected application title; final packaging stopped.');
const payload = gzipSync(Buffer.from(html, 'utf8')).toString('base64');
if (gunzipSync(Buffer.from(payload, 'base64')).toString('utf8') !== html) throw new Error('Final payload verification failed.');
const instructions = `INDIG0KID VISUAL FINAL PROGRAM

Otvori "Indig0kid Visual Final Program.html" dvoklikom u Edge-u ili Chrome-u.
Ovo je Artwork Studio verzija: 20 stilova, jak bass odziv, background image,
centralni cover art, do 5 tekstualnih slojeva, sopstveni fontovi i video export.
Nisu potrebni Node.js, PowerShell ili ovaj chat za svakodnevno pokretanje.

Save project cuva pesmu, slike, tekst, fontove i podesavanja u .indig0kid fajl.
Sledeci put koristi Import save da nastavis gde si stao, bez naloga.
Izaberi Desktop u dijalogu; inace proveri Downloads.
Izvezeni video ostaje u Downloads folderu ili na mestu koje izaberes.

Kada proveris ovu kopiju, stare Vizual Indig0kid HTML fajlove i njihove backup
kopije na Desktopu mozes obrisati ako ti vise ne trebaju. Ne brisi muziku,
slike, fontove ili exportovane video fajlove koje zelis da sacuvas.
Ova skripta nije obrisala stare fajlove.
`;
const script = `# Installs the latest Artwork Studio in a clearly named Desktop folder.
# Copy this ENTIRE script into Windows PowerShell and press Enter.
# Existing files are preserved. No administrator rights are needed.
& {
    $ErrorActionPreference = 'Stop'
    $finalDesktop = [Environment]::GetFolderPath('Desktop')
    if (-not $finalDesktop) { throw 'Windows Desktop folder could not be found.' }
    $finalFolder = Join-Path $finalDesktop '${name}'
    $finalHtml = Join-Path $finalFolder '${name}.html'
    $finalGuide = Join-Path $finalFolder 'PROCITAJ ME.txt'
    $finalPayload = '${payload}'
    $finalInput = New-Object System.IO.MemoryStream(,[Convert]::FromBase64String($finalPayload))
    $finalGzip = New-Object System.IO.Compression.GZipStream($finalInput, [System.IO.Compression.CompressionMode]::Decompress)
    $finalOutput = New-Object System.IO.MemoryStream
    try {
        $finalGzip.CopyTo($finalOutput)
        [System.IO.Directory]::CreateDirectory($finalFolder) | Out-Null
        if (Test-Path -LiteralPath $finalHtml) {
            $finalBackups = Join-Path $finalFolder 'Prethodne verzije'
            [System.IO.Directory]::CreateDirectory($finalBackups) | Out-Null
            Copy-Item -LiteralPath $finalHtml -Destination (Join-Path $finalBackups ('Program-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss-fff') + '.html'))
        }
        [System.IO.File]::WriteAllBytes($finalHtml, $finalOutput.ToArray())
        if (-not (Test-Path -LiteralPath $finalGuide)) {
            $finalGuideContent = @'
${instructions}'@
            [System.IO.File]::WriteAllText($finalGuide, $finalGuideContent, [System.Text.Encoding]::UTF8)
        }
    } finally {
        $finalGzip.Dispose()
        $finalInput.Dispose()
        $finalOutput.Dispose()
    }
    Start-Process -FilePath $finalHtml
    Write-Host 'Indig0kid Visual Final Program is now in its own Desktop folder. Old Desktop files were not deleted.'
}
`;
const finalFolder = join(output, name);
await mkdir(finalFolder, { recursive: true });
await writeFile(join(finalFolder, name + '.html'), html);
await writeFile(join(finalFolder, 'PROCITAJ ME.txt'), instructions);
await writeFile(join(output, 'Instaliraj-Indig0kid-Visual-Final-Program.ps1'), script);
console.log(`Final application and backup-preserving Desktop installer created in ${output}`);
