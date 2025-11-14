import React from 'react';

/**
 * Naver 지도 검색 결과 목록을 표시하는 컴포넌트
 * @param {array} results - Geocoding API 응답 배열 (response.v2.addresses)
 * @param {function} onSetOrigin - '출발' 버튼 클릭 시 호출될 함수
 */
const SearchResultPanel = ({ results, onSetOrigin }) => {
  
  const handleSetOrigin = (item) => {
    // Naver API는 y: lat, x: lng 입니다.
    onSetOrigin({ lat: parseFloat(item.y), lng: parseFloat(item.x) });
  };

  return (
    <div style={styles.container}>
      <p style={styles.title}>'{results.length}'개의 검색 결과</p>
      <ul style={styles.list}>
        {results.map((item, index) => (
          <li key={index} style={styles.item}>
            <div>
              <strong style={styles.roadAddress}>{item.roadAddress}</strong>
              <span style={styles.jibunAddress}>[지번] {item.jibunAddress}</span>
            </div>
            <div style={styles.buttonGroup}>
              <button 
                onClick={() => handleSetOrigin(item)} 
                style={{...styles.button, ...styles.originButton}}
              >
                출발
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  container: {
    maxHeight: '200px',
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
    borderBottom: '1px solid #eee'
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
  },
  roadAddress: {
    fontSize: '15px',
    display: 'block',
  },
  jibunAddress: {
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
  // (참고) destButton 스타일은 이제 사용되지 않습니다.
};

export default SearchResultPanel;