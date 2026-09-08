/**
 * SharedNav — Sim_Bio_Cortex 정원 ↔ 인체 지도 공용 상단 바.
 *  [ 코텍스 | 인체 지도 ]  [ ☾/☀ ]  — 두 사이트 공통 위치·디자인.
 *  가든(Quartz)에도 동일 마크업/스타일을 Head.tsx 가 주입.
 */
import {useEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';
import {currentTheme, toggleTheme, withTheme} from './theme';

export const CORTEX_URL = 'https://simbio11.github.io/simbio-digital-garden2/';
export const ATLAS_URL = 'https://simbio-atlas.vercel.app/';

export default function SharedNav({active}: {active: 'cortex' | 'atlas'}) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document === 'undefined' ? 'light' : currentTheme(),
  );
  useEffect(() => {
    const on = () => setTheme(currentTheme());
    document.addEventListener('sbc-theme', on as EventListener);
    return () => document.removeEventListener('sbc-theme', on as EventListener);
  }, []);

  return (
    <nav className="sbc-switch" aria-label="사이트 전환">
      <a
        className="sbc-switch-btn"
        data-active={active === 'cortex' ? 'true' : 'false'}
        aria-current={active === 'cortex' ? 'page' : undefined}
        href={active === 'cortex' ? undefined : withTheme(CORTEX_URL)}
      >
        <span className="sbc-switch-dot" />
        코텍스
      </a>
      <a
        className="sbc-switch-btn"
        data-active={active === 'atlas' ? 'true' : 'false'}
        aria-current={active === 'atlas' ? 'page' : undefined}
        href={active === 'atlas' ? undefined : withTheme(ATLAS_URL)}
      >
        <span className="sbc-switch-dot" />
        인체 지도
      </a>
      <button
        type="button"
        className="sbc-theme-toggle"
        onClick={() => toggleTheme()}
        aria-label={theme === 'dark' ? '라이트 모드로' : '다크 모드로'}
        title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </nav>
  );
}
