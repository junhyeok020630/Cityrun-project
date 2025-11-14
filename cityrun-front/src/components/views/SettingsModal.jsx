import React from 'react';

const SettingsModal = ({ routeData, setRouteData, onClose }) => {
  return (
    // 모달 배경 (어둡게)
    <div style={styles.modalOverlay} onClick={onClose}>
      {/* 모달 컨텐츠 (클릭 방지) */}
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>설정</h3>
        
        {/* 🔻🔻🔻 (항목 2) KM 거리 설정 추가 🔻🔻🔻 */}
        <div style={styles.distanceGroup}>
          <label style={styles.distanceLabel}>
            원하는 거리 (km):
            <input
              type="number"
              value={routeData.distanceKm}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                setRouteData((prev) => ({ 
                  ...prev, 
                  distanceKm: newValue > 0 ? newValue : 5.0 
                }));
              }}
              style={styles.distanceInput}
            />
          </label>
        </div>
        {/* 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺 */}

        {/* (항목 1) 기존 선호 조건 UI */}
        <div style={styles.prefsGroup}>
          <h4>선호 조건</h4>
          {Object.keys(routeData.prefs).map((key) => (
            <label key={key} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={routeData.prefs[key]}
                onChange={(e) =>
                  setRouteData((prev) => ({
                    ...prev,
                    prefs: {
                      ...prev.prefs,
                      [key]: e.target.checked,
                    },
                  }))
                }
              />
              {key === 'avoidUphill' && ' 경사 회피'}
              {key === 'minimizeCrosswalks' && ' 횡단보도 최소화'}
              {key === 'avoidCrowd' && ' 혼잡 회피'}
            </label>
          ))}
        </div>
        
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
  // 🔻🔻🔻 (항목 2) 거리 설정 스타일 추가 🔻🔻🔻
  distanceGroup: {
    margin: '20px 0',
  },
  distanceLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceInput: {
    width: '80px',
    padding: '8px',
    fontSize: '16px',
    textAlign: 'center',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  // 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺
  prefsGroup: {
    margin: '20px 0',
  },
  closeButton: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
};

export default SettingsModal;