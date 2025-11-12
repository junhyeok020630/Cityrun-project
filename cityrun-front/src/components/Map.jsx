import React, { useEffect, useRef } from 'react';

const MAP_CENTER = new naver.maps.LatLng(37.5665, 126.9780); // 서울 시청

const MapComponent = ({ route, userLocation }) => {
  const mapRef = useRef(null); // 지도를 렌더링할 DOM 요소
  const mapInstanceRef = useRef(null); // naver.maps.Map 인스턴스 저장

  useEffect(() => {
    // Naver Map이 로드되었는지 확인
    if (!window.naver || !window.naver.maps || mapInstanceRef.current) return;

    // 지도 초기화
    const map = new naver.maps.Map(mapRef.current, {
      center: MAP_CENTER,
      zoom: 13,
      mapTypeId: naver.maps.MapTypeId.NORMAL
    });
    mapInstanceRef.current = map;

    // 💡 초기 사용자 위치 (지도에 마커로 표시)
    if (userLocation) {
      new naver.maps.Marker({
        position: new naver.maps.LatLng(userLocation.lat, userLocation.lng),
        map: map,
        title: '내 위치'
      });
    }

  }, []); // 마운트 시 한 번만 실행

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !route || !route.geomJson) return;

    // 💡 5. 계산된 경로를 지도상에 출력
    try {
      const geojson = JSON.parse(route.geomJson);
      
      if (geojson.type === "LineString") {
        const path = geojson.coordinates.map(coord => new naver.maps.LatLng(coord[1], coord[0])); // GeoJSON [lng, lat] -> Naver [lat, lng]
        
        // 기존 경로 제거 (있다면)
        if (mapInstanceRef.current.currentPolyline) {
          mapInstanceRef.current.currentPolyline.setMap(null);
        }

        const polyline = new naver.maps.Polyline({
          map: map,
          path: path,
          strokeColor: '#007bff',
          strokeOpacity: 0.8,
          strokeWeight: 6
        });

        mapInstanceRef.current.currentPolyline = polyline;
        map.fitBounds(polyline.getBounds()); // 경로 전체가 보이도록 지도 영역 설정

      }
    } catch (e) {
      console.error("GeoJSON 파싱 오류:", e);
    }
  }, [route]); // route 객체가 변경될 때마다 실행

  return <div ref={mapRef} style={{ width: '100%', height: 'calc(100vh - 200px)', borderRadius: '8px' }}></div>;
};

export default MapComponent;