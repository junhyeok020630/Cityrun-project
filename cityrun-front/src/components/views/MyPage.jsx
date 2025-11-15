import React, { useState, useEffect } from 'react';
import axios from 'axios';
// (항목 4) AuthPage import 제거

// 🔻 (항목 1) onDeleteRoute, onOpenEditModal, routeToEdit prop 추가 🔻
const MyPage = ({ currentUser, onLogout, onLoadRoute, onDeleteRoute, onOpenEditModal, routeToEdit }) => { 
  
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredRouteId, setHoveredRouteId] = useState(null); 
  
  // 🔻 (항목 1) 첫 로드 감지용 state 추가 🔻
  const [hasMounted, setHasMounted] = useState(false);

  // 🔻 (항목 1) fetchSavedRoutes를 useEffect 밖으로 이동 🔻
  const fetchSavedRoutes = async () => {
    setLoading(true);
    try {
      // (주석 수정) /api/routes/mine 호출
      const response = await axios.get('/api/routes/mine');
      setSavedRoutes(response.data);
    } catch (err) {
      console.error("저장된 경로 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // 🔻 (항목 1) 중복 정의된 함수 대신, 바깥의 함수를 호출 🔻
      fetchSavedRoutes();
      setHasMounted(true); // ⬅️ 첫 로드 완료
    }
  }, [currentUser]); 

  // 🔻 (항목 1) ★수정 성공 시 새로고침을 위한 useEffect★ 🔻
  useEffect(() => {
    // 1. 마운트 시(첫 실행) 또는 currentUser가 null일 때는 무시
    if (!hasMounted || !currentUser) return;

    // 2. routeToEdit가 null이 되었을 때 (모달이 닫혔을 때) 목록 새로고침
    if (routeToEdit === null) {
      fetchSavedRoutes();
    }
  }, [routeToEdit]); // ⬅️ routeToEdit state를 감시
  // 🔺🔺🔺

  // 🔻 (항목 1) 삭제 버튼 클릭 핸들러 (App.jsx로 삭제 요청 전달) 🔻
  const handleDeleteClick = async (e, routeId) => {
    e.stopPropagation(); // <li>의 onLoadRoute 실행 방지
    const success = await onDeleteRoute(routeId); // ⬅️ App.jsx 함수 호출
    if (success) {
      fetchSavedRoutes(); // ⬅️ 삭제 성공 시 목록 새로고침
    }
  };

  // 🔻 (항목 1) 수정 버튼 클릭 핸들러 (await 제거) 🔻
  const handleEditClick = (e, route) => {
    e.stopPropagation(); // <li>의 onLoadRoute 실행 방지
    // ⬅️ App.jsx의 모달 열기 함수만 호출
    onOpenEditModal(route); 
  };
  // 🔺🔺🔺

  if (!currentUser) {
    // (참고: App.jsx의 Login Wall 때문에 이 코드는 실행되지 않음)
    return <p>로그인이 필요합니다.</p>;
  }

  return (
    <div style={styles.container}>
      <h2>My Page</h2>
      
      <div style={styles.profileBox}>
        <p><strong>닉네임:</strong> {currentUser.nickname}</p>
        <p><strong>이메일:</strong> {currentUser.email}</p>
        <button onClick={onLogout} style={styles.logoutButton}>
          로그아웃
        </button>
      </div>

      <h3>My Route</h3>
      {loading && <p>경로를 불러오는 중...</p>}
      {!loading && savedRoutes.length === 0 && (
        <p>저장된 경로가 없습니다.</p>
      )}
      <ul style={styles.routeList}>
        {savedRoutes.map(route => (
          <li 
            key={route.id} 
            style={{
              ...styles.routeItem,
              backgroundColor: hoveredRouteId === route.id ? '#f0f0f0' : 'transparent'
            }}
            onClick={() => onLoadRoute(route)} // ⬅️ <li> 클릭 시 경로 로드
            onMouseEnter={() => setHoveredRouteId(route.id)}
            onMouseLeave={() => setHoveredRouteId(null)}
          >
            {/* 🔻 (항목 1) 경로 정보 (좌측) 🔻 */}
            <div style={styles.routeInfo}>
              <strong>{route.name}</strong>
              <span> ({(route.distanceM / 1000).toFixed(2)} km)</span>
            </div>

            {/* 🔻 (항목 1) 수정/삭제 버튼 (우측) 🔻 */}
            <div style={styles.buttonContainer}>
              <button 
                style={styles.iconButton}
                onClick={(e) => handleEditClick(e, route)}
              >
                ✏️
              </button>
              <button 
                style={{...styles.iconButton, ...styles.deleteButton}}
                onClick={(e) => handleDeleteClick(e, route.id)}
              >
                🗑️
              </button>
            </div>
            {/* 🔺🔺🔺 */}
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  // 🔻 (항목 2) 스크롤을 위해 수정 🔻
  container: {
    padding: '10px',
    height: '100%', // ⬅️ 부모(main)의 100%
    display: 'flex',
    flexDirection: 'column',
  },
  // 🔺🔺🔺
  profileBox: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '20px',
    flexShrink: 0, // ⬅️ (항목 2) 프로필 박스는 줄어들지 않음
  },
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
  // 🔻 (항목 2) 스크롤을 위해 수정 🔻
  routeList: {
    listStyle: 'none',
    padding: 0,
    margin: 0, // ⬅️ (추가) 기본 마진 제거
    flex: 1, // ⬅️ 남은 공간을 모두 차지
    overflowY: 'auto', // ⬅️ 리스트가 길어지면 여기서 스크롤
  },
  // 🔺🔺🔺
  routeItem: {
    padding: '15px 10px', 
    borderBottom: '1px solid #eee',
    cursor: 'pointer', 
    transition: 'background-color 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // ... (routeInfo, buttonContainer, iconButton, deleteButton 스타일은 그대로) ...
  routeInfo: {
    // 텍스트 영역 (자동으로 늘어남)
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0, // 버튼이 줄어들지 않도록
  },
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
  deleteButton: {
    background: '#ffebee', 
    color: '#dc3545',
    border: '1px solid #ffcdd2',
  }
};

export default MyPage;