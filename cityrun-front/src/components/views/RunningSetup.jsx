// '홈' 탭의 메인 화면: 경로 추천 설정 및 시작 UI 뷰
import React from 'react';
import MapComponent from '../Map.jsx'; // Naver 지도 컴포넌트
import DataPanel from '../DataPanel.jsx'; // 경로 정보 표시 패널

// App.jsx로부터 모든 state와 handler를 props로 전달받음
const RunningSetup = (props) => {
  const {
    routeData, // 현재 경로 설정값 (목표 거리, 출발지 등)
    recommendedRoute, // 추천 완료된 경로 정보
    loading, // 로딩 상태
    error, // 오류 메시지
    userLocation, // 사용자 현재 위치
    onMapClick, // 지도 클릭 핸들러
    onRecommend, // 경로 추천 핸들러
    onStartNavigation, // 운동 시작 핸들러
    onSaveRoute, // 경로 저장 핸들러
    onOpenSettings, // 설정 모달 열기 핸들러
    onOpenSearch // 검색 모달 열기 핸들러
  } = props;

  return (
    // 전체 화면을 '상단'과 '하단' 컨트롤 영역으로 분리
    <div style={styles.setupContainer}>
      
      {/* --- 상단 영역 (지도, 정보) --- */}
      <div style={styles.topSection}>
        <h2>Gachon City RUN</h2>
        
        {/* 프로토타입 안내 문구 */}
        <p style={styles.notice}>
          ⚠️ 현재 이 웹 서비스는 <strong>프로토타입</strong>이며,{' '}
          <strong>서울 시내에서만</strong> 테스트 가능합니다
          (알고리즘 확인 최적화 데이터 : 롯데월드, 롯데월드에서 횡단보도 회피 기능을 껐다 켜가며 테스트)
        </p>

        {/* Naver 지도 컴포넌트 래퍼 */}
        <div style={styles.miniMapContainer}>
          {userLocation && ( // 사용자 위치가 있어야 지도 렌더링
            <MapComponent
              route={recommendedRoute} // 추천된 경로 (폴리라인 그리기용)
              userLocation={userLocation} // 사용자 현재 위치 (파란 점)
              onMapClick={onMapClick} // 지도 클릭 시 출발지 설정
              routeData={routeData} // 출발지 마커 표시용
              searchResults={[]} // 검색 결과 (여기서는 사용 안 함)
            />
          )}
        </div>

        {/* 경로 추천 전/후 UI 분기 */}
        {recommendedRoute ? (
          // (A) 경로 추천 후: DataPanel (경로 상세 정보) 표시
          <DataPanel route={recommendedRoute} />
        ) : (
          // (B) 경로 추천 전: 안내 텍스트 표시
          !loading && ( // (로딩 중이 아닐 때만)
            <p style={styles.instructionText}>
              지도에서 출발지를 선택하세요
            </p>
          )
        )}
      </div>

      {/* --- 하단 컨트롤 영역 --- */}
      <div style={styles.controlsSection}>

        {/* 재추천 버튼 또는 출발지 안내 텍스트 */}
        <div style={styles.redoButtonContainer}>
          {loading ? null : recommendedRoute ? (
            // (A) 추천 경로가 있으면: 재추천 버튼 (↻) 표시
            <button onClick={onRecommend} style={styles.redoButton}>
              ↻
            </button>
          ) : !routeData.origin ? (
            // (B) 추천 경로가 없고, 출발지도 없으면: 안내 문구 표시
            <span style={styles.instructionText}>
              출발지 설정이 필요합니다
            </span>
          ) : (
            // (C) 출발지만 있으면: 빈 공간 유지 (아래 '경로 추천' 버튼이 있으므로)
            null 
          )}
        </div>

        {/* 메인 컨트롤 버튼 (설정, 시작/추천, 검색) */}
        <div style={styles.mainControls}>
          {/* 설정 버튼 */}
          <button onClick={onOpenSettings} style={styles.sideButton} disabled={loading}>
            ⚙️
          </button>
          
          {/* 중앙 버튼 (경로 추천 / 시작) */}
          <button
            // (A) 추천 경로가 있으면 '시작' 핸들러, 없으면 '경로 추천' 핸들러 호출
            onClick={recommendedRoute ? onStartNavigation : onRecommend}
            // 로딩 중이거나, 출발지가 없으면 비활성화
            disabled={loading || !routeData.origin}
            style={styles.startButton}
          >
            {/* 버튼 텍스트 분기 처리 */}
            {loading ? '...' : (recommendedRoute ? '시작' : '경로 추천')}
          </button>

          {/* 검색 버튼 */}
          <button onClick={onOpenSearch} style={styles.sideButton} disabled={loading}>
            🔍
          </button>
        </div>

        {/* 경로 저장 버튼 (추천 완료 시에만 노출) */}
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
  // 상단/하단 분리 Flex 컨테이너
  setupContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between', // 상단은 위로, 하단은 아래로
    height: '100%', // 부모(mainContent)의 100%
  },
  // 상단 영역 (패딩)
  topSection: {
    padding: '0 0 20px 0',
  },
  // 하단 컨트롤 영역 (중앙 정렬)
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0 0 0',
  },
  // 안내 문구 스타일
  notice: {
    padding: '8px 12px',
    marginBottom: '8px',
    backgroundColor: '#fffbe6',
    border: '1px solid #ffe58f',
    borderRadius: '5px',
    fontSize: '13px',
    color: '#8c6d1f',
  },
  // 지도 컨테이너 (고정 높이)
  miniMapContainer: {
    height: '250px',
    width: '100%',
    border: '1px solid #eee',
    borderRadius: '8px',
    overflow: 'hidden', 
  },
  // 출발지 선택 안내 텍스트
  instructionText: {
    fontSize: '16px',
    color: '#555',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '20px 0', // DataPanel 대신 공간 차지
  },
  // 재추천 버튼 컨테이너 (높이 고정)
  redoButtonContainer: {
    height: '50px',
    marginBottom: '10px',
  },
  // 재추천 버튼 (원형)
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
  // 메인 컨트롤 행 (설정/시작/검색)
  mainControls: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  // 양 옆 설정/검색 버튼 (원형)
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
  // 중앙 시작/추천 버튼 (큰 원형)
  startButton: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#F19C4D', // 주황색 배경
    border: 'none',
    color: 'black', // 검정색 텍스트
    fontSize: '22px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  },
  // 경로 저장 버튼 컨테이너 (높이 고정)
  saveButtonContainer: {
    height: '30px',
    marginTop: '10px',
  },
  // 경로 저장 버튼 (텍스트 링크 스타일)
  saveButtonText: {
    background: 'white',
    border: '1px solid #ccc',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '16px',
    textDecoration: 'none',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '20px',
  },
  // (미사용) 상태 메시지
  status: {
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '15px',
  },
};

export default RunningSetup;