import React, { useState, useEffect } from 'react'; // 💡 useEffect 추가 (MapComponent 통합 대비)
import axios from 'axios';
import MapComponent from './components/Map.jsx'; // 💡 MapComponent 임포트 (Naver Map 표시)

// 💡 API 연동을 위한 기본 데이터 구조 (RecommendRequest 모델 반영)
const DEFAULT_ROUTE_DATA = {
  distanceKm: 5.0,
  origin: [37.5665, 126.9780], // 서울 시청 근처
  dest: [37.5665, 126.9780],
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

  // 💡 2. 로그인한 사용자는 본인의 위치 제공 동의 받기 (useEffect로 시뮬레이션)
  useEffect(() => {
    // Naver Map이 로드된 후 위치 요청
    if (navigator.geolocation && window.naver && window.naver.maps) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 실제 위치 획득 성공 시 상태 업데이트
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log("위치 동의 및 획득 성공");
        },
        (error) => {
          // 위치 획득 실패 시 기본 위치 사용 (서울 시청)
          setUserLocation({ lat: 37.5665, lng: 126.9780 });
          console.error("위치 획득 실패:", error);
        }
      );
    } else {
        // Geolocation 미지원 또는 Naver Map 미로드 시 기본 위치 사용
        setUserLocation({ lat: 37.5665, lng: 126.9780 });
    }
  }, []); // 마운트 시 한 번만 실행

  // Geo 엔진을 호출하는 핵심 함수
  const handleRecommend = async () => {
    setLoading(true);
    setError(null);
    setRecommendedRoute(null);

    // 💡 4. 지금까지의 로직을 이용해 러닝 경로 계산
    try {
      // Nginx 프록시를 통해 API 서버로 요청 (http://localhost/api/routes/recommend)
      const response = await axios.post('/api/routes/recommend', routeData);
      
      // API 서버는 Geo 엔진 응답의 'route' 객체 자체를 반환함.
      // recommendedRoute에 Geo 엔진의 상세 경로 객체가 직접 저장됨.
      setRecommendedRoute(response.data); 
      
    } catch (err) {
      console.error('경로 추천 실패:', err);
      // API 응답 구조에 맞게 오류 메시지 처리
      setError(err.response?.data?.message || '경로 추천 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🏃 CityRun 경로 추천 (React)</h2>
      <p style={styles.status}>
        API 상태: {loading ? '요청 중...' : error ? <span style={{ color: 'red' }}>오류: {error}</span> : '준비 완료'}
      </p>

      {/* 💡 3, 5. 지도상에 위치 표시 및 계산된 경로 출력 */}
      {userLocation && <MapComponent route={recommendedRoute} userLocation={userLocation} />}
      
      {/* 💡 1. 거리 입력 (distanceKm) */}
      <div style={styles.inputGroup}>
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
      
      {/* 💡 2. 출발지 / 목적지 입력 (간단한 예시) */}
      <div style={styles.inputGroup}>
        <p>출발지/목적지 (순환코스): 서울 시청 (37.5665, 126.9780)</p>
        <button 
          onClick={() => setRouteData(DEFAULT_ROUTE_DATA)}
          style={styles.button}
        >
          순환 코스 데이터로 초기화
        </button>
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

      <button onClick={handleRecommend} disabled={loading} style={styles.buttonPrimary}>
        {loading ? '추천 중...' : '경로 추천 받기'}
      </button>

      {/* 💡 4. 추천 결과 출력 */}
      {recommendedRoute && (
        <div style={styles.result}>
          {/* 🚨 수정 완료: recommendedRoute.route.name -> recommendedRoute.name */}
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