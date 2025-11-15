import React, { useState, useEffect } from 'react';
import axios from 'axios';

// (항목 1) 🔻 formatTime을 prop으로 받도록 수정 (App.jsx에서 받음) 🔻
const ActivityPage = ({ currentUser, onSelectActivity, formatTime, onDeleteActivity }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredActivityId, setHoveredActivityId] = useState(null); // (항목 2)

  // (항목 1) 🔻 formatPace 함수 제거 🔻

  // 🔻 (항목 1) 활동 목록을 다시 불러오는 함수 🔻
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
  // 🔺🔺🔺

  useEffect(() => {
    if (currentUser) {
      fetchActivities(); // ⬅️ 분리된 함수 호출
    } else {
      setActivities([]); // 로그아웃 시 목록 비우기
    }
  }, [currentUser]);

  // 🔻 (항목 1) 삭제 버튼 클릭 핸들러 🔻
  const handleDeleteClick = async (e, activityId) => {
    e.stopPropagation(); // ⬅️ li의 onSelectActivity 실행 방지
    const success = await onDeleteActivity(activityId);
    if (success) {
      fetchActivities(); // ⬅️ 삭제 성공 시 목록 새로고침
    }
  };
  // 🔺🔺🔺

  if (!currentUser) {
    // (참고: App.jsx의 Login Wall 때문에 이 코드는 실행되지 않음)
    return (
      <div style={styles.container}>
        <h2>활동</h2>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>활동</h2>
      {loading && <p>운동 기록을 불러오는 중...</p>}
      
      {!loading && activities.length === 0 && (
        <p>아직 운동 기록이 없습니다.</p>
      )}

      <ul style={styles.activityList}>
        {activities.map(activity => (
          <li 
            key={activity.id} 
            // (항목 2) 🔻 클릭 이벤트 및 스타일 추가 🔻
            style={{
              ...styles.activityItem,
              backgroundColor: hoveredActivityId === activity.id ? '#f0f0f0' : 'transparent'
            }}
            onClick={() => onSelectActivity(activity)}
            onMouseEnter={() => setHoveredActivityId(activity.id)}
            onMouseLeave={() => setHoveredActivityId(null)}
            // 🔺🔺🔺
          >
            <div style={styles.activityContent}> {/* 🔻 3. 컨텐츠 래퍼 🔻 */}
              {/* (항목 1) 🔻 레이아웃 수정 🔻 */}
              <div style={styles.activityHeader}>
                <strong>{(activity.distanceM / 1000).toFixed(2)} km</strong>
                <span style={styles.timeText}>{formatTime(activity.durationS)}</span>
              </div>
              <div style={styles.activityBody}>
                <span style={styles.dateText}>
                  {new Date(activity.createdAt).toLocaleString('ko-KR', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </span>
                {/* "평균 페이스" 제거 */}
              </div>
              {/* 🔺🔺🔺 */}
            </div>

            {/* 🔻 (항목 1) 삭제 버튼 🔻 */}
            <div style={styles.buttonContainer}>
              <button 
                style={{...styles.iconButton, ...styles.deleteButton}}
                onClick={(e) => handleDeleteClick(e, activity.id)}
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

// 🔻 (항목 1) 스타일 수정 🔻
const styles = {
  // 🔻 (항목 2) 스크롤을 위해 수정 🔻
  container: {
    padding: '10px',
    height: '100%', // ⬅️ 부모(main)의 100%
    display: 'flex',
    flexDirection: 'column',
  },
  activityList: {
    listStyle: 'none',
    padding: 0,
    margin: 0, // ⬅️ (추가) 기본 마진 제거
    flex: 1, // ⬅️ 남은 공간을 모두 차지
    overflowY: 'auto', // ⬅️ 리스트가 길어지면 여기서 스크롤
  },
  // 🔺🔺🔺
  activityItem: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    cursor: 'pointer', 
    transition: 'background-color 0.2s',
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center', 
  },
  activityContent: {
    flexGrow: 1, 
  },
  // ... (activityHeader, timeText, activityBody, dateText, buttonContainer, iconButton, deleteButton 스타일은 그대로) ...
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline', 
    fontSize: '22px', 
    fontWeight: 'bold',
    marginBottom: '8px', 
  },
  timeText: {
    fontSize: '20px',
    fontWeight: 'normal',
    color: '#333',
  },
  activityBody: {
    display: 'flex',
    justifyContent: 'flex-start', 
    fontSize: '14px',
    color: '#555',
  },
  dateText: {
    fontSize: '14px',
    color: '#555',
    fontWeight: 'normal',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    paddingLeft: '10px', 
    flexShrink: 0, 
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

export default ActivityPage;