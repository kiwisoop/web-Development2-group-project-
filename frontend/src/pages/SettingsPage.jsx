import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { changePassword, deleteMe } from '../api/authApi';

const SECTIONS = [
  { key: 'profile', label: '프로필', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )},
  { key: 'data', label: '데이터', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )},
];

const STORAGE_KEY = 'sport-analysis.settings';

export default function SettingsPage() {
  const { user, isLoggedIn, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [sec, setSec] = useState('profile');
  const photoInputRef = useRef(null);

  // 로컬 저장된 설정 불러오기
  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        nickname: '',
        intro: '',
        photoDataUrl: null,
        ...saved,
      };
    } catch {
      return { nickname:'', intro:'', photoDataUrl:null };
    }
  });

  // 사용자 정보가 로드되면 nickname 채우기 (한 번만)
  const [initialName] = useState(user?.nickname || user?.username || '');
  const [profileForm, setProfileForm] = useState({
    nickname: settings.nickname || initialName,
    intro: settings.intro || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user && !settings.nickname) {
      setProfileForm(f => ({ ...f, nickname: user.nickname || user.username || '' }));
    }
  }, [user, settings.nickname]);

  if (!isLoggedIn) {
    return (
      <div className="sl-card" style={{padding:48, textAlign:'center'}}>
        <h3 style={{fontSize:18, marginBottom:8}}>로그인이 필요해요</h3>
        <p style={{color:'var(--color-text-muted)'}}>설정을 보려면 먼저 로그인해주세요.</p>
        <button className="btn btn-primary" style={{marginTop:18}} onClick={() => navigate('/login?back=/settings')}>
          로그인하기
        </button>
      </div>
    );
  }

  const initials = (profileForm.nickname || user?.nickname || user?.username || '?').charAt(0).toUpperCase();

  // ===== 핸들러 =====
  const savePrefs = (next) => {
    const updated = { ...settings, ...next };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('sport-analysis-settings-change'));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('파일 크기는 2MB 이하여야 합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      savePrefs({ photoDataUrl: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileCancel = () => {
    setProfileForm({
      nickname: settings.nickname || initialName,
      intro: settings.intro || '',
    });
  };

  const handleProfileSave = () => {
    savePrefs({
      nickname: profileForm.nickname.trim(),
      intro: profileForm.intro.trim(),
    });
    // 시각적 피드백
    const btn = document.activeElement;
    if (btn && btn.tagName === 'BUTTON') {
      const orig = btn.textContent;
      btn.textContent = '✓ 저장됨';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
    }
  };

  const handleDeleteAccount = async () => {
    const input = prompt(`회원 탈퇴를 진행하려면 아이디를 입력해주세요.\n(${user?.username})`);
    if (input === null) return;
    if (input !== user?.username) {
      alert('아이디가 일치하지 않아 취소되었습니다.');
      return;
    }

    try {
      await deleteMe();
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('sport-analysis-settings-change'));
      alert('회원 탈퇴가 완료되었습니다.');
      navigate('/login', { replace: true });
    } catch (e) {
      alert('회원 탈퇴 실패: ' + (e.response?.data?.message || e.message));
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('현재 비밀번호와 새 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('비밀번호가 변경되었습니다.');
    } catch (e) {
      alert('비밀번호 변경 실패: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <>
      <div className="sl-page-head">
        <div>
          <h1 className="sl-page-title">설정</h1>
          <p className="sl-page-sub">계정 · 프로필</p>
        </div>
      </div>

      <div className="sl-settings-grid">
        <nav className="sl-set-nav">
          {SECTIONS.map(s => (
            <button key={s.key} className={sec===s.key ? 'active' : ''} onClick={() => setSec(s.key)}>
              {s.icon} {s.label}
            </button>
          ))}
        </nav>

        <div>
          {/* ===== PROFILE ===== */}
          {sec === 'profile' && (
            <div className="sl-card" style={{padding:28}}>
              <h2 className="sl-set-title">프로필</h2>
              <p className="sl-set-desc">다른 사용자에게 보여지는 정보예요. (변경사항은 브라우저에 저장돼요)</p>

              <div style={{display:'flex', gap:20, alignItems:'center', padding:'18px 0', borderTop:'1px solid var(--glass-border)'}}>
                {settings.photoDataUrl ? (
                  <img src={settings.photoDataUrl} alt="profile" style={{width:80, height:80, borderRadius:24, objectFit:'cover', boxShadow:'0 12px 32px rgba(124,92,255,0.4)'}}/>
                ) : (
                  <div style={{width:80,height:80,borderRadius:24,background:'linear-gradient(135deg,#7c5cff,#18d6ff)',display:'grid',placeItems:'center',fontSize:32,fontWeight:900,color:'#fff', boxShadow:'0 12px 32px rgba(124,92,255,0.4)'}}>
                    {initials}
                  </div>
                )}
                <div style={{flex:1}}>
                  <b style={{fontSize:14, fontWeight:600, display:'block', marginBottom:2}}>프로필 사진</b>
                  <small style={{fontSize:12, color:'var(--color-text-muted)'}}>JPG, PNG, GIF · 최대 2MB</small>
                </div>
                <input
                  ref={photoInputRef} type="file" accept="image/*"
                  style={{display:'none'}} onChange={handlePhotoChange}
                />
                <div style={{display:'flex', gap:8}}>
                  {settings.photoDataUrl && (
                    <button className="btn btn-outline" onClick={() => savePrefs({photoDataUrl: null})}>제거</button>
                  )}
                  <button className="btn btn-outline" onClick={() => photoInputRef.current?.click()}>사진 변경</button>
                </div>
              </div>

              <div className="form-group">
                <label>닉네임</label>
                <input
                  value={profileForm.nickname}
                  onChange={(e) => setProfileForm(f => ({...f, nickname: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label>아이디</label>
                <input value={user?.username || ''} disabled />
              </div>
              <div className="form-group">
                <label>자기소개</label>
                <textarea
                  rows={3}
                  placeholder="좋아하는 팀이나 응원하는 선수를 적어주세요"
                  value={profileForm.intro}
                  onChange={(e) => setProfileForm(f => ({...f, intro: e.target.value}))}
                />
              </div>

              <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid var(--glass-border)'}}>
                <button className="btn btn-outline" onClick={handleProfileCancel}>취소</button>
                <button className="btn btn-primary" onClick={handleProfileSave}>저장하기</button>
              </div>
            </div>
          )}

          {/* ===== DATA ===== */}
          {sec === 'data' && (
            <div className="sl-card" style={{padding:28}}>
              <h2 className="sl-set-title">데이터</h2>
              <p className="sl-set-desc">계정 작업은 즉시 반영됩니다.</p>

              <div className="sl-danger-zone sl-account-zone">
                <h4>비밀번호 변경</h4>
                <p>현재 비밀번호 확인 후 새 비밀번호로 변경합니다.</p>
                <div className="form-group">
                  <label>현재 비밀번호</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    autoComplete="current-password"
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    autoComplete="new-password"
                    placeholder="8자 이상"
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                <button className="btn btn-primary" type="button" onClick={handlePasswordChange}>비밀번호 변경</button>
              </div>

              <div className="sl-danger-zone">
                <h4>로그아웃</h4>
                <p>현재 기기에서 로그아웃합니다.</p>
                <button className="btn-danger-sl" onClick={async () => {
                  if (!confirm('로그아웃 하시겠어요?')) return;
                  await logoutUser();
                  navigate('/');
                }}>로그아웃</button>
              </div>

              <div className="sl-danger-zone">
                <h4>회원 탈퇴</h4>
                <p>계정, 즐겨찾기, 예측 투표, 응원톡 기록이 삭제됩니다.</p>
                <button className="btn-danger-sl" onClick={handleDeleteAccount}>회원 탈퇴</button>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
