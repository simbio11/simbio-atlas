/**
 * note-link.ts — BodyParts3D 구조물(영문) → Sim_Bio_Cortex(옵시디언/Quartz) 노트 연결
 *
 *  1) 영문 구조물명을 정규화(좌우·부분 수식어 제거)
 *  2) EN→KO 해부학 사전으로 한국어명 확보
 *  3) 라이브 가든의 contentIndex.json(제목/슬러그)과 대조해 실제 노트 URL 확정
 *  4) 못 찾으면 matched:false + 한국어명(있으면) 반환 → 우측 패널이 "미연결" 표시
 */

import anatomyKo from '@/scripts/anatomy-ko.json';

export const GARDEN_BASE = 'https://simbio11.github.io/simbio-digital-garden2';

type IndexEntry = { slug: string; title: string; aliases?: string[] };
let INDEX: Record<string, IndexEntry> | null = null;
let indexPromise: Promise<void> | null = null;

export function loadGardenIndex(base = GARDEN_BASE): Promise<void> {
  if (indexPromise) return indexPromise;
  indexPromise = fetch(`${base}/static/contentIndex.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data) INDEX = data as Record<string, IndexEntry>;
    })
    .catch(() => {
      /* 오프라인/CORS 실패 시 fallback 경로로 동작 */
    });
  return indexPromise;
}

/** 좌우·부분·머리·가지 등 수식어를 벗겨 핵심 명칭만 남김 */
export function normalizeName(raw: string): string {
  let s = raw.toLowerCase().trim();
  const strip = [
    /^(left|right)\s+/,
    /^(anterior|posterior|superior|inferior|medial|lateral|deep|superficial|proximal|distal|internal|external|greater|lesser|middle)\s+/,
    /^(clavicular|sternocostal|sternal|costal|abdominal|acromial|spinal|transverse|ascending|descending|oblique|straight)\s+part of\s+/,
    /^(long|short|lateral|medial|oblique|straight)\s+head of\s+/,
    /^(head|belly|tendon|zone|segment|body|trunk|part|branch|division|subdivision|tributary|root|fascicle|apex|base|shaft|neck)\s+of\s+/,
    /^variant\s+/,
  ];
  let prev = '';
  while (prev !== s) {
    prev = s;
    for (const re of strip) s = s.replace(re, '');
    s = s.trim();
  }
  s = s.replace(/\s+(muscle|bone|nerve|artery|vein|tendon|ligament|joint|gland)$/,'').trim();
  return s;
}

/** EN → KO 해부학 사전 — koreanize.mjs 와 공유 (scripts/anatomy-ko.json 의 vocab). 볼트 용어 기준. */
export const EN_KO: Record<string, string> = anatomyKo.vocab as Record<string, string>;

export interface NoteResolution {
  url: string | null;
  label: string;       // 표시용 이름 (한국어 우선)
  english: string;     // 원본 영문
  matched: boolean;    // 실제 노트 연결 여부
  korean: string | null;
}

const HANGUL = /[가-힣]/;

function findInIndex(term: string, base: string): { url: string; title: string } | null {
  if (!INDEX || !term) return null;
  const t = term.trim().toLowerCase();
  const seg = term.trim().replace(/\s+/g, '-');
  const entries = Object.entries(INDEX);
  let hit =
    entries.find(([, e]) => (e.title ?? '').trim().toLowerCase() === t) ||
    entries.find(([, e]) => (e.aliases ?? []).some((a) => a.trim().toLowerCase() === t)) ||
    entries.find(([slug]) => {
      const tail = slug.split('/').pop() ?? '';
      return tail === seg || tail === term.trim();
    });
  return hit ? { url: `${base}/${hit[0]}`, title: hit[1].title || term } : null;
}

/**
 * @param displayName  atlas.json 의 name (한국어화됐으면 한국어, 아니면 영문)
 * @param englishName  atlas.json 의 nameEn (한국어화된 경우의 원문 영문)
 */
export function resolveNote(displayName: string, englishName?: string, base = GARDEN_BASE): NoteResolution {
  const english = englishName ?? displayName;
  // 1) 한국어 이름이면 그대로 인덱스 대조
  let korean: string | null = HANGUL.test(displayName) ? displayName : null;
  let hit = korean ? findInIndex(korean, base) : null;

  // 2) 영문 → vocab 사전으로 한국어명 확보 후 대조
  if (!hit) {
    const viaVocab = EN_KO[normalizeName(english)] ?? EN_KO[english.toLowerCase().trim()] ?? null;
    if (viaVocab) {
      korean = korean ?? viaVocab;
      hit = findInIndex(viaVocab, base);
    }
  }

  // 3) 한국어명에서 좌우 접두어 제거 후 재시도 (왼/오른)
  if (!hit && korean) {
    const bare = korean.replace(/^(왼|오른|좌|우)\s*/, '');
    if (bare !== korean) hit = findInIndex(bare, base);
  }

  if (hit) return { url: hit.url, label: hit.title, english, matched: true, korean };
  return { url: null, label: korean ?? english, english, matched: false, korean };
}
