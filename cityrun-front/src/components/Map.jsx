import React, { useEffect, useRef, useState } from 'react';

const MAP_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청

const MapComponent = ({ route, userLocation, onMapClick, routeData, searchResults }) => {
  const mapRef = useRef(null);               // DOM element
  const mapInstanceRef = useRef(null);       // naver.maps.Map 인스턴스
  const polylineRef = useRef(null);          // 경로 Polyline
  const originDestMarkersRef = useRef([]);   // 출발/도착 마커
  const searchMarkersRef = useRef([]);       // 검색 결과 마커
  const clickListenerRef = useRef(null);     // 지도 클릭 리스너

  const [isMapReady, setIsMapReady] = useState(false);

  // ===============================
  // 1. 지도 초기화 (최초 1회)
  // ===============================
  useEffect(() => {
    // Naver Map SDK 로드 대기
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

  // ==============================================
  // 2. 지도 클릭 리스너 등록 (onMapClick이 바뀔 때마다)
  // ==============================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps || !onMapClick) return;

    const { Event } = window.naver.maps;

    // 기존 리스너 제거
    if (clickListenerRef.current) {
      Event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    // 최신 onMapClick을 사용하는 리스너 등록
    clickListenerRef.current = Event.addListener(map, 'click', (e) => {
      // Naver Maps v3 이벤트 객체에 따라 e.coord 또는 e.latlng 사용
      const lat = e.latlng ? e.latlng.lat() : e.coord.lat();
      const lng = e.latlng ? e.latlng.lng() : e.coord.lng();
      onMapClick({ lat, lng });
    });

    // cleanup
    return () => {
      if (clickListenerRef.current) {
        Event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [onMapClick, isMapReady]);

  // ======================================
  // 3. 검색 결과 마커 표시
  // ======================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;

    const { LatLng, Marker, LatLngBounds } = window.naver.maps;

    // 기존 검색 마커 제거
    searchMarkersRef.current.forEach((marker) => marker.setMap(null));
    searchMarkersRef.current = [];

    if (searchResults && searchResults.length > 0) {
      const bounds = new LatLngBounds();

      searchResults.forEach((item) => {
        const latlng = new LatLng(item.y, item.x);
        const marker = new Marker({
          position: latlng,
          map: map,
          title: item.roadAddress || item.jibunAddress,
        });

        searchMarkersRef.current.push(marker);
        bounds.extend(latlng);
      });

      map.fitBounds(bounds);
    }
  }, [searchResults, isMapReady]);

  // ======================================
  // 4. 출발지 / 도착지 마커 표시
  // ======================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;

    const { LatLng, Marker, Point } = window.naver.maps;

    // 기존 출발/도착 마커 제거
    originDestMarkersRef.current.forEach((marker) => marker.setMap(null));
    originDestMarkersRef.current = [];

    // 출발지/도착지가 설정되면 검색 마커 숨김
    if ((routeData.origin || routeData.dest) && searchMarkersRef.current.length > 0) {
      searchMarkersRef.current.forEach((marker) => marker.setMap(null));
      searchMarkersRef.current = [];
    }

    // 출발지
    if (routeData.origin && routeData.origin.length === 2) {
      const originMarker = new Marker({
        position: new LatLng(routeData.origin[0], routeData.origin[1]),
        map: map,
        title: '출발지',
        icon: {
          content:
            '<div style="background:blue; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>',
          anchor: new Point(7, 7),
        },
      });
      originDestMarkersRef.current.push(originMarker);
    }

    // 도착지
    if (routeData.dest && routeData.dest.length === 2) {
      const destMarker = new Marker({
        position: new LatLng(routeData.dest[0], routeData.dest[1]),
        map: map,
        title: '도착지',
        icon: {
          content:
            '<div style="background:green; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>',
          anchor: new Point(7, 7),
        },
      });
      originDestMarkersRef.current.push(destMarker);
    }
  }, [routeData, isMapReady]);

  // ======================================
  // 5. 추천 경로 Polyline 표시
  // ======================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map || !window.naver?.maps) return;

    // route가 없으면 기존 경로 제거
    if (!route) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    try {
      const { LatLng, Polyline } = window.naver.maps;
      const geojson = JSON.parse(route.geomJson);

      // 기존 polyline 제거
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      if (geojson.type === 'LineString') {
        // GeoJSON: [lng, lat] → LatLng: (lat, lng)
        const path = geojson.coordinates.map(
          (coord) => new LatLng(coord[1], coord[0])
        );

        const polyline = new Polyline({
          map: map,
          path: path,
          strokeColor: '#007bff',
          strokeOpacity: 0.8,
          strokeWeight: 6,
        });

        polylineRef.current = polyline;
        map.fitBounds(polyline.getBounds());
      }
    } catch (e) {
      console.error('GeoJSON 파싱 오류:', e);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [route, isMapReady]);

  // ======================================
  // 렌더링
  // ======================================
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
        marginBottom: '20px',
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
