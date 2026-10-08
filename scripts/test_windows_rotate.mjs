import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('Windows rotation handles Unicode/quoted paths and releases the original image file', { skip: process.platform !== 'win32' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'vx_rotate_'));
  try {
    const path = join(dir, "ảnh tiếng Việt # % ' thử.png");
    // Two RGB pixels: red and blue, 2x1 PNG.
    writeFileSync(path, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAADUlEQVR4nGP4zwAE/wEHAAH/4iOeWQAAAABJRU5ErkJggg==', 'base64'));
    const source = readFileSync('src-tauri/src/commands/rotate.rs', 'utf8');
    const raw = source.match(/let script = format!\([\s\S]*?r#"([\s\S]*?)"#,/);
    assert.ok(raw, 'The test must execute the current rotation script');
    const script = raw[1].replace('{}', 'Rotate90FlipNone').replaceAll('{{', '{').replaceAll('}}', '}');
    const result = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script], {
      input: `${path}\n`, encoding: 'utf8', windowsHide: true, timeout: 90000,
    });
    assert.equal(result.status, 0, `${result.error ?? ''}\n${result.stderr}`);
    const rotated = readFileSync(path);
    assert.equal(rotated.readUInt32BE(16), 1, 'Rotated image width');
    assert.equal(rotated.readUInt32BE(20), 2, 'Rotated image height');
    // This fails on Windows if GDI+ still holds the original file open.
    rmSync(path);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
