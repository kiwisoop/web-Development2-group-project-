import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ChatBox from '../components/ChatBox';

const SPORT_TABS = [
  { key: 'SOCCER', label: '축구' },
  { key: 'BASEBALL', label: '야구' },
  { key: 'ESPORTS', label: 'e스포츠' },
];

export default function ChatRoomPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const current = SPORT_TABS.find(
    t => t.key === (sportType || '').toUpperCase()
  ) || SPORT_TABS[0];

  return (
    <div className="chat-room-page">
      <h1 className="page-title">팬 채팅</h1>
      <div className="chat-sport-tabs">
        {SPORT_TABS.map(tab => (
          <button
            key={tab.key}
            className={`btn ${current.key === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => navigate(`/chat/${tab.key.toLowerCase()}`)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ChatBox mode="sport" sportType={current.key} isLoggedIn={isLoggedIn} />
    </div>
  );
}
