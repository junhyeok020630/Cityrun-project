import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SosButton from './components/SosButton.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import RunningSetup from './components/views/RunningSetup.jsx';
import RunningTracking from './components/views/RunningTracking.jsx';
import RunningPaused from './components/views/RunningPaused.jsx';
import ActivityPage from './components/views/ActivityPage.jsx';
import MyPage from './components/views/MyPage.jsx';
import SettingsModal from './components/views/SettingsModal.jsx';
import SearchModal from './components/views/SearchModal.jsx';
import AuthPage from './components/views/AuthPage.jsx';
import SaveRouteModal from './components/views/SaveRouteModal.jsx';
import EditRouteModal from './components/views/EditRouteModal.jsx';

axios.defaults.withCredentials = true; 

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

const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function App() {
  // --- 1. 핵심 State ---
  const [view, setView] = useState('home'); 
  const [runState, setRunState] = useState('setup');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); 
  const [routeToEdit, setRouteToEdit] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [isAuthLoading, setIsAuthLoading] = useState(true); 

  const watchIdRef = useRef(null);
  const timerIdRef = useRef(null);
  const [runTime, setRunTime] = useState(0); 
  const [runDistance, setRunDistance] = useState(0); 
  const [currentPace, setCurrentPace] = useState(0); 

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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // --- 2. 초기 위치 획득 & 세션 확인 ---
  useEffect(() => {
    // 1. 현재 위치 획득
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
          const defaultLocation = { lat: 37.5665, lng: 126.9780 };
          setUserLocation(defaultLocation);
          console.error('위치 획득 실패(HTTPS 필요):', err);
        }
      );
    } else {
      const defaultLocation = { lat: 37.5665, lng: 126.9780 };
      setUserLocation(defaultLocation);
    }

    // 2. 현재 로그인 세션 확인
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get('/api/users/me'); 
        setCurrentUser(response.data); 
        console.log("세션 확인:", response.data);
      } catch (err) {
        setCurrentUser(null);
        console.log("세션 없음.");
      } finally {
        setIsAuthLoading(false); 
      }
    };
    checkLoginStatus();
  }, []); 

  // 타이머 로직
  useEffect(() => {
    if (runState === 'running') {
      timerIdRef.current = setInterval(() => {
        setRunTime(t => t + 1);
      }, 1000);
    } else {
      clearInterval(timerIdRef.current);
    }
    return () => clearInterval(timerIdRef.current);
  }, [runState]);

  // --- 3. 지도/검색 핸들러 ---
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

  // --- 3. 지도/검색 핸들러 ---

  // 장소 검색 (네이버 Places REST API 프록시 호출)
  const handleSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError('검색어를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 백엔드에 프록시 엔드포인트를 하나 만든다고 가정
      // 예: GET /api/places/search?query=...&lat=...&lng=...
      const params = { query: trimmed };
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await axios.get('/api/places/search', { params });

      // 백엔드에서 아래 형태로 반환한다고 가정:
      // {
      //   places: [
      //     {
      //       id: '123',
      //       name: '가천대학교',
      //       roadAddress: '경기 성남시 수정구 성공로 123',
      //       jibunAddress: '경기 성남시 수정구 복정동 123-4',
      //       x: 127.123456,  // 경도
      //       y: 37.123456,   // 위도
      //     },
      //     ...
      //   ]
      // }
      const places = res.data?.places || res.data || [];
      setSearchResults(Array.isArray(places) ? places : []);
    } catch (err) {
      console.error('장소 검색 실패:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '장소 검색 중 오류가 발생했습니다.';
      setError(msg);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSetOriginFromSearch = ({ lat, lng }) => {
    if (!isInSeoul(lat, lng)) {
      setError('서울 외의 지역은 현재 지원하지 않습니다.');
      return;
    }
    setError(null);
    setRouteData((prev) => ({ ...prev, origin: [lat, lng] }));
    setSearchResults([]);
    setIsSearchOpen(false); 
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
      setIsSettingsOpen(false);
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
  
  const handleSaveRoute = () => {
    if (!currentUser) { 
      alert('로그인이 필요합니다.');
      return;
    }
    if (!recommendedRoute) {
      alert('저장할 경로가 없습니다.');
      return;
    }
    setIsSaveModalOpen(true);
  };
  
  const handleConfirmSaveRoute = async (customName) => {
    if (!customName || customName.trim() === '') {
      alert('경로 이름을 입력해주세요.');
      return;
    }
    if (!recommendedRoute || !currentUser) return; 

    const saveRequest = {
      name: customName, 
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
      setIsSaveModalOpen(false);
    } catch (err) {
      alert('❌ 경로 저장 실패: ' + (err.response?.data?.message || '서버 오류'));
      console.error('경로 저장 오류:', err);
      setIsSaveModalOpen(false); 
    }
  };


  // --- 4. 운동 핸들러 ---

  const handleStartNavigation = () => {
    if (!recommendedRoute) return;
    console.log("운동 시작!");
    setRunState('running');
    setRunTime(0); 
    setRunDistance(0);
    setCurrentPace(0);
    // (항목 5) TODO: 위치 추적 시작
  };

  const handlePauseRun = () => {
    console.log("운동 일시정지");
    setRunState('paused'); 
    // (항목 5) TODO: 위치 추적 중지
  };
  
  const handleResumeRun = () => {
    console.log("운동 재시작");
    setRunState('running');
    // (항목 5) TODO: 위치 추적 재시작
  };

  const handleStopRun = () => {
    if (window.confirm("운동을 중단하시겠습니까?")) {
      console.log("운동 중단");
      
      if (currentUser) {
        const distanceKm = runDistance / 1000;
        const avgPace = (distanceKm > 0) ? Math.round(runTime / distanceKm) : 0;
        const activityData = {
          distanceM: Math.round(runDistance),
          durationS: runTime,
          avgPaceSPerKm: avgPace
        };
        console.log("운동 기록 저장 시도:", activityData);
        axios.post('/api/activities', activityData)
          .then(response => console.log("활동 저장 성공:", response.data))
          .catch(err => console.error("활동 저장 실패:", err));
      }
      
      setRunState('setup');
      setRunTime(0);
      setView('home'); 
      // (항목 3) 경로는 유지
    }
  };

  // --- 5. 인증 핸들러 ---
  const handleLogin = async (email, password) => {
    try {
      await axios.post('/api/auth/login', { email, password });
      const response = await axios.get('/api/users/me');
      setCurrentUser(response.data);
    } catch (err) {
      console.error("로그인 실패:", err);
      alert("로그인 실패: " + (err.response?.data?.message || '이메일 또는 비밀번호를 확인하세요.'));
    }
  };

  const handleRegister = async (email, password, nickname) => {
    try {
      await axios.post('/api/auth/register', { email, password, nickname });
      alert("회원가입 성공! 이제 로그인해주세요.");
    } catch (err) {
      console.error("회원가입 실패:", err);
      alert("회원가입 실패: " + (err.response?.data?.message || '서버 오류'));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setCurrentUser(null); 
    } catch (err) {
      console.error("로그아웃 실패:", err);
      alert("로그아웃에 실패했습니다.");
    }
  };
  
  const handleLoadRoute = (route) => {
    setRecommendedRoute(route); 
    setRouteData(prev => ({
      ...prev, 
      origin: [route.originLat, route.originLng] 
    }));
    setView('home'); 
  };
  
  const handleSelectActivity = (activity) => {
    alert(`
      (TODO: 활동 상세 페이지)
      
      거리: ${(activity.distanceM / 1000).toFixed(2)} km
      시간: ${formatTime(activity.durationS)}
      날짜: ${new Date(activity.createdAt).toLocaleString('ko-KR')}
    `);
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm("정말 이 경로를 삭제하시겠습니까?")) return false; 
    try {
      await axios.delete(`/api/routes/${routeId}`);
      alert("경로가 삭제되었습니다.");
      return true; 
    } catch (err) {
      console.error("경로 삭제 실패:", err);
      alert("경로 삭제에 실패했습니다: " + (err.response?.data?.message || '서버 오류'));
      return false; 
    }
  };

  const handleOpenEditModal = (route) => {
    setRouteToEdit(route); 
  };

  const handleConfirmEdit = async (routeId, newName) => {
    if (!newName || newName.trim() === '') {
      alert('경로 이름은 비워둘 수 없습니다.');
      return false;
    }
    try {
      await axios.put(`/api/routes/${routeId}`, { name: newName });
      alert("경로 이름이 수정되었습니다.");
      setRouteToEdit(null); 
      return true; 
    } catch (err) {
      console.error("경로 수정 실패:", err);
      alert("경로 수정에 실패했습니다: " + (err.response?.data?.message || '서버 오류'));
      return false; 
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("정말 이 활동 기록을 삭제하시겠습니까?")) return false; 
    try {
      await axios.delete(`/api/activities/${activityId}`);
      alert("활동 기록이 삭제되었습니다.");
      return true; 
    } catch (err) {
      console.error("활동 삭제 실패:", err);
      alert("활동 삭제에 실패했습니다: " + (err.response?.data?.message || '서버 오류'));
      return false; 
    }
  };
  // 🔺🔺🔺

  // --- 6. 메인 렌더링 로직 ---

  const renderView = () => {
    if (runState === 'running') {
      return (
        <RunningTracking
          userId={currentUser?.id} 
          userLocation={userLocation}
          runTime={runTime}
          runDistance={runDistance}
          currentPace={currentPace}
          recommendedRoute={recommendedRoute}
          routeData={routeData}
          onMapClick={handleMapClick}
          onPauseRun={handlePauseRun}
          formatTime={formatTime} 
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
          formatTime={formatTime}
        />
      );
    }
    
    switch (view) {
      case 'home':
      default:
        return (
          <RunningSetup
            routeData={routeData}
            setRouteData={setRouteData}
            recommendedRoute={recommendedRoute}
            loading={loading}
            error={error}
            userLocation={userLocation}
            onMapClick={handleMapClick}
            onRecommend={handleRecommend}
            onStartNavigation={handleStartNavigation}
            onSaveRoute={handleSaveRoute} 
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        );
      case 'activity':
        return (
          <ActivityPage 
            currentUser={currentUser} 
            onSelectActivity={handleSelectActivity} 
            formatTime={formatTime} 
            onDeleteActivity={handleDeleteActivity} 
          />
        );
      case 'mypage':
        return (
          <MyPage 
            currentUser={currentUser}
            onLogout={handleLogout}
            onLoadRoute={handleLoadRoute}
            onDeleteRoute={handleDeleteRoute} 
            onOpenEditModal={handleOpenEditModal} 
            routeToEdit={routeToEdit} 
          />
        );
    }
  };

  return (
    <div style={{
        ...styles.mobileContainer,
        backgroundColor: runState === 'running' ? '#F19C4D' : '#ffffff',
    }}>
      
      {isAuthLoading ? (
        <p style={styles.loadingText}>로딩 중...</p>
      ) : !currentUser ? (
        <AuthPage 
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      ) : (
        <>
          {runState !== 'running' && userLocation && (
            <SosButton userId={currentUser.id} userLocation={userLocation} />
          )}
          
          <main style={{
            ...styles.mainContent,
            padding: runState === 'setup' ? '20px' : '0',
            overflowY: 'hidden', 
            height: runState !== 'setup' ? 'auto' : '100%',
          }}>
            {renderView()}
          </main>

          {isSettingsOpen && (
            <SettingsModal
              routeData={routeData}
              setRouteData={setRouteData}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
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

          {isSaveModalOpen && (
            <SaveRouteModal
              defaultName={recommendedRoute?.name || '나의 러닝 경로'} 
              onClose={() => setIsSaveModalOpen(false)}
              onConfirmSave={handleConfirmSaveRoute}
            />
          )}
          
          {routeToEdit && (
            <EditRouteModal
              routeToEdit={routeToEdit}
              onClose={() => setRouteToEdit(null)}
              onConfirmEdit={handleConfirmEdit}
            />
          )}

          {runState === 'setup' && (
            <BottomNav currentView={view} setView={setView} />
          )}
        </>
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
    position: 'relative', 
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // 🔻🔻🔻 (항목 2) 스크롤 방지 🔻🔻🔻
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '50px',
  }
};

export default App;