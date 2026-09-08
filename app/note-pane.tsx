import {useEffect, useRef, useState} from 'react';
import {EyeOff, Undo2, RotateCcw, ExternalLink, ArrowLeft, Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GARDEN_BASE, type NoteResolution} from './note-link';

interface Props {
  resolution: NoteResolution | null;
  canHide: boolean;
  hiddenCount: number;
  onHide: () => void;
  onRestoreLast: () => void;
  onRestoreAll: () => void;
}

export default function NotePane({resolution, canHide, hiddenCount, onHide, onRestoreLast, onRestoreAll}: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const src = resolution?.url ?? null;

  useEffect(() => {
    if (src) setLoading(true);
  }, [src]);

  return (
    <div className="sc-note-pane">
      <header className="sc-note-bar">
        <a className="sc-note-home" href={GARDEN_BASE} target="_blank" rel="noreferrer" title="Sim_Bio_Cortex 홈">
          <ArrowLeft size={15} />
          <span>Sim_Bio_Cortex</span>
        </a>

        <div className="sc-note-title" title={resolution?.english}>
          {resolution ? (
            <>
              <strong>{resolution.label}</strong>
              {resolution.korean && resolution.korean !== resolution.label && (
                <span className="sc-note-en">{resolution.korean}</span>
              )}
              {!resolution.matched && <span className="sc-note-badge">미연결</span>}
            </>
          ) : (
            <span className="sc-note-hint">구조물을 클릭하면 해당 노트가 여기에 열립니다</span>
          )}
        </div>

        <div className="sc-note-tools">
          <Button
            variant="ghost"
            className="sc-tool"
            disabled={!canHide}
            onClick={onHide}
            title="선택한 구조물 숨기기 (안쪽 구조 클릭 가능)"
          >
            <EyeOff size={15} />
            <span>숨기기</span>
          </Button>
          <Button
            variant="ghost"
            className="sc-tool"
            disabled={hiddenCount === 0}
            onClick={onRestoreLast}
            title="마지막으로 숨긴 구조물 되돌리기"
          >
            <Undo2 size={15} />
          </Button>
          <Button
            variant="ghost"
            className="sc-tool"
            disabled={hiddenCount === 0}
            onClick={onRestoreAll}
            title={`숨긴 구조물 전체 복원 (${hiddenCount})`}
          >
            <RotateCcw size={15} />
            {hiddenCount > 0 && <span className="sc-tool-count">{hiddenCount}</span>}
          </Button>
        </div>
      </header>

      <div className="sc-note-body">
        {src ? (
          <>
            {loading && <div className="sc-note-loading">노트를 불러오는 중…</div>}
            <iframe
              ref={frame}
              src={src}
              title={resolution?.label ?? '노트'}
              onLoad={() => setLoading(false)}
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <div className="sc-note-empty">
            {resolution && !resolution.matched ? (
              <>
                <p>
                  <strong>{resolution.label}</strong> 에 연결된 노트를 찾지 못했습니다.
                </p>
                <p className="sc-note-sub">
                  {resolution.korean
                    ? `한국어명 "${resolution.korean}" 노트를 만들거나, 매핑을 추가하면 자동 연결됩니다.`
                    : `영문명 "${resolution.english}" 의 한국어 매핑을 note-link.ts 에 추가하세요.`}
                </p>
                <a
                  className="sc-note-searchlink"
                  href={`${GARDEN_BASE}/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Search size={14} /> 가든에서 검색
                </a>
              </>
            ) : (
              <>
                <div className="sc-note-logo" />
                <p>왼쪽 3D 모델에서 근육·뼈·신경·혈관을 클릭하세요.</p>
                <p className="sc-note-sub">겉 근육은 “숨기기”로 제거하면 안쪽 구조를 바로 선택할 수 있습니다.</p>
              </>
            )}
          </div>
        )}
      </div>

      <a
        className="sc-note-open-ext"
        href={src ?? `${GARDEN_BASE}/`}
        target="_blank"
        rel="noreferrer"
        title="새 탭에서 열기"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
