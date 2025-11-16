// '운동 중' 화면 뷰: 지도, 운동 시간, SOS 버튼, 일시정지 버튼 UI
import React from 'react';
import MapComponent from '../Map.jsx'; // Naver 지도 컴포넌트
import SosButton from '../SosButton.jsx'; // SOS 버튼 컴포넌트

// 초(sec)를 '00:00' 형식의 문자열로 변환하는 헬퍼 함수
const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// App.jsx로부터 state와 handler를 props로 전달받음
const RunningTracking = (props) => {
  const {
    userId, // 현재 사용자 ID (SOS 버튼용)
    userLocation, // 사용자 현재 위치 (지도 표시용)
    runTime, // 현재 운동 시간
    runDistance, // 현재 운동 거리 (미표시)
    currentPace, // 현재 페이스 (미표시)
    recommendedRoute, // 추천 경로 (지도 표시용)
    routeData, // 출발지 정보 (지도 표시용)
    onMapClick, // 지도 클릭 핸들러 (현재 비활성화 상태)
    onPauseRun // '일시정지' 핸들러 (App.jsx)
  } = props;

  return (
    // 전체 뷰 컨테이너 (주황색 배경)
    <div style={styles.trackingContainer}>
      
      {/* SOS 버튼 (우측 상단 절대 위치) */}
      {userId && userLocation && (
        <div style={styles.sosButtonWrapper}>
          <SosButton userId={userId} userLocation={userLocation} />
        </div>
      )}
      
      {/* 상단바 (운동 시간만 표시) */}
      <div style={styles.topBar}>
        <div style={styles.metric}>
          <span style={styles.metricValue}>{formatTime(runTime)}</span>
        </div>
      </div>
      
      {/* 중앙 지도 영역 */}
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

      {/* 하단 제어 버튼 (일시정지) */}
      <div style={styles.controls}>
        <br/>
        <button onClick={onPauseRun} style={styles.pauseButton}>
          ❚❚
        </button>
      </div>
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // 뷰 전체 컨테이너 (Flex 수직 정렬)
  trackingContainer: {
    width: '100%',
    height: '100%', // 부모(mainContent)의 100%
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F19C4D', // 주황색 배경
    color: 'black',
    position: 'relative', 
  },
  // SOS 버튼 래퍼 (크기 0.7배 축소)
  sosButtonWrapper: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 1010, // 지도보다 높게
    transform: 'scale(0.7)', 
    transformOrigin: 'top right',
  },
  // 상단바 (시간 표시 영역)
  topBar: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    background: '#f19c4d',
    zIndex: 1000,
    height: '90px', // 고정 높이
    flexShrink: 0,  // 축소 방지
  },
  // 시간 표시 메트릭
  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  // 시간 텍스트 (48px, Bold)
  metricValue: {
    fontSize: '48px',
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: '16px',
    color: '#888',
  },
  // 지도 컨테이너 (Flex Item)
  mapContainer: {
    height: '400px', // 고정 높이 (App.jsx 수정으로 flex:1 대신 사용됨)
    backgroundColor: '#f0f0f0',
    margin: '10px',
    borderRadius: '8px',
    border: '1px solid #eee',
    display: 'flex', 
  },
  // 하단 컨트롤 (일시정지 버튼 영역)
  controls: {
    padding: '30px',
    display: 'flex',
    justifyContent: 'center',
    background: '#f19c4d',
    zIndex: 1000,
    height: '140px', // 고정 높이
    flexShrink: 0,  // 축소 방지
  },
  // 일시정지 버튼 (원형)
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