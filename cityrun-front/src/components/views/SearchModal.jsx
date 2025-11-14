import React from 'react';
import SearchResultPanel from '../SearchResultPanel.jsx';

const SearchModal = (props) => {
  const {
    searchQuery, setSearchQuery,
    searchResults, onSearch,
    onSetOrigin, onClose
  } = props;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>출발지 검색</h3>
        
        {/* (항목 1) 기존 검색 바 UI */}
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="출발지를 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button
            onClick={onSearch}
            style={styles.searchButton}
          >
            검색
          </button>
        </div>

        {/* (항목 1) 기존 검색 결과 UI */}
        {searchResults.length > 0 && (
          <SearchResultPanel
            results={searchResults}
            onSetOrigin={onSetOrigin}
          />
        )}
        
        <button onClick={onClose} style={styles.closeButton}>
          닫기
        </button>
      </div>
    </div>
  );
};

const styles = {
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
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
  },
  searchBar: {
    display: 'flex',
    marginBottom: '15px',
  },
  searchInput: {
    flexGrow: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px 0 0 5px',
  },
  searchButton: {
    padding: '0 15px',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
  },
  closeButton: {
    padding: '10px 15px',
    backgroundColor: '#6c757d', // 회색
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '15px',
  },
};

export default SearchModal;