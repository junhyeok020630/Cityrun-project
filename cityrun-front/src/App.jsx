import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// (항목 3) SosButton import 제거
import BottomNav from './components/layout/BottomNav.jsx';
import RunningSetup from './components/views/RunningSetup.jsx';
import RunningTracking from './components/views/RunningTracking.jsx';
import RunningPaused from './components/views/RunningPaused.jsx';
import ActivityPage from './components/views/ActivityPage.jsx';
import MyPage from './components/views/MyPage.jsx';
// (항목 1) 모달 컴포넌트 import
import SettingsModal from './components/views/SettingsModal.jsx';
import SearchModal from './components/views/SearchModal.jsx';

// 서울 범위 (대략)
const SEOUL_BOUNDS = {
  minLat: 37.3,
  maxLat: 37.7,
  minLng: 126.7,
  maxLng: 127.3,
};

const isInSeoul = (lat, lng) =>
  lat >= SEOUL_BOUNDS.minLat &&
  lat <= SEOUL_BOUNDS.maxLat &&
  lng >= SEOUL_BOUNDS.minLng &&
  lng <= SEOUL_BOUNDS.maxLng;

function App() {
  // --- 1. 핵심 State ---
  const [view, setView] = useState('home'); // 'home', 'activity', 'mypage'
  const [runState, setRunState] = useState('setup'); // 'setup', 'running', 'paused'

  // (항목 1) 모달 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // (항목 2) 타이머/위치추적 ID
  const watchIdRef = useRef(null);
  const timerIdRef = useRef(null); // (항목 2) 타이머 ID Ref

  // (항목 2) 운동 데이터
  const [runTime, setRunTime] = useState(0); // 초
  const [runDistance, setRunDistance] = useState(0); // 미터
  const [currentPace, setCurrentPace] = useState(0); // 분/km

  // 경로 추천 관련 State
  const [routeData, setRouteData] = useState({
    distanceKm: 5.0,
    origin: null,
    prefs: {
      avoidUphill: true,
      minimizeCrosswalks: true,
      avoidCrowd: true,
    },
  });
  const [recommendedRoute, setRecommendedRoute] = useState(null);
  
  // 기타 UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userId, setUserId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // --- 2. 초기 위치 획득 ---
  useEffect(() => {
    if (navigator.geolocation && window.naver && window.naver.maps) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
        },
        (err) => {
          const defaultLocation = { lat: 37.5665, lng: 126.978 };
          setUserLocation(defaultLocation);
          console.error('위치 획득 실패(HTTPS 필요):', err);
        }
      );
    } else {
      const defaultLocation = { lat: 37.5665, lng: 126.978 };
      setUserLocation(defaultLocation);
    }
  }, []);

  // 🔻 (항목 2) 타이머 로직 🔻
  useEffect(() => {
    // runState가 'running'일 때
    if (runState === 'running') {
      timerIdRef.current = setInterval(() => {
        setRunTime(t => t + 1);
      }, 1000);
    } else {
      // 'paused' 또는 'setup'일 때 타이머 정지
      clearInterval(timerIdRef.current);
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timerIdRef.current);
  }, [runState]);
  // 🔺🔺🔺

  // --- 3. 지도/검색 핸들러 (Modal로 전달) ---

  const handleMapClick = ({ lat, lng }) => {
    if (runState !== 'setup') return; 

    if (!isInSeoul(lat, lng)) {
      setError('현재 프로토타입은 서울 시내만 테스트 가능합니다.');
      return;
    }

    setError(null);
    const coords = [lat, lng];
    setSearchResults([]);
    setRouteData((prev) => ({ ...prev, origin: coords }));
  };

  const handleSearch = () => {
    if (!window.naver?.maps?.Service || !searchQuery) {
      setError('지도 인증 실패 또는 검색어 없음');
      return;
    }
    setLoading(true);

    window.naver.maps.Service.geocode({ query: searchQuery }, (status, response) => {
      setLoading(false);
      if (status === window.naver.maps.Service.Status.OK) {
        setSearchResults(response.v2.addresses || []);
      } else {
        setSearchResults([]);
      }
    });
  };

  const handleSetOriginFromSearch = ({ lat, lng }) => {
    if (!isInSeoul(lat, lng)) {
      setError('서울 외의 지역은 현재 지원하지 않습니다.');
      return;
    }
    setError(null);
    setRouteData((prev) => ({ ...prev, origin: [lat, lng] }));
    setSearchResults([]);
    setIsSearchOpen(false); // (항목 1) 검색 모달 닫기
  };

  const handleRecommend = async () => {
    if (!routeData.origin) {
      setError('출발지를 설정해주세요.');
      return;
    }
    if (!isInSeoul(routeData.origin[0], routeData.origin[1])) {
      setError('출발지를 서울 시내에서 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendedRoute(null);

    try {
      const response = await axios.post('/api/routes/recommend', routeData);
      const newRoute = response.data?.route ?? response.data;
      setRecommendedRoute(newRoute);
      setIsSettingsOpen(false); // (항목 1) 추천 성공 시 설정 모달 닫기
    } catch (err) {
      console.error('경로 추천 실패:', err);
      const rawErrorMessage = err.response?.data?.message || err.response?.data?.error || '경로 추천 요청 오류';
      setError(rawErrorMessage);
      if (err.response?.status === 400) {
        alert("경로를 찾을 수 없습니다. 출발지를 다시 설정해주세요.");
      } else {
        alert("경로 추천 중 서버 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!recommendedRoute || !userId) {
      alert('저장할 경로가 없거나 로그인 상태가 아닙니다.');
      return;
    }
    const saveRequest = {
      name: recommendedRoute.name,
      origin: [recommendedRoute.originLat, recommendedRoute.originLng],
      dest: [recommendedRoute.originLat, recommendedRoute.originLng],
      distanceM: recommendedRoute.distanceM,
      finalScore: recommendedRoute.finalScore,
      uphillM: recommendedRoute.uphillM,
      crosswalkCount: recommendedRoute.crosswalkCount,
      nightScore: recommendedRoute.nightScore,
      crowdScore: recommendedRoute.crowdScore,
      isPublic: false, 
      geomJson: recommendedRoute.geomJson,
    };
    try {
      await axios.post('/api/routes', saveRequest);
      alert('✅ 경로가 "내 경로"에 저장되었습니다!');
    } catch (err) {
      alert('❌ 경로 저장 실패: 로그인 상태를 확인하세요.');
      console.error('경로 저장 오류:', err);
    }
  };

  // --- 4. 운동 핸들러 ---

  const handleStartNavigation = () => {
    if (!recommendedRoute) return;
    
    console.log("운동 시작!");
    setRunState('running');
    setRunTime(0); // (항목 2) 시간 0으로 리셋
    setRunDistance(0);
    setCurrentPace(0);

    // (항목 5) TODO: 위치 추적 시작
    // watchIdRef.current = navigator.geolocation.watchPosition(...)
  };

  const handlePauseRun = () => {
    console.log("운동 일시정지");
    setRunState('paused'); 
    
    // (항목 5) TODO: 위치 추적 중지
    // navigator.geolocation.clearWatch(watchIdRef.current);
  };
  
  const handleResumeRun = () => {
    console.log("운동 재시작");
    setRunState('running');

    // (항목 5) TODO: 위치 추적 재시작
    // watchIdRef.current = navigator.geolocation.watchPosition(...)
  };

  const handleStopRun = () => {
    // (항목 5) TODO: 3초 꾹 누르기 로직
    
    if (window.confirm("운동을 중단하시겠습니까?")) {
      console.log("운동 중단");
      
      // (항목 5) TODO: 위치 추적 중지
      // navigator.geolocation.clearWatch(watchIdRef.current);
      
      // (항목 4) TODO: 운동 기록 DB 저장
      
      setRunState('setup');
      setRunTime(0); // (항목 2) 타이머 리셋
      
      // 🔻 (항목 3) 경로 추천 상태를 유지하기 위해 null로 리셋하지 않음
      // setRecommendedRoute(null); 
      // 🔺
      
      setView('home'); 
    }
  };

  // --- 5. 메인 렌더링 로직 ---

  const renderView = () => {
    if (runState === 'running') {
      return (
        <RunningTracking
          // (항목 3) SosButton에 prop 전달
          userId={userId}
          userLocation={userLocation}
          //
          runTime={runTime}
          runDistance={runDistance}
          currentPace={currentPace}
          recommendedRoute={recommendedRoute}
          routeData={routeData}
          onMapClick={handleMapClick}
          onPauseRun={handlePauseRun}
        />
      );
    }

    if (runState === 'paused') {
      return (
        <RunningPaused
          runTime={runTime}
          runDistance={runDistance}
          userLocation={userLocation}
          recommendedRoute={recommendedRoute}
          routeData={routeData}
          onMapClick={handleMapClick}
          onResumeRun={handleResumeRun}
          onStopRun={handleStopRun}
        />
      );
    }
    
    switch (view) {
      case 'home':
      default:
        return (
          <RunningSetup
            // Props
            routeData={routeData}
            setRouteData={setRouteData}
            recommendedRoute={recommendedRoute}
            loading={loading}
            error={error}
            userLocation={userLocation}
            // Handlers
            onMapClick={handleMapClick}
            onRecommend={handleRecommend}
            onStartNavigation={handleStartNavigation}
            onSaveRoute={handleSaveRoute}
            // (항목 1) 모달 핸들러 추가
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        );
      case 'activity':
        return <ActivityPage />;
      case 'mypage':
        return <MyPage />;
    }
  };

  return (
    <div style={{
        ...styles.mobileContainer,
        // 🔻 'running' 상태일 때만 배경을 검게 변경 🔻
        backgroundColor: runState === 'running' ? '#f19c4d' : '#ffffff',
    }}>
      {/* (항목 3) SosButton을 RunningTracking 컴포넌트 내부로 이동시킴 */}
      
      <main style={{
        ...styles.mainContent,
        // (항목 1) 운동 중에는 padding 제거
        padding: runState === 'setup' ? '20px' : '0',
        overflowY: runState === 'setup' ? 'auto' : 'hidden',
      }}>
        {renderView()}
      </main>

      {/* (항목 1) 설정 모달 */}
      {isSettingsOpen && (
        <SettingsModal
          routeData={routeData}
          setRouteData={setRouteData}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* (항목 1) 검색 모달 */}
      {isSearchOpen && (
        <SearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          onSearch={handleSearch}
          onSetOrigin={handleSetOriginFromSearch}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {/* 러닝 중이 아닐 때만 하단 탭 바 표시 */}
      {runState === 'setup' && (
        <BottomNav currentView={view} setView={setView} />
      )}
    </div>
  );
}

// --- 스타일 ---
const styles = {
  mobileContainer: {
    maxWidth: '500px', 
    minHeight: '100vh', 
    margin: '0 auto',
    border: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  mainContent: {
    flex: 1,
    position: 'relative', // (항목 3) SosButton의 기준점이 되도록
  },
};

export default App;