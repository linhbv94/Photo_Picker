import assert from 'node:assert/strict';
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const repo = process.env.GITHUB_REPOSITORY;
const tag = process.env.RELEASE_TAG;
assert.ok(repo && tag, 'Missing release target');
assert.equal(manifest.version.replace(/^v/, ''), config.version);
const response = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`, {
  headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
});
assert.ok(response.ok, `Could not read draft release: HTTP ${response.status}`);
const release = await response.json();
assert.equal(release.draft, true, 'Only draft releases may be validated');
// tauri-action v1 may emit REST asset URLs. Public apps use direct, tag-pinned URLs.
for (const entry of Object.values(manifest.platforms ?? {})) {
  const url = new URL(entry.url);
  let asset;
  if (url.origin === 'https://api.github.com') {
    assert.ok(url.pathname.startsWith(`/repos/${repo}/releases/assets/`), 'Asset must belong to this repository');
    const id = Number(url.pathname.split('/').at(-1));
    asset = release.assets.find((item) => item.id === id);
  } else {
    assert.equal(url.origin, 'https://github.com');
    assert.ok(url.pathname.startsWith(`/${repo}/releases/download/${tag}/`), 'Asset must belong to this version');
    asset = release.assets.find((item) => item.name === decodeURIComponent(url.pathname.split('/').at(-1)));
  }
  assert.ok(asset && asset.size > 0, 'Updater asset is missing from release');
  entry.url = `https://github.com/${repo}/releases/download/${tag}/${encodeURIComponent(asset.name)}`;
}
for (const platform of ['darwin-aarch64', 'darwin-x86_64', 'windows-x86_64']) {
  const entry = manifest.platforms?.[platform];
  assert.ok(entry, `Missing platform ${platform}`);
  assert.ok(typeof entry.signature === 'string' && entry.signature.trim(), `Missing signature ${platform}`);
  const url = new URL(entry.url);
  assert.equal(url.origin, 'https://github.com');
  assert.ok(url.pathname.startsWith(`/${repo}/releases/download/${tag}/`), `Package must point to this version: ${platform}`);
  const assetName = decodeURIComponent(url.pathname.split('/').at(-1));
  assert.ok(release.assets.some((asset) => asset.name === assetName && asset.size > 0), `Missing release asset ${assetName}`);
  assert.ok(platform.startsWith('windows') ? assetName.endsWith('.exe') : assetName.endsWith('.app.tar.gz'), `Wrong installer format: ${platform}`);
}
assert.ok(release.assets.filter((asset) => asset.name.endsWith('.dmg')).length >= 2, 'Missing first-install macOS DMGs');
writeFileSync(process.argv[2], JSON.stringify(manifest, null, 2) + '\n');
const summary = `### ${config.productName} ${tag}\n\nAll three platforms and their signed updater packages are present.\n\n[Open draft release](https://github.com/${repo}/releases) → smoke test → **Publish release**.\n\nStandard public runners only. No Actions caches or workflow artifacts were uploaded.\n`;
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log('Manifest valid for Windows x64, macOS Apple Silicon and macOS Intel. Release remains a draft.');
