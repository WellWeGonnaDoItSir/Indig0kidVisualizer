export function createStudio({ toast, getColor }) {
  const $ = id => document.getElementById(id);
  const artwork = { background: null, cover: null };
  const versions = { background: 0, cover: 0 };
  const pending = new Set();
  const customAssets = new Map();
  const fonts = new Map([
    ['grotesk', '"Space Grotesk", Arial, sans-serif'], ['dm', '"DM Sans", Arial, sans-serif'],
    ['bebas', '"Bebas Neue", Impact, sans-serif'], ['montserrat', 'Montserrat, Arial, sans-serif'],
    ['orbitron', 'Orbitron, "Courier New", monospace'], ['playfair', '"Playfair Display", Georgia, serif'],
    ['arial', 'Arial, sans-serif'], ['impact', 'Impact, sans-serif'], ['georgia', 'Georgia, serif'], ['mono', '"Courier New", monospace']
  ]);
  let nextLayer = 1, customFont = 0, selected = 1, locked = false;
  const newLayer = () => ({ id: nextLayer++, text: '', font: 'grotesk', color: '#ffffff', size: 72, align: 'center', x: 50, y: 80, spacing: 2, bold: true, italic: false, shadow: true });
  const layers = [newLayer()];
  const active = () => layers.find(layer => layer.id === selected);
  const tracked = task => { pending.add(task); task.finally(() => pending.delete(task)); return task; };
  const cleanImage = () => Object.values(artwork).forEach(asset => asset?.bitmap?.close?.());
  window.addEventListener('pagehide', cleanImage, { once: true });

  async function loadImage(kind, file) {
    if (!file || locked) return;
    if (!/^image\/(png|jpeg|webp|avif)$/i.test(file.type)) { toast('Za slike koristi PNG, JPG, WEBP ili AVIF.'); return; }
    if (file.size > 25 * 1024 * 1024) { toast('Slika je prevelika. Izaberi fajl manji od 25 MB.'); return; }
    const version = ++versions[kind], url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (version !== versions[kind]) return;
      const factor = Math.min(1, 2560 / Math.max(image.naturalWidth, image.naturalHeight));
      const bitmap = document.createElement('canvas'); bitmap.width = Math.max(1, Math.round(image.naturalWidth * factor)); bitmap.height = Math.max(1, Math.round(image.naturalHeight * factor));
      bitmap.getContext('2d').drawImage(image, 0, 0, bitmap.width, bitmap.height);
      artwork[kind] = { bitmap, name: file.name, file };
      const mini = document.createElement('canvas'); mini.width = 96; mini.height = 96;
      const side = Math.min(bitmap.width, bitmap.height); mini.getContext('2d').drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 96, 96);
      const thumbnail = new Image(); thumbnail.src = mini.toDataURL('image/jpeg', 0.7); thumbnail.alt = '';
      $(kind + '-preview').replaceChildren(thumbnail); $(kind + '-name').textContent = file.name; $('remove-' + kind).disabled = false;
      toast(kind === 'background' ? 'Pozadina je dodata — ulazi i u export.' : 'Cover art je dodat u centralni krug.');
    } catch { if (version === versions[kind]) toast('Slika nije mogla da se učita. Probaj PNG ili JPG.'); }
    finally { URL.revokeObjectURL(url); $(kind + '-file').value = ''; }
  }
  for (const kind of ['background', 'cover']) {
    $(kind + '-file').addEventListener('change', event => tracked(loadImage(kind, event.target.files[0])));
    $('remove-' + kind).addEventListener('click', () => {
      if (locked) return; versions[kind]++; artwork[kind] = null;
      $(kind + '-preview').textContent = kind === 'cover' ? 'ART' : 'BG';
      $(kind + '-name').textContent = kind === 'cover' ? 'Omot pesme u centru scene' : 'Tvoja slika, preko celog videa';
      $('remove-' + kind).disabled = true;
    });
  }
  for (const id of ['background-opacity', 'cover-size']) $(id).addEventListener('input', () => $(id + '-value').textContent = $(id).value + '%');
  document.querySelectorAll('.asset-upload').forEach(label => {
    label.tabIndex = 0; label.setAttribute('role', 'button');
    label.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!locked) label.querySelector('input')?.click(); } });
  });

  const fields = { font: 'text-font', color: 'text-color', size: 'text-size', align: 'text-align', x: 'text-x', y: 'text-y', spacing: 'text-spacing', bold: 'text-bold', italic: 'text-italic', shadow: 'text-shadow', text: 'overlay-text' };
  function syncEditor() {
    const layer = active();
    $('text-layer').replaceChildren(...layers.map((item, index) => { const option = new Option(`Text ${String(index + 1).padStart(2, '0')}`, String(item.id)); option.selected = item.id === selected; return option; }));
    for (const [key, id] of Object.entries(fields)) { if (typeof layer[key] === 'boolean') $(id).checked = layer[key]; else $(id).value = layer[key]; }
    for (const key of ['size', 'spacing', 'x', 'y']) $('text-' + key + '-value').textContent = layer[key] + (['size', 'spacing'].includes(key) ? ' px' : '%');
    $('text-position').value = layer.x === 50 ? ({ 15: 'top', 50: 'center', 80: 'bottom' }[layer.y] || 'custom') : 'custom';
    $('add-text').disabled = layers.length >= 5;
  }
  async function loadFont(layer) {
    try { await document.fonts.load(`${layer.italic ? 'italic ' : ''}${layer.bold ? '700' : '400'} 72px ${fonts.get(layer.font)}`); }
    catch { /* Local fallback fonts remain usable if the network font fails. */ }
  }
  for (const [key, id] of Object.entries(fields)) $(id).addEventListener('input', () => {
    if (locked) return;
    const layer = active(); layer[key] = typeof layer[key] === 'boolean' ? $(id).checked : typeof layer[key] === 'number' ? Number($(id).value) : $(id).value;
    if (['font', 'bold', 'italic'].includes(key)) tracked(loadFont({ ...layer }));
    if (['size', 'spacing', 'x', 'y'].includes(key)) $('text-' + key + '-value').textContent = layer[key] + (['size', 'spacing'].includes(key) ? ' px' : '%');
    if (['x', 'y'].includes(key)) $('text-position').value = 'custom';
  });
  $('text-layer').addEventListener('change', () => { selected = Number($('text-layer').value); syncEditor(); });
  $('add-text').addEventListener('click', () => {
    if (locked || layers.length >= 5) return;
    const layer = newLayer(); layer.y = [80, 86, 15, 21, 50][layers.length]; layer.size = layers.length === 1 ? 48 : 72;
    layers.push(layer); selected = layer.id; syncEditor(); $('overlay-text').focus();
  });
  $('remove-text').addEventListener('click', () => {
    if (locked) return;
    const index = layers.findIndex(layer => layer.id === selected); layers.splice(index, 1);
    if (!layers.length) layers.push(newLayer()); selected = layers[Math.min(index, layers.length - 1)].id; syncEditor();
  });
  $('text-position').addEventListener('change', () => {
    const y = { top: 15, center: 50, bottom: 80 }[$('text-position').value]; if (y === undefined) return;
    active().x = 50; active().y = y; syncEditor();
  });
  $('font-file').addEventListener('change', event => tracked((async () => {
    const file = event.target.files[0]; if (!file || locked) return;
    if (!/\.(ttf|otf|woff2?)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { toast('Izaberi TTF, OTF, WOFF ili WOFF2 font manji od 10 MB.'); return; }
    if ([...fonts.keys()].filter(key => key.startsWith('custom-')).length >= 10) { toast('Možeš ubaciti do 10 svojih fontova.'); return; }
    try {
      const id = `custom-${++customFont}`, family = `Indig0kidCustom${customFont}`;
      const face = new FontFace(family, await file.arrayBuffer()); await face.load(); document.fonts.add(face);
      fonts.set(id, `"${family}", Arial, sans-serif`); $('text-font').add(new Option(file.name.replace(/\.[^.]+$/, '') + ' · moj font', id));
      customAssets.set(id, { name: file.name, blob: file, face });
      active().font = id; syncEditor(); toast('Tvoj font je učitan i biće korišćen u exportu.');
    } catch { toast('Font nije moguće učitati. Probaj drugi TTF ili WOFF2 fajl.'); }
    finally { $('font-file').value = ''; }
  })()));
  syncEditor();

  function drawBackground(ctx, width, height) {
    const image = artwork.background?.bitmap; if (!image) return;
    const scale = Math.max(width / image.width, height / image.height);
    ctx.save(); ctx.globalAlpha = Number($('background-opacity').value) / 100;
    ctx.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale); ctx.restore();
  }
  function drawCover(ctx, intensity, impact) {
    const image = artwork.cover?.bitmap; if (!image) return;
    const pulse = $('cover-pulse').checked ? 1 + intensity * 0.09 + impact * 0.055 : 1;
    const radius = Number($('cover-size').value) * 2.5 * pulse;
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0a0910'; ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    const side = Math.min(image.width, image.height);
    ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, -radius, -radius, radius * 2, radius * 2); ctx.restore();
    if ($('cover-border').checked) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, radius + 3, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${getColor().join(',')},${0.55 + Math.min(0.4, impact * 0.3)})`; ctx.lineWidth = 1.2 + Math.min(1, impact); ctx.stroke(); ctx.restore(); }
  }
  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    for (const paragraph of text.split('\n')) {
      if (!paragraph.trim()) { lines.push(''); continue; }
      let line = '';
      for (const word of paragraph.trim().split(/\s+/)) {
        const candidate = line ? line + ' ' + word : word;
        if (ctx.measureText(candidate).width <= maxWidth) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        for (const character of Array.from(word)) {
          if (line && ctx.measureText(line + character).width > maxWidth) { lines.push(line); line = ''; }
          line += character;
        }
      }
      lines.push(line);
    }
    return lines;
  }
  function drawText(ctx, width, height) {
    for (const layer of layers) {
      if (!layer.text.trim()) continue;
      ctx.save(); let size = layer.size * height / 1440, lines;
      const configure = () => {
        ctx.font = `${layer.italic ? 'italic ' : ''}${layer.bold ? '700' : '400'} ${size}px ${fonts.get(layer.font)}`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = `${layer.spacing * height / 1440}px`;
      };
      for (let attempt = 0; attempt < 8; attempt++) { configure(); lines = wrapText(ctx, layer.text, width * 0.86); if (lines.length * size * 1.28 <= height * 0.86) break; size *= 0.8; }
      const lineHeight = size * 1.28, blockHeight = lines.length * lineHeight;
      const textWidth = Math.min(width * 0.86, Math.max(...lines.map(line => ctx.measureText(line).width), 0));
      const padding = width * 0.035;
      const xMin = layer.align === 'left' ? padding : layer.align === 'right' ? padding + textWidth : padding + textWidth / 2;
      const xMax = layer.align === 'left' ? width - padding - textWidth : layer.align === 'right' ? width - padding : width - padding - textWidth / 2;
      const x = Math.max(xMin, Math.min(xMax, width * layer.x / 100));
      const centerY = Math.max(height * 0.04 + blockHeight / 2, Math.min(height * 0.96 - blockHeight / 2, height * layer.y / 100));
      ctx.textAlign = layer.align; ctx.textBaseline = 'middle'; ctx.fillStyle = layer.color;
      if (layer.shadow) { ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = height * 0.006; ctx.shadowOffsetY = height * 0.0015; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = Math.max(0.5, height / 1440 * 3); ctx.lineJoin = 'round'; }
      lines.forEach((line, index) => { const y = centerY - (lines.length - 1) * lineHeight / 2 + index * lineHeight; if (layer.shadow) ctx.strokeText(line, x, y); ctx.fillText(line, x, y); });
      ctx.restore();
    }
  }
  return {
    drawBackground, drawCover, drawText,
    async snapshot(assets) {
      await Promise.all([...pending]);
      const add = (name, blob) => { const index = assets.length; assets.push({ name, blob }); return index; };
      return {
        images: Object.fromEntries(Object.entries(artwork).map(([kind, asset]) => [kind, asset ? add(asset.name, asset.file) : null])),
        customFonts: [...customAssets].map(([id, asset]) => ({ id, asset: add(asset.name, asset.blob) })),
        layers: layers.map(layer => ({ ...layer })), selected,
        settings: { opacity: Number($('background-opacity').value), coverSize: Number($('cover-size').value), pulse: $('cover-pulse').checked, border: $('cover-border').checked }
      };
    },
    async prepareRestore(state, assets) {
      const fail = () => { throw new Error('Save sadrži neispravna artwork/text podešavanja.'); };
      const range = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
      const assetAt = index => { if (!Number.isInteger(index) || !assets[index]) fail(); return assets[index]; };
      if (!state || !state.images || !Array.isArray(state.customFonts) || state.customFonts.length > 10 || !Array.isArray(state.layers) || state.layers.length < 1 || state.layers.length > 5 || !state.settings) fail();
      const settings = state.settings;
      if (!range(settings.opacity, 0, 100) || !range(settings.coverSize, 12, 45) || typeof settings.pulse !== 'boolean' || typeof settings.border !== 'boolean') fail();
      const restoredFonts = new Map(), restoredImages = {};
      for (const item of state.customFonts) {
        if (!item || typeof item.id !== 'string' || !/^custom-\d+$/.test(item.id) || restoredFonts.has(item.id)) fail();
        const asset = assetAt(item.asset); if (asset.blob.size > 10 * 1024 * 1024 || !/\.(ttf|otf|woff2?)$/i.test(asset.name)) fail();
        const family = `Indig0kidRestored${Date.now()}_${restoredFonts.size}`;
        const face = new FontFace(family, await asset.blob.arrayBuffer()); await face.load();
        restoredFonts.set(item.id, { ...asset, face, family });
      }
      const ids = new Set();
      for (const layer of state.layers) {
        if (!layer || !Number.isSafeInteger(layer.id) || layer.id < 1 || layer.id > 1000000 || ids.has(layer.id) || typeof layer.text !== 'string' || layer.text.length > 400 || typeof layer.font !== 'string' || !(restoredFonts.has(layer.font) || (fonts.has(layer.font) && !layer.font.startsWith('custom-'))) || !/^#[0-9a-f]{6}$/i.test(layer.color) || !range(layer.size, 24, 180) || !range(layer.spacing, 0, 20) || !range(layer.x, 5, 95) || !range(layer.y, 5, 95) || !['left', 'center', 'right'].includes(layer.align) || ['bold', 'italic', 'shadow'].some(key => typeof layer[key] !== 'boolean')) fail();
        ids.add(layer.id);
      }
      if (!ids.has(state.selected)) fail();
      for (const kind of ['background', 'cover']) {
        if (state.images[kind] === null) { restoredImages[kind] = null; continue; }
        const asset = assetAt(state.images[kind]); if (!/^image\/(png|jpeg|webp|avif)$/i.test(asset.blob.type) || asset.blob.size > 25 * 1024 * 1024) fail();
        const url = URL.createObjectURL(asset.blob);
        try {
          const image = new Image(); image.src = url; await image.decode();
          const factor = Math.min(1, 2560 / Math.max(image.naturalWidth, image.naturalHeight));
          const bitmap = document.createElement('canvas'); bitmap.width = Math.max(1, Math.round(image.naturalWidth * factor)); bitmap.height = Math.max(1, Math.round(image.naturalHeight * factor)); bitmap.getContext('2d').drawImage(image, 0, 0, bitmap.width, bitmap.height);
          restoredImages[kind] = { bitmap, file: asset.blob, name: asset.name };
        } finally { URL.revokeObjectURL(url); }
      }
      // Commit only after every image, font and field has been validated/decoded.
      return () => {
        for (const [id, item] of customAssets) { document.fonts.delete(item.face); fonts.delete(id); }
        customAssets.clear(); [...$('text-font').options].filter(option => option.value.startsWith('custom-')).forEach(option => option.remove());
        for (const [id, item] of restoredFonts) { document.fonts.add(item.face); fonts.set(id, `"${item.family}", Arial, sans-serif`); customAssets.set(id, item); $('text-font').add(new Option(item.name.replace(/\.[^.]+$/, '') + ' · moj font', id)); }
        customFont = Math.max(0, ...[...restoredFonts.keys()].map(id => Number(id.slice(7))));
        for (const kind of ['background', 'cover']) {
          versions[kind]++; artwork[kind] = restoredImages[kind]; const item = artwork[kind];
          if (item) { const thumbnail = new Image(); thumbnail.src = item.bitmap.toDataURL('image/jpeg', 0.6); thumbnail.alt = ''; $(kind + '-preview').replaceChildren(thumbnail); $(kind + '-name').textContent = item.name; }
          else { $(kind + '-preview').textContent = kind === 'cover' ? 'ART' : 'BG'; $(kind + '-name').textContent = kind === 'cover' ? 'Omot pesme u centru scene' : 'Tvoja slika, preko celog videa'; }
          $('remove-' + kind).disabled = !item;
        }
        layers.splice(0, layers.length, ...state.layers.map(layer => Object.fromEntries(['id', ...Object.keys(fields)].map(key => [key, layer[key]]))));
        selected = state.selected; nextLayer = Math.max(...layers.map(layer => layer.id)) + 1;
        $('background-opacity').value = settings.opacity; $('cover-size').value = settings.coverSize; $('cover-pulse').checked = settings.pulse; $('cover-border').checked = settings.border;
        for (const id of ['background-opacity', 'cover-size']) $(id + '-value').textContent = $(id).value + '%'; syncEditor();
      };
    },
    setExporting(value) { locked = value; $('artwork-controls').disabled = value; $('text-controls').disabled = value; },
    async ready() { await Promise.all([...pending]); await Promise.all(layers.filter(layer => layer.text.trim()).map(loadFont)); await document.fonts.ready; }
  };
}
