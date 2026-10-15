# Indig0kid Visual Studio

A local, bass-reactive music visualizer with 20 animated scenes, color palettes, fullscreen playback, and video export. Audio files stay in the browser. Includes a locally generated demo track.

## Publish the free website

`npm ci` installs the locked Vite development dependencies. `npm run build` produces the production website in `dist/`, using the GitHub Pages base path `/Indig0kidVisualizer/` configured in `vite.config.js`. Both the application and privacy page are built; source scripts, Desktop installers, user media, repository metadata and secrets are excluded.

The `.github/workflows/deploy-pages.yml` workflow runs on pushes to `main` and supports manual dispatch. It installs dependencies with `npm ci`, validates the JavaScript and project-save tests, runs `npm run build`, uploads only `dist/`, and deploys the artifact with GitHub Pages. Deployment uses the workflow's automatic token and does not require payment keys or a personal token in source. In repository **Settings → Pages**, select **GitHub Actions** as the build/deployment source. A successful push is not proof of a live website: check the workflow deployment result. The intended URL is `https://wellwegonnadoitsir.github.io/Indig0kidVisualizer/`. Private repositories may require a GitHub plan that supports Pages; repository visibility is preserved.

All visualizer functions remain free. To activate the optional **Donate 1$ if you want 😄** link, set `donationUrl` in `site-config.js` to the owner's actual public HTTPS payment page and republish. Without a real link the header button remains visible as a disabled placeholder with a “coming soon” tooltip; it does not initiate a payment. Never store card numbers, bank-account numbers, passwords, or payment API keys in this public configuration. Payment is handled entirely by the external provider; its fees and supported amounts apply. There are no paywalls or payment forms in the application.

## Save and resume without an account

Save project writes one `.indig0kid` file containing the original audio, background, cover, uploaded fonts, text layers, scene, palette, bass/motion controls, listening volume, toggles, and playback position. Import save restores it after closing the browser or visiting the site again. Playback resumes paused at the saved position; press Play to continue. There are no accounts or email logins.

On browsers supporting the File System Access API, the save dialog starts at Desktop and lets the user choose a destination. Other browsers download the file to their configured Downloads folder. The app cannot silently write to a Desktop path. Project files are local and support up to 512 MB; they contain the user's media and should be shared accordingly. Corrupt or unsupported saves are validated before replacing the existing project.

## Artwork and typography

The centered header keeps branding outside the video. A tabbed inspector groups Audio, Visuals (bass/motion/palette), Artwork, and Text controls beside the preview on desktop, with responsive placement below it on smaller screens. All settings remain available; switching tabs does not interrupt playback or reset the project.

The artwork editor adds a full-frame background and a circular cover in the center of any scene. Upload PNG, JPEG, WEBP, or AVIF (up to 25 MB); decoded images are capped at 2560 pixels on their longest edge to limit memory. Backgrounds fill the frame with a centered crop. Covers use a centered square crop inside a circle. Adjust background visibility and cover diameter; optional cover pulse follows bass, and the light ring uses the current palette. Remove buttons clear either image independently. A failed image replacement preserves the previous image.

The text editor supports five independent multiline layers with font, color, size, position, alignment, letter spacing, bold, italic, and shadow. Text wraps to the video bounds; font size is expressed in pixels at 1440p and scales with the preview. Very long text shrinks to fit. The ten offered fonts include local font families and optional Google Fonts with local fallbacks. Upload TTF, OTF, WOFF, or WOFF2 files (up to 10 MB, ten custom fonts per session) to use your own fonts without network access.

Background, cover, and text are drawn directly onto the recording canvas and appear in fullscreen and video exports. Export waits for pending image/font loads and locks scene selection, visual settings, artwork/text editing, format selection and project actions until finished or canceled. Listening volume, fullscreen and cancellation remain available. Disabled editor controls retain their previous state after cancellation or completion. Uploaded images, fonts, text, and audio stay in browser memory. Save project writes them to a local .indig0kid file; Import save restores them after reopening. They are not written to the application HTML or sent to a server.

## Scenes

The gallery has rendered static thumbnails, category filters, text search by scene name/mood/category, a matching-scene count, an empty state and a random visible scene picker. Each preset uses its own procedural renderer, reacts to the shared bass/kick engine, and works with all five color palettes. Selecting a style preserves audio playback. Scroll the gallery to explore all 20.

| Category | Presets |
| --- | --- |
| Cosmic | Indigo orbit, Hyperdrive, Solar eclipse, Stardust, Event horizon |
| Fluid | Silk waves, Liquid chrome, Satin ribbons, Spiral motion, Northern lights |
| Geometry | Cyber grid, Frequency hills, Double helix, Prism break, Sacred geometry |
| Electric | After hours, Bass crown, Pulse line, Signal error, Neon rain |

Visual direction was informed by the procedural preset approach documented in [projectM](https://github.com/projectM-visualizer/projectm) and [Butterchurn/MilkDrop](https://github.com/jberg/butterchurn). The renderers here are original Canvas scenes; no third-party presets or renderer libraries are bundled. These references describe established visualizer approaches, rather than a ranking of current trends.

## Studio guide and frame capture

Quick guide and the sidebar help button open an accessible modal with workflow steps and keyboard shortcuts. Space toggles playback, F opens fullscreen, / focuses scene search and ? opens the guide. Shortcuts do not intercept typing or focused interactive controls and are inactive during export/project operations. The footer FAQ explains local files, project saves and real-time recording.

The camera button downloads the current canvas as a PNG at its current preview resolution. It includes user artwork/text and no website interface; it does not promise a 1440p still. Video export always requests 2560 × 1440. An estimate based on the requested combined video/audio bitrate shows approximate download size and recording time; actual output size varies by encoder.

## Windows Desktop version

```sh
npm run desktop
```

Creates `desktop/Vizual Indig0kid.html` and `desktop/Azuriraj-Vizual-Indig0kid-Artwork.ps1`. The HTML bundles all application JavaScript and CSS and needs no local server or Node.js on the user's computer. Open it with Edge, Chrome, or Firefox. Online fonts are optional and have local fallbacks.

Users can copy the complete PowerShell script into PowerShell to create/update the HTML on their Windows Desktop. It preserves any existing `Vizual Indig0kid.html` as a timestamped backup before replacement. Node.js is only needed to build this distribution, not to use it. Cloud Chromium policy blocks direct `file://` navigation; standalone content is tested over an intercepted local HTTP response instead.

For the clearly named final distribution, run `npm run desktop:final`. This rebuilds the latest application and creates `desktop/Indig0kid Visual Final Program/Indig0kid Visual Final Program.html`, a short usage guide, and `desktop/Instaliraj-Indig0kid-Visual-Final-Program.ps1`. The installer creates that same folder on the Windows Desktop, backs up an existing final HTML inside `Prethodne verzije`, and opens the application. It does not remove old Desktop files.

## Run

Requires Node.js 22.12 or newer. Install development dependencies from the lockfile.

```sh
npm ci
npm run dev
```

Vite prints its local development address. Use `npm run dev -- --port 3000` to choose a port. Open it in a modern browser. Upload a browser-supported audio file or choose the demo, then press Play. Bass intensity drives isolated 25–180 Hz waveform energy, rapid kick detection, ring expansion, vibration, and outgoing shockwaves. The response has a fast attack at every smoothing setting; Motion smoothing controls the release only. The live bass meter shows detected low-frequency energy. Audio detail adds higher-frequency motion. Listening volume does not change the exported audio level.

## Export

The preview canvas is the recorded video surface. Indig0kid and Sound into form branding, status labels, fullscreen controls, and export progress stay outside it in the website interface. No permanent website watermark is drawn into either MP4 or WebM exports. The optional Track title toggle and user-added artist/song text, images, and covers are still included when enabled.

Export records the complete track from its beginning in real time at 2560 × 1440, requesting 60 fps, 20 Mb/s video, and 385 kb/s audio. The browser chooses the actual encoding rates and may drop frames on slow machines. Keep the tab visible throughout the export. Audio bitrate is a requested target, not a guaranteed constant bitrate.

Chrome and Firefox generally export WebM with VP9/VP8 and Opus. The format selector also offers MP4 when MediaRecorder reports support. The browser chooses supported codecs for generic MP4 fallback; AAC is not guaranteed. Browsers without recording support show an unavailable status and disable video export. Cancel discards the in-progress recording. Export is held in memory until download, so very long tracks may require substantial RAM. For exact constant frame rate or mastering codec requirements, transcode the download with a dedicated video tool.

Fullscreen requires browser support and a user gesture. Font loading uses Google Fonts, with local sans-serif fallbacks when offline.

## Check

```sh
npm run check
npm test
npm run build
```

This checks JavaScript syntax. To validate playback and export, run the demo in a browser, switch scenes and palettes, seek, adjust bass, then export the 16-second demo and confirm the downloaded video includes audio.
