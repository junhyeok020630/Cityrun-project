// '운동 일시정지' 화면 뷰: 지도, 시간, 재시작/중단 버튼 UI
import React from 'react';
import MapComponent from '../Map.jsx'; // Naver 지도 컴포넌트

// 초(sec)를 '00:00' 형식의 문자열로 변환하는 헬퍼 함수
const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// App.jsx로부터 state와 handler를 props로 전달받음
const RunningPaused = (props) => {
  const {
    runTime, // 현재 운동 시간
    userLocation, // 사용자 현재 위치
    recommendedRoute, // 추천 경로
    routeData, // 출발지 정보
    onMapClick, // 지도 클릭 핸들러 (비활성화)
    onResumeRun, // '재시작' 핸들러 (App.jsx)
    onStopRun // '중단' 핸들러 (App.jsx)
  } = props;

  return (
    <div style={styles.pausedContainer}>
      
      {/* 상단 지도 영역 */}
      <div style={styles.mapContainer}>
        {userLocation && ( // 사용자 위치가 있어야 지도 렌더링
          <MapComponent
            route={recommendedRoute}
            userLocation={userLocation}
            onMapClick={onMapClick}
            routeData={routeData}
            searchResults={[]}
          />
        )}
      </div>

      {/* 중앙 데이터 (운동 시간) */}
      <div style={styles.dataContainer}>
        <span style={styles.metricValue}>{formatTime(runTime)}</span>
      </div>

      {/* 하단 제어 버튼 (중단 / 재시작) */}
      <div style={styles.controls}>
        {/* '중단' 버튼 */}
        <button onClick={onStopRun} style={styles.stopButton}>
          ■
        </button>
        {/* '재시작' 버튼 */}
        <button onClick={onResumeRun} style={styles.resumeButton}>
          ▶
        </button>
      </div>
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // 뷰 전체 컨테이너 (Flex 수직 정렬)
  pausedContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white', 
  },
  // 지도 컨테이너
  mapContainer: {
    height: '400px', 
    backgroundColor: '#f0f0f0',
    margin: '10px',
    borderRadius: '8px',
    border: '1px solid #eee',
    display: 'flex', 
  },
  // 중앙 데이터 (시간) 컨테이너
  dataContainer: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  metricLabel: {
    fontSize: '16px',
    color: '#888',
  },
  // 시간 텍스트 (48px, Bold)
  metricValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'black',
  },
  // 하단 컨트롤 (버튼) 컨테이너
  controls: {
    display: 'flex',
    justifyContent: 'space-around', // 버튼 좌우로 정렬
    alignItems: 'center',
    padding: '20px',
  },
  // '중단' 버튼 (원형, 검정)
  stopButton: {
    width: '80px',
    height: '80px',
    borderRadius: '50%', // 원형
    padding: '0',
    fontSize: '40px', // 아이콘 크기
    fontWeight: 'bold',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  // '재시작' 버튼 (원형, 주황)
  resumeButton: {
    width: '80px',
    height: '80px',
    borderRadius: '50%', // 원형
    padding: '0',
    fontSize: '30px', // 아이콘 크기
    fontWeight: 'bold',
    backgroundColor: '#f19c4d', // 주황색 배경
    color: 'black',
    border: 'none',
    cursor: 'pointer',
  }
};

export default RunningPaused;