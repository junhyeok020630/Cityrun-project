import React from 'react';
import MapComponent from '../Map.jsx';
import DataPanel from '../DataPanel.jsx';

// App.jsx로부터 모든 state와 handler를 props로 전달받음
const RunningSetup = (props) => {
  const {
    routeData,
    recommendedRoute, loading, error,
    userLocation,
    onMapClick,
    onRecommend, onStartNavigation, onSaveRoute,
    onOpenSettings, onOpenSearch
  } = props;

  return (
    // (항목 1) 전체 화면을 '상단'과 '하단' 컨트롤 영역으로 분리
    <div style={styles.setupContainer}>
      
      {/* --- 상단 영역 (지도, 정보) --- */}
      <div style={styles.topSection}>
        <h2>Gachon City RUN</h2>
        
        <p style={styles.notice}>
          ⚠️ 현재 이 웹 서비스는 <strong>프로토타입</strong>이며,{' '}
          <strong>서울 시내에서만</strong> 테스트 가능합니다.
          (알고리즘 확인 최적화 데이터 : 롯데월드, 롯데월드에서 횡단보도 회피 기능을 껐다 켜가며 테스트)
        </p>

        <div style={styles.miniMapContainer}>
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

        {/* 🔻🔻🔻 (항목 1) 경로 추천 전/후 UI 분기 🔻🔻🔻 */}
        {recommendedRoute ? (
          // 경로 추천 후: DataPanel 표시
          <DataPanel route={recommendedRoute} />
        ) : (
          // 경로 추천 전: 안내 텍스트 표시
          !loading && ( // 로딩 중이 아닐 때만
            <p style={styles.instructionText}>
              지도에서 출발지를 선택하세요.
            </p>
          )
        )}
        {/* 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺 */}
      </div>

      {/* --- 하단 컨트롤 영역 --- */}
      {/* --- 하단 컨트롤 영역 --- */}
      <div style={styles.controlsSection}>

        {/* 🔻🔻🔻 (항목 1) (수정) 재추천 버튼 또는 출발지 안내 텍스트 🔻🔻🔻 */}
        <div style={styles.redoButtonContainer}>
          {loading ? null : recommendedRoute ? (
            // (A) 추천 경로가 있으면: 재추천 버튼 표시
            <button onClick={onRecommend} style={styles.redoButton}>
              ↻
            </button>
          ) : !routeData.origin ? (
            // (B) 추천 경로가 없고, 출발지도 없으면: 안내 문구 표시
            <span style={styles.instructionText}>
              출발지 설정이 필요합니다.
            </span>
          ) : (
            // (C) 출발지만 있으면: 빈 공간 유지 (경로 추천 버튼이 있으므로)
            null 
          )}
        </div>
        {/* 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺 */}

        {/* (항목 1-1, 1-2) 메인 컨트롤 버튼 (설정, 시작, 검색) */}
        <div style={styles.mainControls}>
          <button onClick={onOpenSettings} style={styles.sideButton} disabled={loading}>
            ⚙️
          </button>
          
          <button
            onClick={recommendedRoute ? onStartNavigation : onRecommend}
            disabled={loading || !routeData.origin}
            style={styles.startButton}
          >
            {loading ? '...' : (recommendedRoute ? '시작' : '경로 추천')}
          </button>

          <button onClick={onOpenSearch} style={styles.sideButton} disabled={loading}>
            🔍
          </button>
        </div>

        {/* (항목 1-4) 경로 저장 버튼 (경로 추천 시에만 노출) */}
        <div style={styles.saveButtonContainer}>
          {recommendedRoute && !loading && (
            <button onClick={onSaveRoute} style={styles.saveButtonText}>
              경로 저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // (항목 1) setupContainer: 상단과 하단을 분리하는 flex 컨테이너
  setupContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between', // 상단은 위로, 하단은 아래로
    height: '100%', // 부모(mainContent)의 100%
  },
  topSection: {
    padding: '0 0 20px 0', // 하단 컨트롤과 겹치지 않게 padding
  },
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0 0 0', // 상단과 겹치지 않게 padding
  },
  notice: {
    padding: '8px 12px',
    marginBottom: '8px',
    backgroundColor: '#fffbe6',
    border: '1px solid #ffe58f',
    borderRadius: '5px',
    fontSize: '13px',
    color: '#8c6d1f',
  },
  miniMapContainer: {
    height: '250px', // (항목 1) 지도를 더 작게
    width: '100%',
    border: '1px solid #eee',
    borderRadius: '8px',
    overflow: 'hidden', 
  },
  // 🔻🔻🔻 (항목 1) instructionText 스타일 추가 🔻🔻🔻
  instructionText: {
    fontSize: '16px',
    color: '#555',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '20px 0', // DataPanel 대신 공간 차지
  },
  // 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺
  // (항목 1-3) 경로 재추천 버튼
  redoButtonContainer: {
    height: '50px', // (항목 1) 버튼 크기에 맞게 높이 조절
    marginBottom: '10px',
  },
  redoButton: {
    background: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
  },
  // (항목 1-2) 메인 컨트롤 행
  mainControls: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  // (항목 1-2) 양 옆 설정/검색 버튼
  sideButton: {
    background: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
  },
  // (항목 1-1) 중앙 시작 버튼
  startButton: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#F19C4D', // (항목 1-1) 주황색 배경
    border: 'none',
    color: 'black', // (항목 1-1) 검정색 텍스트
    fontSize: '22px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  },
  // (항목 1-4) 경로 저장 버튼 (텍스트 링크 스타일)
  saveButtonContainer: {
    height: '30px', // 공간 확보
    marginTop: '10px',
  },
  saveButtonText: {
    background: 'white',
    border: '1px solid #ccc',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '16px',
    textDecoration: 'none', // 밑줄 제거
    cursor: 'pointer',
    padding: '8px 16px', // 버튼 패딩
    borderRadius: '20px', // 둥근 모서리
  },
  status: {
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '15px',
  },
};

export default RunningSetup;