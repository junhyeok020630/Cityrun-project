// '경로 저장' 시 경로 이름을 입력받는 모달 컴포넌트
import React, { useState } from 'react';

/**
 * 경로 저장 확인 모달
 * @param {object} props
 * @param {string} props.defaultName - 추천 경로의 기본 이름
 * @param {function} props.onClose - 모달 닫기 핸들러 (App.jsx)
 * @param {function} props.onConfirmSave - '저장' 버튼 클릭 핸들러 (App.jsx)
 */
const SaveRouteModal = ({ defaultName, onClose, onConfirmSave }) => {
  // --- State 정의 ---
  // 모달 내부에서 관리하는 경로 이름, 'defaultName'으로 초기화
  const [name, setName] = useState(defaultName || '나의 러닝 경로');

  // '저장' 버튼 클릭 핸들러
  const handleSaveClick = () => {
    // App.jsx의 onConfirmSave 함수에 현재 'name' state를 인자로 전달
    onConfirmSave(name);
  };

  // --- 렌더링 ---
  return (
    // 모달 배경 (어둡게)
    // 클릭 시 onClose 핸들러를 호출하여 모달을 닫음
    <div style={styles.modalOverlay} onClick={onClose}>
      {/* 모달 컨텐츠 (클릭 이벤트 전파 방지) */}
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>경로 이름 지정</h3>
        
        {/* 1. 경로 이름 입력 그룹 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>경로 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)} // 입력 시 'name' state 변경
            style={styles.input}
            autoFocus // 모달이 뜨면 자동으로 이 입력창에 포커스
          />
        </div>
        
        {/* 2. 버튼 그룹 (취소 / 저장) */}
        <div style={styles.buttonGroup}>
          {/* 취소 버튼 */}
          <button onClick={onClose} style={styles.cancelButton}>
            취소
          </button>
          {/* 저장 버튼 */}
          <button onClick={handleSaveClick} style={styles.saveButton}>
            저장
          </button>
        </div>
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
    alignItems: 'center',
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
  // 입력 필드 그룹
  inputGroup: {
    margin: '20px 0',
  },
  // 입력 필드 레이블
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  // 입력 필드 (input)
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
  },
  // 버튼 그룹 (Flex)
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  // 취소 버튼 (회색)
  cancelButton: {
    flex: 1,
    padding: '10px 15px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  // 저장 버튼 (파란색)
  saveButton: {
    flex: 1,
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default SaveRouteModal;