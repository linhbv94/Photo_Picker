import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('Windows production JPEG rotation and recovery support Unicode paths', { skip: process.platform !== 'win32' }, () => {
  const result = spawnSync('cargo', ['test', '--locked', '--manifest-path', 'src-tauri/Cargo.toml', '--lib', 'rotate_and_undo_restore_original_bytes', '--', '--exact', 'commands::file_safety_tests::rotate_and_undo_restore_original_bytes'], {
    encoding: 'utf8', windowsHide: true, timeout: 600000,
  });
  assert.equal(result.status, 0, `${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1 passed/);
});
