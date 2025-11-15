import React, { useState, useEffect } from 'react';
import axios from 'axios';

// (항목 5) TODO: RunningPaused에서 가져온 포맷 헬퍼
const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
// (항목 5) TODO: 페이스 포맷 헬퍼 (km당 초 -> 00'00")
const formatPace = (paceInSeconds) => {
  if (!paceInSeconds || paceInSeconds === 0) return "-'--";
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = paceInSeconds % 60;
  return `${minutes}'${String(seconds).padStart(2, '0')}"`;
};

// (수정) 🔻 요청사항: 날짜/시간 포맷을 두 줄로 분리 🔻
const formatActivityHeader = (createdAt) => {
  const date = new Date(createdAt);
  
  // Line 1: YYYY. M. D. - HH:MM (오전/오후)
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
  const line1 = `${dateString} - ${timeString}`; // 예: "2025. 11. 15. - 오후 9:38"

  // Line 2: 요일 시간대 러닝
  const dayOfWeek = date.toLocaleString('ko-KR', { weekday: 'long' }); 
  
  const hour = date.getHours();
  let timeOfDay = '';
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
// 🔺🔺🔺

// 🔻 (수정) onDeleteActivity prop 받기 🔻
const ActivityPage = ({ currentUser, onDeleteActivity }) => {
  // (항목 4) 🔻 운동 기록 state 🔻
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  // 🔺🔺🔺

  // (항목 4) 🔻 로그인 상태가 되면 운동 기록을 불러옴 🔻
  useEffect(() => {
    if (currentUser) {
      const fetchActivities = async () => {
        setLoading(true);
        try {
          // /api/activities/mine (ActivityController.getMyActivities) 호출
          const response = await axios.get('/api/activities/mine');
          setActivities(response.data);
        } catch (err) {
          console.error("활동 기록 로딩 실패:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchActivities();
    } else {
      setActivities([]); // 로그아웃 시 목록 비우기
    }
  }, [currentUser]);
  // 🔺🔺🔺

  // 🔻 (추가) 2. 삭제 핸들러 (MyPage.jsx와 동일한 로직) 🔻
  const handleDeleteClick = async (e, activityId) => {
    e.stopPropagation(); // li 클릭(상세보기) 방지
    if (!onDeleteActivity) return; 

    // App.jsx의 핸들러(API 호출)
    const success = await onDeleteActivity(activityId); 
    
    if (success) {
      // 성공 시, state에서 즉시 제거하여 UI 업데이트
      setActivities(prevActivities => 
        prevActivities.filter(act => act.id !== activityId)
      );
    }
  };
  // 🔺🔺🔺

  // (항목 4) 🔻 App.jsx의 Login Wall로 인해 이 부분은 필요 없음 🔻
  // if (!currentUser) { ... }
  // 🔺🔺🔺

  return (
    // 🔻 (수정) 1. 스크롤을 위한 flex 컨테이너로 변경 🔻
    <div style={styles.container}>
      <h2 style={{ flexShrink: 0 }}>활동</h2> 
      {loading && <p style={{ flexShrink: 0 }}>운동 기록을 불러오는 중...</p>}
     
      {!loading && activities.length === 0 && (
        <p style={{ flexShrink: 0 }}>아직 운동 기록이 없습니다.</p>
      )}
    {/* 🔺🔺🔺 */}

      <ul style={styles.activityList}>
        {activities.map(activity => {
          // (추가) 🔻 헬퍼 함수 미리 호출 🔻
          const headerData = formatActivityHeader(activity.createdAt);
          // 🔺🔺🔺

          return (
            // 🔻 (수정) 2. 삭제 버튼을 위한 flex li 🔻
          <li key={activity.id} style={styles.activityItem}>
              {/* 2-1. 콘텐츠 래퍼 */}
              <div style={{ flex: 1 }}>
            
                {/* (수정) 🔻 요청사항: 헤더 레이아웃 변경 (두 줄) 🔻 */}
                <div style={styles.activityHeader}>
                  {/* 1. 날짜/시간 (윗줄) + 요일/시간대 (아랫줄) */}
                  <div style={styles.activityTitleContainer}>
                    <div style={styles.activityTitleDate}>
                      {headerData.line1}
                    </div>
                    <div style={styles.activityTitleDetails}>
                      {headerData.line2}
                    </div>
                  </div>
                  
                  {/* 2. 거리 (이전과 동일) */}
                  <div style={styles.distanceBlock}>
                    <span style={styles.distanceNumber}>
                      {(activity.distanceM / 1000).toFixed(2)}
                    </span>
                    <span style={styles.distanceUnit}>
                      km
                    </span>
                  </div>
                </div>
                {/* 🔺🔺🔺 */}

                {/* (유지) 🔻 요청사항: 시간과 페이스는 기존처럼 유지 🔻 */}
                <div style={styles.activityBody}>
                  <span>시간: {formatTime(activity.durationS)}</span>
                  <span>평균 페이스: {formatPace(activity.avgPaceSPerKm)}</span>
                </div>
                {/* 🔺🔺🔺 */}
              </div>

              {/* 2-2. 삭제 버튼 컨테이너 (MyPage.jsx에서 복사) */}
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

// 🔻 (수정) 1. 스크롤 스타일 및 2. 버튼 스타일 추가 🔻
const styles = {
  // 1. 스크롤을 위해 MyPage.jsx 스타일 적용
  container: {
    padding: '10px',
    height: '100%', // ⬅️ (추가) 부모(main)의 100%
    display: 'flex', // ⬅️ (추가)
    flexDirection: 'column', // ⬅️ (추가)
  },
  activityList: {
    listStyle: 'none',
    padding: 0,
    margin: 0, // ⬅️ (추가)
    flex: 1, // ⬅️ (추가) 남은 공간을 모두 차지
    overflowY: 'auto', // ⬅️ 리스트가 길어지면 여기서 스크롤
  },
  // 2. 삭제 버튼을 위해 MyPage.jsx 스타일 적용
  activityItem: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex', // ⬅️ flex
    justifyContent: 'space-between', // ⬅️ space-between
    alignItems: 'center', // ⬅️ center
    gap: '10px', // ⬅️ (추가) 콘텐츠와 버튼 사이 간격
  },
  // (유지)
  activityHeader: {
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  activityTitleContainer: {
    marginBottom: '8px', 
  },
  activityTitleDate: {
    fontSize: '12px',
    color: '#777', 
    marginBottom: '2px', 
  },
  activityTitleDetails: {
    fontSize: '16px', 
    color: '#333',
    fontWeight: '500', 
  },
  distanceBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start', 
  },
  distanceNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    lineHeight: 1.1,
  },
  distanceUnit: {
    fontSize: '14px',
    color: '#333',
  },
  activityBody: {
    display: 'flex',
    justifyContent: 'space-around',
    fontSize: '14px',
    color: '#555',
  },

  // 🔻 (추가) 2. MyPage.jsx에서 복사한 버튼 스타일 🔻
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
  // 🔺🔺🔺
};
// 🔺🔺🔺

export default ActivityPage;