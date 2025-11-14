import React, { useEffect, useRef, useState } from 'react';

const MAP_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청

const MapComponent = ({ route, userLocation, onMapClick, routeData, searchResults }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const originDestMarkersRef = useRef([]);   // 출발/도착 마커
  const searchMarkersRef = useRef([]);       // 검색 결과 마커
  const clickListenerRef = useRef(null);     // 클릭 리스너 핸들
  const userMarkerRef = useRef(null);        // (항목 4) 내 위치 마커 Ref

  // --- 1. 지도 초기화 ---
  useEffect(() => {
    if (!window.naver || !window.naver.maps) {
      const timer = setTimeout(() => {
        if (window.naver && window.naver.maps && !mapInstanceRef.current) {
          initializeMap();
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    if (!mapInstanceRef.current) {
      initializeMap();
    }

    function initializeMap() {
      const { LatLng, Map, MapTypeId } = window.naver.maps;
      const initialCenter = userLocation
        ? new LatLng(userLocation.lat, userLocation.lng)
        : new LatLng(MAP_CENTER.lat, MAP_CENTER.lng);
      const map = new Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        mapTypeId: MapTypeId.NORMAL,
      });
      mapInstanceRef.current = map;
      setIsMapReady(true);
    }
  }, [userLocation]);

  // --- (항목 4) 내 위치 마커 업데이트 (SVG 화살표 아이콘) ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps || !userLocation) return;
    
    const { LatLng, Marker, Point, Size } = window.naver.maps;
    const userLatLng = new LatLng(userLocation.lat, userLocation.lng);

    // (항목 4) SVG 화살표 아이콘 정의
    const svgIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2.5 21.5L12 17L21.5 21.5L12 2Z" 
              fill="#007bff" 
              stroke="white" 
              stroke-width="1.5" 
              stroke-linejoin="round"/>
      </svg>
    `;

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(userLatLng);
    } else {
      userMarkerRef.current = new Marker({
        position: userLatLng,
        map,
        title: '내 위치',
        icon: {
          content: svgIcon,
          size: new Size(24, 24),
          anchor: new Point(12, 12), // SVG의 중앙
        },
        zIndex: 100,
      });
    }

  }, [userLocation, isMapReady]);
  
  // --- 2. 클릭 리스너 ---
  useEffect(() => {
    // ... (기존 코드와 동일, 생략)
    if (!isMapReady || !mapInstanceRef.current || !window.naver?.maps) return;
    const { Event } = window.naver.maps;
    if (clickListenerRef.current) {
      Event.removeListener(clickListenerRef.current);
    }
    clickListenerRef.current = Event.addListener(
      mapInstanceRef.current,
      'click',
      (e) => {
        onMapClick({
          lat: e.latlng.lat(),
          lng: e.latlng.lng(),
        });
      }
    );
    return () => {
      if (clickListenerRef.current) {
        Event.removeListener(clickListenerRef.current);
      }
    };
  }, [onMapClick, isMapReady]);

  // --- 3. 검색 결과 마커 ---
  useEffect(() => {
    // ... (기존 코드와 동일, 생략)
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;
    const { LatLng, Marker, LatLngBounds } = window.naver.maps;
    searchMarkersRef.current.forEach((m) => m.setMap(null));
    searchMarkersRef.current = [];
    if (!searchResults || searchResults.length === 0) return;
    const bounds = new LatLngBounds();
    searchResults.forEach((item) => {
      const lat = parseFloat(item.y);
      const lng = parseFloat(item.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const latlng = new LatLng(lat, lng);
      const marker = new Marker({
        position: latlng,
        map,
        title: item.roadAddress || item.jibunAddress || '',
      });
      searchMarkersRef.current.push(marker);
      bounds.extend(latlng);
    });
    if (searchMarkersRef.current.length > 0) {
      map.fitBounds(bounds);
    }
  }, [searchResults, isMapReady]);

  // --- 4. 출발 마커 (도착지 제거) ---
  useEffect(() => {
    // ... (기존 코드와 동일, 생략)
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;
    const { LatLng, Marker, Point } = window.naver.maps;
    originDestMarkersRef.current.forEach((m) => m.setMap(null));
    originDestMarkersRef.current = [];
    if (routeData.origin && searchMarkersRef.current.length > 0) {
      searchMarkersRef.current.forEach((m) => m.setMap(null));
      searchMarkersRef.current = [];
    }
    if (routeData.origin && routeData.origin.length === 2) {
      const [lat, lng] = routeData.origin;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const originMarker = new Marker({
          position: new LatLng(lat, lng),
          map,
          title: '출발지',
          icon: {
            content:
              '<div style="background:green; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>',
            anchor: new Point(7, 7),
          },
        });
        originDestMarkersRef.current.push(originMarker);
      }
    }
  }, [routeData, isMapReady]);

  // --- 5. 경로 Polyline ---
  useEffect(() => {
    // ... (기존 코드와 동일, 생략)
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;
    const { LatLng, Polyline, LatLngBounds } = window.naver.maps;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (!route || !route.geomJson) {
      return;
    }
    let geojson;
    try {
      geojson =
        typeof route.geomJson === 'string'
          ? JSON.parse(route.geomJson)
          : route.geomJson;
    } catch (e) {
      console.error('GeoJSON 파싱 오류:', e, route.geomJson);
      return;
    }
    const flatPath = [];
    const addLineString = (coords) => {
      if (!Array.isArray(coords)) return;
      for (const c of coords) {
        if (!Array.isArray(c) || c.length < 2) continue;
        const lng = parseFloat(c[0]);
        const lat = parseFloat(c[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        flatPath.push(new LatLng(lat, lng));
      }
    };
    if (geojson.type === 'LineString') {
      addLineString(geojson.coordinates);
    } else if (geojson.type === 'MultiLineString') {
      geojson.coordinates.forEach((line) => addLineString(line));
    } else if (
      geojson.type === 'GeometryCollection' &&
      Array.isArray(geojson.geometries)
    ) {
      geojson.geometries.forEach((g) => {
        if (g.type === 'LineString') addLineString(g.coordinates);
        else if (g.type === 'MultiLineString')
          g.coordinates.forEach((line) => addLineString(line));
      });
    }
    if (flatPath.length < 2) {
      return;
    }
    try {
      const polyline = new Polyline({
        map,
        path: flatPath,
        strokeColor: '#007bff',
        strokeOpacity: 0.8,
        strokeWeight: 6,
      });
      polylineRef.current = polyline;
      const bounds = new LatLngBounds();
      flatPath.forEach((latlng) => bounds.extend(latlng));
      map.fitBounds(bounds);
    } catch (e) {
      console.error('[ROUTE DEBUG] Polyline 생성/그리기 중 오류:', e);
    }
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [route, isMapReady]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        backgroundColor: isMapReady ? 'white' : '#f0f0f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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