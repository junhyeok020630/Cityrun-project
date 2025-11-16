// 장소 검색 결과 목록을 표시하고, 선택된 장소를 출발지로 설정하는 컴포넌트
import React from 'react';

/**
 * 장소 검색 결과 목록 컴포넌트
 * @param {object} props
 * @param {Array} props.results - 검색된 장소 목록 ([{ id, name, roadAddress, jibunAddress, x, y }, ...])
 * @param {function} props.onSetOrigin - '출발' 버튼 클릭 시 호출되는 핸들러 ({ lat, lng })
 */
const SearchResultPanel = ({ results, onSetOrigin }) => {
  
  // '출발' 버튼 클릭 시 호출
  const handleSetOrigin = (item) => {
    // 좌표가 없으면 경고 후 종료
    if (item.y == null || item.x == null) {
      console.warn('선택한 장소에 좌표가 없습니다', item);
      return;
    }

    // 네이버 Local Search의 mapx/mapy (경도/위도 * 1e7 형태)를 실제 좌표로 변환
    const lng = Number(item.x) / 1e7; // 경도
    const lat = Number(item.y) / 1e7; // 위도

    console.log('[Place raw]', item.x, item.y);
    console.log('[Place lat/lng]', lat, lng);

    // App.jsx의 핸들러에 위도/경도 전달 (출발지 설정)
    onSetOrigin({ lat, lng });
  };


  return (
    <div style={styles.container}>
      {/* 검색 결과 개수 표시 */}
      <p style={styles.title}>
        '{results.length}'개의 검색 결과
      </p>

      {results.length === 0 ? (
        // 검색 결과가 없을 경우 메시지 표시
        <div style={{ padding: '10px 15px', fontSize: '14px', color: '#666' }}>
          검색 결과가 없습니다
        </div>
      ) : (
        // 검색 결과 목록 (ul)
        <ul style={styles.list}>
          {results.map((item, index) => (
            <li key={item.id || index} style={styles.item}>
              <div>
                {/* 장소 이름 표시 (없으면 주소로 대체) */}
                <strong style={styles.placeName}>
                  {item.name || item.roadAddress || item.jibunAddress || '이름 없음'}
                </strong>

                {/* 도로명 주소 표시 */}
                {item.roadAddress && (
                  <span style={styles.subText}>
                    [도로명] {item.roadAddress}
                  </span>
                )}

                {/* 지번 / 기타 주소 표시 */}
                {(item.jibunAddress || item.address) && (
                  <span style={styles.subText}>
                    [지번] {item.jibunAddress || item.address}
                  </span>
                )}
              </div>

              {/* '출발' 버튼 그룹 */}
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => handleSetOrigin(item)} // 버튼 클릭 시 출발지 설정
                  style={{ ...styles.button, ...styles.originButton }}
                >
                  출발
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // 결과 패널 컨테이너 (스크롤 가능)
  container: {
    maxHeight: '250px',
    overflowY: 'auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    margin: '10px 0',
  },
  // 타이틀 스타일
  title: {
    padding: '10px 15px',
    margin: 0,
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  // 목록 스타일
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  // 목록 아이템 스타일
  item: {
    padding: '10px 15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  // 장소 이름 텍스트
  placeName: {
    fontSize: '15px',
    display: 'block',
    marginBottom: '2px',
  },
  // 주소 텍스트
  subText: {
    fontSize: '12px',
    color: '#777',
    display: 'block',
  },
  // 버튼 그룹
  buttonGroup: {
    display: 'flex',
    gap: '5px',
    flexShrink: 0,
  },
  // 버튼 공통 스타일
  button: {
    padding: '5px 8px',
    fontSize: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
  },
  // '출발' 버튼 (파란색)
  originButton: {
    backgroundColor: '#007bff',
  },
};

export default SearchResultPanel;