// Naver 지도 API를 사용하여 지도 인스턴스를 관리하고 경로/마커를 렌더링하는 컴포넌트
import React, { useEffect, useRef, useState } from 'react';

// 지도 초기 중심 좌표 (서울 시청)
const MAP_CENTER = { lat: 37.5665, lng: 126.9780 }; 

/**
 * 지도 컴포넌트
 * @param {object} props
 * @param {object} props.route - 추천 경로 정보 (GeoJSON 포함)
 * @param {object} props.userLocation - 사용자 현재 위치 {lat, lng}
 * @param {function} props.onMapClick - 지도 클릭 시 호출되는 핸들러 (출발지 설정용)
 * @param {object} props.routeData - 출발지 좌표 [lat, lng]
 * @param {Array} props.searchResults - 검색 결과 목록 (현재 지도 마커는 사용 안 함)
 */
const MapComponent = ({ route, userLocation, onMapClick, routeData, searchResults }) => {
  // --- Ref 및 State 정의 ---
  const mapRef = useRef(null); // 지도가 렌더링될 DOM 요소를 참조
  const mapInstanceRef = useRef(null); // Naver Map 인스턴스 객체를 저장
  const polylineRef = useRef(null); // 경로 선(Polyline) 객체를 저장
  const [isMapReady, setIsMapReady] = useState(false); // 지도 로딩 완료 상태

  const originDestMarkersRef = useRef([]);   // 출발지 마커
  const searchMarkersRef = useRef([]);       // 검색 결과 마커
  const clickListenerRef = useRef(null);     // 지도 클릭 이벤트 리스너 핸들
  const userMarkerRef = useRef(null);        // 내 위치 마커 Ref

  // --- 1. 지도 초기화 (최초 1회 실행) ---
  useEffect(() => {
    // Naver Maps API 로드가 완료되었는지 확인 (비동기 로딩을 기다림)
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
      
      // 지도의 초기 중심을 사용자 위치 또는 서울 시청으로 설정
      const initialCenter = userLocation
        ? new LatLng(userLocation.lat, userLocation.lng)
        : new LatLng(MAP_CENTER.lat, MAP_CENTER.lng);

      // Map 인스턴스 생성 및 DOM 요소에 바인딩
      const map = new Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        mapTypeId: MapTypeId.NORMAL,
      });
      mapInstanceRef.current = map;
      setIsMapReady(true); // 지도 준비 완료
    }
  }, [userLocation]);

  // --- 2. 내 위치 마커 업데이트 ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps || !userLocation) return;
    
    const { LatLng, Marker, Point, Size } = window.naver.maps;
    const userLatLng = new LatLng(userLocation.lat, userLocation.lng);

    // 내 위치를 나타내는 커스텀 SVG 아이콘 정의
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
      // 마커가 이미 있으면 위치만 업데이트
      userMarkerRef.current.setPosition(userLatLng);
    } else {
      // 마커가 없으면 새로 생성
      userMarkerRef.current = new Marker({
        position: userLatLng,
        map,
        title: '내 위치',
        icon: {
          content: svgIcon,
          size: new Size(24, 24),
          anchor: new Point(12, 12),
        },
        zIndex: 100,
      });
    }
  }, [userLocation, isMapReady]);
  
  // --- 3. 지도 클릭 리스너 설정 ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;

    const { Event } = window.naver.maps;

    // 기존 리스너가 있다면 제거
    if (clickListenerRef.current) {
      Event.removeListener(clickListenerRef.current);
    }

    // 새로운 클릭 리스너 설정
    clickListenerRef.current = Event.addListener(
      map,
      'click',
      (e) => {
        // 클릭된 위치(위도/경도) 정보를 App.jsx로 전달
        const lat = e.coord.y;
        const lng = e.coord.x;
        onMapClick({ lat, lng });
      }
    );

    // 컴포넌트 정리(cleanup) 함수: 리스너 제거
    return () => {
      if (clickListenerRef.current) {
        Event.removeListener(clickListenerRef.current);
      }
    };
  }, [onMapClick, isMapReady]);

  // --- 4. 검색 결과 마커 표시 (현재 미사용) ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;

    const { LatLng, Marker, LatLngBounds } = window.naver.maps;

    // 기존 검색 마커 제거
    searchMarkersRef.current.forEach((m) => m.setMap(null));
    searchMarkersRef.current = [];

    if (!searchResults || searchResults.length === 0) return;

    const bounds = new LatLngBounds();

    searchResults.forEach((item) => {
      // 네이버 Local Search API의 TM128 좌표를 위도/경도로 변환 (x/1e7, y/1e7)
      const lng = Number(item.x) / 1e7;
      const lat = Number(item.y) / 1e7;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const latlng = new LatLng(lat, lng);
      // 검색 결과 마커 생성
      const marker = new Marker({
        position: latlng,
        map,
        title: item.roadAddress || item.jibunAddress || '',
      });
      searchMarkersRef.current.push(marker);
      bounds.extend(latlng); // 지도 경계 확장
    });

    // 검색 결과가 있으면 지도 뷰를 결과 범위에 맞춤
    if (searchMarkersRef.current.length > 0) {
      map.fitBounds(bounds);
    }
  }, [searchResults, isMapReady]);

  // --- 5. 출발지(origin) 마커 표시 및 지도 중심 이동 ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;

    const { LatLng, Marker, Point } = window.naver.maps;

    // 기존 출발지 마커 제거
    originDestMarkersRef.current.forEach((m) => m.setMap(null));
    originDestMarkersRef.current = [];

    // routeData에 출발지 정보가 없거나 유효하지 않으면 종료
    if (!routeData?.origin || routeData.origin.length !== 2) return;

    const [lat, lng] = routeData.origin; // [위도, 경도]
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const pos = new LatLng(lat, lng);

    // 출발지 마커 생성 (초록색 원)
    const originMarker = new Marker({
      position: pos,
      map,
      title: '출발지',
      icon: {
        content:
          '<div style="background:green; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>',
        anchor: new Point(7, 7),
      },
    });

    originDestMarkersRef.current.push(originMarker);

    // 출발지로 지도 중심 이동
    map.setCenter(pos);
    // map.setZoom(16);

    console.log('[Map] origin updated:', lat, lng);
  }, [routeData?.origin, isMapReady]);

  // --- 6. 경로 Polyline 그리기 ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;

    const { LatLng, Polyline, LatLngBounds } = window.naver.maps;

    // 기존 폴리라인 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!route || !route.geomJson) return;

    let geojson;
    try {
      // GeoJSON 문자열을 파싱
      geojson =
        typeof route.geomJson === 'string'
          ? JSON.parse(route.geomJson)
          : route.geomJson;
    } catch (e) {
      console.error('GeoJSON 파싱 오류:', e, route.geomJson);
      return;
    }

    const flatPath = [];
    // GeoJSON의 LineString 좌표를 LatLng 배열로 변환하는 헬퍼 함수
    const addLineString = (coords) => {
      if (!Array.isArray(coords)) return;
      for (const c of coords) {
        if (!Array.isArray(c) || c.length < 2) continue;
        const lng = parseFloat(c[0]); // GeoJSON 표준: [경도, 위도]
        const lat = parseFloat(c[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        flatPath.push(new LatLng(lat, lng));
      }
    };

    // GeoJSON 타입에 따라 좌표 추출
    if (geojson.type === 'LineString') {
      addLineString(geojson.coordinates);
    } else if (geojson.type === 'MultiLineString') {
      geojson.coordinates.forEach((line) => addLineString(line));
    } else if (
      geojson.type === 'GeometryCollection' &&
      Array.isArray(geojson.geometries)
    ) {
      // GeometryCollection 내의 모든 LineString/MultiLineString 처리
      geojson.geometries.forEach((g) => {
        if (g.type === 'LineString') addLineString(g.coordinates);
        else if (g.type === 'MultiLineString')
          g.coordinates.forEach((line) => addLineString(line));
      });
    }

    if (flatPath.length < 2) return;

    try {
      // Polyline 객체 생성 및 지도에 표시
      const polyline = new Polyline({
        map,
        path: flatPath,
        strokeColor: '#007bff', // 파란색 선
        strokeOpacity: 0.8,
        strokeWeight: 6,
      });
      polylineRef.current = polyline;

      // 폴리라인의 전체 영역에 맞게 지도 경계(Bounds) 조정
      const bounds = new LatLngBounds();
      flatPath.forEach((latlng) => bounds.extend(latlng));
      map.fitBounds(bounds);
    } catch (e) {
      console.error('[ROUTE DEBUG] Polyline 생성/그리기 중 오류:', e);
    }

    // 컴포넌트 정리(cleanup) 함수: 폴리라인 제거
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [route, isMapReady]);

  // --- 7. 최종 렌더링 ---
  return (
    // 지도가 삽입될 DOM 요소
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
        // 지도 로딩 중 메시지
        <p style={{ color: 'gray', textAlign: 'center' }}>
          Naver Map 로드 대기 중...
        </p>
      )}
    </div>
  );
};

export default MapComponent;