import React, { useState } from 'react';
import './Auth.css';

/**
 * @interface AuthProps
 * @description 컴포넌트 Props 정의. 로그인 성공 시 부모 컴포넌트로 상태를 전달합니다.
 */
interface AuthProps {
  onLoginSuccess: (token: string, nickname: string) => void;
}

/**
 * @component Auth
 * @description 사용자의 로그인 및 회원가입을 처리하는 인증 컴포넌트입니다.
 */
const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  /**
   * @function handleSubmit
   * @description 로그인 또는 회원가입 폼 제출 이벤트를 처리합니다.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isLoginMode 
      ? `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/users/login` 
      : `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/users/signup`;
    
    const payload = isLoginMode 
      ? { email, password } 
      : { email, password, nickname };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('요청 실패: 입력하신 정보를 다시 확인해주세요.');
      }

      if (isLoginMode) {
        const data = await response.json();
        const token = data.token; 
        const userNickname = data.nickname;

        // JWT 토큰 및 사용자 정보 로컬 스토리지 보관
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('nickname', userNickname);
        
        alert(`환영합니다, ${userNickname}님!`);
        onLoginSuccess(token, userNickname);
      } else {
        const message = await response.text();
        alert(message);
        setIsLoginMode(true); 
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">NexTalk {isLoginMode ? '로그인' : '회원가입'}</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            className="auth-input" 
            placeholder="이메일" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          
          {!isLoginMode && (
            <input 
              type="text" 
              className="auth-input" 
              placeholder="닉네임" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              required 
            />
          )}

          <input 
            type="password" 
            className="auth-input" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          <button type="submit" className="auth-btn">
            {isLoginMode ? '로그인' : '가입하기'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          <span onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? '회원가입' : '로그인'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;