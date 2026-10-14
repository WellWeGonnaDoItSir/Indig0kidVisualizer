import { SCENES, renderScene } from './scenes.js';
import { createStudio } from './studio.js';
import { SITE_CONFIG } from './site-config.js';
import { encodeProject, decodeProject } from './project.js';
const $ = id => document.getElementById(id);
const canvas = $('visual'), ctx = canvas.getContext('2d'), audio = $('audio');
if (SITE_CONFIG.donationUrl) {
  try {
    const destination = new URL(SITE_CONFIG.donationUrl);
    if (destination.protocol === 'https:' && !destination.username && !destination.password) {
      $('donate-link').href = destination.href; $('donation-panel').hidden = false;
    }
  } catch { /* Invalid or missing donation configuration never creates a dead payment link. */ }
}
const icons = {
  play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l14-8z"/></svg>',
  pause: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>',
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>'
};
$('play').innerHTML = icons.play;
$('export').querySelector('span').innerHTML = icons.arrow;
$('demo').innerHTML = `${icons.play}<span>Probaj sa demo zvukom</span><span>${icons.arrow}</span>`;
document.querySelectorAll('.scene i').forEach(el => el.innerHTML = icons.arrow);
const colors = { indigo: [167, 132, 255], mint: [104, 225, 205], rose: [244, 142, 185], amber: [244, 185, 105], ice: [205, 223, 255] };
let color = colors.indigo, scene = 'orbit', audioContext, analyser, bassAnalyser, bassSamples, source, gain, recordingDestination;
const studio = createStudio({ toast: message => toast(message), getColor: () => color });
let bins, fullSamples, bass = 0, detail = 0, url, title = '', trackBlob = null, trackName = '', projectBusy = false, exporting = false, recorder, chunks = [], exportStream;
let bassBaseline = 0, previousBass = 0, kick = 0, hitCooldown = 0, vibrationPhase = 0;
const shockwaves = [];
let toastTimer, lastTime = 0, elapsed = 0, exportCancelled = false, exportGeneration = 0, previousVolume = 0.8;
const stars = Array.from({ length: 110 }, (_, i) => ({ x: (Math.sin(i * 127.1) * 43758.5453) % 1, y: (Math.cos(i * 311.7) * 17358.313) % 1, size: 0.3 + (i % 4) * 0.23 }));
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 7000); }
function formatTime(seconds) { if (!Number.isFinite(seconds)) return '0:00'; return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
function setupAudio() {
  if (audioContext) return;
  audioContext = new AudioContext(); analyser = audioContext.createAnalyser(); analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.12;
  // Measure actual low-frequency waveform energy, rather than saturated dB bins.
  const highpass = audioContext.createBiquadFilter(), lowpass = audioContext.createBiquadFilter();
  highpass.type = 'highpass'; highpass.frequency.value = 25; highpass.Q.value = 0.707;
  lowpass.type = 'lowpass'; lowpass.frequency.value = 180; lowpass.Q.value = 0.707;
  bassAnalyser = audioContext.createAnalyser(); bassAnalyser.fftSize = 2048;
  bassSamples = new Float32Array(bassAnalyser.fftSize);
  const silent = audioContext.createGain(); silent.gain.value = 0;
  source = audioContext.createMediaElementSource(audio); gain = audioContext.createGain();
  recordingDestination = audioContext.createMediaStreamDestination();
  source.connect(analyser); analyser.connect(gain); gain.connect(audioContext.destination);
  source.connect(highpass); highpass.connect(lowpass); lowpass.connect(bassAnalyser);
  bassAnalyser.connect(silent); silent.connect(audioContext.destination);
  // Export the original audio level independently of the listening volume.
  analyser.connect(recordingDestination); gain.gain.value = Number($('volume').value);
  bins = new Uint8Array(analyser.frequencyBinCount);
  fullSamples = new Float32Array(analyser.fftSize);
}
async function play() {
  if (!audio.src) { await loadDemo(); }
  setupAudio(); await audioContext.resume(); await audio.play();
}
$('play').addEventListener('click', async () => { if (exporting) return; try { if (audio.paused) await play(); else audio.pause(); } catch { toast('Zvuk nije moguće pokrenuti. Probaj drugi audio fajl.'); } });
audio.addEventListener('play', () => { $('play').innerHTML = icons.pause; $('play').setAttribute('aria-label', 'Pause'); $('stage-state').textContent = 'AUDIO REACTIVE'; });
audio.addEventListener('pause', () => { $('play').innerHTML = icons.play; $('play').setAttribute('aria-label', 'Play'); if (!exporting) $('stage-state').textContent = 'PREVIEW MODE'; });
audio.addEventListener('loadedmetadata', () => { $('duration').textContent = formatTime(audio.duration); });
audio.addEventListener('timeupdate', () => { $('current-time').textContent = formatTime(audio.currentTime); $('seek').value = audio.duration ? audio.currentTime / audio.duration * 1000 : 0; if (exporting) $('export-status').textContent = `Export ${Math.floor(audio.currentTime / audio.duration * 100)}% · ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`; });
audio.addEventListener('ended', () => { if (exporting && recorder?.state === 'recording') recorder.stop(); });
audio.addEventListener('error', () => { toast('Ovaj audio format nije podržan. Probaj MP3 ili WAV.'); if (exporting) { exportCancelled = true; recorder?.stop(); } });
$('seek').addEventListener('input', () => { if (!exporting && Number.isFinite(audio.duration)) audio.currentTime = Number($('seek').value) / 1000 * audio.duration; });
$('volume').addEventListener('input', () => { if (gain) gain.gain.value = Number($('volume').value); $('mute').textContent = Number($('volume').value) ? '♫' : '×'; });
$('mute').addEventListener('click', () => { const value = Number($('volume').value); if (value) previousVolume = value; $('volume').value = value ? 0 : previousVolume; $('volume').dispatchEvent(new Event('input')); });
function setTrack(blob, name) {
  if (exporting) return;
  audio.pause(); bass = 0; detail = 0; bassBaseline = 0; previousBass = 0; kick = 0; hitCooldown = 0; shockwaves.length = 0;
  if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); audio.src = url; audio.load();
  trackBlob = blob; trackName = name;
  title = name.replace(/\.[^.]+$/, ''); $('track-title').textContent = title; $('track-subtitle').textContent = 'LOCAL AUDIO / READY TO PLAY'; $('current-time').textContent = '0:00'; $('duration').textContent = '0:00'; $('seek').value = 0;
}
async function loadFile(file) {
  if (!file || exporting || projectBusy) return;
  if (!file.type.startsWith('audio/') && !/\.(mp3|wav|flac|m4a|ogg|aac|aiff|opus)$/i.test(file.name)) { toast('Izaberi audio fajl.'); return; }
  setTrack(file, file.name); try { await play(); } catch { toast('Pesma je učitana. Pritisni Play ili probaj drugi format.'); }
}
$('audio-file').addEventListener('change', event => loadFile(event.target.files[0]));
const drop = $('drop-zone');
['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.remove('dragging'); }));
drop.addEventListener('drop', event => loadFile(event.dataTransfer.files[0]));
// A locally synthesized 16-second demo: no network, license, or audio asset required.
async function loadDemo() {
  const rate = 44100, length = rate * 16, data = new ArrayBuffer(44 + length * 2), view = new DataView(data);
  const str = (offset, value) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  str(0, 'RIFF'); view.setUint32(4, 36 + length * 2, true); str(8, 'WAVE'); str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, length * 2, true);
  const notes = [55, 55, 65.406, 49];
  for (let i = 0; i < length; i++) {
    const t = i / rate, beat = t % 0.5, note = notes[Math.floor(t / 4) % 4];
    const kick = Math.sin(2 * Math.PI * (45 * beat + 7 * (1 - Math.exp(-beat * 35)))) * Math.exp(-beat * 17) * 0.65;
    const sub = Math.sin(2 * Math.PI * note * t) * (0.22 + 0.08 * Math.sin(t * 2)) * Math.min(1, t) * Math.min(1, 16 - t);
    const pad = (Math.sin(2 * Math.PI * note * 4 * t) + Math.sin(2 * Math.PI * note * 6 * t)) * 0.045;
    const hat = Math.sin(t * 19231) * Math.sin(t * 17389) * Math.exp(-(t % 0.25) * 100) * 0.07;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, kick + sub + pad + hat)) * 32767, true);
  }
  setTrack(new Blob([data], { type: 'audio/wav' }), 'Indig0kid — Midnight demo');
}
$('demo').addEventListener('click', async () => { if (exporting) return; try { await loadDemo(); await play(); } catch { toast('Pritisni Play da pokreneš demo.'); } });
for (const id of ['bass', 'detail', 'smooth']) $(id).addEventListener('input', () => $(id + '-value').textContent = $(id).value + '%');
const sceneButtons = new Map();
const previewBins = Uint8Array.from({ length: 1024 }, (_, i) => Math.max(0, 160 - i * 0.45 + Math.sin(i * 0.14) * 65));
const previewSamples = Float32Array.from({ length: 1024 }, (_, i) => Math.sin(i * 0.08) * 0.4 * Math.exp(-(((i - 512) / 300) ** 2)));
function drawScenePreview(button) {
  const preview = button.querySelector('canvas'), c = preview.getContext('2d');
  c.fillStyle = '#0d0b15'; c.fillRect(0, 0, preview.width, preview.height);
  c.save(); c.translate(preview.width / 2, preview.height / 2); c.scale(preview.height / 500, preview.height / 500);
  renderScene(c, button.dataset.scene, { time: 2.3, intensity: 0.55, impact: 0.22, complexity: 0.45, phase: 2.1, color, width: preview.width / preview.height * 500, bins: previewBins, samples: previewSamples });
  c.restore();
}
for (const [index, preset] of SCENES.entries()) {
  const button = document.createElement('button'); button.className = 'scene'; button.dataset.scene = preset.id; button.dataset.category = preset.category;
  button.classList.toggle('selected', preset.id === scene); button.setAttribute('aria-pressed', String(preset.id === scene));
  button.setAttribute('aria-label', `${String(index + 1).padStart(2, '0')}. ${preset.name}, ${preset.mood}`);
  button.innerHTML = `<canvas class="scene-art scene-thumbnail" width="300" height="160" aria-hidden="true"></canvas><span><strong>${preset.name}</strong><small>${String(index + 1).padStart(2, '0')} / ${preset.mood}</small></span><i>${icons.arrow}</i>`;
  button.addEventListener('click', () => {
    scene = preset.id;
    for (const b of sceneButtons.values()) { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }
    $('scene-name').textContent = `${String(index + 1).padStart(2, '0')} / ${preset.name.toUpperCase()}`;
    $('scene-current').textContent = preset.name;
  });
  sceneButtons.set(preset.id, button); $('scene-gallery').append(button); drawScenePreview(button);
}
document.querySelectorAll('.scene-filter').forEach(button => button.addEventListener('click', () => {
  for (const filter of document.querySelectorAll('.scene-filter')) { filter.classList.toggle('selected', filter === button); filter.setAttribute('aria-pressed', String(filter === button)); }
  let count = 0;
  for (const b of sceneButtons.values()) { b.hidden = button.dataset.category !== 'all' && b.dataset.category !== button.dataset.category; if (!b.hidden) count++; }
  $('scene-count').textContent = button.dataset.category === 'all' ? '20 SCENES' : `${String(count).padStart(2, '0')} / 20 SCENES`;
  $('scene-gallery').scrollTop = 0;
}));
document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => { color = colors[button.dataset.color]; $('palette-name').textContent = button.dataset.color.toUpperCase(); for (const b of sceneButtons.values()) drawScenePreview(b); document.querySelectorAll('.swatch').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); }));
$('fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('stage').requestFullscreen(); } catch { toast('Fullscreen nije dostupan u ovom browseru.'); } });
const savedRanges = ['bass', 'detail', 'smooth', 'volume'];
const savedToggles = ['particles', 'show-title'];
function projectLock(value, message = '') {
  projectBusy = value; document.querySelector('main').inert = value; studio.setExporting(value);
  $('project-progress').hidden = !value; $('project-progress').textContent = message;
}
$('save-project').addEventListener('click', async () => {
  if (exporting || projectBusy) return;
  const wasPlaying = !audio.paused; audio.pause(); projectLock(true, 'Saving your project…');
  try {
    let handle;
    const fileName = `${(title || 'Indig0kid-project').replace(/[^\p{L}\p{N}\s_-]/gu, '').slice(0, 80)}.indig0kid`;
    if (window.showSaveFilePicker) {
      try { handle = await window.showSaveFilePicker({ suggestedName: fileName, startIn: 'desktop', types: [{ description: 'Indig0kid project', accept: { 'application/octet-stream': ['.indig0kid'] } }] }); }
      catch (error) { if (error.name === 'AbortError') return; if (!['SecurityError', 'NotAllowedError'].includes(error.name)) throw error; }
    }
    const assets = []; const artwork = await studio.snapshot(assets);
    const audioIndex = trackBlob ? assets.push({ name: trackName, blob: trackBlob }) - 1 : null;
    const state = { scene, palette: $('palette-name').textContent.toLowerCase(), controls: Object.fromEntries(savedRanges.map(id => [id, Number($(id).value)])), toggles: Object.fromEntries(savedToggles.map(id => [id, $(id).checked])), position: audio.currentTime || 0, elapsed, phase: vibrationPhase, audio: audioIndex, studio: artwork };
    const blob = encodeProject(state, assets);
    if (handle) { const stream = await handle.createWritable(); try { await stream.write(blob); await stream.close(); } catch (error) { await stream.abort().catch(() => {}); throw error; } toast('Projekat je sačuvan na mestu koje si izabrao.'); }
    else { const link = document.createElement('a'), download = URL.createObjectURL(blob); link.href = download; link.download = fileName; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(download), 60000); toast('Save fajl je preuzet. Proveri Downloads ili folder koji si izabrao.'); }
  } catch (error) { toast('Save nije uspeo: ' + error.message); }
  finally { projectLock(false); if (wasPlaying) audio.play().catch(() => {}); }
});
async function validateSavedAudio(asset) {
  if (!asset) return;
  if (!asset.blob.size || !(asset.blob.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg|aac|aiff|opus)$/i.test(asset.name))) throw new Error('Save sadrži neispravan audio fajl.');
  const probe = new Audio(), testUrl = URL.createObjectURL(asset.blob);
  try { await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Audio iz save fajla nije moguće učitati.')), 15000); probe.onloadedmetadata = () => { clearTimeout(timeout); Number.isFinite(probe.duration) && probe.duration > 0 ? resolve() : reject(new Error('Audio nije podržan.')); }; probe.onerror = () => { clearTimeout(timeout); reject(new Error('Audio iz save fajla nije podržan.')); }; probe.src = testUrl; probe.load(); }); }
  finally { probe.removeAttribute('src'); probe.load(); URL.revokeObjectURL(testUrl); }
}
$('import-project').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file || exporting || projectBusy) return;
  const wasPlaying = !audio.paused; audio.pause(); projectLock(true, 'Restoring your project…'); let applied = false;
  try {
    await studio.ready(); const { state, assets } = await decodeProject(file);
    const finite = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
    if (!SCENES.some(preset => preset.id === state.scene) || !Object.hasOwn(colors, state.palette) || !state.controls || !state.toggles || savedRanges.some(id => !finite(state.controls[id], 0, id === 'volume' ? 1 : 100)) || savedToggles.some(id => typeof state.toggles[id] !== 'boolean') || !finite(state.position, 0, 86400 * 7) || !finite(state.elapsed, 0, 1e9) || !finite(state.phase, 0, 1e12) || (state.audio !== null && (!Number.isInteger(state.audio) || !assets[state.audio]))) throw new Error('Save sadrži neispravna podešavanja.');
    await validateSavedAudio(state.audio === null ? null : assets[state.audio]);
    const applyArtwork = await studio.prepareRestore(state.studio, assets);
    applyArtwork();
    document.querySelector('.scene-filter[data-category="all"]').click(); sceneButtons.get(state.scene).click(); document.querySelector(`.swatch[data-color="${state.palette}"]`).click();
    for (const id of savedRanges) { $(id).value = state.controls[id]; $(id).dispatchEvent(new Event('input')); }
    for (const id of savedToggles) $(id).checked = state.toggles[id];
    elapsed = state.elapsed; vibrationPhase = state.phase; bass = 0; kick = 0; detail = 0; shockwaves.length = 0;
    if (state.audio !== null) {
      const asset = assets[state.audio];
      audio.addEventListener('loadedmetadata', () => { audio.currentTime = Math.min(state.position, audio.duration); $('current-time').textContent = formatTime(audio.currentTime); $('seek').value = audio.currentTime / audio.duration * 1000; }, { once: true });
      setTrack(asset.blob, asset.name);
    } else { audio.removeAttribute('src'); audio.load(); if (url) URL.revokeObjectURL(url); url = null; trackBlob = null; trackName = ''; title = ''; $('track-title').textContent = 'No track selected'; $('track-subtitle').textContent = 'Ubaci pesmu ili poslušaj demo'; $('current-time').textContent = '0:00'; $('duration').textContent = '0:00'; $('seek').value = 0; }
    applied = true; toast('Projekat je vraćen — pesma, slike, fontovi i podešavanja. Pritisni Play da nastaviš.');
  } catch (error) { toast('Import nije uspeo. Postojeći projekat je sačuvan. ' + error.message); }
  finally { event.target.value = ''; projectLock(false); if (!applied && wasPlaying) audio.play().catch(() => {}); }
});
document.querySelector('.import-button').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!projectBusy && !exporting) $('import-project').click(); } });
const rgb = (alpha = 1) => `rgba(${color.join(',')},${alpha})`;
function resize() { if (exporting) return; const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); }
new ResizeObserver(resize).observe($('stage'));
function readSound(dt) {
  let b = 0, d = 0;
  if (analyser && !audio.paused) {
    analyser.getByteFrequencyData(bins);
    analyser.getFloatTimeDomainData(fullSamples);
    bassAnalyser.getFloatTimeDomainData(bassSamples);
    let energy = 0;
    for (const sample of bassSamples) energy += sample * sample;
    const rms = Math.sqrt(energy / bassSamples.length);
    b = Math.min(1.4, Math.max(0, rms - 0.002) * 4.8);
    for (let i = 8; i < 180; i++) d += bins[i] / 255;
    d /= 172;
  }
  const smoothing = Number($('smooth').value) / 100;
  // Fast attack is independent of smoothing. The slider controls the release.
  const attack = 1 - Math.exp(-dt / 0.012);
  const release = 1 - Math.exp(-dt / (0.045 + smoothing * 0.13));
  bass += (b - bass) * (b > bass ? attack : release);
  detail += (d - detail) * (1 - Math.exp(-dt / 0.065));
  bassBaseline += (b - bassBaseline) * (1 - Math.exp(-dt / 0.6));
  hitCooldown = Math.max(0, hitCooldown - dt);
  const rise = Math.max(0, b - previousBass);
  if (b > 0.1 && rise > 0.025 && b > bassBaseline * 1.12 && !hitCooldown) {
    kick = Math.min(1.5, 0.3 + rise * 5 + Math.max(0, b - bassBaseline) * 0.8);
    hitCooldown = 0.12;
    if (Number($('bass').value) > 0) shockwaves.push({ age: 0, strength: kick });
    if (shockwaves.length > 6) shockwaves.shift();
  } else kick *= Math.exp(-dt / 0.11);
  previousBass = b;
  $('bass-level').style.width = `${Math.min(100, b * 100)}%`;
}
function draw(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0.016, 0.1); lastTime = now; elapsed += dt; readSound(dt);
  const w = canvas.width, h = canvas.height; if (!w || !h) { requestAnimationFrame(draw); return; }
  ctx.fillStyle = '#08090f'; ctx.fillRect(0, 0, w, h);
  studio.drawBackground(ctx, w, h);
  const drive = Number($('bass').value) / 100;
  const intensity = Math.min(1.5, bass * drive * (0.65 + drive * 1.4));
  const impact = Math.min(1.5, kick * drive * (0.7 + drive));
  const complexity = detail * Number($('detail').value) / 100;
  vibrationPhase += dt * (18 + intensity * 42);
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.51, 0, w * 0.5, h * 0.51, h * 0.75);
  glow.addColorStop(0, rgb(Math.min(0.65, 0.04 + intensity * 0.16 + impact * 0.2))); glow.addColorStop(0.5, rgb(0.025 + intensity * 0.055)); glow.addColorStop(1, 'rgba(8,9,15,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  if ($('particles').checked) for (const star of stars) { const x = ((star.x + elapsed * 0.002) % 1 + 1) % 1 * w, y = ((star.y + elapsed * 0.003) % 1 + 1) % 1 * h; ctx.fillStyle = rgb(0.1 + 0.3 * Math.abs(Math.sin(elapsed * 0.3 + star.x * 25)) + intensity * 0.2); ctx.beginPath(); ctx.arc(x, y, star.size * w / 900, 0, Math.PI * 2); ctx.fill(); }
  ctx.save(); ctx.translate(w / 2, h / 2); const scale = h / 500; ctx.scale(scale, scale);
  const shake = intensity * 4 + impact * 7;
  ctx.translate(Math.sin(vibrationPhase * 1.7) * shake, Math.cos(vibrationPhase * 1.31) * shake * 0.7);
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const wave = shockwaves[i]; wave.age += dt;
    if (wave.age > 0.65) { shockwaves.splice(i, 1); continue; }
    ctx.beginPath(); ctx.arc(0, 0, 130 + wave.age * 190 + wave.strength * 15, 0, Math.PI * 2);
    ctx.strokeStyle = rgb(Math.max(0, (1 - wave.age / 0.65) * wave.strength * drive * 0.35)); ctx.lineWidth = 1.5; ctx.stroke();
  }
  renderScene(ctx, scene, { time: elapsed, intensity, impact, complexity, phase: vibrationPhase, color, width: w / scale, bins: audio.paused ? null : bins, samples: audio.paused ? null : fullSamples });
  studio.drawCover(ctx, intensity, impact);
  ctx.restore(); ctx.shadowBlur = 0;
  // Only the optional audio title and user-added artwork/text are drawn into the video.
  ctx.fillStyle = 'rgba(201,188,223,.55)'; ctx.font = `${Math.max(9, h * 0.019)}px sans-serif`; ctx.textAlign = 'center';
  if ($('show-title').checked && title) { ctx.fillStyle = 'rgba(185,170,211,.65)'; ctx.font = `${Math.max(8, h * 0.016)}px sans-serif`; ctx.fillText(title, w / 2, h * 0.935, w * 0.7); }
  studio.drawText(ctx, w, h);
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
const exportTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4;codecs=avc1.42002A,mp4a.40.2', 'video/mp4'];
const mime = typeof MediaRecorder !== 'undefined' ? exportTypes.find(type => MediaRecorder.isTypeSupported(type)) : undefined;
$('format').textContent = mime?.includes('mp4') ? 'MP4 / AAC' : 'WEBM / OPUS';
function lockExport(lock) { exporting = lock; studio.setExporting(lock); ['play', 'seek', 'demo', 'audio-file', 'export', 'save-project', 'import-project'].forEach(id => $(id).disabled = lock); $('export-overlay').hidden = !lock; $('stage-state').textContent = lock ? 'RENDERING / 1440P' : 'PREVIEW MODE'; }
$('export').addEventListener('click', async () => {
  if (exporting) return;
  if (!audio.src) { toast('Prvo ubaci pesmu ili izaberi demo.'); return; }
  if (!mime || !canvas.captureStream) { toast('Ovaj browser ne podržava video export. Koristi noviji Chrome ili Firefox.'); return; }
  if (!Number.isFinite(audio.duration) || !audio.duration) { toast('Sačekaj da se pesma učita ili probaj drugi format.'); return; }
  const generation = ++exportGeneration; exportCancelled = false; recorder = null; chunks = []; exportStream = null;
  try {
    lockExport(true); $('export-status').textContent = 'Priprema slika i fontova…'; await studio.ready();
    if (generation !== exportGeneration || !exporting) return;
    setupAudio(); await audioContext.resume(); audio.pause(); audio.currentTime = 0;
    lockExport(true); canvas.width = 2560; canvas.height = 1440; exportCancelled = false; chunks = [];
    exportStream = canvas.captureStream(60); recordingDestination.stream.getAudioTracks().forEach(track => exportStream.addTrack(track));
    recorder = new MediaRecorder(exportStream, { mimeType: mime, videoBitsPerSecond: 20000000, audioBitsPerSecond: 385000 });
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { exportCancelled = true; toast('Export nije uspeo. Probaj kraću pesmu ili drugi browser.'); if (recorder.state !== 'inactive') recorder.stop(); else finishExport(); };
    recorder.onstop = finishExport;
    recorder.start(1000); await audio.play();
    $('export-status').textContent = 'Export 0% · rendering in real time';
    toast('Export je počeo. Ostavi ovu karticu aktivnom do kraja pesme.');
  } catch (error) {
    exportCancelled = true;
    if (recorder?.state === 'recording') recorder.stop(); else finishExport();
    toast('Export nije moguće pokrenuti: ' + error.message);
  }
});
function finishExport() {
  exportGeneration++;
  audio.pause(); exportStream?.getVideoTracks().forEach(track => track.stop());
  if (!exportCancelled && chunks.length) {
    const blob = new Blob(chunks, { type: recorder.mimeType }), downloadUrl = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = downloadUrl; a.download = `${(title || 'Indig0kid').replace(/[^\p{L}\p{N}\s_-]/gu, '').slice(0, 80)}-1440p60.${recorder.mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    toast('Video je spreman: 2560 × 1440, cilj 60 fps i audio 385 kb/s.');
  }
  chunks = []; lockExport(false); resize();
}
$('cancel-export').addEventListener('click', () => { exportCancelled = true; if (recorder?.state === 'recording') recorder.stop(); else finishExport(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && exporting) toast('Vrati se na ovu karticu: browser može usporiti video u pozadini.'); });
