import { appendFileSync, readFileSync } from 'node:fs';
import { findRelease } from './find_release.mjs';

const repo = process.env.GITHUB_REPOSITORY;
const tag = process.env.RELEASE_TAG;
const token = process.env.GH_TOKEN;
if (!repo || !tag || !token || !process.env.TAURI_SIGNING_PRIVATE_KEY) {
  throw new Error('Missing release configuration. Add repository secret TAURI_SIGNING_PRIVATE_KEY.');
}
const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
const base = `https://api.github.com/repos/${repo}`;
const metadata = await fetch(base, { headers });
if (!metadata.ok || (await metadata.json()).private !== false) throw new Error('Release builds are enabled only for public repositories to keep standard runner usage free.');

let release = await findRelease(repo, tag, token);
if (release) {
  if (!release.draft) throw new Error('This version is already published. Bump the version instead of replacing installed update packages.');
} else {
  const result = await fetch(`${base}/releases`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: tag, name: `${config.productName} ${tag}`, draft: true, prerelease: false,
      body: 'Windows: tải bộ cài setup.exe. macOS: tải DMG đúng kiến trúc (aarch64 cho Apple Silicon, x64 cho Intel), kéo app vào Applications.\n\nBản phân phối miễn phí: macOS ký ad-hoc; Windows chưa có chứng chỉ Authenticode. Có thể cần cho phép mở ứng dụng lần đầu. Các gói cập nhật được ký bằng khóa Tauri riêng.\n\nKiểm tra smoke test Windows/macOS và latest.json trước khi bấm Publish release.' })
  });
  if (!result.ok) throw new Error(`Could not create draft release: HTTP ${result.status}`);
  release = await result.json();
}
appendFileSync(process.env.GITHUB_OUTPUT, `release_id=${release.id}\ntag=${tag}\n`);
console.log(`Draft release ready: ${release.html_url}`);
