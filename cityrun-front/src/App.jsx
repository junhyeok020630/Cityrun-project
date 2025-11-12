import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import MapComponent from './components/Map.jsx'; 
import SosButton from './components/SosButton.jsx';
import { speak } from './utils/tts.js'; 

// 💡 API 연동을 위한 기본 데이터 구조 (RecommendRequest 모델 반영)
const DEFAULT_ROUTE_DATA = {
  distanceKm: 5.0,
  origin: null, // 초기에는 null로 설정
  dest: null, // 초기에는 null로 설정
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
  const [userLocation, setUserLocation] = useState(null); // 💡 사용자 위치 상태 초기화
  const [userId, setUserId] = useState(1); // 💡 임시 사용자 ID (테스트용 - 실제는 로그인 후 설정)
  const [selectMode, setSelectMode] = useState('origin'); // 'origin' 또는 'dest'

  // 💡 6. TTS 음성 안내 시작 (마운트 시 초기 TTS 안내)
  useEffect(() => {
      speak("시티 런 내비게이션에 오신 것을 환영합니다. 경로 추천을 시작해 주세요.");
  }, []);

  // 💡 2. 로그인한 사용자는 본인의 위치 제공 동의 받기 (GeoLocation)
  useEffect(() => {
    // GeoLocation은 HTTPS 환경에서만 작동하며, 실패 시 기본 위치 사용
    if (navigator.geolocation && window.naver && window.naver.maps) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 실제 위치 획득 성공 시 상태 업데이트
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setRouteData(prev => ({ ...prev, origin: [newLocation.lat, newLocation.lng] }));
          speak("현재 위치를 파악했습니다. 지도에서 도착지를 선택해주세요.");
        },
        (error) => {
          // 위치 획득 실패 시 기본 위치(서울 시청) 사용
          const defaultLocation = { lat: 37.5665, lng: 126.9780 };
          setUserLocation(defaultLocation);
          setRouteData(prev => ({ ...prev, origin: [defaultLocation.lat, defaultLocation.lng] }));
          console.error("위치 획득 실패:", error);
          speak("현재 위치 획득에 실패했습니다. 기본 위치가 설정되었습니다.");
        }
      );
    } else {
        // GeoLocation 미지원 또는 Naver Map 미로드 시 기본 위치 사용
        const defaultLocation = { lat: 37.5665, lng: 126.9780 };
        setUserLocation(defaultLocation);
        setRouteData(prev => ({ ...prev, origin: [defaultLocation.lat, defaultLocation.lng] }));
    }
  }, []); // 마운트 시 한 번만 실행


  // 💡 지도 클릭 이벤트 핸들러 (출발지/도착지 설정)
  const handleMapClick = ({ lat, lng }) => {
    const coords = [lat, lng]; // [lat, lng]

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


  // Geo 엔진을 호출하는 핵심 함수
  const handleRecommend = async () => {
    if (!routeData.origin || !routeData.dest) {
        setError("출발지와 도착지를 모두 설정해주세요.");
        speak("출발지와 도착지를 모두 설정해주세요.");
        return;
    }

    setLoading(true);
    setError(null);
    setRecommendedRoute(null);
    speak("경로를 탐색 중입니다. 잠시만 기다려주세요."); // 💡 TTS 안내 추가

    // 💡 4. 지금까지의 로직을 이용해 러닝 경로 계산
    try {
      // Nginx 프록시를 통해 API 서버로 요청 (http://localhost/api/routes/recommend)
      const response = await axios.post('/api/routes/recommend', routeData);
      setRecommendedRoute(response.data); 
      speak("최적의 경로를 찾았습니다. 지도를 확인해 주세요."); // 💡 TTS 안내 추가
    } catch (err) {
      console.error('경로 추천 실패:', err);
      setError(err.response?.data?.message || '경로 추천 요청 중 오류가 발생했습니다.');
      speak("경로 추천 중 오류가 발생했습니다."); // 💡 TTS 안내 추가
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 💡 9. SOS 버튼 통합 */}
      {userId && userLocation && <SosButton userId={userId} userLocation={userLocation} />}

      <h2>🏃 CityRun 경로 추천 (React)</h2>
      <p style={styles.status}>
        API 상태: {loading ? '요청 중...' : error ? <span style={{ color: 'red' }}>오류: {error}</span> : '준비 완료'}
      </p>

      {/* 💡 3, 5. 지도상에 위치 표시 및 계산된 경로 출력 */}
      {userLocation && <MapComponent 
          route={recommendedRoute} 
          userLocation={userLocation}
          onMapClick={handleMapClick} // 💡 클릭 이벤트 핸들러 전달
      />}
      
      {/* 💡 경로 선택 현황 및 모드 표시 */}
      <div style={styles.inputGroup}>
            <p>
                현재 선택 모드: <strong style={{ color: selectMode === 'origin' ? 'blue' : 'green' }}>{selectMode === 'origin' ? '출발지' : '도착지'}</strong>를 지도에서 클릭하세요.
            </p>
            <p>
                출발지: {routeData.origin ? routeData.origin.map(c => c.toFixed(4)).join(', ') : '미설정'} / 
                도착지: {routeData.dest ? routeData.dest.map(c => c.toFixed(4)).join(', ') : '미설정'}
            </p>
            
            {/* 💡 1. 거리 입력 (distanceKm) */}
            <label>
              원하는 거리 (km):
              <input
                type="number"
                value={routeData.distanceKm}
                onChange={(e) => setRouteData({ ...routeData, distanceKm: parseFloat(e.target.value) || 0 })}
                style={styles.input}
              />
            </label>
        </div>


      {/* 💡 3. 선호도 설정 (prefs) */}
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

      <button onClick={handleRecommend} disabled={loading || !routeData.origin || !routeData.dest} style={styles.buttonPrimary}>
        {loading ? '추천 중...' : '경로 추천 받기'}
      </button>

      {/* 💡 4. 추천 결과 출력 */}
      {recommendedRoute && (
        <div style={styles.result}>
          <h3>✨ 추천 결과: {recommendedRoute.name}</h3>
          <p>최종 점수: {recommendedRoute.finalScore}점</p>
          <pre style={styles.pre}>
            {JSON.stringify(recommendedRoute, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  status: {
    color: 'green',
    fontWeight: 'bold'
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