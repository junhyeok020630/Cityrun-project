import React, { useEffect, useRef, useState } from 'react'; // 💡 useState 임포트 추가

const MAP_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청

// 💡 onMapClick 콜백 함수 추가
const MapComponent = ({ route, userLocation, onMapClick }) => {
  const mapRef = useRef(null); 
  const mapInstanceRef = useRef(null); 
  const polylineRef = useRef(null); 
  const markerRef = useRef(null); 
  const [isMapReady, setIsMapReady] = useState(false); // 💡 상태 정의 추가

  // 💡 지도 초기화 (최초 1회)
  useEffect(() => {
    // window.naver.maps 객체가 존재하고 MapComponent가 처음 마운트 될 때만 실행
    if (!window.naver || !window.naver.maps || mapInstanceRef.current) {
        // SDK가 로드되지 않았다면 500ms 후 다시 확인 (인증 대기)
        const timer = setTimeout(() => {
            if (window.naver && window.naver.maps) {
                initializeMap();
            }
        }, 500);
        return () => clearTimeout(timer);
    }
    
    initializeMap();

    function initializeMap() {
        const { LatLng, Map, MapTypeId, Marker, Point, Event } = window.naver.maps; 

        // 지도 초기화
        const initialCenter = userLocation 
            ? new LatLng(userLocation.lat, userLocation.lng)
            : new LatLng(MAP_CENTER.lat, MAP_CENTER.lng);

        const map = new Map(mapRef.current, {
            center: initialCenter,
            zoom: 13,
            mapTypeId: MapTypeId.NORMAL
        });
        mapInstanceRef.current = map;

        // 초기 사용자 위치 마커 표시
        markerRef.current = new Marker({
            position: initialCenter,
            map: map,
            title: '내 위치',
            icon: {
                content: '<div style="background:red; width:10px; height:10px; border-radius:50%"></div>',
                anchor: new naver.maps.Point(5, 5)
            }
        });

        // 💡 지도 클릭 이벤트 리스너 추가
        Event.addListener(map, 'click', (e) => {
            const lat = e.latlng.lat();
            const lng = e.latlng.lng();
            // 상위 App.jsx로 좌표 전달
            onMapClick({ lat, lng });
        });
        
        setIsMapReady(true); // 💡 지도 준비 완료 상태 업데이트
    }
    
  }, [userLocation, onMapClick]);


  // 💡 경로 그리기 (route 데이터가 바뀔 때마다 실행)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !route) return; // 💡 isMapReady 상태를 사용하여 실행 조건 제어

    // 기존 경로 제거
    if (polylineRef.current) {
        polylineRef.current.setMap(null);
    }
    
    // GeoJSON 파싱 및 경로 생성
    try {
      const { LatLng, Polyline } = window.naver.maps;
      const geojson = JSON.parse(route.geomJson);
      
      if (geojson.type === "LineString") {
        const path = geojson.coordinates.map(coord => new LatLng(coord[1], coord[0]));
        
        const polyline = new Polyline({
          map: map,
          path: path,
          strokeColor: '#007bff',
          strokeOpacity: 0.8,
          strokeWeight: 6
        });

        polylineRef.current = polyline; // 폴리라인 인스턴스 저장
        map.fitBounds(polyline.getBounds()); // 경로 전체가 보이도록 지도 영역 설정
      }
    } catch (e) {
      console.error("GeoJSON 파싱 오류:", e);
    }
  }, [route, isMapReady]); 

  // 지도가 로드되지 않으면 로딩 메시지를 표시
  return (
    <div 
        ref={mapRef} 
        style={{ 
            width: '100%', 
            height: '400px', 
            borderRadius: '8px', 
            backgroundColor: isMapReady ? 'white' : '#f0f0f0', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px' // UI 간격 확보
        }}
    >
        {!isMapReady && (
            <p style={{ color: 'gray', textAlign: 'center' }}>
                Naver Map 로드 대기 중 (인증 오류 지속)<br/>
                API 연동 테스트는 아래 버튼으로 진행하세요.
            </p>
        )}
    </div>
  );
};

export default MapComponent;