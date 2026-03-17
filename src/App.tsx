import { useState, useEffect } from 'react';
import Auth from './Auth';
import RoomList from './RoomList';
import ChatRoom from './pages/ChatRoom';

/**
 * @component App
 * @description 애플리케이션의 최상위 루트 컴포넌트입니다.
 * 사용자의 인증 상태(로그인 유무) 및 현재 참여 중인 채팅방 상태를 전역적으로 관리하며,
 * 조건부 렌더링을 통해 화면 전환(라우팅)을 제어합니다.
 */
function App() {
  // 📝 [State] 사용자 인증 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  /**
   * 📝 [State] currentRoomId
   * @description 현재 입장한 채팅방의 ID를 관리합니다. 
   * 값이 null일 경우 로비(RoomList) 화면을 렌더링하고, 값이 존재할 경우 해당 채팅방(ChatRoom)을 렌더링합니다.
   */
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  /**
   * @effect
   * @description 컴포넌트 최초 마운트 시 브라우저의 LocalStorage를 확인하여,
   * JWT 토큰이 존재할 경우 자동 로그인 처리를 수행합니다.
   */
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  /**
   * @function handleLoginSuccess
   * @description 하위 컴포넌트(Auth)에서 로그인 성공 시 호출되어 전역 인증 상태를 업데이트합니다.
   */
  const handleLoginSuccess = () => {
  setIsLoggedIn(true);
  };

  /**
   * @function handleLogout
   * @description 로그아웃 처리를 수행합니다.
   * LocalStorage의 인증 정보를 초기화하고, 로비 화면으로 이동시킵니다.
   */
  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('nickname');
    setIsLoggedIn(false);
    setCurrentRoomId(null); 
  };

  return (
    <div className="App" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '20px' }}>
      {!isLoggedIn ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', minHeight: '100vh' }}>
          
          {/* 🏷️ 상단 네비게이션 바 영역 */}
          <div style={{ textAlign: 'right', padding: '15px', backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
            <span style={{ fontWeight: 'bold' }}>👤 {localStorage.getItem('nickname')}님</span>
            <button 
              onClick={handleLogout} 
              style={{ marginLeft: '15px', padding: '5px 10px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              로그아웃
            </button>
          </div>

          {/* 🔄 조건부 라우팅 렌더링 영역 */}
          {!currentRoomId ? (
            <RoomList onEnterRoom={(id) => setCurrentRoomId(id)} />
          ) : (
            <ChatRoom 
              roomId={currentRoomId} 
              onLeave={() => setCurrentRoomId(null)} 
            />
          )}
          
        </div>
      )}
    </div>
  );
}

export default App;