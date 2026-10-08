import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { assetPrefix } from './release_layout.mjs';

const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const repo = new URL(config.plugins.updater.endpoints[0]).pathname.split('/').slice(1, 3).join('/');
const tag = `v${config.version}`;
const assets = [
  { id: 1, name: 'app_arm.app.tar.gz', size: 100 },
  { id: 2, name: 'app_x64.app.tar.gz', size: 100 },
  { id: 3, name: 'app_setup.exe', size: 100 },
  { id: 4, name: 'app_arm.dmg', size: 100 },
  { id: 5, name: 'app_x64.dmg', size: 100 },
];
const platforms = Object.fromEntries(['darwin-aarch64', 'darwin-x86_64', 'windows-x86_64'].map((platform, index) => [platform, {
  signature: 'test_signature', url: `https://api.github.com/repos/${repo}/releases/assets/${index + 1}`,
}]));
function validate(manifest, release = { draft: true, assets }) {
  const dir = mkdtempSync(join(tmpdir(), 'vx_release_test_#%_'));
  try {
    const manifestPath = join(dir, 'latest.json');
    const mockPath = join(dir, 'mock_fetch.mjs');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const metadata = { id: 42, tag_name: tag, ...release };
    writeFileSync(mockPath, `globalThis.fetch = async (url) => ({ ok: url.endsWith('/releases/42'), status: 404, json: async () => (${JSON.stringify(metadata)}) });`);
    // The ESM loader needs a file URL for Windows drive paths and reserved characters.
    const result = spawnSync(process.execPath, ['--import', pathToFileURL(mockPath).href, 'scripts/validate_updater.mjs', manifestPath], {
      encoding: 'utf8', env: { ...process.env, GITHUB_REPOSITORY: repo, RELEASE_TAG: tag, RELEASE_ID: '42', GH_TOKEN: 'test_only', GITHUB_STEP_SUMMARY: '' },
    });
    return { ...result, manifest: JSON.parse(readFileSync(manifestPath, 'utf8')) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const manifest = () => ({ version: config.version, platforms: structuredClone(platforms) });

test('three-platform draft normalizes REST assets into public tag-pinned URLs', () => {
  const result = validate(manifest());
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.manifest.platforms['windows-x86_64'].url, `https://github.com/${repo}/releases/download/${tag}/app_setup.exe`);
});
test('missing platform or signature fails instead of declaring release ready', () => {
  const partial = manifest();
  delete partial.platforms['darwin-x86_64'];
  assert.notEqual(validate(partial).status, 0);
  const unsigned = manifest();
  unsigned.platforms['windows-x86_64'].signature = '';
  assert.notEqual(validate(unsigned).status, 0);
});
test('wrong repository, missing package and already published release fail validation', () => {
  const foreign = manifest();
  foreign.platforms['windows-x86_64'].url = 'https://api.github.com/repos/another/repo/releases/assets/3';
  assert.notEqual(validate(foreign).status, 0);
  assert.notEqual(validate(manifest(), { draft: true, assets: assets.filter((item) => item.id !== 3) }).status, 0);
  assert.notEqual(validate(manifest(), { draft: false, assets }).status, 0);
});

test('release ID from another tag is rejected', () => {
  assert.notEqual(validate(manifest(), { tag_name: 'v0.0.1', draft: true, assets }).status, 0);
});

test('draft lookup uses paginated listings instead of published tag lookup', async () => {
  const { findRelease } = await import('./find_release.mjs');
  const original = globalThis.fetch;
  const urls = [];
  try {
    globalThis.fetch = async (url) => {
      urls.push(url);
      assert.ok(!url.includes('/releases/tags/'));
      return { ok: true, json: async () => url.endsWith('page=1')
        ? Array.from({ length: 100 }, (_, id) => ({ id, tag_name: `other_${id}` }))
        : [{ id: 42, tag_name: tag, draft: true }] };
    };
    assert.equal((await findRelease(repo, tag, 'test_only')).id, 42);
    assert.equal(urls.length, 2);
    globalThis.fetch = async () => ({ ok: false, status: 403 });
    await assert.rejects(findRelease(repo, tag, 'test_only'), /HTTP 403/);
  } finally {
    globalThis.fetch = original;
  }
});

test('prepare reuses an existing draft without creating another release', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vx_prepare_test_'));
  try {
    const mockPath = join(dir, 'mock_fetch.mjs');
    const output = join(dir, 'outputs');
    writeFileSync(mockPath, `globalThis.fetch = async (url, options) => {
      if (options.method === 'POST') throw new Error('Must not create another draft');
      if (url.includes('/releases?')) return { ok: true, json: async () => ([{ id: 42, tag_name: ${JSON.stringify(tag)}, draft: true, html_url: 'https://github.com/example/repo/releases' }]) };
      return { ok: true, json: async () => ({ private: false }) };
    };`);
    const result = spawnSync(process.execPath, ['--import', pathToFileURL(mockPath).href, 'scripts/prepare_release.mjs'], {
      encoding: 'utf8', env: { ...process.env, GITHUB_REPOSITORY: repo, RELEASE_TAG: tag, GH_TOKEN: 'test_only', TAURI_SIGNING_PRIVATE_KEY: 'test_only', GITHUB_OUTPUT: output },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(output, 'utf8'), `release_id=42\ntag=${tag}\nasset_prefix=${assetPrefix(config)}\n`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
