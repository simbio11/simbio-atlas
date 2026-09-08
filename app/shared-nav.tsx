/**
 * SharedNav — Sim_Bio_Cortex 정원 ↔ 인체 지도 를 오가는 공용 상단 스위치.
 * 가든(Quartz) 쪽에도 동일한 마크업/스타일을 Head.tsx 에서 주입해 시각적으로 하나처럼 보이게 함.
 */
export const CORTEX_URL = 'https://simbio11.github.io/simbio-digital-garden2/';
export const ATLAS_URL = 'https://simbio-atlas.vercel.app/';

export default function SharedNav({active}: {active: 'cortex' | 'atlas'}) {
  return (
    <nav className="sbc-switch" aria-label="사이트 전환">
      <a
        className="sbc-switch-btn"
        data-active={active === 'cortex' ? 'true' : 'false'}
        aria-current={active === 'cortex' ? 'page' : undefined}
        href={active === 'cortex' ? undefined : CORTEX_URL}
      >
        <span className="sbc-switch-dot" />
        코텍스
      </a>
      <a
        className="sbc-switch-btn"
        data-active={active === 'atlas' ? 'true' : 'false'}
        aria-current={active === 'atlas' ? 'page' : undefined}
        href={active === 'atlas' ? undefined : ATLAS_URL}
      >
        <span className="sbc-switch-dot" />
        인체 지도
      </a>
    </nav>
  );
}
