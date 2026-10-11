// Regression: desktop truyền lỗi thật; VM kiểm chứng bridge, không thay native E2E.
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/services/tauriApi.ts', import.meta.url), 'utf8');
const code = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, ''), { mode: 'strip' })
  .replaceAll("import('@tauri-apps/api/core')", 'Promise.resolve(nativeStub)')
  .replaceAll('export ', '');
const context = vm.createContext({
  window: { __TAURI_INTERNALS__: {} },
  console: { warn() {}, log() {} }, Date,
  nativeStub: { async invoke() { throw new Error('FORCED_NATIVE_FAILURE'); } },
});
vm.runInContext(code + '\nglobalThis.api = tauriApi;', context);
const api = context.api;
const cases = [
  ['rotate', () => api.rotateLossless(['/fixture/a.jpg'], 90, 'token')],
  ['rename', () => api.applyBatchRename([{ original_path: '/fixture/a.jpg', new_path: '/fixture/b.jpg' }])],
  ['trash', () => api.moveToTrash(['/fixture/a.jpg'], 'token')],
  ['create_subfolder', () => api.createSubfolder('/fixture', 'new')],
  ['read_directory', () => api.readDirectory('/fixture')],
  ['preview_rename', () => api.previewBatchRename(['/fixture/a.jpg'])],
  ['preview_operation', () => api.previewFileOperation(['/fixture/a.jpg'], 'MOVE', '/fixture/dest')],
  ['move_copy', () => api.moveOrCopyFiles(['/fixture/a.jpg'], '/fixture/dest', 'MOVE', 'token')],
  ['list_recovery', () => api.listRecovery('/fixture')],
  ['restore', () => api.restoreOperation('/fixture/journal.jsonl')],
];
for (const [name, call] of cases) {
  await assert.rejects(call(), /FORCED_NATIVE_FAILURE/);
  console.log(`PASS: ${name} truyền lỗi native; không success giả`);
}
