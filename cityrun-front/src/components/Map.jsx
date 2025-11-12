import React, { useEffect, useRef, useState } from 'react';

const MAP_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청

const MapComponent = ({ route, userLocation, onMapClick, routeData, searchResults }) => {
  const mapRef = useRef(null); 
  const mapInstanceRef = useRef(null); 
  const polylineRef = useRef(null); 
  const [isMapReady, setIsMapReady] = useState(false); 
  const originDestMarkersRef = useRef([]); // 출발/도착 마커
  const searchMarkersRef = useRef([]); // 💡 검색 결과 마커

  // 💡 지도 초기화 (최초 1회)
  useEffect(() => {
    // ... (SDK 로딩 대기 및 지도 초기화 로직은 이전과 동일)
    
    // Naver Map SDK가 로드되었는지 확인
    if (!window.naver || !window.naver.maps) {
        const timer = setTimeout(() => {
            if (window.naver && window.naver.maps) initializeMap();
        }, 500);
        return () => clearTimeout(timer);
    }
    if (!mapInstanceRef.current) initializeMap();

    function initializeMap() {
        const { LatLng, Map, MapTypeId, Event } = window.naver.maps; 

        const initialCenter = userLocation 
            ? new LatLng(userLocation.lat, userLocation.lng)
            : new LatLng(MAP_CENTER.lat, MAP_CENTER.lng);

        const map = new Map(mapRef.current, {
            center: initialCenter,
            zoom: 15,
            mapTypeId: MapTypeId.NORMAL
        });
        mapInstanceRef.current = map;

        Event.addListener(map, 'click', (e) => {
            onMapClick({ lat: e.latlng.lat(), lng: e.latlng.lng() });
        });
        
        setIsMapReady(true); 
    }
  }, [userLocation, onMapClick]);

  
  // 💡 검색 결과 마커 표시 (A, B)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver.maps) return;

    // 기존 검색 마커 제거
    searchMarkersRef.current.forEach(marker => marker.setMap(null));
    searchMarkersRef.current = [];
    
    // 💡 검색 결과가 있을 때만 실행
    if (searchResults && searchResults.length > 0) {
        const { LatLng, Marker, LatLngBounds } = window.naver.maps;
        const bounds = new LatLngBounds();

        searchResults.forEach(item => {
            const latlng = new LatLng(item.y, item.x);
            const marker = new Marker({ // 일반 마커
                position: latlng,
                map: map,
                title: item.roadAddress || item.jibunAddress
            });
            searchMarkersRef.current.push(marker);
            bounds.extend(latlng);
        });
        
        map.fitBounds(bounds); // 검색 결과에 맞게 지도 확대
    }
  }, [searchResults, isMapReady]);


  // 💡 출발지/도착지 마커 표시 로직 (A, B)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver.maps) return;

    // 기존 출발/도착 마커 제거
    originDestMarkersRef.current.forEach(marker => marker.setMap(null));
    originDestMarkersRef.current = [];

    // 💡 출발지/도착지가 설정되면 검색 마커는 숨김
    if ((routeData.origin || routeData.dest) && searchMarkersRef.current.length > 0) {
        searchMarkersRef.current.forEach(marker => marker.setMap(null));
        searchMarkersRef.current = [];
    }

    const { LatLng, Marker, Point } = window.naver.maps;

    // 출발지 마커
    if (routeData.origin && routeData.origin.length === 2) {
        const originMarker = new Marker({
            position: new LatLng(routeData.origin[0], routeData.origin[1]),
            map: map,
            title: '출발지',
            icon: { 
                content: '<div style="background:blue; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>', 
                anchor: new Point(7, 7) 
            }
        });
        originDestMarkersRef.current.push(originMarker);
    }
    
    // 도착지 마커
    if (routeData.dest && routeData.dest.length === 2) {
        const destMarker = new Marker({
            position: new LatLng(routeData.dest[0], routeData.dest[1]),
            map: map,
            title: '도착지',
            icon: { 
                content: '<div style="background:green; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>', 
                anchor: new Point(7, 7) 
            }
        });
        originDestMarkersRef.current.push(destMarker);
    }
  }, [routeData, isMapReady]); 


  // 💡 5. 계산된 경로를 지도상에 출력 (경로가 떴다가 사라지는 문제 해결)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver.maps) return;

    // 1. route 데이터가 없으면 -> 기존 경로를 지움
    if (!route) {
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
        }
        return;
    }

    // 2. route 데이터가 있으면 -> 새 경로를 그림
    try {
      const { LatLng, Polyline } = window.naver.maps;
      const geojson = JSON.parse(route.geomJson);
      
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      if (geojson.type === "LineString") {
        const path = geojson.coordinates.map(coord => new LatLng(coord[1], coord[0])); // [lng, lat] -> [lat, lng]
        
        const polyline = new Polyline({
          map: map,
          path: path,
          strokeColor: '#007bff',
          strokeOpacity: 0.8,
          strokeWeight: 6
        });

        polylineRef.current = polyline;
        map.fitBounds(polyline.getBounds());
      }
    } catch (e) {
      console.error("GeoJSON 파싱 오류:", e);
    }

    // 3. 클린업 함수
    return () => {
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
        }
    };
  }, [route, isMapReady]); 

  // ... (return 렌더링 로직 생략)
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
            marginBottom: '20px'
        }}
    >
        {!isMapReady && (
            <p style={{ color: 'gray', textAlign: 'center' }}>
                Naver Map 로드 대기 중...
            </p>
        )}
    </div>
  );
};

export default MapComponent;