import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MapComponent from './components/Map.jsx';
import SosButton from './components/SosButton.jsx';
import DataPanel from './components/DataPanel.jsx';
import SearchResultPanel from './components/SearchResultPanel.jsx';
import { speak } from './utils/tts.js';

const DEVIATION_THRESHOLD_M = 50;          // 경로 이탈 허용 거리(미터)
const LOCATION_UPDATE_INTERVAL_MS = 5000;  // 위치 업데이트 간격

const DEFAULT_ROUTE_DATA = {
  distanceKm: 5.0,
  origin: null,
  dest: null,
  prefs: {
    avoidUphill: true,
    minimizeCrosswalks: true,
    avoidCrowd: true,
  },
};

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
  const [routeData, setRouteData] = useState(DEFAULT_ROUTE_DATA);
  const [recommendedRoute, setRecommendedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userId, setUserId] = useState(1); // TODO: 로그인 붙이면 실제 사용자 ID로 교체
  const [selectMode, setSelectMode] = useState('origin'); // 'origin' | 'dest'
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deviationMessage, setDeviationMessage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const watchIdRef = useRef(null);

  // --- 거리 계산 유틸 ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 지구 반지름 (m)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isDeviated = (currentLat, currentLng, route) => {
    if (!route || !route.geomJson) return false;

    const endLat = route.destLat;
    const endLng = route.destLng;
    const distToEnd = calculateDistance(currentLat, currentLng, endLat, endLng);
    const pathLength = route.distanceM;

    // 단순 기준: 목적지까지 남은 거리가 전체 거리의 1.5배를 넘으면 이탈
    if (distToEnd > pathLength * 1.5) {
      return true;
    }
    return false;
  };

  const handleRecalculateRoute = async (currentLat, currentLng) => {
    speak('경로를 이탈하였습니다. 최적의 경로를 재탐색합니다.');
    setDeviationMessage('경로 이탈! 재탐색 중입니다...');

    const originalDest = routeData.dest;
    const newRouteData = {
      ...routeData,
      origin: [currentLat, currentLng],
      dest: originalDest,
    };

    try {
      const response = await axios.post('/api/routes/recommend', newRouteData);
      const data = response.data;
      const newRoute = data.route ?? data;

      setRecommendedRoute(newRoute);
      setRouteData(newRouteData);
      setError(null);
      speak('새로운 경로를 찾았습니다. 내비게이션을 재시작합니다.');
    } catch (err) {
      setError('재탐색에 실패했습니다. 지도상의 경로를 확인해주세요.');
      speak('경로 재탐색에 실패했습니다.');
    }
  };

  // --- 초기 환영 + 현재 위치 ---
  useEffect(() => {
    speak('시티 런 내비게이션에 오신 것을 환영합니다.');

    if (navigator.geolocation && window.naver && window.naver.maps) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          speak('현재 위치를 파악했습니다. 지도에서 출발지를 선택해주세요.');
        },
        (err) => {
          const defaultLocation = { lat: 37.5665, lng: 126.978 };
          setUserLocation(defaultLocation);
          console.error('위치 획득 실패(HTTPS 필요):', err);
          speak('현재 위치 획득에 실패했습니다. 지도에서 출발지를 선택해주세요.');
        }
      );
    } else {
      const defaultLocation = { lat: 37.5665, lng: 126.978 };
      setUserLocation(defaultLocation);
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // --- 내비게이션 중 위치 추적 ---
  useEffect(() => {
    if (!isNavigating || !recommendedRoute) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        setUserLocation({ lat: currentLat, lng: currentLng });

        if (isDeviated(currentLat, currentLng, recommendedRoute)) {
          handleRecalculateRoute(currentLat, currentLng);
        } else {
          setDeviationMessage(null);
        }
      },
      (error) => {
        console.error('내비게이션 중 위치 추적 오류:', error);
        speak('위치 추적에 실패했습니다. 내비게이션을 중단합니다.');
        setIsNavigating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: LOCATION_UPDATE_INTERVAL_MS,
        timeout: 60000,
      }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isNavigating, recommendedRoute]);

  // --- 지도 클릭: 출발/도착 설정 + 서울 제한 ---
  const handleMapClick = ({ lat, lng }) => {
    if (!isInSeoul(lat, lng)) {
      setError(
        '현재 프로토타입은 서울 시내만 테스트 가능합니다. 서울 지역에서 출발지와 도착지를 선택해주세요.'
      );
      speak(
        '현재 버전은 서울 시내만 지원합니다. 서울 안에서 출발지와 도착지를 선택해주세요.'
      );
      return;
    }

    setError(null);
    const coords = [lat, lng];
    setSearchResults([]);

    if (selectMode === 'origin') {
      setRouteData((prev) => ({ ...prev, origin: coords }));
      speak('출발지가 설정되었습니다.');
    } else {
      setRouteData((prev) => ({ ...prev, dest: coords }));
      speak('도착지가 설정되었습니다.');
    }
  };

  // --- 주소 검색 ---
  const handleSearch = () => {
    if (
      !window.naver ||
      !window.naver.maps ||
      !window.naver.maps.Service ||
      !searchQuery
    ) {
      setError(
        '지도 인증에 실패했거나 검색어가 비어 있습니다. NCP 설정을 확인하세요.'
      );
      speak(
        '지도 검색 기능을 사용할 수 없습니다. API 인증 상태를 확인하세요.'
      );
      return;
    }
    speak(`${searchQuery}를 검색합니다.`);
    setLoading(true);

    window.naver.maps.Service.geocode(
      {
        query: searchQuery,
      },
      (status, response) => {
        setLoading(false);
        if (status === window.naver.maps.Service.Status.OK) {
          const results = response.v2.addresses;
          if (results && results.length > 0) {
            setSearchResults(results);
            speak(
              `검색된 ${searchQuery}에 대한 ${results.length}개의 결과입니다.`
            );
          } else {
            speak('검색 결과가 없습니다.');
            setSearchResults([]);
          }
        } else {
          speak('주소 검색에 실패했습니다.');
          setSearchResults([]);
        }
      }
    );
  };

  const handleSetOriginFromSearch = ({ lat, lng }) => {
    if (!isInSeoul(lat, lng)) {
      setError(
        '서울 외의 지역은 현재 지원하지 않습니다. 서울 시내 위치를 선택해주세요.'
      );
      speak('서울 외의 지역은 현재 지원하지 않습니다. 서울 안의 위치를 선택해주세요.');
      return;
    }
    setError(null);
    setRouteData((prev) => ({ ...prev, origin: [lat, lng] }));
    setSearchResults([]);
    speak('출발지가 설정되었습니다.');
  };

  const handleSetDestFromSearch = ({ lat, lng }) => {
    if (!isInSeoul(lat, lng)) {
      setError(
        '서울 외의 지역은 현재 지원하지 않습니다. 서울 시내 위치를 선택해주세요.'
      );
      speak('서울 외의 지역은 현재 지원하지 않습니다. 서울 안의 위치를 선택해주세요.');
      return;
    }
    setError(null);
    setRouteData((prev) => ({ ...prev, dest: [lat, lng] }));
    setSearchResults([]);
    speak('도착지가 설정되었습니다.');
  };

  // --- 경로 추천 / 재추천 ---
  const handleRecommend = async () => {
    if (!routeData.origin || !routeData.dest) {
      setError('출발지와 도착지를 모두 설정해주세요.');
      speak('출발지와 도착지를 모두 설정해주세요.');
      return;
    }

    const [oLat, oLng] = routeData.origin;
    const [dLat, dLng] = routeData.dest;

    if (!isInSeoul(oLat, oLng) || !isInSeoul(dLat, dLng)) {
      setError(
        '현재 프로토타입은 서울 시내만 지원합니다. 출발지/도착지를 서울에서 선택해주세요.'
      );
      speak(
        '서울 시내만 지원합니다. 서울에서 출발지와 도착지를 다시 선택해주세요.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendedRoute(null);
    setDeviationMessage(null);
    speak('경로를 탐색 중입니다. 잠시만 기다려주세요.');

    try {
      const response = await axios.post('/api/routes/recommend', routeData);
      const data = response.data;
      const newRoute = data.route ?? data;

      setRecommendedRoute(newRoute);
      speak('최적의 경로를 찾았습니다. 지도를 확인해 주세요.');
    } catch (err) {
      console.error('경로 추천 실패:', err);
      setError(
        err.response?.data?.message ||
          '경로 추천 요청 중 오류가 발생했습니다.'
      );
      speak('경로 추천 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // --- 내비게이션 시작 / 종료 ---
  const handleStartNavigation = () => {
    if (!recommendedRoute) {
      speak('경로가 선택되지 않았습니다. 먼저 경로 추천을 받아주세요.');
      return;
    }
    setIsNavigating(true);
    speak('운동을 시작합니다. 경로를 따라 달려주세요.');
  };

  // --- 경로 저장 ---
  const handleSaveRoute = async () => {
    if (!recommendedRoute || !userId) {
      alert('저장할 경로가 없거나 로그인 상태가 아닙니다.');
      return;
    }

    const saveRequest = {
      name: recommendedRoute.name,
      origin: [recommendedRoute.originLat, recommendedRoute.originLng],
      dest: [recommendedRoute.destLat, recommendedRoute.destLng],
      distanceM: recommendedRoute.distanceM,
      finalScore: recommendedRoute.finalScore,
      uphillM: recommendedRoute.uphillM,
      crosswalkCount: recommendedRoute.crosswalkCount,
      nightScore: recommendedRoute.nightScore,
      crowdScore: recommendedRoute.crowdScore,
      isPublic: true,
      geomJson: recommendedRoute.geomJson,
    };

    try {
      await axios.post('/api/routes', saveRequest);
      speak('경로를 성공적으로 저장하고 공유했습니다.');
      alert('✅ 경로가 저장 및 공유되었습니다!');
    } catch (err) {
      speak('경로 저장에 실패했습니다.');
      alert('❌ 경로 저장 실패: 로그인 상태를 확인하세요.');
      console.error('경로 저장 오류:', err);
    }
  };

  // --- 렌더링 ---
  return (
    <div style={styles.container}>
      {userId && userLocation && (
        <SosButton userId={userId} userLocation={userLocation} />
      )}

      <h2>🏃 CityRun 경로 추천 (React)</h2>

      {/* 서울 프로토타입 안내 */}
      <p style={styles.notice}>
        ⚠️ 현재 이 웹 서비스는 <strong>프로토타입</strong>이며,{' '}
        <strong>서울 시내에서만</strong> 테스트 가능합니다. 출발지와 도착지를 서울
        시내에서 선택해주세요.
      </p>

      {/* 검색 바 */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="출발지 또는 도착지를 검색하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={styles.searchButton}
        >
          {loading ? '...' : '검색'}
        </button>
      </div>

      {/* 지도 */}
      {userLocation && (
        <MapComponent
          route={recommendedRoute}
          userLocation={userLocation}
          onMapClick={handleMapClick}
          routeData={routeData}
          searchResults={searchResults}
        />
      )}

      {/* 검색 결과 패널 */}
      {searchResults.length > 0 && (
        <SearchResultPanel
          results={searchResults}
          onSetOrigin={handleSetOriginFromSearch}
          onSetDest={handleSetDestFromSearch}
        />
      )}

      {/* 출발/도착 선택 & 거리 입력 */}
      <div style={styles.inputGroup}>
        <div style={styles.modeButtons}>
          <button
            onClick={() => setSelectMode('origin')}
            style={
              selectMode === 'origin'
                ? styles.buttonActive
                : styles.buttonInactive
            }
          >
            출발지 설정
          </button>
          <button
            onClick={() => setSelectMode('dest')}
            style={
              selectMode === 'dest'
                ? styles.buttonActive
                : styles.buttonInactive
            }
          >
            도착지 설정
          </button>
        </div>

        <p>
          현재{' '}
          <strong
            style={{
              color: selectMode === 'origin' ? 'blue' : 'green',
            }}
          >
            {selectMode === 'origin' ? '출발지' : '도착지'}
          </strong>{' '}
          선택 모드입니다.
        </p>
        <p>
          출발지:{' '}
          {routeData.origin
            ? routeData.origin.map((c) => c.toFixed(4)).join(', ')
            : '미설정 (지도 클릭)'}{' '}
          / 도착지:{' '}
          {routeData.dest
            ? routeData.dest.map((c) => c.toFixed(4)).join(', ')
            : '미설정 (지도 클릭)'}
        </p>

        <label style={{ display: 'block', marginTop: '10px' }}>
          원하는 거리 (km):
          <input
            type="number"
            value={routeData.distanceKm}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              setRouteData({
                ...routeData,
                distanceKm:
                  newValue > 0 ? newValue : DEFAULT_ROUTE_DATA.distanceKm,
              });
            }}
            style={styles.input}
          />
        </label>
      </div>

      {/* 경로 정보 패널 */}
      {(recommendedRoute || isNavigating) && (
        <DataPanel
          route={recommendedRoute}
          isNavigating={isNavigating}
          deviationMessage={deviationMessage}
        />
      )}

      {/* 선호 조건 */}
      {!isNavigating && (
        <div style={styles.prefsGroup}>
          <h4>선호 조건</h4>
          {Object.keys(routeData.prefs).map((key) => (
            <label key={key} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={routeData.prefs[key]}
                onChange={(e) =>
                  setRouteData({
                    ...routeData,
                    prefs: {
                      ...routeData.prefs,
                      [key]: e.target.checked,
                    },
                  })
                }
              />
              {key === 'avoidUphill' && ' 경사 회피'}
              {key === 'minimizeCrosswalks' && ' 횡단보도 최소화'}
              {key === 'avoidCrowd' && ' 혼잡 회피'}
            </label>
          ))}
        </div>
      )}

      {/* 버튼 그룹: 추천/재추천 + 시작/종료 + 저장 */}
      <div style={styles.buttonGroup}>
        {/* 추천 / 재추천 버튼 (내비게이션 중 아닐 때만) */}
        {!isNavigating && (
          <button
            onClick={handleRecommend}
            disabled={loading || !routeData.origin || !routeData.dest}
            style={styles.buttonPrimary}
          >
            {loading
              ? recommendedRoute
                ? '재추천 중...'
                : '추천 중...'
              : recommendedRoute
              ? '경로 다시 추천'
              : '경로 추천 받기'}
          </button>
        )}

        {/* 운동 시작 / 종료 */}
        {recommendedRoute && !isNavigating && (
          <button
            onClick={handleStartNavigation}
            style={{
              ...styles.buttonPrimary,
              backgroundColor: 'green',
              marginTop: '10px',
            }}
          >
            🏃 운동 시작 (내비게이션 시작)
          </button>
        )}

        {isNavigating && (
          <button
            onClick={() => setIsNavigating(false)}
            style={{
              ...styles.buttonPrimary,
              backgroundColor: 'darkred',
            }}
          >
            🛑 운동 종료
          </button>
        )}

        {/* 경로 저장 */}
        {recommendedRoute && !isNavigating && (
          <button
            onClick={handleSaveRoute}
            style={{
              ...styles.buttonPrimary,
              backgroundColor: '#ff9900',
              marginTop: '10px',
            }}
          >
            💾 경로 저장 및 공유
          </button>
        )}
      </div>

      {/* 상태 표시 */}
      <p style={styles.status}>
        API 상태:{' '}
        {loading ? (
          '요청 중...'
        ) : error ? (
          <span style={{ color: 'red' }}>오류: {error}</span>
        ) : (
          '준비 완료'
        )}
      </p>
    </div>
  );
}

// --- 스타일 ---
const styles = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  status: {
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '15px',
  },
  searchBar: {
    display: 'flex',
    marginBottom: '15px',
  },
  searchInput: {
    flexGrow: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px 0 0 5px',
  },
  searchButton: {
    padding: '0 15px',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
  },
  inputGroup: {
    marginBottom: '15px',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  input: {
    marginLeft: '10px',
    padding: '5px',
  },
  prefsGroup: {
    marginBottom: '20px',
    padding: '10px',
    border: '1px solid #f0f0f0',
    borderRadius: '5px',
  },
  buttonGroup: {
    marginTop: '20px',
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    width: '100%',
  },
  modeButtons: {
    display: 'flex',
    marginBottom: '10px',
    gap: '10px',
  },
  buttonActive: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  buttonInactive: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
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
};

export default App;
