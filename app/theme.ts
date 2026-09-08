/**
 * theme.ts — 인체 지도 다크/라이트 모드. Sim_Bio_Cortex 와 톤을 맞춘다.
 *  - 우선순위: URL ?sbcTheme= (정원에서 넘어올 때) > localStorage > 시스템 설정
 *  - <html class="dark"> 토글 (Tailwind @custom-variant dark)
 *  - 정원으로 나갈 때 링크에 ?sbcTheme=<현재> 를 붙여 상태 유지
 */
export type Theme = 'light' | 'dark';
const KEY = 'sbc-atlas-theme';
const PARAM = 'sbcTheme';

export function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyTheme(t: Theme, persist = true) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0f1626' : '#ffffff');
  if (persist) {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
  }
  document.dispatchEvent(new CustomEvent('sbc-theme', {detail: {theme: t}}));
}

export function toggleTheme() {
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

/** 첫 로드 시 결정 — index.html 의 인라인 스크립트에서도 같은 로직을 쓴다(플래시 방지). */
export function initTheme() {
  let t: Theme | null = null;
  try {
    const p = new URLSearchParams(location.search).get(PARAM);
    if (p === 'dark' || p === 'light') t = p;
  } catch {
    /* ignore */
  }
  if (!t) {
    try {
      const s = localStorage.getItem(KEY);
      if (s === 'dark' || s === 'light') t = s as Theme;
    } catch {
      /* ignore */
    }
  }
  if (!t) t = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(t, true);
  // URL 파라미터는 깔끔히 제거
  try {
    const u = new URL(location.href);
    if (u.searchParams.has(PARAM)) {
      u.searchParams.delete(PARAM);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch {
    /* ignore */
  }
}

/** 정원 링크에 현재 테마를 실어 보냄 */
export function withTheme(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set(PARAM, currentTheme());
    return u.toString();
  } catch {
    return url;
  }
}
