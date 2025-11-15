import React, { useState, useEffect } from 'react';

const EditRouteModal = ({ routeToEdit, onClose, onConfirmEdit }) => {
  // 모달 내부에서 경로 이름을 관리
  const [name, setName] = useState(routeToEdit?.name || '');

  // routeToEdit prop이 변경될 때 (모달이 새로 열릴 때) state 업데이트
  useEffect(() => {
    setName(routeToEdit?.name || '');
  }, [routeToEdit]);

  const handleConfirm = () => {
    // 🔻 (수정) App.jsx의 핸들러가 반환값을 처리하도록 수정 🔻
    onConfirmEdit(routeToEdit.id, name);
  };

  return (
    // 모달 배경 (어둡게)
    <div style={styles.modalOverlay} onClick={onClose}>
      {/* 모달 컨텐츠 (클릭 방지) */}
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>경로 이름 수정</h3>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>경로 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            autoFocus // 모달이 뜨면 바로 입력창에 포커스
          />
        </div>
        
        <div style={styles.buttonGroup}>
          <button onClick={onClose} style={styles.cancelButton}>
            취소
          </button>
          <button onClick={handleConfirm} style={styles.saveButton}>
            수정
          </button>
        </div>
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
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
  },
  inputGroup: {
    margin: '20px 0',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '10px 15px',
    backgroundColor: '#6c757d', // 회색
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  saveButton: {
    flex: 1,
    padding: '10px 15px',
    backgroundColor: '#007bff', // 파란색
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default EditRouteModal;