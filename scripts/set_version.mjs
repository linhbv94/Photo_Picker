import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? '')) {
  throw new Error('Usage: npm run version:set -- 1.2.3 (stable SemVer only)');
}
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const pkg = readJson('package.json');
const config = readJson('src-tauri/tauri.conf.json');
const lock = readJson('package-lock.json');
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8');
const cargoLock = readFileSync('src-tauri/Cargo.lock', 'utf8');
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const packagePattern = new RegExp('(\\[\\[package\\]\\]\\nname = "' + escape(pkg.name) + '"\\nversion = ")[^"]+(")');
if (!packagePattern.test(cargoLock)) throw new Error('App package not found in Cargo.lock');
pkg.version = config.version = lock.version = lock.packages[''].version = version;
for (const [path, value] of [['package.json', pkg], ['package-lock.json', lock], ['src-tauri/tauri.conf.json', config]]) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}
writeFileSync('src-tauri/Cargo.toml', cargo.replace(/(\[package\][\s\S]*?\nversion = ")[^"]+(")/, '$1' + version + '$2'));
writeFileSync('src-tauri/Cargo.lock', cargoLock.replace(packagePattern, '$1' + version + '$2'));
console.log(`Version set to ${version}. Review, commit, then push tag v${version}.`);
