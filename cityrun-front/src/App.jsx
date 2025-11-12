import React, { useState, useEffect, useRef } from 'react'; 
import axios from 'axios';
import MapComponent from './components/Map.jsx'; 
import SosButton from './components/SosButton.jsx';
import DataPanel from './components/DataPanel.jsx'; 
import SearchResultPanel from './components/SearchResultPanel.jsx'; // 💡 검색 결과 UI
import { speak } from './utils/tts.js'; 

// 💡 상수 정의
const DEVIATION_THRESHOLD_M = 50; 
const LOCATION_UPDATE_INTERVAL_MS = 5000; 

// 💡 API 연동을 위한 기본 데이터 구조
const DEFAULT_ROUTE_DATA = {
  distanceKm: 5.0,
  origin: null, // 초기에는 null (현재 위치로 설정됨)
  dest: null, // 초기에는 null
  prefs: {
    avoidUphill: true,
    minimizeCrosswalks: true,
    avoidCrowd: true,
  }
};

function App() {
  const [routeData, setRouteData] = useState(DEFAULT_ROUTE_DATA);
  const [recommendedRoute, setRecommendedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null); 
  const [userId, setUserId] = useState(1); // 💡 임시 사용자 ID (테스트용)
  const [selectMode, setSelectMode] = useState('dest'); // 💡 기본 출발지는 '내 위치'이므로 '도착지' 선택 모드로 시작
  const [isNavigating, setIsNavigating] = useState(false); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [deviationMessage, setDeviationMessage] = useState(null); 
  const [searchResults, setSearchResults] = useState([]); // 💡 검색 결과 리스트 상태

  const watchIdRef = useRef(null); 

  // --- 유틸리티 함수 ---

  // 💡 Haversine 공식 (두 좌표 간 거리 계산)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 미터 단위 거리 반환
  };

  // 💡 경로 이탈 감지 (단순화된 버전)
  const isDeviated = (currentLat, currentLng, route) => {
    if (!route || !route.geomJson) return false;
    
    // 단순화를 위해, 현재 위치와 목적지 간의 거리가 전체 경로 길이보다 크게 차이나면 이탈로 간주
    const endLat = route.destLat;
    const endLng = route.destLng;
    const distToEnd = calculateDistance(currentLat, currentLng, endLat, endLng);
    const pathLength = route.distanceM;
    
    if (distToEnd > pathLength * 1.5) { 
        return true;
    }
    return false;
  };
  
  // 💡 10. 경로 재탐색 및 내비게이션 재시작
  const handleRecalculateRoute = async (currentLat, currentLng) => {
      speak("경로를 이탈하였습니다. 최적의 경로를 재탐색합니다.");
      setDeviationMessage("경로 이탈! 재탐색 중입니다...");

      const originalDest = routeData.dest;
      
      const newRouteData = {
          ...routeData,
          origin: [currentLat, currentLng], // 현재 위치를 새로운 출발지로 설정
          dest: originalDest // 목적지는 그대로 유지
      };

      try {
          const response = await axios.post('/api/routes/recommend', newRouteData);
          const newRoute = response.data;

          setRecommendedRoute(newRoute);
          setRouteData(newRouteData); 
          setError(null);
          speak("새로운 경로를 찾았습니다. 내비게이션을 재시작합니다.");

      } catch (err) {
          setError("재탐색에 실패했습니다. 지도상의 경로를 확인해주세요.");
          speak("경로 재탐색에 실패했습니다.");
      }
  };

  // --- useEffect 훅 ---

  // 💡 6. 초기 TTS 안내 및 2. GeoLocation (위치 획득)
  useEffect(() => {
      speak("시티 런 내비게이션에 오신 것을 환영합니다.");
      
      // HTTPS 환경에서 Geolocation 작동
      if (navigator.geolocation && window.naver && window.naver.maps) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                  setUserLocation(newLocation);
                  setRouteData(prev => ({ ...prev, origin: [newLocation.lat, newLocation.lng] }));
                  speak("현재 위치를 파악했습니다. 지도에서 도착지를 선택해주세요.");
              },
              (error) => {
                  // HTTPS 환경에서도 사용자가 '거부'할 경우 오류 발생
                  const defaultLocation = { lat: 37.5665, lng: 126.9780 };
                  setUserLocation(defaultLocation);
                  setRouteData(prev => ({ ...prev, origin: [defaultLocation.lat, defaultLocation.lng] }));
                  console.error("위치 획득 실패(HTTPS 필요):", error);
                  speak("현재 위치 획득에 실패했습니다. 기본 위치가 설정되었습니다.");
              }
          );
      } else {
          // GeoLocation 미지원 시 기본 위치
          const defaultLocation = { lat: 37.5665, lng: 126.9780 };
          setUserLocation(defaultLocation);
          setRouteData(prev => ({ ...prev, origin: [defaultLocation.lat, defaultLocation.lng] }));
      }
      
      return () => {
          if (watchIdRef.current) {
              navigator.geolocation.clearWatch(watchIdRef.current);
          }
      };
  }, []); // 마운트 시 한 번만 실행

  // 💡 10. 경로 이탈 감지 및 내비게이션 추적 로직
  useEffect(() => {
      if (!isNavigating || !recommendedRoute) {
          if(watchIdRef.current) {
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
                  setDeviationMessage(null); // 정상 경로 복귀
              }
          },
          (error) => {
              console.error("내비게이션 중 위치 추적 오류:", error);
              speak("위치 추적에 실패했습니다. 내비게이션을 중단합니다.");
              setIsNavigating(false);
          },
          { enableHighAccuracy: true, maximumAge: LOCATION_UPDATE_INTERVAL_MS, timeout: 60000 }
      );
      
      return () => {
          if (watchIdRef.current) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
          }
      };
      
  }, [isNavigating, recommendedRoute]);

  // --- 이벤트 핸들러 ---

  // 💡 1. 지도 클릭 핸들러 (출발지/도착지 설정)
  const handleMapClick = ({ lat, lng }) => {
    const coords = [lat, lng]; 
    setSearchResults([]); // 💡 지도 클릭 시 검색 결과 숨김

    if (selectMode === 'origin') {
        setRouteData(prev => ({ ...prev, origin: coords }));
        setSelectMode('dest');
        speak("출발지가 설정되었습니다. 지도에서 도착지를 선택해주세요.");
    } else {
        setRouteData(prev => ({ ...prev, dest: coords }));
        setSelectMode('origin');
        speak("도착지가 설정되었습니다. 경로 추천 버튼을 눌러주세요.");
    }
  };

  // 💡 (A) 주소 검색 기능 (Naver Geocoding API 사용)
  const handleSearch = () => {
    // 💡 geocode 오류 방지: window.naver.maps.Service가 로드되었는지 확인
    if (!window.naver || !window.naver.maps || !window.naver.maps.Service || !searchQuery) {
        setError("지도 인증에 실패했거나(NCP URL 확인) 검색어가 비어 있습니다.");
        speak("지도 검색 기능을 사용할 수 없습니다. API 인증 상태를 확인하세요.");
        return;
    }
    
    speak(`${searchQuery}를 검색합니다.`);
    setLoading(true);
    
    window.naver.maps.Service.geocode({
        query: searchQuery
    }, (status, response) => {
        setLoading(false);
        if (status === window.naver.maps.Service.Status.OK) {
            const results = response.v2.addresses;
            if (results && results.length > 0) {
                setSearchResults(results); // 💡 검색 결과를 상태에 저장
                speak(`검색된 ${searchQuery}에 대한 ${results.length}개의 결과입니다.`);
            } else {
                speak("검색 결과가 없습니다.");
                setSearchResults([]);
            }
        } else {
            speak("주소 검색에 실패했습니다.");
            setSearchResults([]);
        }
    });
  };

  // 💡 (A-2) 검색 목록에서 출발지/도착지 선택 핸들러
  const handleSetOriginFromSearch = ({ lat, lng }) => {
      setRouteData(prev => ({ ...prev, origin: [lat, lng] }));
      setSelectMode('dest');
      setSearchResults([]); // 💡 선택 완료 후 검색 결과 숨김
      speak("출발지가 설정되었습니다.");
  };

  const handleSetDestFromSearch = ({ lat, lng }) => {
      setRouteData(prev => ({ ...prev, dest: [lat, lng] }));
      setSelectMode('origin');
      setSearchResults([]); // 💡 선택 완료 후 검색 결과 숨김
      speak("도착지가 설정되었습니다.");
  };

  // 💡 4. 경로 추천 함수 (Geo Engine 호출)
  const handleRecommend = async () => {
    if (!routeData.origin || !routeData.dest) {
        setError("출발지와 도착지를 모두 설정해주세요.");
        speak("출발지와 도착지를 모두 설정해주세요.");
        return;
    }

    setLoading(true);
    setError(null);
    setRecommendedRoute(null);
    speak("경로를 탐색 중입니다. 잠시만 기다려주세요.");

    try {
      const response = await axios.post('/api/routes/recommend', routeData);
      setRecommendedRoute(response.data); 
      speak("최적의 경로를 찾았습니다. 지도를 확인해 주세요.");
    } catch (err) {
      console.error('경로 추천 실패:', err);
      setError(err.response?.data?.message || '경로 추천 요청 중 오류가 발생했습니다.');
      speak("경로 추천 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 💡 6. 내비게이션 시작 함수 (E)
  const handleStartNavigation = () => {
    if (!recommendedRoute) {
      speak("경로가 선택되지 않았습니다. 먼저 경로 추천을 받아주세요.");
      return;
    }
    setIsNavigating(true);
    speak("운동을 시작합니다. 경로를 따라 달려주세요.");
  };

  // 💡 7. 경로 저장 함수
  const handleSaveRoute = async () => {
      if (!recommendedRoute || !userId) {
          alert("저장할 경로가 없거나 로그인 상태가 아닙니다.");
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
          isPublic: true, // 기본적으로 공유 가능으로 설정
          geomJson: recommendedRoute.geomJson
      };

      try {
          await axios.post('/api/routes', saveRequest); 
          speak("경로를 성공적으로 저장하고 공유했습니다.");
          alert("✅ 경로가 저장 및 공유되었습니다!");
      } catch (err) {
          speak("경로 저장에 실패했습니다.");
          alert("❌ 경로 저장 실패: 로그인 상태를 확인하세요.");
          console.error("경로 저장 오류:", err);
      }
  };

  // --- 렌더링 ---
  return (
    <div style={styles.container}>
      {/* 💡 9. SOS 버튼 통합 */}
      {userId && userLocation && <SosButton userId={userId} userLocation={userLocation} />}

      <h2>🏃 CityRun 경로 추천 (React)</h2>
      
      {/* 💡 (A) 검색 바 추가 */}
      <div style={styles.searchBar}>
        <input
            type="text"
            placeholder="출발지 또는 도착지를 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading} style={styles.searchButton}>
            {loading ? '...' : '검색'}
        </button>
      </div>

      {/* 💡 지도 컴포넌트 렌더링 (searchResults 전달) */}
      {userLocation && <MapComponent 
          route={recommendedRoute} 
          userLocation={userLocation}
          onMapClick={handleMapClick}
          routeData={routeData} 
          searchResults={searchResults} // 💡 검색 결과 전달
      />}

      {/* 💡 검색 결과 패널 (Naver 지도 앱 UI) */}
      {searchResults.length > 0 && (
          <SearchResultPanel
              results={searchResults}
              onSetOrigin={handleSetOriginFromSearch}
              onSetDest={handleSetDestFromSearch}
          />
      )}
      
      {/* 💡 경로 선택 현황 및 모드 표시 */}
      <div style={styles.inputGroup}>
            <p>
                현재 선택 모드: <strong style={{ color: selectMode === 'origin' ? 'blue' : 'green' }}>{selectMode === 'origin' ? '출발지' : '도착지'}</strong>를 지도에서 클릭하거나 검색하세요.
            </p>
            <p>
                출발지: {routeData.origin ? routeData.origin.map(c => c.toFixed(4)).join(', ') : '미설정'} / 
                도착지: {routeData.dest ? routeData.dest.map(c => c.toFixed(4)).join(', ') : '미설정'}
            </p>
            
            <label style={{ display: 'block', marginTop: '10px' }}>
              원하는 거리 (km):
              <input
                type="number"
                value={routeData.distanceKm}
                onChange={(e) => setRouteData({ ...routeData, distanceKm: parseFloat(e.target.value) || 0 })}
                style={styles.input}
              />
            </label>
      </div>

      {/* 💡 데이터 시각화 패널 (추천 경로가 있거나, 내비게이션 중일 때) */}
      {(recommendedRoute || isNavigating) && <DataPanel 
          route={recommendedRoute} 
          isNavigating={isNavigating}
          deviationMessage={deviationMessage} 
      />}
      
      {/* 💡 2. 선호도 설정 (prefs) */}
      {!isNavigating && (
          <div style={styles.prefsGroup}>
            <h4>선호 조건</h4>
            {Object.keys(routeData.prefs).map(key => (
              <label key={key} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={routeData.prefs[key]}
                  onChange={(e) => setRouteData({ 
                    ...routeData, 
                    prefs: { ...routeData.prefs, [key]: e.target.checked }
                  })}
                />
                {key === 'avoidUphill' && ' 경사 회피'}
                {key === 'minimizeCrosswalks' && ' 횡단보도 최소화'}
                {key === 'avoidCrowd' && ' 혼잡 회피'}
              </label>
            ))}
          </div>
      )}

      {/* 💡 메인 버튼 영역: 추천 vs 시작 */}
      <div style={styles.buttonGroup}>
          {recommendedRoute && !isNavigating ? (
              <>
                  <button onClick={handleStartNavigation} style={{ ...styles.buttonPrimary, backgroundColor: 'green' }}>
                      🏃 운동 시작 (내비게이션 시작)
                  </button>
                  <button onClick={handleSaveRoute} style={{ ...styles.buttonPrimary, backgroundColor: '#ff9900', marginTop: '10px' }}>
                      💾 경로 저장 및 공유
                  </button>
              </>
          ) : isNavigating ? (
              <button onClick={() => setIsNavigating(false)} style={{ ...styles.buttonPrimary, backgroundColor: 'darkred' }}>
                  🛑 운동 종료
              </button>
          ) : (
              <button onClick={handleRecommend} disabled={loading || !routeData.origin || !routeData.dest} style={styles.buttonPrimary}>
                  {loading ? '추천 중...' : '경로 추천 받기'}
              </button>
          )}
      </div>

      {/* 💡 API 상태 메시지 */}
      <p style={styles.status}>
        API 상태: {loading ? '요청 중...' : error ? <span style={{ color: 'red' }}>오류: {error}</span> : '준비 완료'}
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
    fontFamily: 'Arial, sans-serif'
  },
  status: {
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '15px'
  },
  searchBar: {
    display: 'flex',
    marginBottom: '15px'
  },
  searchInput: {
    flexGrow: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px 0 0 5px'
  },
  searchButton: {
    padding: '0 15px',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer'
  },
  inputGroup: {
    marginBottom: '15px',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px'
  },
  input: {
    marginLeft: '10px',
    padding: '5px'
  },
  prefsGroup: {
    marginBottom: '20px',
    padding: '10px',
    border: '1px solid #f0f0f0',
    borderRadius: '5px'
  },
  buttonGroup: {
    marginTop: '20px'
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    width: '100%'
  },
  button: {
    marginTop: '10px',
    padding: '5px 10px',
    cursor: 'pointer',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ccc',
    borderRadius: '3px'
  },
  result: {
    marginTop: '30px',
    borderTop: '2px solid #007bff',
    paddingTop: '15px'
  },
  pre: {
    backgroundColor: '#f4f4f4',
    padding: '10px',
    borderRadius: '5px',
    overflowX: 'auto'
  }
};

export default App;