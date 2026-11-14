#!/usr/bin/env node
// 크루 목록 검사 + index.json 생성. 사용법: node tools/build-index.js [--check]
// --check: 검사만 하고, index.json이 최신이 아니면 실패한다(PR 검사용).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const MAX_BYTES = 64 * 1024;
const ID_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const VER_RE = /^\d{1,3}(\.\d{1,3}){0,2}$/;
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
const errors = [];
const err = (m) => errors.push(m);
const verKey = (v) => v.split('.').map(Number);
const cmp = (a, b) => { const x = verKey(a), y = verKey(b); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
const isLangMap = (o, max) => o && typeof o === 'object' && typeof o.ko === 'string' && Object.values(o).every((v) => typeof v === 'string' && v.length > 0 && v.length <= max);

let official = [];
try { official = JSON.parse(fs.readFileSync(path.join(ROOT, 'OFFICIAL.json'), 'utf8')); } catch { err('OFFICIAL.json을 읽을 수 없어요'); }

const crews = [];
const dir = path.join(ROOT, 'crews');
for (const id of fs.readdirSync(dir).sort()) {
  const cdir = path.join(dir, id);
  if (!fs.statSync(cdir).isDirectory()) { err(`crews/${id}: 폴더가 아니에요`); continue; }
  if (!ID_RE.test(id)) { err(`crews/${id}: 폴더 이름은 영문 소문자·숫자·-로 3~40자`); continue; }
  let meta;
  try { meta = JSON.parse(fs.readFileSync(path.join(cdir, 'crew.json'), 'utf8')); } catch { err(`crews/${id}: crew.json이 없거나 형식이 틀려요`); continue; }
  if (meta.id !== id) err(`crews/${id}: crew.json의 id가 폴더 이름과 달라요`);
  if (!isLangMap(meta.name, 40)) err(`crews/${id}: name은 {ko:"…"} 형식(40자까지)`);
  if (!isLangMap(meta.blurb, 120)) err(`crews/${id}: blurb는 {ko:"…"} 형식(120자까지)`);
  if (meta.examples !== undefined && !(meta.examples && Array.isArray(meta.examples.ko) && meta.examples.ko.length <= 5 && Object.values(meta.examples).every((a) => Array.isArray(a) && a.every((x) => typeof x === 'string' && x.length <= 80)))) err(`crews/${id}: examples는 {ko:["…"]} 형식(5개, 80자까지)`);
  if (typeof meta.icon !== 'string' || !meta.icon || meta.icon.length > 8) err(`crews/${id}: icon은 이모지 한 칸`);
  if (typeof meta.author !== 'string' || !meta.author || meta.author.length > 60) err(`crews/${id}: author가 필요해요`);
  if (meta.license !== 'Apache-2.0') err(`crews/${id}: license는 Apache-2.0이어야 해요`);
  if (meta.official !== undefined) err(`crews/${id}: crew.json에 official을 쓸 수 없어요(OFFICIAL.json으로만 정해요)`);
  if (!VER_RE.test(String(meta.latest))) err(`crews/${id}: latest 버전 형식이 틀려요`);
  const files = fs.readdirSync(cdir).filter((f) => f !== 'crew.json');
  const versions = {};
  for (const f of files) {
    const m = /^(.+)\.md$/.exec(f);
    if (!m || !VER_RE.test(m[1])) { err(`crews/${id}/${f}: <버전>.md 이외의 파일은 둘 수 없어요`); continue; }
    const buf = fs.readFileSync(path.join(cdir, f));
    if (buf.length > MAX_BYTES) { err(`crews/${id}/${f}: 64KB를 넘어요`); continue; }
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { err(`crews/${id}/${f}: UTF-8 글이 아니에요`); continue; }
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) { err(`crews/${id}/${f}: 제어 문자가 들어 있어요`); continue; }
    if (!text.endsWith('\n')) { err(`crews/${id}/${f}: 마지막 줄이 줄바꿈으로 끝나야 해요`); continue; }
    versions[m[1]] = hash(text);
  }
  if (!versions[meta.latest]) { err(`crews/${id}: latest(${meta.latest}) 파일이 없어요`); continue; }
  if (cmp(Object.keys(versions).sort(cmp).pop(), meta.latest) > 0) err(`crews/${id}: latest보다 높은 버전 파일이 있어요`);
  const old = Object.entries(versions).filter(([v]) => v !== meta.latest).map(([, h]) => h);
  crews.push({
    id, name: meta.name, blurb: meta.blurb, icon: meta.icon,
    ...(meta.group ? { group: meta.group } : {}), ...(meta.examples ? { examples: meta.examples } : {}),
    author: meta.author, license: meta.license, official: official.includes(id),
    latest: meta.latest, hash: versions[meta.latest], old: [...new Set([...(meta.old || []), ...old])], versions: Object.keys(versions).sort(cmp),
  });
}
for (const o of official) if (!crews.some((c) => c.id === o)) err(`OFFICIAL.json: ${o} 크루가 없어요`);
if (errors.length) { console.error(errors.map((e) => '✗ ' + e).join('\n')); process.exit(1); }

const out = JSON.stringify({ format: 'gamja-crews', version: 1, crews }, null, 2) + '\n';
const target = path.join(ROOT, 'index.json');
if (process.argv.includes('--check')) {
  let cur = ''; try { cur = fs.readFileSync(target, 'utf8'); } catch {}
  if (cur !== out) { console.error('✗ index.json이 최신이 아니에요. node tools/build-index.js 를 실행해 올려 주세요.'); process.exit(1); }
  console.log(`OK: 크루 ${crews.length}개`);
} else { fs.writeFileSync(target, out); console.log(`index.json 생성: 크루 ${crews.length}개`); }
