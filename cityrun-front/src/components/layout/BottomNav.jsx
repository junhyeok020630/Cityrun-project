// 앱의 메인 하단 네비게이션 바(BottomNav) UI 컴포넌트
import React from 'react';

/**
 * 하단 네비게이션 바 컴포넌트
 * @param {object} props
 * @param {string} props.currentView - 현재 선택된 뷰 (예: 'home', 'activity')
 * @param {function} props.setView - 뷰(view) 상태를 변경하는 App.jsx의 핸들러 함수
 */
const BottomNav = ({ currentView, setView }) => {
  // 네비게이션 아이템 목록 정의
  const navItems = [
    { id: 'home', label: '홈' },
    { id: 'activity', label: '활동' },
    { id: 'mypage', label: '마이페이지' },
  ];

  return (
    // 네비게이션 바 전체 컨테이너
    <nav style={styles.navContainer}>
      {/* navItems 배열을 순회하며 버튼 생성 */}
      {navItems.map((item) => (
        <button
          key={item.id}
          // 버튼 클릭 시 App.jsx의 setView 함수를 호출하여 'view' state 변경
          onClick={() => setView(item.id)}
          style={{
            ...styles.navButton,
            // 현재 뷰(currentView)와 버튼의 id가 일치하면 글자색을 파란색으로 변경
            color: currentView === item.id ? '#007bff' : '#888',
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

// 컴포넌트에 적용될 스타일 객체
const styles = {
  // 네비게이션 바 컨테이너 스타일
  navContainer: {
    display: 'flex',
    justifyContent: 'space-around', // 버튼들을 좌우로 균등 배분
    alignItems: 'center', // 수직 중앙 정렬
    height: '60px', // 고정 높이
    borderTop: '1px solid #eee', // 상단 경계선
    backgroundColor: '#f9f9f9', // 배경색
    width: '100%',
  },
  // 네비게이션 버튼 스타일
  navButton: {
    background: 'none', // 배경 없음
    border: 'none', // 테두리 없음
    fontSize: '14px',
    cursor: 'pointer',
    padding: '10px',
    fontWeight: 'bold',
  },
};

export default BottomNav;