const PROJECT_MAGIC = 'INDIG0K1';
const PROJECT_LIMIT = 512 * 1024 * 1024;
export function encodeProject(state, assets) {
  const manifest = { application: 'Indig0kid Visual', version: 1, state, assets: assets.map(asset => ({ name: asset.name, type: asset.blob.type, size: asset.blob.size })) };
  const json = new TextEncoder().encode(JSON.stringify(manifest));
  const header = new Uint8Array(12); header.set(new TextEncoder().encode(PROJECT_MAGIC)); new DataView(header.buffer).setUint32(8, json.length, true);
  const blob = new Blob([header, json, ...assets.map(asset => asset.blob)], { type: 'application/octet-stream' });
  if (blob.size > PROJECT_LIMIT) throw new Error('Projekat je prevelik. Save podržava najviše 512 MB.');
  return blob;
}
export async function decodeProject(file) {
  if (file.size < 12 || file.size > PROJECT_LIMIT) throw new Error('Save fajl nije validan ili je veći od 512 MB.');
  const header = await file.slice(0, 12).arrayBuffer();
  if (new TextDecoder().decode(new Uint8Array(header, 0, 8)) !== PROJECT_MAGIC) throw new Error('Ovo nije Indig0kid save fajl.');
  const size = new DataView(header).getUint32(8, true);
  if (!size || size > 2 * 1024 * 1024 || 12 + size > file.size) throw new Error('Save fajl je oštećen.');
  let manifest;
  try { manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await file.slice(12, 12 + size).arrayBuffer())); }
  catch { throw new Error('Save fajl je oštećen.'); }
  if (manifest.application !== 'Indig0kid Visual' || manifest.version !== 1 || !manifest.state || !Array.isArray(manifest.assets) || manifest.assets.length > 13) throw new Error('Ova verzija save fajla nije podržana.');
  const assets = []; let offset = 12 + size;
  for (const asset of manifest.assets) {
    if (!asset || typeof asset.name !== 'string' || asset.name.length > 1000 || typeof asset.type !== 'string' || asset.type.length > 100 || !Number.isSafeInteger(asset.size) || asset.size < 0 || offset + asset.size > file.size) throw new Error('Save sadrži neispravne fajlove.');
    assets.push({ name: asset.name, blob: file.slice(offset, offset + asset.size, asset.type) }); offset += asset.size;
  }
  if (offset !== file.size) throw new Error('Save fajl ima neispravan sadržaj.');
  return { state: manifest.state, assets };
}
