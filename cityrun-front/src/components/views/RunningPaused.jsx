import React from 'react';
import MapComponent from '../Map.jsx';

const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const RunningPaused = (props) => {
  const {
    runTime,
    userLocation, recommendedRoute, routeData,
    onMapClick, onResumeRun, onStopRun
  } = props;

  return (
    <div style={styles.pausedContainer}>
      
      {/* (항목 1) 프로토타입 경고문 제거 */}

      {/* 상단 지도 */}
      <div style={styles.mapContainer}>
        {userLocation && (
          <MapComponent
            route={recommendedRoute}
            userLocation={userLocation}
            onMapClick={onMapClick}
            routeData={routeData}
            searchResults={[]}
          />
        )}
      </div>

      {/* 중앙 데이터 (시간만) */}
      <div style={styles.dataContainer}>
        <span style={styles.metricValue}>{formatTime(runTime)}</span>
      </div>

      {/* 하단 제어 버튼 */}
      <div style={styles.controls}>
        {/* 🔻🔻🔻 (항목 2) 텍스트 제거 🔻🔻🔻 */}
        <button onClick={onStopRun} style={styles.stopButton}>
          ■
        </button>
        <button onClick={onResumeRun} style={styles.resumeButton}>
          ▶
        </button>
        {/* 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺 */}
      </div>
    </div>
  );
};

const styles = {
  pausedContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white', 
  },
  // (항목 1) 경고문 스타일 제거
  mapContainer: {
    height: '400px', 
    backgroundColor: '#f0f0f0',
    margin: '10px',
    borderRadius: '8px',
    border: '1px solid #eee',
    display: 'flex', 
  },
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
  metricValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'black',
  },
  controls: {
    display: 'flex',
    // 🔻 (항목 1) flex:1이 아니므로 gap 대신 정렬 🔻
    justifyContent: 'space-around',
    alignItems: 'center',
    // 🔺🔺🔺
    padding: '20px',
  },
  stopButton: {
    // 🔻🔻🔻 (항목 1, 2, 3) 스타일 수정 🔻🔻🔻
    width: '80px',
    height: '80px',
    borderRadius: '50%', // 원형
    padding: '0', // 패딩 제거
    fontSize: '30px', // 아이콘 크기
    fontWeight: 'bold',
    backgroundColor: 'black', // (항목 3) 검정 배경
    color: 'white', // (항목 3) 흰색 아이콘
    border: 'none',
    // 🔺🔺🔺
    cursor: 'pointer',
  },
  resumeButton: {
    // 🔻🔻🔻 (항목 1, 2, 3) 스타일 수정 🔻🔻🔻
    width: '80px',
    height: '80px',
    borderRadius: '50%', // 원형
    padding: '0', // 패딩 제거
    fontSize: '30px', // 아이콘 크기
    fontWeight: 'bold',
    backgroundColor: '#f19c4d', // (항목 3) 주황색 배경
    color: 'black', // (항목 3) 검정 아이콘
    border: 'none',
    // 🔺🔺🔺
    cursor: 'pointer',
  }
};

export default RunningPaused;