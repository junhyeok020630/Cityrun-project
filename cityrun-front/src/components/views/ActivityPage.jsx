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

const ActivityPage = ({ currentUser }) => {
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

  // (항목 4) 🔻 App.jsx의 Login Wall로 인해 이 부분은 필요 없음 🔻
  // if (!currentUser) { ... }
  // 🔺🔺🔺

  return (
    <div style={styles.container}>
      <h2>활동</h2>
      {loading && <p>운동 기록을 불러오는 중...</p>}
     
      {/* (항목 1) 🔻 데이터가 없을 때만 "기록 없음" 표시 🔻 */}
      {!loading && activities.length === 0 && (
        <p>아직 운동 기록이 없습니다.</p>
      )}
      {/* 🔺🔺🔺 */}

      <ul style={styles.activityList}>
        {activities.map(activity => {
          // (추가) 🔻 헬퍼 함수 미리 호출 🔻
          const headerData = formatActivityHeader(activity.createdAt);
          // 🔺🔺🔺

          return (
          <li key={activity.id} style={styles.activityItem}>
            
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
          </li>
          );
        })}
      </ul>
    </div>
  );
};

// (항목 4) 🔻 스타일 (수정됨) 🔻
const styles = {
  container: {
    padding: '10px',
  },
  activityList: {
    listStyle: 'none',
    padding: 0,
    overflowY: 'auto', // ⬅️ 리스트가 길어지면 여기서 스크롤
  },
  activityItem: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  // (유지) 🔻 헤더 스타일 🔻
  activityHeader: {
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  // 🔺🔺🔺

  // (수정) 🔻 요청사항: 제목 컨테이너 (두 줄 래퍼) 🔻
  activityTitleContainer: {
    marginBottom: '8px', // 거리와 간격
  },
  // (추가) 🔻 요청사항: 날짜 + 시간 (윗줄) 🔻
  activityTitleDate: {
    fontSize: '12px',
    color: '#777', // 이미지의 회색 텍스트 참고
    marginBottom: '2px', // 아랫줄과의 간격
  },
  // (수정) 🔻 요청사항: 요일 + 시간대 (아랫줄) 🔻
  activityTitleDetails: {
    fontSize: '16px', // "월요일 야간 러닝" 텍스트
    color: '#333',
    fontWeight: '500', 
  },
  // 🔺🔺🔺

  // (유지) 🔻 요청사항: 거리 표시 블록 🔻
  distanceBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start', // 좌측 정렬
  },
  // (유지) 🔻 요청사항: 거리 숫자 (크게) 🔻
  distanceNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    lineHeight: 1.1,
  },
  // (유지) 🔻 요청사항: 거리 단위 (작게) 🔻
  distanceUnit: {
    fontSize: '14px',
    color: '#333',
  },
  // 🔺🔺🔺
  
  // (유지) 🔻 요청사항: 시간/페이스 영역 🔻
  activityBody: {
    display: 'flex',
    justifyContent: 'space-around',
    fontSize: '14px',
    color: '#555',
  }
};
// 🔺🔺🔺

export default ActivityPage;