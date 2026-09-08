#!/usr/bin/env node
/**
 * koreanize.mjs — public/models/atlas.json 의 영문 해부명을 한국어로 치환.
 *
 *  - parts[].name / concepts[].name 을 한국어로 바꾸고, 원문을 nameEn 으로 보존
 *  - anatomy-ko.json 의 phrase(전체일치) > rel(~of~) > base+mod(조합) 순으로 해석
 *  - 해석 불가한 항목은 영문 유지 (커버리지 리포트 출력)
 *
 *  usage: node scripts/koreanize.mjs [--dry]
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS = path.join(ROOT, 'public/models/atlas.json');
const DICT = path.join(ROOT, 'scripts/anatomy-ko.json');
const DRY = process.argv.includes('--dry');

const D = JSON.parse(fs.readFileSync(DICT, 'utf8'));
const VOCAB = D.vocab || {}, PHRASE = D.phrase, MOD = D.mod, BASE = D.base, REL = D.rel;

const SIDE = /^(left|right)\s+/i;
const REL_OF = new RegExp(
  '^(.*?)\\s*\\b(branch|branches|part|parts|head|heads|belly|tendon|segment|trunk|trunks|division|root|roots|tributary|body|neck|shaft|apex|base|wall|zone|region|cavity|lumen|surface|border|angle|process|spine|crest|fossa|notch|tuberosity|condyle|epicondyle|set)\\s+of\\s+(.+)$',
  'i',
);
const SUFFIX = /\s+(tree|plexus|anastomosis|arcade|network)$/i;

const hasAscii = (s) => /[a-z]/i.test(s);

// base 사전에서 최장 일치 구를 우선 소비하며 토큰 배열을 한국어로
function joinBase(str) {
  const words = str.trim().split(/\s+/).filter(Boolean);
  const out = [];
  let i = 0,
    translated = 0;
  while (i < words.length) {
    let matched = false;
    for (let n = Math.min(4, words.length - i); n >= 1; n--) {
      const slice = words.slice(i, i + n).join(' ');
      const key = slice.toLowerCase();
      if (BASE[key]) {
        out.push({ko: BASE[key], en: slice, base: true});
        i += n;
        translated += n;
        matched = true;
        break;
      }
      if (n === 1 && MOD[key]) {
        out.push({ko: MOD[key], en: slice, base: false});
        i += 1;
        translated += 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push({ko: words[i], en: words[i], base: false, fail: true});
      i += 1;
    }
  }
  return {parts: out, translated, total: words.length};
}

function compose(str) {
  const s = str.toLowerCase().trim();
  if (!s) return null;
  if (VOCAB[s]) return VOCAB[s]; // 볼트 용어 최우선
  if (PHRASE[s]) return PHRASE[s];

  // laterality — 좌/우 접두어는 표시·노트연결에 방해되므로 아예 제거 (3D 메시는 여전히 좌우 구분됨)
  const sm = s.match(SIDE);
  const side = '';
  let core = s;
  if (sm) {
    core = s.slice(sm[0].length).trim();
    if (VOCAB[core]) return VOCAB[core];
    if (PHRASE[core]) return PHRASE[core];
  }

  // "... X of Y"
  const rm = core.match(REL_OF);
  if (rm) {
    const mods = rm[1].trim();
    const relWord = rm[2].toLowerCase();
    const target = rm[3].trim();
    const relKo = REL[`${relWord} of`] || REL[`${relWord}s of`] || rm[2];
    const targetKo = compose(target);
    if (targetKo && !hasAscii(targetKo)) {
      const modKo = mods ? renderMods(mods) : '';
      return side + targetKo + ' ' + modKo + relKo;
    }
    return null;
  }

  // "X tree|plexus|anastomosis|..."
  const fm = core.match(SUFFIX);
  if (fm) {
    const head = core.slice(0, fm.index).trim();
    const headKo = compose(head);
    if (headKo && !hasAscii(headKo)) return side + headKo + (REL[fm[1].toLowerCase()] || fm[1]);
    return null;
  }

  // 일반 "A of B" — 마지막 of 기준으로 B(위치/소속) + A(대상)
  const oi = core.lastIndexOf(' of ');
  if (oi > 0) {
    const a = core.slice(0, oi).trim();
    const b = core.slice(oi + 4).trim();
    const aKo = compose(a);
    const bKo = compose(b);
    if (aKo && bKo && !hasAscii(aKo) && !hasAscii(bKo)) return side + bKo + aKo;
    return null;
  }

  // base + mod 조합
  const {parts, translated, total} = joinBase(core);
  if (translated === 0 || translated < total) return null; // 완전 해석만 채택
  let acc = side;
  parts.forEach((p, idx) => {
    let ko = p.ko;
    if (p.base && p.en.toLowerCase() === 'muscle' && parts.length > 1 && idx === parts.length - 1) {
      ko = acc.endsWith('근') ? '' : '근'; // 이미 근으로 끝나면 중복 방지
    }
    acc += ko;
  });
  return acc;
}

function renderMods(mods) {
  return mods
    .trim()
    .split(/\s+/)
    .map((w) => MOD[w.toLowerCase()] || w)
    .join('');
}

function koreanize(name) {
  try {
    const ko = compose(name);
    if (ko && !hasAscii(ko)) return ko;
  } catch {
    /* fall through */
  }
  return null;
}

// ── 적용 ────────────────────────────────────────────────
const atlas = JSON.parse(fs.readFileSync(ATLAS, 'utf8'));
let okP = 0,
  okC = 0;
const missPreview = new Set();

for (const p of atlas.parts) {
  if (p.nameEn) p.name = p.nameEn; // 재실행 안전
  const ko = koreanize(p.name);
  if (ko) {
    p.nameEn = p.name;
    p.name = ko;
    okP++;
  } else if (missPreview.size < 40) {
    missPreview.add(p.name);
  }
}
for (const c of atlas.concepts) {
  if (c.nameEn) c.name = c.nameEn;
  const ko = koreanize(c.name);
  if (ko) {
    c.nameEn = c.name;
    c.name = ko;
    okC++;
  } else if (missPreview.size < 40) {
    missPreview.add(c.name);
  }
}

const pctP = ((okP / atlas.parts.length) * 100).toFixed(1);
const pctC = ((okC / atlas.concepts.length) * 100).toFixed(1);
console.log(`parts   : ${okP}/${atlas.parts.length} (${pctP}%) 한국어화`);
console.log(`concepts: ${okC}/${atlas.concepts.length} (${pctC}%) 한국어화`);
console.log('\n미해석 예시:');
console.log([...missPreview].slice(0, 30).map((s) => '  · ' + s).join('\n'));

if (DRY) {
  console.log('\n--dry: 파일 미저장');
} else {
  fs.writeFileSync(ATLAS, JSON.stringify(atlas));
  console.log('\natlas.json 저장 완료');
}
