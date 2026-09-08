import {useCallback, useEffect, useRef, useState, type ReactNode} from 'react';

const KEY = 'sc-atlas-split';
const MIN = 30;
const MAX = 76;
const isVerticalNow = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
const keyFor = (v: boolean) => KEY + (v ? ':v' : '');
const defFor = (v: boolean) => (v ? 60 : 54); // 모바일 세로: 3D 우선

/** 좌우(좁으면 상하) 리사이즈 가능한 분할 셸. 외부 의존성 없음. */
export default function SplitShell({left, right}: {left: ReactNode; right: ReactNode}) {
  const host = useRef<HTMLDivElement>(null);
  const [vertical, setVertical] = useState(isVerticalNow);
  const [pct, setPct] = useState<number>(() => {
    const v = isVerticalNow();
    const stored = typeof localStorage !== 'undefined' ? Number(localStorage.getItem(keyFor(v))) : NaN;
    return Number.isFinite(stored) && stored >= MIN && stored <= MAX ? stored : defFor(v);
  });
  const dragging = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const on = () => {
      const v = mq.matches;
      setVertical(v);
      const stored = Number(localStorage.getItem(keyFor(v)));
      setPct(Number.isFinite(stored) && stored >= MIN && stored <= MAX ? stored : defFor(v));
    };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current || !host.current) return;
      const r = host.current.getBoundingClientRect();
      const raw = vertical ? ((e.clientY - r.top) / r.height) * 100 : ((e.clientX - r.left) / r.width) * 100;
      const next = Math.min(MAX, Math.max(MIN, raw));
      setPct(next);
    },
    [vertical],
  );

  useEffect(() => {
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem(keyFor(vertical), String(Math.round(pct)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [onMove, pct, vertical]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = vertical ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 6 : 2;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setPct((p) => Math.max(MIN, p - step));
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setPct((p) => Math.min(MAX, p + step));
    else return;
    e.preventDefault();
  };

  return (
    <div ref={host} className={`sc-shell ${vertical ? 'is-vertical' : ''}`}>
      <div className="sc-atlas-panel" style={{flexBasis: `${pct}%`}}>
        {left}
      </div>
      <div
        className="sc-resize-handle"
        role="separator"
        aria-orientation={vertical ? 'horizontal' : 'vertical'}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={Math.round(pct)}
        aria-label="패널 크기 조절"
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={nudge}
        onDoubleClick={() => setPct(54)}
      >
        <span className="sc-resize-grip" />
      </div>
      <div className="sc-note-panel" style={{flexBasis: `${100 - pct}%`}}>
        {right}
      </div>
    </div>
  );
}
