import React from 'react';

/**
 * 장소 검색 결과 목록
 * @param {array} results - [{ id, name, roadAddress, jibunAddress, x, y }, ...]
 * @param {function} onSetOrigin - '출발' 버튼 클릭 시 호출 ({ lat, lng })
 */
const SearchResultPanel = ({ results, onSetOrigin }) => {
  const handleSetOrigin = (item) => {
    if (item.y == null || item.x == null) {
      console.warn('선택한 장소에 좌표가 없습니다.', item);
      return;
    }

    // 네이버 Local Search의 mapx/mapy는 경도/위도 * 1e7 형태
    const lng = Number(item.x) / 1e7; // 경도
    const lat = Number(item.y) / 1e7; // 위도

    console.log('[Place raw]', item.x, item.y);
    console.log('[Place lat/lng]', lat, lng);

    onSetOrigin({ lat, lng });
  };


  return (
    <div style={styles.container}>
      <p style={styles.title}>
        '{results.length}'개의 검색 결과
      </p>

      {results.length === 0 ? (
        <div style={{ padding: '10px 15px', fontSize: '14px', color: '#666' }}>
          검색 결과가 없습니다.
        </div>
      ) : (
        <ul style={styles.list}>
          {results.map((item, index) => (
            <li key={item.id || index} style={styles.item}>
              <div>
                {/* 장소 이름 (없으면 도로명/지번으로 대체) */}
                <strong style={styles.placeName}>
                  {item.name || item.roadAddress || item.jibunAddress || '이름 없음'}
                </strong>

                {/* 도로명 주소 */}
                {item.roadAddress && (
                  <span style={styles.subText}>
                    [도로명] {item.roadAddress}
                  </span>
                )}

                {/* 지번 / 기타 주소 */}
                {(item.jibunAddress || item.address) && (
                  <span style={styles.subText}>
                    [지번] {item.jibunAddress || item.address}
                  </span>
                )}
              </div>

              <div style={styles.buttonGroup}>
                <button
                  onClick={() => handleSetOrigin(item)}
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

const styles = {
  container: {
    maxHeight: '250px',
    overflowY: 'auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    margin: '10px 0',
  },
  title: {
    padding: '10px 15px',
    margin: 0,
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    padding: '10px 15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  placeName: {
    fontSize: '15px',
    display: 'block',
    marginBottom: '2px',
  },
  subText: {
    fontSize: '12px',
    color: '#777',
    display: 'block',
  },
  buttonGroup: {
    display: 'flex',
    gap: '5px',
    flexShrink: 0,
  },
  button: {
    padding: '5px 8px',
    fontSize: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
  },
  originButton: {
    backgroundColor: '#007bff',
  },
};

export default SearchResultPanel;
