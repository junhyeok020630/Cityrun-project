// '활동' 탭 뷰: 내 운동 기록 목록 조회 및 삭제 UI
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // API 호출 라이브러리

// 초(sec)를 '00:00' (분:초) 형식으로 변환하는 헬퍼 함수
const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 평균 페이스(km당 초)를 '0'00"' (분'초") 형식으로 변환하는 헬퍼 함수
const formatPace = (paceInSeconds) => {
  if (!paceInSeconds || paceInSeconds === 0) return "-'--"; // 0 또는 null일 경우
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = paceInSeconds % 60;
  return `${minutes}'${String(seconds).padStart(2, '0')}"`;
};

// 활동 기록 시간을 두 줄 형식(날짜/시간, 요일/시간대)으로 변환하는 헬퍼 함수
const formatActivityHeader = (createdAt) => {
  const date = new Date(createdAt);
  
  // Line 1: YYYY M D - HH:MM (오전/오후)
  const dateString = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const timeString = date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const line1 = `${dateString} - ${timeString}`; // 예: "2025 11 15 - 오후 9:38"

  // Line 2: 요일 시간대 러닝
  const dayOfWeek = date.toLocaleString('ko-KR', { weekday: 'long' }); 
  
  const hour = date.getHours();
  let timeOfDay = ''; // 아침/점심/저녁/야간
  if (hour >= 5 && hour < 12) {
    timeOfDay = '아침';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = '점심';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = '저녁';
  } else {
    timeOfDay = '야간';
  }
  
  const line2 = `${dayOfWeek} ${timeOfDay} 러닝`; // 예: "토요일 저녁 러닝"

  return { line1, line2 };
};

/**
 * 활동 페이지 컴포넌트
 * @param {object} props
 * @param {object} props.currentUser - 현재 로그인한 사용자 정보
 * @param {function} props.onDeleteActivity - 활동 삭제 핸들러 (App.jsx에서 전달)
 */
const ActivityPage = ({ currentUser, onDeleteActivity }) => {
  // --- State 정의 ---
  const [activities, setActivities] = useState([]); // 운동 기록 목록
  const [loading, setLoading] = useState(false); // 로딩 상태

  // --- useEffect ---
  // 'currentUser' state가 변경될 때 (로그인/로그아웃 시) 실행
  useEffect(() => {
    if (currentUser) {
      // (A) 로그인 상태: 내 활동 기록을 API로 조회
      const fetchActivities = async () => {
        setLoading(true);
        try {
          // GET /api/activities/mine API 호출
          const response = await axios.get('/api/activities/mine');
          setActivities(response.data); // 응답 데이터를 state에 저장
        } catch (err) {
          console.error("활동 기록 로딩 실패:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchActivities();
    } else {
      // (B) 로그아웃 상태: 활동 기록 목록 비우기
      setActivities([]);
    }
  }, [currentUser]); // currentUser가 바뀔 때마다 이 effect 재실행

  // '삭제' 버튼 클릭 핸들러
  const handleDeleteClick = async (e, activityId) => {
    e.stopPropagation(); // 이벤트 버블링 방지 (li의 onClick 실행 방지)
    if (!onDeleteActivity) return; 

    // App.jsx의 onDeleteActivity(API 호출) 실행
    const success = await onDeleteActivity(activityId); 
    
    if (success) {
      // API 호출 성공 시, state에서도 해당 항목 즉시 제거 (UI 새로고침)
      setActivities(prevActivities => 
        prevActivities.filter(act => act.id !== activityId)
      );
    }
  };

  return (
    // 스크롤을 위한 Flex 컨테이너 (App.jsx의 mainContent 하위)
    <div style={styles.container}>
      <h2 style={{ flexShrink: 0 }}>활동</h2> 
      {loading && <p style={{ flexShrink: 0 }}>운동 기록을 불러오는 중...</p>}
     
      {!loading && activities.length === 0 && (
        <p style={{ flexShrink: 0 }}>아직 운동 기록이 없습니다</p>
      )}

      {/* 활동 기록 목록 (스크롤 영역) */}
      <ul style={styles.activityList}>
        {activities.map(activity => {
          // 날짜/시간 포맷 헬퍼 미리 호출
          const headerData = formatActivityHeader(activity.createdAt);

          return (
            // 개별 활동 아이템 (li)
          <li key={activity.id} style={styles.activityItem}>
              {/* 1. 콘텐츠 래퍼 */}
              <div style={{ flex: 1 }}>
            
                {/* 1-1. 활동 헤더 (날짜/시간, 거리) */}
                <div style={styles.activityHeader}>
                  {/* 날짜/시간 (두 줄) */}
                  <div style={styles.activityTitleContainer}>
                    <div style={styles.activityTitleDate}>
                      {headerData.line1}
                    </div>
                    <div style={styles.activityTitleDetails}>
                      {headerData.line2}
                    </div>
                  </div>
                  
                  {/* 거리 (우측) */}
                  <div style={styles.distanceBlock}>
                    <span style={styles.distanceNumber}>
                      {(activity.distanceM / 1000).toFixed(2)}
                    </span>
                    <span style={styles.distanceUnit}>
                      km
                    </span>
                  </div>
                </div>

                {/* 1-2. 활동 본문 (시간, 평균 페이스) */}
                <div style={styles.activityBody}>
                  <span>시간: {formatTime(activity.durationS)}</span>
                  <span>평균 페이스: {formatPace(activity.avgPaceSPerKm)}</span>
                </div>
              </div>

              {/* 2. 삭제 버튼 컨테이너 */}
              <div style={styles.buttonContainer}>
                <button 
                  style={{...styles.iconButton, ...styles.deleteButton}}
                  onClick={(e) => handleDeleteClick(e, activity.id)}
                >
                  🗑️
                </button>
              </div>
          </li>
          );
        })}
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
  // 활동 목록 (ul)
  activityList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    flex: 1, // 남은 공간을 모두 차지 (스크롤 영역)
    overflowY: 'auto', // 내용이 넘칠 경우 수직 스크롤
  },
  // 개별 활동 아이템 (li)
  activityItem: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex', // Flex (콘텐츠 + 버튼)
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px', // 콘텐츠와 버튼 사이 간격
  },
  // 활동 헤더 (날짜/거리)
  activityHeader: {
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  // 날짜/시간 컨테이너
  activityTitleContainer: {
    marginBottom: '8px', 
  },
  // 날짜/시간 (윗줄)
  activityTitleDate: {
    fontSize: '12px',
    color: '#777', 
    marginBottom: '2px', 
  },
  // 요일/시간대 (아랫줄)
  activityTitleDetails: {
    fontSize: '16px', 
    color: '#333',
    fontWeight: '500', 
  },
  // 거리 표시 블록
  distanceBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start', 
  },
  // 거리 숫자 (36px, Bold)
  distanceNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    lineHeight: 1.1,
  },
  // 'km' 단위
  distanceUnit: {
    fontSize: '14px',
    color: '#333',
  },
  // 활동 본문 (시간/페이스)
  activityBody: {
    display: 'flex',
    justifyContent: 'space-around',
    fontSize: '14px',
    color: '#555',
  },
  // 삭제 버튼 컨테이너 (MyPage.jsx와 유사)
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

export default ActivityPage;