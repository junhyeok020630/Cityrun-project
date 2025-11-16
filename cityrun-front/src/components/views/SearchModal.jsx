// '출발지 장소 검색' 모달 UI 컴포넌트
import React from 'react';
import SearchResultPanel from '../SearchResultPanel.jsx'; // 검색 결과 목록 패널

/**
 * 장소 검색 모달
 * @param {object} props
 * @param {string} props.searchQuery - 현재 검색어 (state)
 * @param {function} props.setSearchQuery - 'searchQuery' state 변경 핸들러 (App.jsx)
 * @param {Array} props.searchResults - 검색 결과 목록 (state)
 * @param {function} props.onSearch - '검색' 버튼 클릭 핸들러 (App.jsx)
 * @param {function} props.onSetOrigin - '출발' 버튼 클릭 핸들러 (App.jsx)
 * @param {function} props.onClose - 모달 닫기 핸들러 (App.jsx)
 */
const SearchModal = (props) => {
  const {
    searchQuery, setSearchQuery,
    searchResults, onSearch,
    onSetOrigin, onClose
  } = props;

  // 'Enter' 키를 눌렀을 때 onSearch 핸들러 호출
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    // 모달 배경 (어둡게)
    // 클릭 시 onClose 핸들러를 호출하여 모달을 닫음
    <div style={styles.modalOverlay} onClick={onClose}>
      {/* 모달 컨텐츠 (클릭 이벤트 전파 방지) */}
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>출발지 검색</h3>

        {/* 1. 검색 바 (input + button) */}
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="출발지를 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // 입력 시 state 변경
            style={styles.searchInput}
            onKeyDown={handleKeyDown} // Enter 키 감지
          />
          <button
            onClick={onSearch} // '검색' 버튼 클릭
            style={styles.searchButton}
          >
            검색
          </button>
        </div>

        {/* 2. 검색 결과 패널 */}
        {/* SearchResultPanel은 results가 비어있으면 '결과 없음'을 자체적으로 렌더링 */}
        <SearchResultPanel
          results={searchResults}
          onSetOrigin={onSetOrigin} // '출발' 버튼 핸들러 전달
        />

        {/* 3. 닫기 버튼 */}
        <button onClick={onClose} style={styles.closeButton}>
          닫기
        </button>
      </div>
    </div>
  );
};

// --- 스타일 ---
const styles = {
  // 모달 전체를 덮는 어두운 배경
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start', // 모달을 상단에 배치
    paddingTop: '50px',
    zIndex: 1000,
  },
  // 모달 본문 (흰색 박스)
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
  },
  // 검색 바 (Flex)
  searchBar: {
    display: 'flex',
    marginBottom: '15px',
  },
  // 검색 입력창
  searchInput: {
    flexGrow: 1, // 남은 공간 모두 차지
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px 0 0 5px',
  },
  // 검색 버튼
  searchButton: {
    padding: '0 15px',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
  },
  // 닫기 버튼 (회색)
  closeButton: {
    padding: '10px 15px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '15px',
  },
};

export default SearchModal;