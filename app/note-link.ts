/**
 * note-link.ts — BodyParts3D 구조물(영문) → Sim_Bio_Cortex(옵시디언/Quartz) 노트 연결
 *
 *  1) 영문 구조물명을 정규화(좌우·부분 수식어 제거)
 *  2) EN→KO 해부학 사전으로 한국어명 확보
 *  3) 라이브 가든의 contentIndex.json(제목/슬러그)과 대조해 실제 노트 URL 확정
 *  4) 못 찾으면 matched:false + 한국어명(있으면) 반환 → 우측 패널이 "미연결" 표시
 */

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

/** EN → KO 해부학 사전 (핵심 구조물 중심, 필요 시 계속 추가) */
export const EN_KO: Record<string, string> = {
  // ─── 근육: 흉부·견갑대 ───
  'pectoralis major': '대흉근',
  'pectoralis minor': '소흉근',
  'subclavius': '쇄골하근',
  'serratus anterior': '전거근',
  'trapezius': '승모근',
  'latissimus dorsi': '광배근',
  'rhomboid major': '대능형근',
  'rhomboid minor': '소능형근',
  'levator scapulae': '견갑거근',
  'deltoid': '삼각근',
  'supraspinatus': '극상근',
  'infraspinatus': '극하근',
  'teres major': '대원근',
  'teres minor': '소원근',
  'subscapularis': '견갑하근',
  // ─── 근육: 목 ───
  'sternocleidomastoid': '흉쇄유돌근',
  'scalene': '사각근',
  'anterior scalene': '전사각근',
  'middle scalene': '중사각근',
  'posterior scalene': '후사각근',
  'scalenus anterior': '전사각근',
  'scalenus medius': '중사각근',
  'scalenus posterior': '후사각근',
  'splenius capitis': '두판상근',
  'splenius cervicis': '경판상근',
  'longus colli': '경장근',
  'longus capitis': '두장근',
  // ─── 근육: 상완·전완 ───
  'biceps brachii': '상완이두근',
  'triceps brachii': '상완삼두근',
  'brachialis': '상완근',
  'coracobrachialis': '오훼완근',
  'brachioradialis': '완요골근',
  'pronator teres': '원회내근',
  'supinator': '회외근',
  'flexor carpi radialis': '요측수근굴근',
  'flexor carpi ulnaris': '척측수근굴근',
  'extensor carpi radialis longus': '장요측수근신근',
  'extensor carpi ulnaris': '척측수근신근',
  // ─── 근육: 요부·둔부·하지 ───
  'rectus abdominis': '복직근',
  'external oblique': '외복사근',
  'internal oblique': '내복사근',
  'transversus abdominis': '복횡근',
  'quadratus lumborum': '요방형근',
  'psoas major': '대요근',
  'iliacus': '장골근',
  'gluteus maximus': '대둔근',
  'gluteus medius': '중둔근',
  'gluteus minimus': '소둔근',
  'piriformis': '이상근',
  'tensor fasciae latae': '대퇴근막장근',
  'sartorius': '봉공근',
  'rectus femoris': '대퇴직근',
  'vastus lateralis': '외측광근',
  'vastus medialis': '내측광근',
  'vastus intermedius': '중간광근',
  'biceps femoris': '대퇴이두근',
  'semitendinosus': '반건양근',
  'semimembranosus': '반막양근',
  'adductor longus': '장내전근',
  'adductor magnus': '대내전근',
  'gracilis': '박근',
  'gastrocnemius': '비복근',
  'soleus': '가자미근',
  'tibialis anterior': '전경골근',
  'tibialis posterior': '후경골근',
  'fibularis longus': '장비골근',
  'peroneus longus': '장비골근',
  // ─── 골격 ───
  'clavicle': '쇄골',
  'scapula': '견갑골',
  'sternum': '흉골',
  'manubrium of sternum': '흉골병',
  'rib': '늑골',
  'first rib': '제1늑골',
  'humerus': '상완골',
  'radius': '요골',
  'ulna': '척골',
  'sacrum': '천골',
  'ilium': '장골',
  'ischium': '좌골',
  'pubis': '치골',
  'hip bone': '관골',
  'femur': '대퇴골',
  'patella': '슬개골',
  'tibia': '경골',
  'fibula': '비골',
  'cervical vertebra': '경추',
  'thoracic vertebra': '흉추',
  'lumbar vertebra': '요추',
  'atlas': '환추',
  'axis': '축추',
  'mandible': '하악골',
  'cranium': '두개골',
  'skull': '두개골',
  'occipital bone': '후두골',
  'temporal bone': '측두골',
  'frontal bone': '전두골',
  // ─── 신경 ───
  'median nerve': '정중신경',
  'ulnar nerve': '척골신경',
  'radial nerve': '요골신경',
  'musculocutaneous nerve': '근피신경',
  'axillary nerve': '액와신경',
  'long thoracic nerve': '장흉신경',
  'suprascapular nerve': '견갑상신경',
  'phrenic nerve': '횡격막신경',
  'vagus nerve': '미주신경',
  'sciatic nerve': '좌골신경',
  'femoral nerve': '대퇴신경',
  'obturator nerve': '폐쇄신경',
  'common fibular nerve': '총비골신경',
  'tibial nerve': '경골신경',
  'accessory nerve': '부신경',
  'facial nerve': '안면신경',
  'trigeminal nerve': '삼차신경',
  // ─── 혈관 ───
  'subclavian artery': '쇄골하동맥',
  'subclavian vein': '쇄골하정맥',
  'axillary artery': '액와동맥',
  'axillary vein': '액와정맥',
  'brachial artery': '상완동맥',
  'radial artery': '요골동맥',
  'ulnar artery': '척골동맥',
  'common carotid artery': '총경동맥',
  'internal carotid artery': '내경동맥',
  'external carotid artery': '외경동맥',
  'internal jugular vein': '내경정맥',
  'vertebral artery': '척추동맥',
  'aorta': '대동맥',
  'arch of aorta': '대동맥궁',
  'thoracic aorta': '흉부대동맥',
  'abdominal aorta': '복부대동맥',
  'inferior vena cava': '하대정맥',
  'superior vena cava': '상대정맥',
  'femoral artery': '대퇴동맥',
  'femoral vein': '대퇴정맥',
  'popliteal artery': '슬와동맥',
  'great saphenous vein': '대복재정맥',
  // ─── 장기 ───
  'heart': '심장',
  'brain': '뇌',
  'lung': '폐',
  'liver': '간',
  'stomach': '위',
  'spleen': '비장',
  'pancreas': '췌장',
  'kidney': '신장',
  'urinary bladder': '방광',
  'small intestine': '소장',
  'large intestine': '대장',
  'esophagus': '식도',
  'trachea': '기관',
  'thyroid gland': '갑상선',
  'diaphragm': '횡격막',
};

export interface NoteResolution {
  url: string | null;
  label: string;       // 표시용 이름 (한국어 우선)
  english: string;     // 원본 영문
  matched: boolean;    // 실제 노트 연결 여부
  korean: string | null;
}

export function resolveNote(rawName: string, base = GARDEN_BASE): NoteResolution {
  const english = rawName;
  const norm = normalizeName(rawName);
  const korean = EN_KO[norm] ?? EN_KO[rawName.toLowerCase().trim()] ?? null;

  if (INDEX) {
    const entries = Object.values(INDEX);
    const wanted = (korean ?? norm).toLowerCase();
    // 1) 제목 정확 일치
    let hit = entries.find((e) => (e.title ?? '').trim().toLowerCase() === wanted);
    // 2) alias 일치
    if (!hit)
      hit = entries.find((e) => (e.aliases ?? []).some((a) => a.trim().toLowerCase() === wanted));
    // 3) 슬러그 마지막 세그먼트 일치
    if (!hit && korean) {
      const seg = korean.replace(/\s+/g, '-');
      hit = entries.find((e) => {
        const tail = e.slug.split('/').pop() ?? '';
        return tail === seg || tail === korean;
      });
    }
    if (hit) return { url: `${base}/${hit.slug}`, label: hit.title || korean || english, english, matched: true, korean };
  }

  return { url: null, label: korean ?? english, english, matched: false, korean };
}
