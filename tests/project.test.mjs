import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeProject, decodeProject } from '../project.js';

test('save preserves Unicode settings and original binary media without conversion', async () => {
  const state = { text: 'Ćao 🌒\nIndig0kid', position: 123.456, scene: 'orbit' };
  const bytes = new Uint8Array([0, 255, 128, 1, 0, 254]);
  const save = encodeProject(state, [{ name: 'pesma.wav', blob: new Blob([bytes], { type: 'audio/wav' }) }, { name: 'cover.png', blob: new Blob([bytes], { type: 'image/png' }) }]);
  const restored = await decodeProject(save);
  assert.deepEqual(restored.state, state);
  assert.equal(restored.assets[0].name, 'pesma.wav');
  assert.equal(restored.assets[0].blob.type, 'audio/wav');
  assert.equal(restored.assets[1].blob.type, 'image/png');
  for (const asset of restored.assets) assert.deepEqual(new Uint8Array(await asset.blob.arrayBuffer()), bytes);
});

test('truncated and unrelated files are rejected instead of partially restored', async () => {
  const save = encodeProject({ scene: 'wave' }, [{ name: 'audio.mp3', blob: new Blob(['audio bytes'], { type: 'audio/mpeg' }) }]);
  await assert.rejects(() => decodeProject(save.slice(0, -1)));
  await assert.rejects(() => decodeProject(new Blob([save, 'unexpected trailing bytes'])));
  await assert.rejects(() => decodeProject(new Blob(['not an Indig0kid project'])));
});

test('a project without media can be saved and reopened', async () => {
  const state = { scene: 'blackhole', audio: null, text: 'Preset only' };
  const restored = await decodeProject(encodeProject(state, []));
  assert.deepEqual(restored.state, state);
  assert.deepEqual(restored.assets, []);
});
