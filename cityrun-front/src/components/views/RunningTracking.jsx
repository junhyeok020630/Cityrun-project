import React from 'react';
import MapComponent from '../Map.jsx';
import SosButton from '../SosButton.jsx'; 

const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const RunningTracking = (props) => {
  const {
    userId, userLocation, 
    runTime, runDistance, currentPace,
    recommendedRoute, routeData,
    onMapClick, onPauseRun
  } = props;

  return (
    <div style={styles.trackingContainer}>
      {/* SOS 버튼 (절반 크기) */}
      {userId && userLocation && (
        <div style={styles.sosButtonWrapper}>
          <SosButton userId={userId} userLocation={userLocation} />
        </div>
      )}
      
      {/* 상단바 (시간만) */}
      <div style={styles.topBar}>
        <div style={styles.metric}>
          <span style={styles.metricValue}>{formatTime(runTime)}</span>
        </div>
        {/* TODO: 거리, 페이스 */}
      </div>
      
      {/* (항목 2) 중앙 지도 (스타일 수정) */}
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

      {/* 하단 일시정지 버튼 */}
      <div style={styles.controls}>
        <br/>
        <button onClick={onPauseRun} style={styles.pauseButton}>
          ❚❚
        </button>
      </div>
    </div>
  );
};

const styles = {
  trackingContainer: {
    width: '100%',
    height: '100%', // 부모(mainContent)의 100%
    display: 'flex',
    flexDirection: 'column', // 수직 flex
    backgroundColor: '#F19C4D', 
    color: 'black',
    position: 'relative', 
  },
  sosButtonWrapper: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 1010, // 맵(990)보다 높게
    transform: 'scale(0.7)', 
    transformOrigin: 'top right',
  },
  topBar: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    background: '#f19c4d',
    zIndex: 1000,
    height: '90px', // 1. 상단 고정 높이
    flexShrink: 0,  // 2. 줄어들지 않음
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: '48px',
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: '16px',
    color: '#888',
  },
  // 🔻 (항목 2) 맵 컨테이너가 남은 공간을 꽉 채움 (flex: 1) 🔻
  mapContainer: {
    height: '400px', 
    backgroundColor: '#f0f0f0',
    margin: '10px',
    borderRadius: '8px',
    border: '1px solid #eee',
    display: 'flex', 
  },
  // 🔺🔺🔺
  controls: {
    padding: '30px',
    display: 'flex',
    justifyContent: 'center',
    background: '#f19c4d',
    zIndex: 1000,
    height: '140px', // 4. 하단 고정 높이
    flexShrink: 0,  // 5. 줄어들지 않음
  },
  pauseButton: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    fontSize: '30px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  }
};

export default RunningTracking;