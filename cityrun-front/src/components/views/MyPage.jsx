// '마이페이지' 탭 뷰: 내 프로필, 내 경로 목록, 로그아웃 UI 및 기능
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // API 호출 라이브러리

/**
 * 마이페이지 컴포넌트
 * @param {object} props
 * @param {object} props.currentUser - 현재 로그인한 사용자 정보
 * @param {function} props.onLogout - 로그아웃 핸들러 (App.jsx)
 * @param {function} props.onLoadRoute - '내 경로' 불러오기 핸들러 (App.jsx)
 * @param {function} props.onDeleteRoute - 경로 삭제 핸들러 (App.jsx)
 * @param {function} props.onOpenEditModal - 경로 수정 모달 열기 핸들러 (App.jsx)
 * @param {object} props.routeToEdit - 현재 수정 중인 경로 정보 (모달 닫혔는지 감지용)
 */
const MyPage = ({ currentUser, onLogout, onLoadRoute, onDeleteRoute, onOpenEditModal, routeToEdit }) => { 
  
  // --- State 정의 ---
  const [savedRoutes, setSavedRoutes] = useState([]); // '내 경로' 목록
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [hoveredRouteId, setHoveredRouteId] = useState(null); // 마우스 호버 상태 (UI용)
  const [hasMounted, setHasMounted] = useState(false); // 첫 렌더링(마운트) 완료 여부

  // '내 경로' 목록을 API로 조회하는 함수
  const fetchSavedRoutes = async () => {
    setLoading(true);
    try {
      // GET /api/routes/mine API 호출
      const response = await axios.get('/api/routes/mine');
      setSavedRoutes(response.data); // 응답 데이터를 state에 저장
    } catch (err) {
      console.error("저장된 경로 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect (1) ---
  // 'currentUser' state가 변경될 때 (로그인 시) 실행
  useEffect(() => {
    if (currentUser) {
      fetchSavedRoutes(); // '내 경로' 목록 조회
      setHasMounted(true); // 첫 로드 완료로 표시
    }
  }, [currentUser]); // currentUser가 바뀔 때마다 이 effect 재실행

  // --- useEffect (2) ---
  // 'routeToEdit' state(수정 모달 상태)가 변경될 때 실행
  useEffect(() => {
    // 1. 마운트 시(첫 실행) 또는 로그아웃 상태일 때는 무시
    if (!hasMounted || !currentUser) return;

    // 2. 'routeToEdit'가 null이 되었을 때 (즉, 수정 모달이 닫혔을 때)
    //    경로 이름이 변경되었을 수 있으므로 목록을 새로고침
    if (routeToEdit === null) {
      fetchSavedRoutes();
    }
  }, [routeToEdit]); // routeToEdit state를 감시

  // '삭제' 버튼 클릭 핸들러
  const handleDeleteClick = async (e, routeId) => {
    e.stopPropagation(); // 이벤트 버블링 방지 (li의 onLoadRoute 실행 방지)
    // App.jsx의 onDeleteRoute(API 호출) 실행
    const success = await onDeleteRoute(routeId);
    if (success) {
      fetchSavedRoutes(); // 삭제 성공 시 목록 새로고침
    }
  };

  // '수정' 버튼 클릭 핸들러
  const handleEditClick = (e, route) => {
    e.stopPropagation(); // 이벤트 버블링 방지 (li의 onLoadRoute 실행 방지)
    // App.jsx의 onOpenEditModal(모달 열기) 실행
    onOpenEditModal(route); 
  };

  // (방어 코드) App.jsx의 Login Wall로 인해 이 코드는 거의 실행되지 않음
  if (!currentUser) {
    return <p>로그인이 필요합니다</p>;
  }

  // --- 렌더링 ---
  return (
    // 스크롤을 위한 Flex 컨테이너
    <div style={styles.container}>
      <h2>My Page</h2>
      
      {/* 1. 프로필 정보 박스 */}
      <div style={styles.profileBox}>
        <p><strong>닉네임:</strong> {currentUser.nickname}</p>
        <p><strong>이메일:</strong> {currentUser.email}</p>
        <button onClick={onLogout} style={styles.logoutButton}>
          로그아웃
        </button>
      </div>

      {/* 2. '내 경로' 목록 */}
      <h3>My Route</h3>
      {loading && <p>경로를 불러오는 중...</p>}
      {!loading && savedRoutes.length === 0 && (
        <p>저장된 경로가 없습니다</p>
      )}
      
      {/* 경로 목록 (스크롤 영역) */}
      <ul style={styles.routeList}>
        {savedRoutes.map(route => (
          // 개별 경로 아이템 (li)
          <li 
            key={route.id} 
            style={{
              ...styles.routeItem,
              // 마우스 호버 시 배경색 변경
              backgroundColor: hoveredRouteId === route.id ? '#f0f0f0' : 'transparent'
            }}
            // (A) li 클릭: '홈' 탭으로 이동하여 이 경로를 로드 (App.jsx 핸들러)
            onClick={() => onLoadRoute(route)}
            onMouseEnter={() => setHoveredRouteId(route.id)}
            onMouseLeave={() => setHoveredRouteId(null)}
          >
            {/* 2-1. 경로 정보 (이름, 거리) */}
            <div style={styles.routeInfo}>
              <strong>{route.name}</strong>
              <span> ({(route.distanceM / 1000).toFixed(2)} km)</span>
            </div>

            {/* 2-2. 수정/삭제 버튼 */}
            <div style={styles.buttonContainer}>
              {/* (B) 수정 버튼 클릭 */}
              <button 
                style={styles.iconButton}
                onClick={(e) => handleEditClick(e, route)}
              >
                ✏️
              </button>
              {/* (C) 삭제 버튼 클릭 */}
              <button 
                style={{...styles.iconButton, ...styles.deleteButton}}
                onClick={(e) => handleDeleteClick(e, route.id)}
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // 뷰 전체 컨테이너 (Flex 수직 정렬, 스크롤)
  container: {
    padding: '10px',
    height: '100%', // 부모(mainContent)의 100%
    display: 'flex',
    flexDirection: 'column',
  },
  // 프로필 정보 박스
  profileBox: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '20px',
    flexShrink: 0, // 스크롤 시 축소 방지
  },
  // 로그아웃 버튼
  logoutButton: {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  // 경로 목록 (ul)
  routeList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    flex: 1, // 남은 공간을 모두 차지 (스크롤 영역)
    overflowY: 'auto', // 내용이 넘칠 경우 수직 스크롤
  },
  // 개별 경로 아이템 (li)
  routeItem: {
    padding: '15px 10px', 
    borderBottom: '1px solid #eee',
    cursor: 'pointer', 
    transition: 'background-color 0.2s',
    display: 'flex', // Flex (콘텐츠 + 버튼)
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // 경로 정보 (좌측 텍스트)
  routeInfo: {
    // 텍스트 영역 (자동으로 늘어남)
  },
  // 수정/삭제 버튼 컨테이너 (우측)
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0, // 축소 방지
  },
  // 아이콘 버튼 공통 스타일
  iconButton: {
    background: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '50%',
    width: '30px', 
    height: '30px', 
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 삭제 버튼 스타일
  deleteButton: {
    background: '#ffebee', 
    color: '#dc3545',
    border: '1px solid #ffcdd2',
  }
};

export default MyPage;