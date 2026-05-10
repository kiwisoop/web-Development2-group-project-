import { useState } from 'react'
import {
  fetchMlbMockSummary,
  fetchMlbGeminiSummary,
  fetchMlbSummaryCompare,
} from '../api/mlb'

const PANELS = {
  MOCK: {
    title: 'MOCK',
    subtitle: 'Rule-based summary (template)',
    badgeColor: '#7dd3fc',
  },
  GEMINI: {
    title: 'GEMINI',
    subtitle: 'External AI API summary (Gemini 2.5 Flash)',
    badgeColor: '#fbbf24',
  },
}

function Section({ label, value }) {
  return (
    <div className="ai-section">
      <div className="ai-label">{label}</div>
      <div className="ai-body">{value || '-'}</div>
    </div>
  )
}

function SummaryPanel({ kind, data, loading }) {
  const meta = PANELS[kind]
  return (
    <div
      className="card"
      style={{
        padding: 18,
        minHeight: 220,
        flex: 1,
        minWidth: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <span
          style={{
            background: meta.badgeColor,
            color: '#0b0d11',
            padding: '3px 10px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.6,
          }}
        >
          {meta.title}
        </span>
        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          {meta.subtitle}
        </div>
      </div>

      {loading && <p className="muted" style={{ margin: 0 }}>Generating...</p>}

      {!loading && !data && (
        <p className="muted" style={{ margin: 0 }}>Not generated yet.</p>
      )}

      {!loading && data && data.errorMessage && (
        <p style={{ color: 'salmon', whiteSpace: 'pre-wrap', margin: 0 }}>
          Error: {data.errorMessage}
        </p>
      )}

      {!loading && data && !data.errorMessage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Section label="Summary" value={data.summaryText} />
          <Section label="Tactical Analysis" value={data.tacticalAnalysis} />
          <Section label="Key Point" value={data.keyPoint} />
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
      setErr(e?.response?.data?.message || e.message || 'Mock summary failed')
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
      setErr(e?.response?.data?.message || e.message || 'Gemini summary failed')
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
      setErr(e?.response?.data?.message || e.message || 'Compare summary failed')
    } finally {
      setLoadingCompare(false)
      setLoadingMock(false)
      setLoadingGemini(false)
    }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>AI Game Summary Comparison</h3>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn" onClick={runMock} disabled={loadingMock || loadingCompare}>
          {loadingMock && !loadingCompare ? 'Generating Mock...' : 'Generate Mock Summary'}
        </button>
        <button className="btn" onClick={runGemini} disabled={loadingGemini || loadingCompare}>
          {loadingGemini && !loadingCompare ? 'Generating Gemini...' : 'Generate Gemini Summary'}
        </button>
        <button className="btn primary" onClick={runCompare} disabled={loadingCompare}>
          {loadingCompare ? 'Comparing...' : 'Compare Both'}
        </button>
      </div>

      <div className="meta" style={{ marginBottom: 16, lineHeight: 1.7 }}>
        <strong>MOCK</strong> is a rule-based summary built from a code template.
        <strong> GEMINI</strong> calls an external AI API (Gemini 2.5 Flash) for the summary.
        Gemini requires backend env <code>GEMINI_API_KEY</code> to be set.
      </div>

      {err && <p style={{ color: 'salmon' }}>Error: {err}</p>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SummaryPanel kind="MOCK" data={mock} loading={loadingMock} />
        <SummaryPanel kind="GEMINI" data={gemini} loading={loadingGemini} />
      </div>
    </div>
  )
}
