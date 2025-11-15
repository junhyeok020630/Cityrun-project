import React, { useState } from 'react';

const SaveRouteModal = ({ defaultName, onClose, onConfirmSave }) => {
  // 모달 내부에서 경로 이름을 관리
  const [name, setName] = useState(defaultName || '나의 러닝 경로');

  const handleSaveClick = () => {
    onConfirmSave(name);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>경로 이름 지정</h3>
        
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
          <button onClick={handleSaveClick} style={styles.saveButton}>
            저장
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

export default SaveRouteModal;