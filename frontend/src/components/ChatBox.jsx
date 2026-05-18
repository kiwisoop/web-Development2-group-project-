import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getMatchChatMessages, sendMatchChatMessage,
  getSportChatMessages, sendSportChatMessage,
} from '../api/chatApi';

export default function ChatBox({ mode, matchId, sportType, isLoggedIn, disabledReason }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState(null);
  const bottomRef = useRef(null);

  const loadMessages = useCallback((signal) => {
    setLoading(true);
    const req = mode === 'match'
      ? getMatchChatMessages(matchId, signal)
      : getSportChatMessages(sportType, signal);
    req
      .then(res => setMessages(res.data.data))
      .catch(err => {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          setMessages([]);
        }
      })
      .finally(() => setLoading(false));
  }, [mode, matchId, sportType]);

  useEffect(() => {
    const controller = new AbortController();
    setMessages([]);
    loadMessages(controller.signal);
    return () => controller.abort();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (disabledReason || !isLoggedIn) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    setSendError(null);
    try {
      const res = mode === 'match'
        ? await sendMatchChatMessage(matchId, trimmed)
        : await sendSportChatMessage(sportType, trimmed);
      setMessages(prev => [...prev, res.data.data]);
      setContent('');
    } catch (err) {
      setSendError(err.response?.data?.message || '전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <span>채팅</span>
        <button className="btn btn-outline chat-refresh-btn" onClick={() => loadMessages()}>
          새로고침
        </button>
      </div>

      <div className="chat-message-list">
        {loading && <p className="chat-notice">로딩 중...</p>}
        {!loading && messages.length === 0 && (
          <p className="chat-notice">아직 메시지가 없습니다.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="chat-message">
            <span className="chat-author">{msg.nickname || msg.username}</span>
            <span className="chat-content">{msg.content}</span>
            <span className="chat-time">
              {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {sendError && <p className="chat-send-error">{sendError}</p>}

      {disabledReason ? (
        <p className="chat-notice chat-login-notice">{disabledReason}</p>
      ) : !isLoggedIn ? (
        <p className="chat-notice chat-login-notice">
          로그인 후 채팅에 참여할 수 있습니다.
        </p>
      ) : (
        <div className="chat-input-row">
          <input
            className="chat-input"
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            disabled={sending}
            maxLength={500}
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={handleSend}
            disabled={sending || !content.trim()}
          >
            전송
          </button>
        </div>
      )}
    </div>
  );
}
