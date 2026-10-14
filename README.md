# Indig0kid Visual Studio

A local, bass-reactive music visualizer with 20 animated scenes, color palettes, fullscreen playback, and video export. Audio files stay in the browser. Includes a locally generated demo track.

## Publish the free website

`npm run build` creates a public static website in `site/`. Only the application files, public configuration, favicon, privacy page, and `.nojekyll` marker are copied. The Node server, Desktop installers, repository metadata, and user assets are excluded. Relative assets and module imports support a project subpath such as `/Indig0kidVisualizer/`.

`npm run publish:pages` builds and pushes only these public assets to the `gh-pages` branch using the existing Git HTTPS authentication. It preserves earlier deployments in Git history and refuses to overwrite an unrecognized Pages branch. It does not switch the development checkout or create a worktree. Enable GitHub Pages in repository Settings → Pages with **Deploy from a branch**, branch **gh-pages**, folder **/(root)**. A push does not establish successful hosting; confirm the Pages build and test the published HTTPS URL. Private repositories may require a paid GitHub plan for Pages; keep the repository's current visibility unless the owner explicitly changes it. Static `site/` files can instead be uploaded to a free static host that supports private-source projects.

All visualizer functions remain free. To activate the optional **Donate $1 if you want ♥** link, set `donationUrl` in `site-config.js` to the owner's actual public HTTPS payment page and republish. Without a real link the donation section stays hidden. Never store card numbers, bank-account numbers, passwords, or payment API keys in this public configuration. Payment is handled entirely by the external provider; its fees and supported amounts apply. There are no paywalls or payment forms in the application.

## Save and resume without an account

Save project writes one `.indig0kid` file containing the original audio, background, cover, uploaded fonts, text layers, scene, palette, bass/motion controls, listening volume, toggles, and playback position. Import save restores it after closing the browser or visiting the site again. Playback resumes paused at the saved position; press Play to continue. There are no accounts or email logins.

On browsers supporting the File System Access API, the save dialog starts at Desktop and lets the user choose a destination. Other browsers download the file to their configured Downloads folder. The app cannot silently write to a Desktop path. Project files are local and support up to 512 MB; they contain the user's media and should be shared accordingly. Corrupt or unsupported saves are validated before replacing the existing project.

## Artwork and typography

The artwork editor adds a full-frame background and a circular cover in the center of any scene. Upload PNG, JPEG, WEBP, or AVIF (up to 25 MB); decoded images are capped at 2560 pixels on their longest edge to limit memory. Backgrounds fill the frame with a centered crop. Covers use a centered square crop inside a circle. Adjust background visibility and cover diameter; optional cover pulse follows bass, and the light ring uses the current palette. Remove buttons clear either image independently. A failed image replacement preserves the previous image.

The text editor supports five independent multiline layers with font, color, size, position, alignment, letter spacing, bold, italic, and shadow. Text wraps to the video bounds; font size is expressed in pixels at 1440p and scales with the preview. Very long text shrinks to fit. The ten offered fonts include local font families and optional Google Fonts with local fallbacks. Upload TTF, OTF, WOFF, or WOFF2 files (up to 10 MB, ten custom fonts per session) to use your own fonts without network access.

Background, cover, and text are drawn directly onto the recording canvas and appear in fullscreen and video exports. Export waits for pending image/font loads and locks the artwork/text editors until finished or canceled. Uploaded images, fonts, text, and audio stay in browser memory. Save project writes them to a local .indig0kid file; Import save restores them after reopening. They are not written to the application HTML or sent to a server.

## Scenes

The gallery has live-rendered static thumbnails and category filters. Each preset uses its own procedural renderer, reacts to the shared bass/kick engine, and works with all five color palettes. Selecting a style preserves audio playback. Scroll the gallery to explore all 20.

| Category | Presets |
| --- | --- |
| Cosmic | Indigo orbit, Hyperdrive, Solar eclipse, Stardust, Event horizon |
| Fluid | Silk waves, Liquid chrome, Satin ribbons, Spiral motion, Northern lights |
| Geometry | Cyber grid, Frequency hills, Double helix, Prism break, Sacred geometry |
| Electric | After hours, Bass crown, Pulse line, Signal error, Neon rain |

Visual direction was informed by the procedural preset approach documented in [projectM](https://github.com/projectM-visualizer/projectm) and [Butterchurn/MilkDrop](https://github.com/jberg/butterchurn). The renderers here are original Canvas scenes; no third-party presets or renderer libraries are bundled. These references describe established visualizer approaches, rather than a ranking of current trends.

## Windows Desktop version

```sh
npm run desktop
```

Creates `dist/Vizual Indig0kid.html` and `dist/Azuriraj-Vizual-Indig0kid-Artwork.ps1`. The HTML bundles all application JavaScript and CSS and needs no local server or Node.js on the user's computer. Open it with Edge, Chrome, or Firefox. Online fonts are optional and have local fallbacks.

Users can copy the complete PowerShell script into PowerShell to create/update the HTML on their Windows Desktop. It preserves any existing `Vizual Indig0kid.html` as a timestamped backup before replacement. Node.js is only needed to build this distribution, not to use it. Cloud Chromium policy blocks direct `file://` navigation; standalone content is tested over an intercepted local HTTP response instead.

For the clearly named final distribution, run `npm run desktop:final`. This rebuilds the latest application and creates `dist/Indig0kid Visual Final Program/Indig0kid Visual Final Program.html`, a short usage guide, and `dist/Instaliraj-Indig0kid-Visual-Final-Program.ps1`. The installer creates that same folder on the Windows Desktop, backs up an existing final HTML inside `Prethodne verzije`, and opens the application. It does not remove old Desktop files.

## Run

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm run dev
```

The server listens on port 3000 (`PORT` overrides it). Open it in a modern browser. Upload a browser-supported audio file or choose the demo, then press Play. Bass intensity drives isolated 25–180 Hz waveform energy, rapid kick detection, ring expansion, vibration, and outgoing shockwaves. The response has a fast attack at every smoothing setting; Motion smoothing controls the release only. The live bass meter shows detected low-frequency energy. Audio detail adds higher-frequency motion. Listening volume does not change the exported audio level.

## Export

Export records the complete track from its beginning in real time at 2560 × 1440, requesting 60 fps, 20 Mb/s video, and 385 kb/s audio. The browser chooses the actual encoding rates and may drop frames on slow machines. Keep the tab visible throughout the export. Audio bitrate is a requested target, not a guaranteed constant bitrate.

Chrome and Firefox generally export WebM with VP9/VP8 and Opus. MP4/AAC is used when supported instead. Unsupported browsers show an error. Cancel discards the in-progress recording. Export is held in memory until download, so very long tracks may require substantial RAM. For exact constant frame rate or mastering codec requirements, transcode the download with a dedicated video tool.

Fullscreen requires browser support and a user gesture. Font loading uses Google Fonts, with local sans-serif fallbacks when offline.

## Check

```sh
npm run check
```

This checks JavaScript syntax. To validate playback and export, run the demo in a browser, switch scenes and palettes, seek, adjust bass, then export the 16-second demo and confirm the downloaded video includes audio.
