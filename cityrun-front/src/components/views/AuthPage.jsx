// '로그인' 및 '회원가입' UI 뷰 컴포넌트
import React, { useState } from 'react';

/**
 * 로그인/회원가입 폼을 제공하는 페이지 컴포넌트
 * @param {object} props
 * @param {function} props.onLogin - 로그인 핸들러 (App.jsx)
 * @param {function} props.onRegister - 회원가입 핸들러 (App.jsx)
 */
const AuthPage = ({ onLogin, onRegister }) => {
  // --- State 정의 ---
  // true이면 '로그인' 뷰, false이면 '회원가입' 뷰
  const [isLoginView, setIsLoginView] = useState(true);
  
  // 이메일 입력값
  const [email, setEmail] = useState('');
  // 비밀번호 입력값
  const [password, setPassword] = useState('');
  // 닉네임 입력값 (회원가입용)
  const [nickname, setNickname] = useState('');

  // '로그인' 또는 '회원가입' 버튼 클릭 시 호출되는 핸들러
  const handleSubmit = (e) => {
    e.preventDefault(); // Form의 기본 제출 동작(새로고침) 방지
    if (isLoginView) {
      // 로그인 뷰이면 App.jsx의 onLogin 함수 호출
      onLogin(email, password);
    } else {
      // 회원가입 뷰이면 App.jsx의 onRegister 함수 호출
      onRegister(email, password, nickname);
    }
  };

  // --- 렌더링 ---
  return (
    <div style={styles.container}>
      {/* 뷰 상태에 따라 '로그인' 또는 '회원가입' 제목 표시 */}
      <h2>{isLoginView ? '로그인' : '회원가입'}</h2>
      
      {/* 폼 제출 시 handleSubmit 핸들러 호출 */}
      <form onSubmit={handleSubmit}>
        {/* 이메일 입력 그룹 */}
        <div style={styles.inputGroup}>
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        {/* 비밀번호 입력 그룹 */}
        <div style={styles.inputGroup}>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        
        {/* '회원가입' 뷰일 때만 닉네임 입력 그룹 표시 */}
        {!isLoginView && (
          <div style={styles.inputGroup}>
            <label>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={styles.input}
              required
            />
          </div>
        )}
        
        {/* 제출 버튼 */}
        <button type="submit" style={styles.submitButton}>
          {isLoginView ? '로그인' : '회원가입'}
        </button>
      </form>
      
      {/* '로그인' / '회원가입' 뷰 전환 버튼 */}
      <button 
        onClick={() => setIsLoginView(!isLoginView)} 
        style={styles.toggleButton}
      >
        {isLoginView ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
      </button>
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // 뷰 전체 컨테이너 (Flex 수직 정렬, 중앙 배치)
  container: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  // 입력 필드 그룹
  inputGroup: {
    marginBottom: '15px',
  },
  // 입력 필드 (input)
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box', // 테두리, 패딩을 너비에 포함
  },
  // 제출 버튼 (파란색)
  submitButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  // 뷰 전환 버튼 (텍스트 링크 스타일)
  toggleButton: {
    width: '100%',
    marginTop: '15px',
    background: 'none',
    border: 'none',
    color: '#007bff',
    textDecoration: 'underline',
    cursor: 'pointer',
  }
};

export default AuthPage;