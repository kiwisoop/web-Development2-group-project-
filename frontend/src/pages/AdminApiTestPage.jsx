import { useState } from 'react';
import { callApiTest } from '../api/apiTestApi';

const API_LIST = [
  {
    name: '내 정보',
    method: 'GET',
    endpoint: '/auth/me',
    description: '현재 세션 사용자 정보를 반환합니다.',
  },
  {
    name: '경기 목록',
    method: 'GET',
    endpoint: '/matches',
    description: '전체 경기 목록을 반환합니다.',
  },
  {
    name: '경기 상세',
    method: 'GET',
    endpoint: '/matches/1/detail-full',
    description: 'matchId=1 경기의 상세 정보를 반환합니다.',
  },
  {
    name: '축구 랭킹',
    method: 'GET',
    endpoint: '/rankings/SOCCER',
    description: '축구 팀 순위를 반환합니다.',
  },
  {
    name: '야구 랭킹',
    method: 'GET',
    endpoint: '/rankings/BASEBALL',
    description: '야구 팀 순위를 반환합니다.',
  },
  {
    name: 'E스포츠 랭킹',
    method: 'GET',
    endpoint: '/rankings/ESPORTS',
    description: 'E스포츠 팀 순위를 반환합니다.',
  },
  {
    name: '관리자 대시보드',
    method: 'GET',
    endpoint: '/admin/dashboard',
    description: '관리자 통계 데이터를 반환합니다.',
  },
  {
    name: '경기 예측',
    method: 'GET',
    endpoint: '/matches/1/prediction',
    description: 'matchId=1 승부예측 결과를 반환합니다.',
  },
  {
    name: '경기 채팅',
    method: 'GET',
    endpoint: '/matches/1/chat',
    description: 'matchId=1 채팅 메시지 목록을 반환합니다.',
  },
];

export default function AdminApiTestPage() {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async (api) => {
    setSelected(api);
    setResult(null);
    setLoading(true);
    const res = await callApiTest(api.endpoint, api.method);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="api-test-page">
      <div className="api-test-header">
        <h1 className="api-test-title">관리자 API 테스트 페이지</h1>
        <p className="api-test-desc">
          관리자가 React에서 Spring Boot REST API를 직접 호출해 응답을 확인하는 개발자용 페이지입니다.
        </p>
      </div>

      <div className="api-test-grid">
        {API_LIST.map((api) => (
          <div
            key={api.endpoint}
            className={`api-test-card card${selected?.endpoint === api.endpoint ? ' api-test-card--active' : ''}`}
          >
            <div className="api-test-card-top">
              <span className={`api-method-badge api-method-badge--${api.method.toLowerCase()}`}>
                {api.method}
              </span>
              <code className="api-test-endpoint">{api.endpoint}</code>
            </div>
            <p className="api-test-card-name">{api.name}</p>
            <p className="api-test-card-desc">{api.description}</p>
            <button
              className="btn btn-primary api-test-btn"
              onClick={() => handleTest(api)}
              disabled={loading && selected?.endpoint === api.endpoint}
            >
              {loading && selected?.endpoint === api.endpoint ? '호출 중...' : '테스트'}
            </button>
          </div>
        ))}
      </div>

      {(selected || loading) && (
        <div className="api-response-viewer card">
          <div className="api-response-header">
            <span className="api-response-label">응답 결과</span>
            {selected && (
              <span className="api-response-endpoint">
                <span className={`api-method-badge api-method-badge--${selected.method.toLowerCase()}`}>
                  {selected.method}
                </span>
                <code>{selected.endpoint}</code>
              </span>
            )}
            {result && (
              <span className={`api-status-badge${result.success ? ' api-status-badge--ok' : ' api-status-badge--err'}`}>
                HTTP {result.status}
              </span>
            )}
          </div>

          {loading && <p className="api-response-loading">API 호출 중...</p>}

          {!loading && result && (
            <div className="json-output-wrap">
              <pre className="json-output">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
