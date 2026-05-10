import { useState } from 'react'
import {
  fetchMlbMockSummary,
  fetchMlbGeminiSummary,
  fetchMlbSummaryCompare,
} from '../api/mlb'

const MODE_LABEL = {
  MOCK: 'MOCK · 규칙 기반 요약',
  GEMINI: 'GEMINI · 외부 AI API 요약',
}

function SummaryPanel({ title, badgeColor, data, loading }) {
  return (
    <div className="card" style={{ padding: 14, minHeight: 180, flex: 1, minWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            background: badgeColor,
            color: '#0b0d11',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {title}
        </span>
      </div>

      {loading && <p className="muted">생성 중...</p>}

      {!loading && !data && <p className="muted">아직 생성되지 않았습니다.</p>}

      {!loading && data && data.errorMessage && (
        <p style={{ color: 'salmon', whiteSpace: 'pre-wrap' }}>오류: {data.errorMessage}</p>
      )}

      {!loading && data && !data.errorMessage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div className="meta" style={{ marginBottom: 4 }}>요약</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{data.summaryText || '-'}</div>
          </div>
          <div>
            <div className="meta" style={{ marginBottom: 4 }}>전술 분석</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{data.tacticalAnalysis || '-'}</div>
          </div>
          <div>
            <div className="meta" style={{ marginBottom: 4 }}>핵심 포인트</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{data.keyPoint || '-'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BaseballSummaryCompareCard({ gamePk }) {
  const [mock, setMock] = useState(null)
  const [gemini, setGemini] = useState(null)
  const [loadingMock, setLoadingMock] = useState(false)
  const [loadingGemini, setLoadingGemini] = useState(false)
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [err, setErr] = useState('')

  const runMock = async () => {
    if (!gamePk) return
    setErr(''); setLoadingMock(true)
    try {
      const data = await fetchMlbMockSummary(gamePk)
      setMock(data)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Mock 요약 실패')
    } finally {
      setLoadingMock(false)
    }
  }

  const runGemini = async () => {
    if (!gamePk) return
    setErr(''); setLoadingGemini(true)
    try {
      const data = await fetchMlbGeminiSummary(gamePk)
      setGemini(data)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Gemini 요약 실패')
    } finally {
      setLoadingGemini(false)
    }
  }

  const runCompare = async () => {
    if (!gamePk) return
    setErr(''); setLoadingCompare(true)
    setLoadingMock(true); setLoadingGemini(true)
    try {
      const data = await fetchMlbSummaryCompare(gamePk)
      setMock(data?.mock || null)
      setGemini(data?.gemini || null)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || '비교 요약 실패')
    } finally {
      setLoadingCompare(false)
      setLoadingMock(false)
      setLoadingGemini(false)
    }
  }

  return (
    <div className="card" style={{ padding: 14, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>AI 경기 요약 비교</h3>
        <span className="spacer" style={{ flex: 1 }} />
        <button
          className="btn"
          onClick={runMock}
          disabled={loadingMock || loadingCompare}
        >
          {loadingMock && !loadingCompare ? 'Mock 생성 중...' : 'Generate Mock Summary'}
        </button>
        <button
          className="btn"
          onClick={runGemini}
          disabled={loadingGemini || loadingCompare}
        >
          {loadingGemini && !loadingCompare ? 'Gemini 생성 중...' : 'Generate Gemini Summary'}
        </button>
        <button
          className="btn primary"
          onClick={runCompare}
          disabled={loadingCompare}
        >
          {loadingCompare ? '비교 중...' : 'Compare Both'}
        </button>
      </div>

      <div className="meta" style={{ marginBottom: 10 }}>
        MOCK은 규칙 기반(코드로 작성된 템플릿) 요약이고, GEMINI는 외부 AI API(Gemini 2.5 Flash)를 호출한 요약입니다.
        Gemini 사용을 위해서는 백엔드 환경 변수 <code>GEMINI_API_KEY</code>가 필요합니다.
      </div>

      {err && <p style={{ color: 'salmon' }}>오류: {err}</p>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <SummaryPanel
          title={MODE_LABEL.MOCK}
          badgeColor="#7dd3fc"
          data={mock}
          loading={loadingMock}
        />
        <SummaryPanel
          title={MODE_LABEL.GEMINI}
          badgeColor="#fbbf24"
          data={gemini}
          loading={loadingGemini}
        />
      </div>
    </div>
  )
}
