// React 애플리케이션의 최상위 컴포넌트(App)
// 모든 핵심 상태(State)와 핸들러 함수, 그리고 화면 전환 로직을 포함하는 컨트롤 타워 역할
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// --- 뷰(View) 컴포넌트 임포트 ---
import SosButton from './components/SosButton.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import RunningSetup from './components/views/RunningSetup.jsx';
import RunningTracking from './components/views/RunningTracking.jsx';
import RunningPaused from './components/views/RunningPaused.jsx';
import ActivityPage from './components/views/ActivityPage.jsx';
import MyPage from './components/views/MyPage.jsx';
// --- 모달(Modal) 컴포넌트 임포트 ---
import SettingsModal from './components/views/SettingsModal.jsx';
import SearchModal from './components/views/SearchModal.jsx';
import AuthPage from './components/views/AuthPage.jsx';
import SaveRouteModal from './components/views/SaveRouteModal.jsx';
import EditRouteModal from './components/views/EditRouteModal.jsx';

// Axios가 API 요청 시 자동으로 쿠키(세션)를 포함하도록 전역 설정
axios.defaults.withCredentials = true; 

// (프로토타입용) 경로 추천을 서울 시내로 제한하기 위한 경계
const SEOUL_BOUNDS = {
  minLat: 37.3,
  maxLat: 37.7,
  minLng: 126.7,
  maxLng: 127.3,
};

// 위도/경도가 서울 경계 내에 있는지 확인하는 헬퍼 함수
const isInSeoul = (lat, lng) =>
  lat >= SEOUL_BOUNDS.minLat &&
  lat <= SEOUL_BOUNDS.maxLat &&
  lng >= SEOUL_BOUNDS.minLng &&
  lng <= SEOUL_BOUNDS.maxLng;

// 초(sec)를 '00:00' 형식의 문자열로 변환하는 헬퍼 함수
const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function App() {
  // --- 1. 핵심 State 정의 ---
  // --- 1-1. 화면 및 모달 상태 ---
  const [view, setView] = useState('home'); // 현재 뷰 (home, activity, mypage)
  const [runState, setRunState] = useState('setup'); // 운동 상태 (setup, running, paused)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 설정 모달 노출 여부
  const [isSearchOpen, setIsSearchOpen] = useState(false); // 검색 모달 노출 여부
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); // 경로 저장 모달 노출 여부
  const [routeToEdit, setRouteToEdit] = useState(null); // 수정할 경로 정보 (EditRouteModal용)
  const [currentUser, setCurrentUser] = useState(null); // 현재 로그인한 사용자 정보
  const [isAuthLoading, setIsAuthLoading] = useState(true); // 세션 확인 로딩 상태

  // --- 1-2. 운동(Running) 관련 State ---
  const watchIdRef = useRef(null); // (미사용) Geolocation watch ID
  const timerIdRef = useRef(null); // 운동 시간 setInterval ID
  const [runTime, setRunTime] = useState(0); // 운동 시간 (초)
  const [runDistance, setRunDistance] = useState(0); // 운동 거리 (미터)
  const [currentPace, setCurrentPace] = useState(0); // 현재 페이스 (미구현)

  // --- 1-3. 경로(Route) 관련 State ---
  const [routeData, setRouteData] = useState({ // 경로 추천 요청 시 보낼 데이터
    distanceKm: 5.0, // 목표 거리
    origin: null, // 출발지 [lat, lng]
    prefs: { // 선호 옵션
      minimizeCrosswalks: true,
    },
  });
  const [recommendedRoute, setRecommendedRoute] = useState(null); // 추천받은 경로 상세 정보
  
  // --- 1-4. 기타 UI State ---
  const [loading, setLoading] = useState(false); // API 로딩 상태 (경로 추천 등)
  const [error, setError] = useState(null); // 오류 메시지
  const [userLocation, setUserLocation] = useState(null); // 사용자 현재 위치 [lat, lng]
  const [searchQuery, setSearchQuery] = useState(''); // 장소 검색어
  const [searchResults, setSearchResults] = useState([]); // 장소 검색 결과

  // --- 2. 초기화 useEffect ---
  // 컴포넌트 마운트(생성) 시 1회 실행
  useEffect(() => {
    // (A) 현재 위치 획득 (Geolocation API)
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
          // 실패 시 서울 시청을 기본 위치로 설정
          const defaultLocation = { lat: 37.5665, lng: 126.9780 };
          setUserLocation(defaultLocation);
          console.error('위치 획득 실패(HTTPS 필요):', err);
        }
      );
    } else {
      // Geolocation API 미지원 시 서울 시청을 기본 위치로 설정
      const defaultLocation = { lat: 37.5665, lng: 126.9780 };
      setUserLocation(defaultLocation);
    }

    // (B) 현재 로그인 세션 확인 (API 호출)
    const checkLoginStatus = async () => {
      try {
        // /api/users/me 호출 (쿠키 자동 전송)
        const response = await axios.get('/api/users/me'); 
        setCurrentUser(response.data); // 성공 시 사용자 정보 저장
        console.log("세션 확인:", response.data);
      } catch (err) {
        setCurrentUser(null); // 실패(401 등) 시 로그아웃 상태로
        console.log("세션 없음");
      } finally {
        setIsAuthLoading(false); // 세션 확인 로딩 완료
      }
    };
    checkLoginStatus();
  }, []); // 빈 배열: 마운트 시 1회만 실행

  // --- 2-2. 운동 타이머 useEffect ---
  // 'runState' state가 변경될 때마다 실행
  useEffect(() => {
    if (runState === 'running') {
      // 'running' 상태가 되면 1초마다 runTime을 1씩 증가시키는 타이머 시작
      timerIdRef.current = setInterval(() => {
        setRunTime(t => t + 1);
      }, 1000);
    } else {
      // 'paused' 또는 'setup' 상태가 되면 타이머 정지
      clearInterval(timerIdRef.current);
    }
    // 컴포넌트 언마운트(제거) 시 타이머 정리
    return () => clearInterval(timerIdRef.current);
  }, [runState]);

  // --- 3. 지도/검색 핸들러 ---

  // (A) 지도 클릭 핸들러 (RunningSetup, RunningTracking 등 하위 컴포넌트에 전달)
  const handleMapClick = ({ lat, lng }) => {
    if (runState !== 'setup') return; // 'setup' 상태(경로 설정 중)일 때만 동작
    // 프로토타입용 서울 범위 체크
    if (!isInSeoul(lat, lng)) {
      setError('현재 프로토타입은 서울 시내만 테스트 가능합니다');
      return;
    }
    setError(null);
    const coords = [lat, lng];
    setSearchResults([]); // 검색 결과가 있었다면 닫기
    // 클릭한 위치를 'origin'(출발지)으로 설정
    setRouteData((prev) => ({ ...prev, origin: coords }));
  };
  
  // (B) 장소 검색 핸들러 (SearchModal에 전달)
  const handleSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError('검색어를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // /api/places/search (백엔드 프록시) 호출
      const params = { query: trimmed };
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await axios.get('/api/places/search', { params });
      // Naver API 응답에서 'places' 배열 추출
      const places = res.data?.places || res.data || [];
      setSearchResults(Array.isArray(places) ? places : []);
    } catch (err) {
      console.error('장소 검색 실패:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '장소 검색 중 오류가 발생했습니다';
      setError(msg);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // (C) 검색 결과에서 '출발' 버튼 클릭 핸들러 (SearchModal에 전달)
  const handleSetOriginFromSearch = ({ lat, lng }) => {
    if (!isInSeoul(lat, lng)) {
      setError('서울 외의 지역은 현재 지원하지 않습니다');
      return;
    }
    setError(null);
    // 검색된 위치를 'origin'(출발지)으로 설정
    setRouteData((prev) => ({ ...prev, origin: [lat, lng] }));
    setSearchResults([]); // 검색 결과 패널 닫기
    setIsSearchOpen(false); // 검색 모달 닫기
  };

  // (D) '경로 추천' 버튼 핸들러 (RunningSetup에 전달)
  const handleRecommend = async () => {
    if (!routeData.origin) {
      setError('출발지를 설정해주세요');
      return;
    }
    if (!isInSeoul(routeData.origin[0], routeData.origin[1])) {
      setError('출발지를 서울 시내에서 선택해주세요');
      return;
    }
    setLoading(true);
    setError(null);
    setRecommendedRoute(null); // 기존 추천 경로 초기화
    try {
      // /api/routes/recommend (cityrun-api) 호출 -> (cityrun-geo)
      const response = await axios.post('/api/routes/recommend', routeData);
      const newRoute = response.data?.route ?? response.data;
      // 성공 시 추천받은 경로 정보를 state에 저장
      setRecommendedRoute(newRoute);
      setIsSettingsOpen(false); // 설정 모달이 열려있었다면 닫기
    } catch (err) {
      // cityrun-geo에서 400(OUTLIER_ROUTE) 등으로 실패한 경우
      console.error('경로 추천 실패:', err);
      const rawErrorMessage = err.response?.data?.message || err.response?.data?.error || '경로 추천 요청 오류';
      setError(rawErrorMessage);
      if (err.response?.status === 400) {
        alert("경로를 찾을 수 없습니다 출발지를 다시 설정해주세요");
      } else {
        alert("경로 추천 중 서버 오류가 발생했습니다");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // (E) '경로 저장' 버튼 핸들러 (RunningSetup에 전달)
  const handleSaveRoute = () => {
    if (!currentUser) { 
      alert('로그인이 필요합니다');
      return;
    }
    if (!recommendedRoute) {
      alert('저장할 경로가 없습니다');
      return;
    }
    // 저장 모달 열기
    setIsSaveModalOpen(true);
  };
  
  // (F) 경로 저장 '확인' 핸들러 (SaveRouteModal에 전달)
  const handleConfirmSaveRoute = async (customName) => {
    if (!customName || customName.trim() === '') {
      alert('경로 이름을 입력해주세요');
      return;
    }
    if (!recommendedRoute || !currentUser) return; 

    // API 요청에 맞게 DTO 조립
    const saveRequest = {
      name: customName, 
      origin: [recommendedRoute.originLat, recommendedRoute.originLng],
      dest: [recommendedRoute.originLat, recommendedRoute.originLng], // 루프 경로
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
      // /api/routes (POST) 호출
      await axios.post('/api/routes', saveRequest);
      alert('경로가 "내 경로"에 저장되었습니다');
      setIsSaveModalOpen(false); // 모달 닫기
    } catch (err) {
      alert('경로 저장 실패: ' + (err.response?.data?.message || '서버 오류'));
      console.error('경로 저장 오류:', err);
      setIsSaveModalOpen(false); 
    }
  };


  // --- 4. 운동 핸들러 ---

  // (A) '시작' 버튼 핸들러 (RunningSetup에 전달)
  const handleStartNavigation = () => {
    if (!recommendedRoute) return;
    console.log("운동 시작!");
    setRunState('running'); // 상태를 'running'으로 변경
    setRunTime(0); // 타이머 초기화
    setRunDistance(0); // 거리 초기화
    setCurrentPace(0); // 페이스 초기화
  };

  // (B) '일시정지' 버튼 핸들러 (RunningTracking에 전달)
  const handlePauseRun = () => {
    console.log("운동 일시정지");
    setRunState('paused'); // 상태를 'paused'로 변경 (타이머가 멈춤)
  };
  
  // (C) '재시작' 버튼 핸들러 (RunningPaused에 전달)
  const handleResumeRun = () => {
    console.log("운동 재시작");
    setRunState('running'); // 상태를 'running'으로 변경 (타이머가 다시 시작)
  };

  // (D) '중단' 버튼 핸들러 (RunningPaused에 전달)
  const handleStopRun = () => {
    if (window.confirm("운동을 중단하시겠습니까?")) {
      console.log("운동 중단");
      
      // 로그인 상태일 경우만 운동 기록 저장
      if (currentUser) {
        const distanceKm = runDistance / 1000;
        // 평균 페이스 계산 (0으로 나누기 방지)
        const avgPace = (distanceKm > 0) ? Math.round(runTime / distanceKm) : 0;
        // API 요청 DTO 조립
        const activityData = {
          distanceM: Math.round(runDistance),
          durationS: runTime,
          avgPaceSPerKm: avgPace
        };
        console.log("운동 기록 저장 시도:", activityData);
        // /api/activities (POST) 호출 (결과를 기다리지 않고 비동기 처리)
        axios.post('/api/activities', activityData)
          .then(response => console.log("활동 저장 성공:", response.data))
          .catch(err => console.error("활동 저장 실패:", err));
      }
      
      setRunState('setup'); // 상태를 'setup'으로 복귀
      setRunTime(0); // 타이머 리셋
      setView('home'); // 'home' 뷰로 이동
    }
  };

  // --- 5. 인증 핸들러 (AuthPage, MyPage에 전달) ---

  // (A) 로그인
  const handleLogin = async (email, password) => {
    try {
      // /api/auth/login (POST) - 세션 쿠키가 생성됨
      await axios.post('/api/auth/login', { email, password });
      // /api/users/me (GET) - 생성된 쿠키로 사용자 정보 조회
      const response = await axios.get('/api/users/me');
      setCurrentUser(response.data); // state에 사용자 정보 저장
    } catch (err) {
      console.error("로그인 실패:", err);
      alert("로그인 실패: " + (err.response?.data?.message || '이메일 또는 비밀번호를 확인하세요'));
    }
  };

  // (B) 회원가입
  const handleRegister = async (email, password, nickname) => {
    try {
      // /api/auth/register (POST)
      await axios.post('/api/auth/register', { email, password, nickname });
      alert("회원가입 성공! 이제 로그인해주세요");
    } catch (err) {
      console.error("회원가입 실패:", err);
      alert("회원가입 실패: " + (err.response?.data?.message || '서버 오류'));
    }
  };

  // (C) 로그아웃
  const handleLogout = async () => {
    try {
      // /api/auth/logout (POST) - 서버 세션 무효화
      await axios.post('/api/auth/logout');
      setCurrentUser(null); // state에서 사용자 정보 제거
    } catch (err) {
      console.error("로그아웃 실패:", err);
      alert("로그아웃에 실패했습니다");
    }
  };
  
  // --- 6. MyPage/ActivityPage CRUD 핸들러 ---

  // (A) '내 경로' 불러오기 (MyPage에 전달)
  const handleLoadRoute = (route) => {
    setRecommendedRoute(route); // 선택한 경로를 '추천 경로' state에 설정
    setRouteData(prev => ({ // '출발지' state도 동기화
      ...prev, 
      origin: [route.originLat, route.originLng] 
    }));
    setView('home'); // 'home' 뷰로 이동하여 지도에 표시
  };
  
  // (B) '활동' 선택 (ActivityPage에 전달 - 현재 미구현)
  const handleSelectActivity = (activity) => {
    alert(`
      (TODO: 활동 상세 페이지)
      
      거리: ${(activity.distanceM / 1000).toFixed(2)} km
      시간: ${formatTime(activity.durationS)}
      날짜: ${new Date(activity.createdAt).toLocaleString('ko-KR')}
    `);
  };

  // (C) '내 경로' 삭제 (MyPage에 전달)
  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm("정말 이 경로를 삭제하시겠습니까?")) return false; // 사용자 확인
    try {
      // /api/routes/{id} (DELETE)
      await axios.delete(`/api/routes/${routeId}`);
      alert("경로가 삭제되었습니다");
      return true; // MyPage에 성공 여부 반환 (목록 새로고침용)
    } catch (err) {
      console.error("경로 삭제 실패:", err);
      alert("경로 삭제에 실패했습니다: " + (err.response?.data?.message || '서버 오류'));
      return false; // MyPage에 실패 여부 반환
    }
  };

  // (D) '경로 수정' 모달 열기 (MyPage에 전달)
  const handleOpenEditModal = (route) => {
    setRouteToEdit(route); // 수정할 경로 정보를 state에 저장 (EditRouteModal이 열림)
  };

  // (E) '경로 수정' 확인 (EditRouteModal에 전달)
  const handleConfirmEdit = async (routeId, newName) => {
    if (!newName || newName.trim() === '') {
      alert('경로 이름은 비워둘 수 없습니다');
      return false;
    }
    try {
      // /api/routes/{id} (PUT)
      await axios.put(`/api/routes/${routeId}`, { name: newName });
      alert("경로 이름이 수정되었습니다");
      setRouteToEdit(null); // 모달 닫기
      return true; // MyPage에 성공 여부 반환 (목록 새로고침용)
    } catch (err) {
      console.error("경로 수정 실패:", err);
      alert("경로 수정에 실패했습니다: " + (err.response?.data?.message || '서버 오류'));
      return false;
    }
  };

  // (F) '활동 기록' 삭제 (ActivityPage에 전달)
  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("정말 이 활동 기록을 삭제하시겠습니까?")) return false; // 사용자 확인
    try {
      // /api/activities/{id} (DELETE)
      await axios.delete(`/api/activities/${activityId}`);
      alert("활동 기록이 삭제되었습니다");
      return true; // ActivityPage에 성공 여부 반환 (UI 즉시 제거용)
    } catch (err) {
      console.error("활동 삭제 실패:", err);
      alert("활동 삭제에 실패했습니다: " + (err.response?.data?.message || '서버 오류'));
      return false; 
    }
  };

  // --- 7. 메인 렌더링 로직 ---

  // (A) 현재 뷰(View) 렌더링 함수
  const renderView = () => {
    // 1순위: 'runState'가 'running'이면 무조건 RunningTracking 렌더링
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

    // 2순위: 'runState'가 'paused'이면 무조건 RunningPaused 렌더링
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
    
    // 3순위: 'runState'가 'setup'일 때, 'view' state에 따라 뷰 분기
    switch (view) {
      case 'home':
      default:
        // '홈' 탭: 경로 설정 화면
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
        // '활동' 탭: 내 운동 기록 목록
        return (
          <ActivityPage 
            currentUser={currentUser} 
            onSelectActivity={handleSelectActivity} 
            formatTime={formatTime} 
            onDeleteActivity={handleDeleteActivity} 
          />
        );
      case 'mypage':
        // '마이페이지' 탭: 내 정보, 내 경로 목록, 로그아웃
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

  // (B) App 컴포넌트 최종 JSX 반환
  return (
    // 모바일 화면을 흉내 내는 최상위 컨테이너
    <div style={{
        ...styles.mobileContainer,
        // 'running' 상태일 때만 배경색 변경
        backgroundColor: runState === 'running' ? '#F19C4D' : '#ffffff',
    }}>
      
      {isAuthLoading ? (
        // 세션 로딩 중
        <p style={styles.loadingText}>로딩 중...</p>
      ) : !currentUser ? (
        // 로그아웃 상태: AuthPage(로그인/회원가입) 렌더링
        <AuthPage 
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      ) : (
        // 로그인 상태: 메인 앱 렌더링
        <>
          {/* 메인 컨텐츠 영역 (renderView() 결과) */}
          <main style={{
            ...styles.mainContent,
            // 'home' 뷰이면서 'setup' 상태일 때만 좌우 패딩 20px 적용
            padding: view === 'home' && runState === 'setup' ? '20px' : '0',
          }}>
            {renderView()}
          </main>

          {/* 설정 모달 (isSettingsOpen이 true일 때만 렌더링) */}
          {isSettingsOpen && (
            <SettingsModal
              routeData={routeData}
              setRouteData={setRouteData}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
          {/* 검색 모달 */}
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
          {/* 경로 저장 모달 */}
          {isSaveModalOpen && (
            <SaveRouteModal
              defaultName={recommendedRoute?.name || '나의 러닝 경로'} 
              onClose={() => setIsSaveModalOpen(false)}
              onConfirmSave={handleConfirmSaveRoute}
            />
          )}
          {/* 경로 수정 모달 */}
          {routeToEdit && (
            <EditRouteModal
              routeToEdit={routeToEdit}
              onClose={() => setRouteToEdit(null)}
              onConfirmEdit={handleConfirmEdit}
            />
          )}

          {/* 하단 네비게이션 (운동 'setup' 상태일 때만 노출) */}
          {runState === 'setup' && (
            <BottomNav currentView={view} setView={setView} />
          )}
        </>
      )}
    </div>
  );
}

// --- 8. 스타일 ---
const styles = {
  // 모바일 화면을 흉내 내는 최상위 컨테이너
  mobileContainer: {
    maxWidth: '500px', 
    height: '98vh', // 뷰포트 높이
    overflow: 'hidden', // 내부 스크롤 방지
    margin: '0 auto',
    border: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  // 메인 컨텐츠 영역 (하단 탭 제외)
  mainContent: {
    flex: 1, // 남은 공간 모두 차지
    position: 'relative', 
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // 자식 컴포넌트(ActivityPage 등)의 스크롤 기준
  },
  // 세션 로딩 중 텍스트
  loadingText: {
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '50px',
  }
};

export default App;